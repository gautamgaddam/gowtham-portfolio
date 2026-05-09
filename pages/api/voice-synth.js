export const config = {
  runtime: "nodejs",
};

// Input validation
function validateInput(text, voiceId) {
  if (!text || typeof text !== "string") {
    return { valid: false, error: "Text must be a string" };
  }

  if (text.length === 0 || text.length > 5000) {
    return {
      valid: false,
      error: "Text must be between 1 and 5000 characters",
    };
  }

  if (!voiceId || typeof voiceId !== "string") {
    return { valid: false, error: "Voice ID must be specified" };
  }

  // Basic alphanumeric check for voice ID
  if (!/^[a-zA-Z0-9]+$/.test(voiceId)) {
    return { valid: false, error: "Invalid voice ID format" };
  }

  return { valid: true };
}

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text, voiceId } = req.body;

    // Validate input
    const validation = validateInput(text, voiceId);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Call ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", errorText);

      if (response.status === 401) {
        return res.status(500).json({
          error:
            "Voice synthesis authentication failed. Check server configuration.",
        });
      }

      if (response.status === 429) {
        return res.status(429).json({
          error: "Rate limit exceeded. Please try again in a moment.",
        });
      }

      return res.status(500).json({
        error: "Voice synthesis failed",
      });
    }

    // Get audio data as buffer
    const audioBuffer = await response.arrayBuffer();

    // Set headers for audio response
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", audioBuffer.byteLength);
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="generated-voice.mp3"',
    );

    // Send audio data
    res.send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error("Voice synthesis API error:", error);

    return res.status(500).json({
      error: "An error occurred during voice synthesis",
    });
  }
}
