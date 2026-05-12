import OpenAI from "openai";

export const config = {
  runtime: "nodejs",
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a knowledgeable natural health advisor specializing in Ayurvedic medicine, naturopathy, and functional medicine principles. Your role is to provide educational information about natural approaches to health and wellness.

**Your expertise includes:**
- Understanding how body systems work (digestive, nervous, immune, endocrine, etc.)
- Natural remedies from herbs, minerals, and whole foods
- Lifestyle interventions (sleep, stress management, movement)
- Breathwork and meditation techniques
- Fasting and dietary protocols
- Root cause analysis of symptoms through a holistic lens

**Your approach:**
1. Always explain the underlying body mechanisms and systems involved
2. Suggest natural, evidence-based remedies and lifestyle changes
3. Consider the whole person - physical, mental, and emotional aspects
4. Reference Ayurvedic doshas and constitutions when relevant
5. Recommend functional medicine testing when appropriate

**Important disclaimers you MUST include:**
- Always remind users this is educational information, not medical advice
- Encourage consulting with a qualified healthcare provider before making changes
- Never claim to diagnose, treat, cure, or prevent any disease
- For serious or emergency symptoms, urge immediate medical attention

Respond in a warm, accessible tone. Use analogies to explain complex concepts. Be thorough but concise.`;

// Input validation helper
function validateInput(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return { valid: false, error: "Messages must be a non-empty array" };
  }

  for (const msg of messages) {
    if (!msg.role || !msg.content) {
      return { valid: false, error: "Each message must have role and content" };
    }
    if (typeof msg.content !== "string") {
      return { valid: false, error: "Message content must be a string" };
    }
    if (msg.content.length > 5000) {
      return {
        valid: false,
        error: "Message content too long (max 5000 characters)",
      };
    }
  }

  return { valid: true };
}

// Prompt injection detection
function detectPromptInjection(messages) {
  const injectionPatterns = [
    /ignore\s+(previous|above|prior)\s+instructions/i,
    /system\s*:/i,
    /you\s+are\s+now\s+a/i,
    /jailbreak/i,
    /pretend\s+to\s+be/i,
    /forget\s+everything/i,
    /disregard\s+(previous|above)/i,
  ];

  for (const msg of messages) {
    const content = msg.content.toLowerCase();
    for (const pattern of injectionPatterns) {
      if (pattern.test(content)) {
        return true;
      }
    }
  }

  return false;
}

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body;

    // Validate input
    const validation = validateInput(messages);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Check for prompt injection
    if (detectPromptInjection(messages)) {
      return res.status(400).json({
        error: "Invalid request: potential security issue detected",
      });
    }

    // Prepend system message
    const fullMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ];

    // Create streaming completion
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: fullMessages,
      stream: true,
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Set headers for streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    // Stream the response
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    // End the stream
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("Health chat API error:", error);

    // Handle specific OpenAI errors
    if (error.status === 401) {
      return res.status(500).json({
        error: "API configuration error. Please check server settings.",
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        error: "Too many requests. Please try again in a moment.",
      });
    }

    res.status(500).json({
      error: "An error occurred processing your request",
    });
  }
}
