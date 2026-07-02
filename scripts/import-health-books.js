const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");
const { createClient } = require("@supabase/supabase-js");
const bookKnowledge = require("../lib/health-book-knowledge.cjs");

const execFileAsync = promisify(execFile);
const pdfParseModule = require("pdf-parse");
const pdfParse = pdfParseModule.default || pdfParseModule;
const PDFParse = pdfParseModule.PDFParse;

const BOOKS_DIR = path.join(process.cwd(), "books");
const CHUNK_SIZE = 1800;
const CHUNK_OVERLAP = 220;
const INSERT_BATCH_SIZE = 20;
const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";
const DEFAULT_OLLAMA_EMBED_MODEL = "nomic-embed-text";
const DEFAULT_OPENAI_EMBED_MODEL = "text-embedding-3-small";

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;

  const text = fs.readFileSync(filePath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;

    const index = line.indexOf("=");
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) process.env[key] = value;
  }
}

function chunkText(text = "") {
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

function humanizeFileName(fileName) {
  return fileName
    .replace(/\.(pdf|epub)$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function inferBookMetadata(fileName) {
  const title = humanizeFileName(fileName);
  const authorMatch = title.match(/\bby\s+(.+)$/i) || title.match(/\s-\s(.+)$/);
  const author = authorMatch?.[1]?.trim() || "";
  const category = bookKnowledge.inferBookCategory(title, fileName);
  const metadata = bookKnowledge.buildBookMetadata({
    title,
    author,
    fileName,
    category,
    tags: [bookKnowledge.SOURCE_TAG],
    source: "books-folder",
  });

  return {
    title,
    author,
    category,
    tags: metadata.tags,
    metadata: metadata.metadata,
  };
}

function inferTopics(text, fileName) {
  const haystack = `${fileName} ${text}`.toLowerCase();
  const category = bookKnowledge.inferBookCategory(haystack);
  const topics = new Set(["book-context", ...bookKnowledge.tagsForCategory(category)]);
  const rules = [
    ["vitamins-minerals", ["vitamin", "mineral", "magnesium", "zinc", "calcium", "potassium"]],
    ["inflammation", ["inflammation", "inflammatory", "swelling"]],
    ["nutrition", ["diet", "food", "recipe", "alkaline", "fasting", "detox"]],
    ["herbal-remedies", ["herb", "herbal", "remedy", "pharmacist"]],
    ["yoga", ["yoga", "asana", "pranayama", "meditation", "mobility"]],
    ["bodybuilding", ["bodybuilding", "muscle", "hypertrophy", "strength", "protein", "training"]],
    ["strength-training", ["strength", "lifting", "resistance training", "sets", "reps"]],
    ["breathwork", ["breath", "breathing", "pranayama"]],
    ["recovery", ["recovery", "rest", "sleep", "deload"]],
    ["parasites", ["parasite", "cleanse"]],
    ["digestive-health", ["digest", "colon", "bowel", "stomach"]],
  ];

  for (const [topic, needles] of rules) {
    if (needles.some((needle) => haystack.includes(needle))) {
      topics.add(topic);
    }
  }

  return Array.from(topics);
}

function inferConditions(text, fileName) {
  const haystack = `${fileName} ${text}`.toLowerCase();
  const conditions = new Set();
  const rules = [
    ["diabetes", ["diabetes", "blood sugar", "glucose", "insulin"]],
    ["hypertension", ["blood pressure", "hypertension"]],
    ["inflammation", ["inflammation", "inflammatory"]],
    ["digestive", ["digestive", "digestion", "colon", "bowel"]],
    ["parasites", ["parasite"]],
  ];

  for (const [condition, needles] of rules) {
    if (needles.some((needle) => haystack.includes(needle))) {
      conditions.add(condition);
    }
  }

  return Array.from(conditions);
}

async function extractPdf(filePath) {
  const buffer = await fsp.readFile(filePath);
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

async function extractEpub(filePath) {
  const { stdout: fileList } = await execFileAsync("unzip", ["-Z1", filePath], {
    maxBuffer: 80 * 1024 * 1024,
  });
  const htmlEntries = fileList
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter((entry) => /\.(xhtml|html|htm)$/i.test(entry));

  if (htmlEntries.length === 0) {
    throw new Error(`No HTML content files found in EPUB: ${filePath}`);
  }

  const { stdout } = await execFileAsync("unzip", ["-p", filePath, ...htmlEntries], {
    maxBuffer: 80 * 1024 * 1024,
  });

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

  return {
    text,
    pageCount: 0,
  };
}

async function extractBook(filePath) {
  if (filePath.toLowerCase().endsWith(".pdf")) return extractPdf(filePath);
  if (filePath.toLowerCase().endsWith(".epub")) return extractEpub(filePath);
  throw new Error(`Unsupported book file type: ${filePath}`);
}

async function embedWithOllama(text) {
  const baseUrl = (process.env.OLLAMA_BASE_URL || DEFAULT_OLLAMA_BASE_URL).replace(/\/$/, "");
  const model = process.env.OLLAMA_EMBED_MODEL || DEFAULT_OLLAMA_EMBED_MODEL;

  const embedResponse = await fetch(`${baseUrl}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, input: text }),
  });

  if (embedResponse.ok) {
    const json = await embedResponse.json();
    const embedding = Array.isArray(json.embeddings?.[0]) ? json.embeddings[0] : json.embedding;
    if (Array.isArray(embedding)) return embedding;
  }

  const legacyResponse = await fetch(`${baseUrl}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt: text }),
  });

  if (!legacyResponse.ok) {
    const body = await legacyResponse.text().catch(() => "");
    throw new Error(`Ollama embedding failed (${legacyResponse.status}). ${body}`);
  }

  const json = await legacyResponse.json();
  if (!Array.isArray(json.embedding)) {
    throw new Error("Ollama embedding response did not include an embedding array");
  }
  return json.embedding;
}

async function embedWithOpenAI(text) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required when HEALTH_AI_PROVIDER=openai");
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_EMBED_MODEL || DEFAULT_OPENAI_EMBED_MODEL,
      input: text,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`OpenAI embedding failed (${response.status}). ${body}`);
  }

  const json = await response.json();
  return json.data?.[0]?.embedding;
}

