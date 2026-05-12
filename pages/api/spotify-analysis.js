import SpotifyWebApi from "spotify-web-api-node";

export const config = {
  runtime: "nodejs",
};

// Spotify API client with credentials flow (no user login required)
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

// Token cache (in-memory, resets on serverless function restart)
let tokenCache = {
  accessToken: null,
  expiresAt: null,
};

// Get access token with caching
async function getAccessToken() {
  const now = Date.now();

  // Return cached token if still valid (with 60s buffer)
  if (tokenCache.accessToken && tokenCache.expiresAt > now + 60000) {
    return tokenCache.accessToken;
  }

  try {
    console.log("Attempting to get Spotify access token...");
    console.log("Client ID exists:", !!process.env.SPOTIFY_CLIENT_ID);
    console.log("Client Secret exists:", !!process.env.SPOTIFY_CLIENT_SECRET);
    
    const data = await spotifyApi.clientCredentialsGrant();
    tokenCache.accessToken = data.body.access_token;
    tokenCache.expiresAt = now + data.body.expires_in * 1000;

    spotifyApi.setAccessToken(tokenCache.accessToken);
    console.log("Successfully obtained Spotify access token");
    return tokenCache.accessToken;
  } catch (error) {
    console.error("Error getting Spotify access token:", error);
    console.error("Error details:", error.body);
    throw new Error("Failed to authenticate with Spotify");
  }
}

// Input validation
function validateInput(artistName) {
  if (!artistName || typeof artistName !== "string") {
    return { valid: false, error: "Artist name must be a string" };
  }

  if (artistName.length === 0 || artistName.length > 100) {
    return {
      valid: false,
      error: "Artist name must be between 1 and 100 characters",
    };
  }

  return { valid: true };
}

// Compute average audio features
function computeAverages(audioFeatures) {
  const features = audioFeatures.filter((f) => f !== null);

  if (features.length === 0) {
    return null;
  }

  const sum = features.reduce(
    (acc, feature) => ({
      tempo: acc.tempo + feature.tempo,
      energy: acc.energy + feature.energy,
      valence: acc.valence + feature.valence,
      danceability: acc.danceability + feature.danceability,
      acousticness: acc.acousticness + feature.acousticness,
      instrumentalness: acc.instrumentalness + feature.instrumentalness,
      speechiness: acc.speechiness + feature.speechiness,
      liveness: acc.liveness + feature.liveness,
    }),
    {
      tempo: 0,
      energy: 0,
      valence: 0,
      danceability: 0,
      acousticness: 0,
      instrumentalness: 0,
      speechiness: 0,
      liveness: 0,
    },
  );

  const count = features.length;

  return {
    tempo: Math.round(sum.tempo / count),
    energy: Math.round((sum.energy / count) * 100) / 100,
    valence: Math.round((sum.valence / count) * 100) / 100,
    danceability: Math.round((sum.danceability / count) * 100) / 100,
    acousticness: Math.round((sum.acousticness / count) * 100) / 100,
    instrumentalness: Math.round((sum.instrumentalness / count) * 100) / 100,
    speechiness: Math.round((sum.speechiness / count) * 100) / 100,
    liveness: Math.round((sum.liveness / count) * 100) / 100,
  };
}

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { artistName } = req.body;

    // Validate input
    const validation = validateInput(artistName);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Get access token
    await getAccessToken();

    // Search for artist
    const searchResult = await spotifyApi.searchArtists(artistName, {
      limit: 1,
    });

    if (searchResult.body.artists.items.length === 0) {
      return res.status(404).json({ error: "Artist not found" });
    }

    const artist = searchResult.body.artists.items[0];

    // Get artist's top tracks
    const topTracksResult = await spotifyApi.getArtistTopTracks(
      artist.id,
      "US",
    );

    if (topTracksResult.body.tracks.length === 0) {
      return res.status(404).json({ error: "No tracks found for this artist" });
    }

    const tracks = topTracksResult.body.tracks.slice(0, 10);

    // Get audio features for all tracks
    const trackIds = tracks.map((track) => track.id);
    const audioFeaturesResult =
      await spotifyApi.getAudioFeaturesForTracks(trackIds);

    // Compute averages
    const averages = computeAverages(audioFeaturesResult.body.audio_features);

    // Format tracks data
    const tracksData = tracks.map((track, idx) => {
      const audioFeature = audioFeaturesResult.body.audio_features[idx];
      return {
        id: track.id,
        name: track.name,
        popularity: track.popularity,
        previewUrl: track.preview_url,
        albumImage: track.album.images[0]?.url,
        audioFeatures: audioFeature
          ? {
              tempo: Math.round(audioFeature.tempo),
              energy: audioFeature.energy,
              valence: audioFeature.valence,
              danceability: audioFeature.danceability,
              key: audioFeature.key,
              mode: audioFeature.mode,
            }
          : null,
      };
    });

    // Return comprehensive data
    return res.status(200).json({
      artist: {
        id: artist.id,
        name: artist.name,
        image: artist.images[0]?.url,
        genres: artist.genres,
        popularity: artist.popularity,
        followers: artist.followers.total,
      },
      tracks: tracksData,
      averages,
    });
  } catch (error) {
    console.error("Spotify analysis API error:", error);
    console.error("Error status code:", error.statusCode);
    console.error("Error body:", error.body);

    if (error.statusCode === 401 || error.statusCode === 403) {
      return res.status(500).json({
        error:
          "Spotify authentication failed. Please check your API credentials in the Spotify Developer Dashboard.",
        details: error.body?.error?.message || "Forbidden or Unauthorized",
      });
    }

    if (error.statusCode === 429) {
      return res.status(429).json({
        error: "Rate limit exceeded. Please try again in a moment.",
      });
    }

    return res.status(500).json({
      error: "An error occurred analyzing the artist",
      details: error.message,
    });
  }
}
