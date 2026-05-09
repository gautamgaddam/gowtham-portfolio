import OpenAI from "openai";

export const config = {
  runtime: "nodejs",
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    // TODO: Wire Suno API here for actual audio generation
    // Expected Suno API call shape:
    // const sunoResponse = await fetch('https://api.suno.ai/v1/generate', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.SUNO_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     prompt: `${style} song, ${tempo} BPM, ${productionNotes.title}`,
    //     lyrics: generatedLyrics,
    //     duration: 180, // 3 minutes
    //     instrumental: false,
    //   }),
    // });
    // const sunoData = await sunoResponse.json();
    // audioUrl = sunoData.audio_url;

    return res.status(200).json({
      productionNotes,
      generatedLyrics,
      audioUrl: null, // Will be populated when Suno API is integrated
      status: "notes_ready",
      message:
        "Production notes and lyrics generated. Audio generation coming soon!",
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