async function embedText(text) {
  const provider = (process.env.HEALTH_AI_PROVIDER || "ollama").toLowerCase();
  const embedding = provider === "openai"
    ? await embedWithOpenAI(text)
    : await embedWithOllama(text);

  const expectedDimensions = Number.parseInt(
    process.env.HEALTH_EMBEDDING_DIMENSIONS || (provider === "openai" ? "1536" : "768"),
    10,
  );

  if (!Array.isArray(embedding)) {
    throw new Error("Embedding provider did not return an embedding array");
  }

  if (Number.isFinite(expectedDimensions) && embedding.length !== expectedDimensions) {
    throw new Error(
      `Embedding dimension mismatch: provider returned ${embedding.length}, expected ${expectedDimensions}`,
    );
  }

  return embedding;
}

async function insertRowsInBatches(supabase, rows) {
  for (let start = 0; start < rows.length; start += INSERT_BATCH_SIZE) {
    const batch = rows.slice(start, start + INSERT_BATCH_SIZE);
    const { error } = await supabase.from("health_document_chunks").insert(batch);
    if (error) throw error;
  }
}

async function assertDocumentSchemaReady(supabase) {
  const { error } = await supabase
    .from("health_documents")
    .select("id,title,file_name,status,chunk_count,metadata")
    .limit(1);

  if (error?.code === "PGRST205" || error?.code === "PGRST204") {
    throw new Error(
      "Health document schema is missing. Run supabase/health-bot-migration.sql in the Supabase SQL Editor, then rerun npm run import:health-books.",
    );
  }

  if (error) throw error;
}

