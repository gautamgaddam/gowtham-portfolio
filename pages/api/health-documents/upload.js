import fs from "fs/promises";
import formidable from "formidable";
import {
  getHealthUser,
  healthSupabaseAdmin,
  isHealthAdmin,
  requireHealthDatabase,
} from "../../../lib/health-api-auth";
import { processHealthDocument } from "../../../lib/health-document-processing";
import bookKnowledge from "../../../lib/health-book-knowledge.cjs";

export const config = {
  api: {
    bodyParser: false,
  },
  runtime: "nodejs",
};

function parseForm(req) {
  const form = formidable({
    multiples: false,
    maxFileSize: 30 * 1024 * 1024,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (error, fields, files) => {
      if (error) reject(error);
      else resolve({ fields, files });
    });
  });
}

function fieldValue(value, fallback = "") {
  if (Array.isArray(value)) return value[0] || fallback;
  return value || fallback;
}

export default async function handler(req, res) {
  if (requireHealthDatabase(res)) return;
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await getHealthUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    if (!isHealthAdmin(user)) return res.status(403).json({ error: "Admin only" });

    const { fields, files } = await parseForm(req);
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) return res.status(400).json({ error: "PDF or EPUB file is required" });

    const fileName = file.originalFilename || "health-document.pdf";
    const mimeType = file.mimetype || "application/pdf";
    const isPdf = mimeType.includes("pdf") || fileName.toLowerCase().endsWith(".pdf");
    const isEpub = mimeType.includes("epub") || fileName.toLowerCase().endsWith(".epub");
    if (!isPdf && !isEpub) {
      return res.status(400).json({ error: "Only PDF and EPUB uploads are supported" });
    }

    await healthSupabaseAdmin.storage.createBucket("health-documents", {
      public: false,
    }).catch(() => {});

    const fileBuffer = await fs.readFile(file.filepath);
    const storagePath = `${user.id}/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "-")}`;

    const { error: uploadError } = await healthSupabaseAdmin.storage
      .from("health-documents")
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const title = fieldValue(fields.title, fileName);
    const author = fieldValue(fields.author);
    const category = fieldValue(fields.category);
    const bookMetadata = bookKnowledge.buildBookMetadata({
      title,
      author,
      fileName,
      category,
      tags: bookKnowledge.parseTags(fieldValue(fields.tags)),
      source: "dashboard-upload",
    });

    const documentId = fieldValue(fields.documentId);
    let document;
    let error;

    if (documentId) {
      const existing = await healthSupabaseAdmin
        .from("health_documents")
        .select("id, version, storage_path")
        .eq("id", documentId)
        .single();

      if (existing.error) throw existing.error;

      if (existing.data?.storage_path) {
        await healthSupabaseAdmin.storage
          .from("health-documents")
          .remove([existing.data.storage_path])
          .catch(() => {});
      }

      const updateResult = await healthSupabaseAdmin
        .from("health_documents")
        .update({
          title,
          author,
          file_name: fileName,
          file_size_bytes: file.size || fileBuffer.length,
          mime_type: mimeType,
          source_kind: fieldValue(fields.sourceKind, "book"),
          visibility: fieldValue(fields.visibility, "shared"),
          status: "processing",
          storage_path: storagePath,
          tags: bookMetadata.tags,
          metadata: bookMetadata.metadata,
          version: (existing.data?.version || 1) + 1,
          error_message: null,
        })
        .eq("id", documentId)
        .select()
        .single();

      document = updateResult.data;
      error = updateResult.error;
    } else {
      const insertResult = await healthSupabaseAdmin
        .from("health_documents")
        .insert({
          uploaded_by: user.id,
          title,
          author,
          file_name: fileName,
          file_size_bytes: file.size || fileBuffer.length,
          mime_type: mimeType,
          source_kind: fieldValue(fields.sourceKind, "book"),
          visibility: fieldValue(fields.visibility, "shared"),
          status: "processing",
          storage_path: storagePath,
          tags: bookMetadata.tags,
          version: 1,
          metadata: bookMetadata.metadata,
        })
        .select()
        .single();

      document = insertResult.data;
      error = insertResult.error;
    }

    if (error) throw error;

    try {
      await processHealthDocument({
        supabaseAdmin: healthSupabaseAdmin,
        documentId: document.id,
        fileBuffer,
        fileName,
        mimeType,
      });
    } catch (processingError) {
      await healthSupabaseAdmin
        .from("health_documents")
        .update({
          status: "failed",
          error_message: processingError.message,
        })
        .eq("id", document.id);
    }

    const { data: latest } = await healthSupabaseAdmin
      .from("health_documents")
      .select("*")
      .eq("id", document.id)
      .single();

    return res.status(201).json(latest || document);
  } catch (error) {
    console.error("Health document upload error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
