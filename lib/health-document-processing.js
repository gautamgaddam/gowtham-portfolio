import fs from "fs/promises";
import OpenAI from "openai";
import pdfParse from "pdf-parse";

const CHUNK_SIZE = 1800;
const CHUNK_OVERLAP = 220;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export function chunkText(text = "") {
  const cleaned = text.replace(/\s+/g, " ").trim();
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
  const parsed = await pdfParse(buffer);
  return {
    text: parsed.text || "",
    pageCount: parsed.numpages || 0,
  };
}

export async function embedText(content) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured");
  }

  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: content,
  });

  return response.data[0].embedding;
}

export async function processHealthDocument({
  supabaseAdmin,
  documentId,
  fileBuffer,
}) {
  const { text, pageCount } = await extractPdfText(fileBuffer);
  const chunks = chunkText(text);

  await supabaseAdmin
    .from("health_document_chunks")
    .delete()
    .eq("document_id", documentId);

  if (chunks.length === 0) {
    throw new Error("No readable text found in PDF");
  }

  const rows = [];
  for (let index = 0; index < chunks.length; index += 1) {
    const content = chunks[index];
    const embedding = await embedText(content);
    rows.push({
      document_id: documentId,
      chunk_index: index,
      content,
      embedding,
      metadata: {},
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