async function importBook(supabase, filePath, options) {
  const fileName = path.basename(filePath);
  const stat = await fsp.stat(filePath);
  const mimeType = fileName.toLowerCase().endsWith(".epub")
    ? "application/epub+zip"
    : "application/pdf";
  const inferred = inferBookMetadata(fileName);

  const existing = await supabase
    .from("health_documents")
    .select("id, status, chunk_count")
    .eq("file_name", fileName)
    .eq("source_kind", "book")
    .maybeSingle();

  if (existing.error) throw existing.error;
  if (existing.data?.status === "ready" && existing.data.chunk_count > 0 && !options.force) {
    console.log(`skip ${fileName} (${existing.data.chunk_count} chunks already ready)`);
    return;
  }

  const { text, pageCount } = await extractBook(filePath);
  const chunks = chunkText(text);
  if (chunks.length === 0) {
    throw new Error(`No readable text extracted from ${fileName}`);
  }

  const documentPayload = {
    title: inferred.title,
    author: inferred.author,
    file_name: fileName,
    file_size_bytes: stat.size,
    mime_type: mimeType,
    source_kind: "book",
    visibility: "shared",
    status: "processing",
    page_count: pageCount,
    tags: inferred.tags,
    metadata: {
      ...inferred.metadata,
      import_path: path.relative(process.cwd(), filePath),
      health_lens: `${inferred.category}_book_context`,
    },
    error_message: null,
    reprocessed_at: new Date().toISOString(),
  };

  let documentId = existing.data?.id;
  if (documentId) {
    const { error } = await supabase
      .from("health_documents")
      .update(documentPayload)
      .eq("id", documentId);
    if (error) throw error;

    const deleteResult = await supabase
      .from("health_document_chunks")
      .delete()
      .eq("document_id", documentId);
    if (deleteResult.error) throw deleteResult.error;
  } else {
    const { data, error } = await supabase
      .from("health_documents")
      .insert(documentPayload)
      .select("id")
      .single();
    if (error) throw error;
    documentId = data.id;
  }

  console.log(`import ${fileName}: ${chunks.length} chunks`);
  const rows = [];
  for (let index = 0; index < chunks.length; index += 1) {
    const content = chunks[index];
    const embeddedContent = [
      `Book: ${inferred.title}`,
      inferred.author ? `Author/context: ${inferred.author}` : "",
      `Category: ${inferred.category}`,
      `Tags: ${inferred.tags.join(", ")}`,
      `Chunk ${index + 1}/${chunks.length}`,
      "",
      content,
    ].filter(Boolean).join("\n");

    const embedding = await embedText(embeddedContent);
    rows.push({
      document_id: documentId,
      chunk_index: index,
      content,
      embedding,
      topics: inferTopics(content, fileName),
      conditions: inferConditions(content, fileName),
      metadata: {
        ...inferred.metadata,
        title: inferred.title,
        author: inferred.author,
        file_name: fileName,
        category: inferred.category,
        tags: inferred.tags,
        chunk_count: chunks.length,
        safety_note: "Book context may include traditional or controversial claims; verify against evidence and clinician guidance.",
      },
    });
  }

  await insertRowsInBatches(supabase, rows);

  const { error: updateError } = await supabase
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

  console.log(`ready ${fileName}`);
}

async function main() {
  loadEnv(path.join(process.cwd(), ".env.local"));

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  const options = {
    force: process.argv.includes("--force"),
  };

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  await assertDocumentSchemaReady(supabase);

  const files = (await fsp.readdir(BOOKS_DIR))
    .filter((file) => /\.(pdf|epub)$/i.test(file))
    .sort()
    .map((file) => path.join(BOOKS_DIR, file));

  if (files.length === 0) {
    console.log("No PDF or EPUB files found in books/");
    return;
  }

  for (const file of files) {
    try {
      await importBook(supabase, file, options);
    } catch (error) {
      console.error(`failed ${path.basename(file)}: ${error.message}`);
      if (!options.force) {
        console.error("Fix the error or rerun with --force after correcting the database/import state.");
      }
      process.exitCode = 1;
      return;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
