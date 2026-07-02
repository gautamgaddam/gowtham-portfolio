import OpenAI from "openai";

const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";
const DEFAULT_OLLAMA_CHAT_MODEL = "llama3.1:8b";
const DEFAULT_OLLAMA_EMBED_MODEL = "nomic-embed-text";
const DEFAULT_OPENAI_CHAT_MODEL = "gpt-4o";
const DEFAULT_OPENAI_EMBED_MODEL = "text-embedding-3-small";

function providerName() {
  return (process.env.HEALTH_AI_PROVIDER || "ollama").toLowerCase();
}

function ollamaBaseUrl() {
  return (process.env.OLLAMA_BASE_URL || DEFAULT_OLLAMA_BASE_URL).replace(/\/$/, "");
}

function openaiClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured");
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

function assertSupportedProvider(provider) {
  if (!["ollama", "openai"].includes(provider)) {
    throw new Error(`Unsupported health AI provider: ${provider}`);
  }
}

function normalizeOpenAIError(error) {
  if (error?.status === 401) {
    throw new Error("OpenAI API key is not configured");
  }
  throw error;
}

async function streamOllamaChat(messages, res, options = {}) {
  const response = await fetch(`${ollamaBaseUrl()}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OLLAMA_CHAT_MODEL || DEFAULT_OLLAMA_CHAT_MODEL,
      messages,
      stream: true,
      options: {
        temperature: options.temperature ?? 0.7,
        num_predict: options.maxTokens ?? 1000,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Ollama chat request failed (${response.status}). Start Ollama, pull the configured chat model, and try again.${body ? ` ${body}` : ""}`,
    );
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Ollama chat response did not include a stream");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const chunk = JSON.parse(trimmed);
      const content = chunk.message?.content || chunk.response || "";
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }
  }

  if (buffer.trim()) {
    const chunk = JSON.parse(buffer.trim());
    const content = chunk.message?.content || chunk.response || "";
    if (content) {
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
  }
}

async function streamOpenAIChat(messages, res, options = {}) {
  try {
    const stream = await openaiClient().chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL || DEFAULT_OPENAI_CHAT_MODEL,
      messages,
      stream: true,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1000,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }
  } catch (error) {
    normalizeOpenAIError(error);
  }
}

async function generateOllamaChat(messages, options = {}) {
  const response = await fetch(`${ollamaBaseUrl()}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OLLAMA_CHAT_MODEL || DEFAULT_OLLAMA_CHAT_MODEL,
      messages,
      stream: false,
      format: options.format,
      options: {
        temperature: options.temperature ?? 0.2,
        num_predict: options.maxTokens ?? 700,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Ollama chat request failed (${response.status}). Start Ollama, pull the configured chat model, and try again.${body ? ` ${body}` : ""}`,
    );
  }

  const json = await response.json();
  return json.message?.content || json.response || "";
}

async function generateOpenAIChat(messages, options = {}) {
  try {
    const response = await openaiClient().chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL || DEFAULT_OPENAI_CHAT_MODEL,
      messages,
      stream: false,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 700,
      response_format: options.responseFormat,
    });

    return response.choices[0]?.message?.content || "";
  } catch (error) {
    normalizeOpenAIError(error);
  }
}

async function embedWithOllama(text) {
  const model = process.env.OLLAMA_EMBED_MODEL || DEFAULT_OLLAMA_EMBED_MODEL;
  const baseUrl = ollamaBaseUrl();

  const embedResponse = await fetch(`${baseUrl}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      input: text,
    }),
  });

  if (embedResponse.ok) {
    const json = await embedResponse.json();
    const embedding = Array.isArray(json.embeddings?.[0]) ? json.embeddings[0] : json.embedding;
    if (Array.isArray(embedding)) return embedding;
  }

  const legacyResponse = await fetch(`${baseUrl}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt: text,
    }),
  });

  if (!legacyResponse.ok) {
    const body = await legacyResponse.text().catch(() => "");
    throw new Error(
      `Ollama embedding request failed (${legacyResponse.status}). Start Ollama, pull the configured embedding model, and try again.${body ? ` ${body}` : ""}`,
    );
  }

  const json = await legacyResponse.json();
  if (!Array.isArray(json.embedding)) {
    throw new Error("Ollama embedding response did not include an embedding array");
  }
  return json.embedding;
}

async function embedWithOpenAI(text) {
  try {
    const response = await openaiClient().embeddings.create({
      model: process.env.OPENAI_EMBED_MODEL || DEFAULT_OPENAI_EMBED_MODEL,
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    normalizeOpenAIError(error);
  }
}

export function getHealthAiProvider() {
  const provider = providerName();
  assertSupportedProvider(provider);
  return provider;
}

export async function streamHealthChat(messages, res, options = {}) {
  const provider = getHealthAiProvider();

  if (provider === "openai") {
    await streamOpenAIChat(messages, res, options);
    return;
  }

  await streamOllamaChat(messages, res, options);
}

export async function generateHealthChatText(messages, options = {}) {
  const provider = getHealthAiProvider();

  if (provider === "openai") {
    return generateOpenAIChat(messages, options);
  }

  return generateOllamaChat(messages, options);
}

export async function embedHealthText(text) {
  const provider = getHealthAiProvider();
  const embedding = provider === "openai"
    ? await embedWithOpenAI(text)
    : await embedWithOllama(text);

  const expectedDimensions = Number.parseInt(
    process.env.HEALTH_EMBEDDING_DIMENSIONS || (provider === "openai" ? "1536" : "768"),
    10,
  );

  if (Number.isFinite(expectedDimensions) && embedding.length !== expectedDimensions) {
    throw new Error(
      `Embedding dimension mismatch: ${provider} returned ${embedding.length}, but HEALTH_EMBEDDING_DIMENSIONS is ${expectedDimensions}. Update the embedding model or vector schema.`,
    );
  }

  return embedding;
}

export function getHealthAiConfigurationHint() {
  const provider = providerName();
  if (provider === "openai") {
    return "Add OPENAI_API_KEY or switch HEALTH_AI_PROVIDER to ollama.";
  }
  return "Start Ollama and pull the configured models, for example: ollama pull llama3.1:8b && ollama pull nomic-embed-text.";
}
