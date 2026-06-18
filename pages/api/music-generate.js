import OpenAI from "openai";

export const config = {
  runtime: "nodejs",
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEFAULT_STABILITY_AUDIO_ENDPOINT =
  "https://api.stability.ai/v2beta/audio/stable-audio-2/text-to-audio";

// Input validation
function validateInput(prompt, style, tempo, key) {
  if (!prompt || typeof prompt !== "string") {
    return { valid: false, error: "Prompt must be a string" };
  }

  if (prompt.length === 0 || prompt.length > 500) {
    return {
      valid: false,
      error: "Prompt must be between 1 and 500 characters",
    };
  }

  if (!style || typeof style !== "string") {
    return { valid: false, error: "Style must be specified" };
  }

  if (!tempo || typeof tempo !== "number" || tempo < 60 || tempo > 200) {
    return { valid: false, error: "Tempo must be between 60 and 200 BPM" };
  }

  if (!key || typeof key !== "string") {
    return { valid: false, error: "Key must be specified" };
  }

  return { valid: true };
}

const SYSTEM_PROMPT = `You are an expert music producer and composer with deep knowledge of music theory, production techniques, and arrangement. Your task is to generate detailed music production notes that could guide a musician or producer in creating a new song.

When generating production notes, include:
1. **Song Structure**: Intro, verse, chorus, bridge, outro with bar counts
2. **Chord Progression**: Specific chords in the given key
3. **Instrumentation**: Detailed list of instruments and their roles
4. **Production Notes**: Mixing suggestions, effects, atmosphere
5. **Melodic Ideas**: Suggest melodic motifs and hooks
6. **Rhythmic Pattern**: Drum patterns and groove description
7. **Lyrics Theme**: If applicable, suggest lyrical themes and structure

Be specific and creative. Consider the artist's style and the musical parameters provided.`;

function getAudioDuration() {
  const duration = Number(process.env.STABILITY_AUDIO_DURATION_SECONDS || 30);

  if (!Number.isFinite(duration)) return 30;
  return Math.min(Math.max(Math.round(duration), 10), 180);
}

function buildAudioPrompt({
  prompt,
  style,
  tempo,
  key,
  artistContext,
  productionNotes,
}) {
  return [
    `${style} instrumental background music, ${tempo} BPM, ${key}.`,
    `Title idea: ${productionNotes.title}.`,
    `User direction: ${prompt}.`,
    artistContext ? `Artist influence: ${artistContext}.` : null,
    `Arrangement: ${productionNotes.structure}.`,
    `Instrumentation: ${productionNotes.instrumentation?.join(", ")}.`,
    `Rhythm: ${productionNotes.rhythmicPattern}.`,
    "Instrumental BGM only, no vocals, no spoken words, polished studio mix.",
  ]
    .filter(Boolean)
    .join(" ");
}

function extensionForAudioContentType(contentType) {
  if (contentType.includes("wav")) return "wav";
  if (contentType.includes("mpeg") || contentType.includes("mp3")) return "mp3";
  if (contentType.includes("ogg")) return "ogg";
  return "mp3";
}

async function generateStableAudio(audioPrompt) {
  if (!process.env.STABILITY_API_KEY) {
    return {
      provider: "stability",
      status: "unavailable",
      message:
        "Production notes and lyrics are ready. Add STABILITY_API_KEY to generate real music audio.",
      audioUrl: null,
    };
  }

  const endpoint =
    process.env.STABILITY_AUDIO_ENDPOINT || DEFAULT_STABILITY_AUDIO_ENDPOINT;
  const outputFormat = process.env.STABILITY_AUDIO_OUTPUT_FORMAT || "mp3";
  const formData = new FormData();

  formData.append("prompt", audioPrompt);
  formData.append("output_format", outputFormat);
  formData.append("duration", String(getAudioDuration()));
  formData.append("steps", process.env.STABILITY_AUDIO_STEPS || "30");
  formData.append("cfg_scale", process.env.STABILITY_AUDIO_CFG_SCALE || "7");
  formData.append("none", new Blob([""]));

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
      accept: "audio/*",
    },
    body: formData,
  });

  if (!response.ok) {
    const details = await response.text();
    console.error("Stability audio generation failed:", {
      status: response.status,
      details,
    });

    return {
      provider: "stability",
      status: response.status === 429 ? "rate_limited" : "failed",
      message:
        response.status === 429
          ? "Audio generation is rate limited. Production notes and lyrics are still ready."
          : "Audio generation failed. Production notes and lyrics are still ready.",
      audioUrl: null,
    };
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = await response.json();
    const audioBase64 = data.audio || data.output?.audio;

    if (!audioBase64) {
      return {
        provider: "stability",
        status: "failed",
        message:
          "Audio generation returned an unsupported response shape. Production notes and lyrics are still ready.",
        audioUrl: null,
      };
    }

    return {
      provider: "stability",
      status: "ready",
      message: "Music audio generated successfully.",
      audioUrl: `data:audio/${outputFormat};base64,${audioBase64}`,
      seed: data.seed || null,
      finishReason: data.finish_reason || null,
    };
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer());
  const extension = extensionForAudioContentType(contentType);

  return {
    provider: "stability",
    status: "ready",
    message: "Music audio generated successfully.",
    audioUrl: `data:${contentType || `audio/${extension}`};base64,${audioBuffer.toString("base64")}`,
  };
}

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt, style, tempo, key, artistContext } = req.body;

    // Validate input
    const validation = validateInput(prompt, style, tempo, key);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Construct detailed generation prompt
    const userPrompt = `Generate detailed music production notes for a new song with the following parameters:

**Style**: ${style}
**Tempo**: ${tempo} BPM
**Key**: ${key}
**User Request**: ${prompt}
${artistContext ? `**Artist Influence**: ${artistContext}` : ""}

Provide comprehensive production notes in JSON format with the following structure:
{
  "title": "Suggested song title",
  "structure": "Song structure with sections",
  "chordProgression": "Chord progression in the specified key",
  "instrumentation": ["List of instruments"],
  "productionNotes": "Detailed production guidance",
  "melodicIdeas": "Melodic suggestions",
  "rhythmicPattern": "Drum and rhythm description",
  "lyricsTheme": "Suggested lyrical themes and hooks"
}`;

    // Call GPT-4o to generate production notes
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const productionNotes = JSON.parse(completion.choices[0].message.content);

    // Generate lyrics separately for better quality
    const lyricsPrompt = `Write song lyrics for a ${style} song with the following theme: ${productionNotes.lyricsTheme}. The song structure is: ${productionNotes.structure}. Keep it creative and emotionally resonant. Write only the lyrics, organized by sections.`;

    const lyricsCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a skilled lyricist. Write compelling, emotionally resonant song lyrics.",
        },
        { role: "user", content: lyricsPrompt },
      ],
      temperature: 0.9,
      max_tokens: 1000,
    });

    const generatedLyrics = lyricsCompletion.choices[0].message.content;
    const audioPrompt = buildAudioPrompt({
      prompt,
      style,
      tempo,
      key,
      artistContext,
      productionNotes,
    });

    const audioGeneration = await generateStableAudio(audioPrompt);

    return res.status(200).json({
      productionNotes,
      generatedLyrics,
      audioUrl: audioGeneration.audioUrl,
      audioPrompt,
      audioProvider: audioGeneration.provider,
      audioGeneration,
      status:
        audioGeneration.status === "ready"
          ? "audio_ready"
          : "notes_ready_audio_unavailable",
      message: audioGeneration.message,
    });
  } catch (error) {
    console.error("Music generation API error:", error);

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

    return res.status(500).json({
      error: "An error occurred generating music",
    });
  }
}
