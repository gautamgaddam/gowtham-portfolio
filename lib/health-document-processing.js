import fs from "fs/promises";
import { execFile } from "child_process";
import { promisify } from "util";
import * as pdfParseModule from "pdf-parse";
import { embedHealthText } from "./health-ai-provider";
import bookKnowledge from "./health-book-knowledge.cjs";

const CHUNK_SIZE = 1800;
const CHUNK_OVERLAP = 220;
const execFileAsync = promisify(execFile);
const pdfParse = pdfParseModule.default || pdfParseModule;
const PDFParse = pdfParseModule.PDFParse;

export function chunkText(text = "") {
  const cleaned = text
    .replace(/\u0000/g, "")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return [];

  const chunks = [];
  let start = 0;

  while (start < cleaned.length) {
    const end = Math.min(start + CHUNK_SIZE, cleaned.length);
    chunks.push(cleaned.slice(start, end).trim());
    if (end === cleaned.length) break;
    start = Math.max(0, end - CHUNK_OVERLAP);
  }

  return chunks.filter(Boolean);
}

export async function extractPdfText(filePathOrBuffer) {
  const buffer = Buffer.isBuffer(filePathOrBuffer)
    ? filePathOrBuffer
    : await fs.readFile(filePathOrBuffer);

  if (typeof pdfParse === "function") {
    const parsed = await pdfParse(buffer);
    return {
      text: parsed.text || "",
      pageCount: parsed.numpages || parsed.numPages || 0,
    };
  }

  if (typeof PDFParse !== "function") {
    throw new Error("Installed pdf-parse package does not expose a supported parser API");
  }

  const parser = new PDFParse({ data: buffer });
  try {
    const [textResult, infoResult] = await Promise.all([
      parser.getText(),
      parser.getInfo().catch(() => null),
    ]);
    return {
      text: textResult.text || "",
      pageCount: infoResult?.total || textResult.pages?.length || 0,
    };
  } finally {
    await parser.destroy().catch(() => {});
  }
}

export async function extractEpubText(filePathOrBuffer) {
  let tempPath = null;
  const epubPath = Buffer.isBuffer(filePathOrBuffer)
    ? null
    : filePathOrBuffer;

  try {
    const pathToRead = epubPath || (() => {
      tempPath = `/tmp/health-document-${Date.now()}-${Math.random().toString(36).slice(2)}.epub`;
      return tempPath;
    })();

    if (Buffer.isBuffer(filePathOrBuffer)) {
      await fs.writeFile(pathToRead, filePathOrBuffer);
    }

    const { stdout: fileList } = await execFileAsync(
      "unzip",
      ["-Z1", pathToRead],
      { maxBuffer: 80 * 1024 * 1024 },
    );
    const htmlEntries = fileList
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .filter((entry) => /\.(xhtml|html|htm)$/i.test(entry));

    if (htmlEntries.length === 0) {
      throw new Error("No HTML content files found in EPUB");
    }

    const { stdout } = await execFileAsync(
      "unzip",
      ["-p", pathToRead, ...htmlEntries],
      { maxBuffer: 80 * 1024 * 1024 },
    );

    const text = stdout
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, "\"");

    return { text, pageCount: 0 };
  } finally {
    if (tempPath) {
      await fs.unlink(tempPath).catch(() => {});
    }
  }
}

export async function extractHealthDocumentText({
  fileBuffer,
  fileName = "",
  mimeType = "",
}) {
  const lowerName = fileName.toLowerCase();
  if (mimeType.includes("epub") || lowerName.endsWith(".epub")) {
    return extractEpubText(fileBuffer);
  }

  return extractPdfText(fileBuffer);
}

export async function embedText(content) {
  return embedHealthText(content);
}

export async function processHealthDocument({
  supabaseAdmin,
  documentId,
  fileBuffer,
  fileName = "",
  mimeType = "",
}) {
  const { text, pageCount } = await extractHealthDocumentText({
    fileBuffer,
    fileName,
    mimeType,
  });
  const chunks = chunkText(text);

  await supabaseAdmin
    .from("health_document_chunks")
    .delete()
    .eq("document_id", documentId);

  if (chunks.length === 0) {
    throw new Error("No readable text found in document");
  }

  const { data: document } = await supabaseAdmin
    .from("health_documents")
    .select("title, author, file_name, tags, metadata")
    .eq("id", documentId)
    .single();

  const documentCategory =
    document?.metadata?.category ||
    bookKnowledge.inferBookCategory(document?.title, document?.author, document?.file_name, text.slice(0, 3000));
  const documentTags = bookKnowledge.uniqueTags([
    ...(document?.tags || []),
    ...bookKnowledge.tagsForCategory(documentCategory),
  ]);

  const rows = [];
  for (let index = 0; index < chunks.length; index += 1) {
    const content = chunks[index];
    const embeddedContent = [
      document?.title ? `Book: ${document.title}` : "",
      document?.author ? `Author/context: ${document.author}` : "",
      `Category: ${documentCategory}`,
      `Tags: ${documentTags.join(", ")}`,
      "",
      content,
    ].filter(Boolean).join("\n");
    const embedding = await embedText(embeddedContent);
    rows.push({
      document_id: documentId,
      chunk_index: index,
      content,
      embedding,
      topics: documentTags,
      metadata: {
        ...(document?.metadata || {}),
        title: document?.title || fileName,
        author: document?.author || "",
        file_name: document?.file_name || fileName,
        category: documentCategory,
        tags: documentTags,
        chunk_count: chunks.length,
        safety_note: "Book context may include traditional, training, or lifestyle claims; verify against evidence and clinician guidance.",
      },
    });
  }

  const { error } = await supabaseAdmin
    .from("health_document_chunks")
    .insert(rows);

  if (error) throw error;

  const { error: updateError } = await supabaseAdmin
    .from("health_documents")
    .update({
      status: "ready",
      chunk_count: rows.length,
      page_count: pageCount,
      error_message: null,
      reprocessed_at: new Date().toISOString(),
    })
    .eq("id", documentId);

  if (updateError) throw updateError;

  return {
    chunkCount: rows.length,
    pageCount,
  };
}
