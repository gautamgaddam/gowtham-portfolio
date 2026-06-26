import fs from "fs/promises";
import formidable from "formidable";
import OpenAI from "openai";
import {
  getHealthUser,
  healthSupabaseAdmin,
  requireHealthDatabase,
} from "../../../lib/health-api-auth";
import { chunkText, extractPdfText } from "../../../lib/health-document-processing";
import { embedHealthText } from "../../../lib/health-ai-provider";

export const config = {
  api: {
    bodyParser: false,
  },
  runtime: "nodejs",
};

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const SUPPORTED_TEXT_MIME = new Set([
  "text/plain",
  "text/markdown",
  "application/json",
]);

function parseForm(req) {
  const form = formidable({
    multiples: false,
    maxFileSize: MAX_FILE_SIZE,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (error, fields, files) => {
      if (error) reject(error);
      else resolve({ fields, files });
    });
  });
}

function fieldValue(fields, key, fallback = "") {
  const value = fields[key];
  if (Array.isArray(value)) return value[0] || fallback;
  return value || fallback;
}

async function summarizeImage(fileBuffer, mimeType) {
  if (!process.env.OPENAI_API_KEY) {
    return {
      text: "Image uploaded. Automated image reading is not configured for this environment.",
      metadata: { image_extraction: "not_configured" },
    };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.HEALTH_IMAGE_MODEL || "gpt-4o-mini";
  const dataUrl = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content:
          "Extract health-related text and visible medical context from the image. Do not diagnose. If it is a lab/report image, summarize visible values and uncertainties. If text is unreadable, say so.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Read this health-related image for use as patient-provided context in a wellness chatbot.",
          },
          {
            type: "image_url",
            image_url: { url: dataUrl },
          },
        ],
      },
    ],
    max_tokens: 900,
  });

  return {
    text: response.choices[0]?.message?.content || "No readable health information found in image.",
    metadata: { image_extraction: "openai", image_model: model },
  };
}

async function extractFileContent(fileBuffer, mimeType, fileName) {
  if (mimeType.includes("pdf") || fileName.toLowerCase().endsWith(".pdf")) {
    const parsed = await extractPdfText(fileBuffer);
    return {
      text: parsed.text,
      metadata: { extraction: "pdf", page_count: parsed.pageCount },
    };
  }

  if (
    SUPPORTED_TEXT_MIME.has(mimeType) ||
    /\.(txt|md|json|csv)$/i.test(fileName)
  ) {
    return {
      text: fileBuffer.toString("utf8"),
      metadata: { extraction: "text" },
    };
  }

  if (mimeType.startsWith("image/")) {
    return summarizeImage(fileBuffer, mimeType);
  }

  throw new Error("Unsupported file type. Upload PDF, TXT, Markdown, JSON, CSV, JPG, PNG, or WebP.");
}

async function saveToKnowledgeBase({ userId, fileId, fileName, extractedText, metadata }) {
  const chunks = chunkText(extractedText).slice(0, 20);
  if (chunks.length === 0) return 0;

  const rows = [];
  for (let index = 0; index < chunks.length; index += 1) {
    const content = `Uploaded health file: ${fileName}\nChunk ${index + 1}/${chunks.length}\n\n${chunks[index]}`;
    const embedding = await embedHealthText(content);
    rows.push({
      user_id: userId,
      content_type: "other",
      content,
      embedding,
      metadata: {
        ...(metadata || {}),
        source: "user_upload",
        file_id: fileId,
        file_name: fileName,
        chunk_index: index,
      },
    });
  }

  const { error } = await healthSupabaseAdmin
    .from("health_knowledge_base")
    .insert(rows);

  if (error) throw error;
  return rows.length;
}

export default async function handler(req, res) {
  if (requireHealthDatabase(res)) return;
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await getHealthUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { fields, files } = await parseForm(req);
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) return res.status(400).json({ error: "File is required" });

    const fileName = file.originalFilename || "health-upload";
    const mimeType = file.mimetype || "application/octet-stream";
    const notes = fieldValue(fields, "notes");
    const fileBuffer = await fs.readFile(file.filepath);
    const storagePath = `${user.id}/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "-")}`;

    await healthSupabaseAdmin.storage
      .createBucket("health-user-files", { public: false })
      .catch(() => {});

    const { error: uploadError } = await healthSupabaseAdmin.storage
      .from("health-user-files")
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: inserted, error: insertError } = await healthSupabaseAdmin
      .from("health_user_files")
      .insert({
        user_id: user.id,
        file_name: fileName,
        file_size_bytes: file.size || fileBuffer.length,
        mime_type: mimeType,
        storage_path: storagePath,
        status: "processing",
        metadata: { notes },
      })
      .select()
      .single();

    if (insertError) throw insertError;

    try {
      const extraction = await extractFileContent(fileBuffer, mimeType, fileName);
      const extractedText = (extraction.text || "").trim();
      if (!extractedText) throw new Error("No readable health-related content found in file.");

      const summary = extractedText.length > 900
        ? `${extractedText.slice(0, 900)}...`
        : extractedText;
      const chunkCount = await saveToKnowledgeBase({
        userId: user.id,
        fileId: inserted.id,
        fileName,
        extractedText,
        metadata: {
          ...(extraction.metadata || {}),
          notes,
          mime_type: mimeType,
        },
      });

      const { data: updated, error: updateError } = await healthSupabaseAdmin
        .from("health_user_files")
        .update({
          status: "ready",
          extracted_text: extractedText,
          summary,
          error_message: null,
          metadata: {
            ...(extraction.metadata || {}),
            notes,
            knowledge_chunks: chunkCount,
          },
        })
        .eq("id", inserted.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return res.status(201).json(updated);
    } catch (processingError) {
      const { data: failed } = await healthSupabaseAdmin
        .from("health_user_files")
        .update({
          status: "failed",
          error_message: processingError.message,
        })
        .eq("id", inserted.id)
        .select()
        .single();

      return res.status(422).json(failed || {
        error: processingError.message,
      });
    }
  } catch (error) {
    console.error("Health user file upload error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
