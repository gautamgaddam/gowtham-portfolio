import { useState, useRef, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DownloadIcon from "@mui/icons-material/Download";
import { useTheme } from "@mui/material/styles";
import gsap, { Power3 } from "gsap";
import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import styles from "../styles/musicstudio.module.css";

// Register ChartJS components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

const MUSICAL_STYLES = [
  "Pop",
  "Electronic",
  "Jazz",
  "Classical",
  "Hip-Hop",
  "Rock",
  "R&B",
  "Country",
  "Indie",
  "Folk",
];

const MUSICAL_KEYS = [
  "C Major",
  "C# Major",
  "D Major",
  "D# Major",
  "E Major",
  "F Major",
  "F# Major",
  "G Major",
  "G# Major",
  "A Major",
  "A# Major",
  "B Major",
  "C Minor",
  "C# Minor",
  "D Minor",
  "D# Minor",
  "E Minor",
  "F Minor",
  "F# Minor",
  "G Minor",
  "G# Minor",
  "A Minor",
  "A# Minor",
  "B Minor",
];

// ElevenLabs public voice IDs (these are example IDs - use actual ones)
const VOICE_OPTIONS = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel (Calm Female)" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi (Strong Female)" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella (Soft Female)" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni (Well-Rounded Male)" },
  { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli (Emotional Female)" },
];

const MusicStudio = () => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(1);

  // Step 1: Artist Analysis
  const [artistName, setArtistName] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [artistData, setArtistData] = useState(null);

  // Step 2: Music Generation
  const [musicPrompt, setMusicPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("Pop");
  const [tempo, setTempo] = useState(120);
  const [selectedKey, setSelectedKey] = useState("C Major");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);

  // Step 3: Voice Synthesis
  const [selectedVoice, setSelectedVoice] = useState(VOICE_OPTIONS[0].id);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);

  const audioRef = useRef(null);
  const containerRef = useRef(null);
  const patternCardsRef = useRef([]);

  const formatFeaturePercent = (value) =>
    typeof value === "number" ? `${Math.round(value * 100)}%` : "--";

  // GSAP entrance animation on mount
  useEffect(() => {
    if (containerRef.current) {
      gsap.from(containerRef.current, {
        duration: 0.6,
        opacity: 0,
        y: 40,
        ease: Power3.easeOut,
      });
    }
  }, []);

  // GSAP stagger animation for pattern cards when artist data loads
  useEffect(() => {
    if (artistData && patternCardsRef.current.length > 0) {
      gsap.from(patternCardsRef.current, {
        duration: 0.5,
        opacity: 0,
        y: 30,
        ease: Power3.easeOut,
        stagger: 0.1,
      });
    }
  }, [artistData]);

  // Step 1: Search and analyze artist
  const handleArtistSearch = async () => {
    if (!artistName.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch("/api/spotify-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistName: artistName.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to analyze artist");
        return;
      }

      const data = await response.json();
      setArtistData(data);
      setActiveStep(2);

      // Pre-fill generation form with artist's average tempo
      if (data.averages?.tempo) {
        setTempo(data.averages.tempo);
      }
    } catch (error) {
      console.error("Artist search error:", error);
      alert("An error occurred searching for the artist");
    } finally {
      setIsSearching(false);
    }
  };

  // Step 2: Generate music production notes
  const handleMusicGeneration = async () => {
    if (!musicPrompt.trim()) {
      alert("Please enter a prompt for music generation");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/music-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: musicPrompt.trim(),
          style: selectedStyle,
          tempo: tempo,
          key: selectedKey,
          artistContext: artistData
            ? `Influenced by ${artistData.artist.name}, genres: ${artistData.artist.genres.join(", ")}`
            : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to generate music");
        return;
      }

      const data = await response.json();
      setGenerationResult(data);
      setActiveStep(3);
    } catch (error) {
      console.error("Music generation error:", error);
      alert("An error occurred generating music");
    } finally {
      setIsGenerating(false);
    }
  };

  // Step 3: Synthesize voice
  const handleVoiceSynthesis = async () => {
    if (!generationResult?.generatedLyrics) {
      alert("No lyrics available to synthesize");
      return;
    }

    setIsSynthesizing(true);
    try {
      const response = await fetch("/api/voice-synth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: generationResult.generatedLyrics,
          voiceId: selectedVoice,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to synthesize voice");
        return;
      }

      // Create blob URL for audio
      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
    } catch (error) {
      console.error("Voice synthesis error:", error);
      alert("An error occurred during voice synthesis");
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Prepare radar chart data
  const getRadarChartData = () => {
    if (!artistData?.averages) return null;

    const avg = artistData.averages;
    const radarValues = [
      avg.energy,
      avg.danceability,
      avg.valence,
      avg.acousticness,
      avg.instrumentalness,
      avg.speechiness,
      avg.liveness,
    ];

    if (!radarValues.some((value) => typeof value === "number")) return null;

    return {
      labels: [
        "Energy",
        "Danceability",
        "Valence",
        "Acousticness",
        "Instrumentalness",
        "Speechiness",
        "Liveness",
      ],
      datasets: [
        {
          label: artistData.artist.name,
          data: radarValues.map((value) =>
            typeof value === "number" ? value * 100 : 0,
          ),
          backgroundColor: "rgba(99, 102, 241, 0.2)",
          borderColor: "rgba(99, 102, 241, 1)",
          borderWidth: 2,
          pointBackgroundColor: "rgba(99, 102, 241, 1)",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgba(99, 102, 241, 1)",
        },
      ],
    };
  };

  const radarOptions = {
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: theme.palette.mode === "dark" ? "#94a3b8" : "#64748b",
        },
        grid: {
          color: theme.palette.mode === "dark" ? "#333" : "#e2e8f0",
        },
        pointLabels: {
          color: theme.palette.mode === "dark" ? "#e2e8f0" : "#1a1a1a",
          font: {
            size: 12,
            weight: "bold",
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  return (
    <Box ref={containerRef} className={styles.studioContainer}>
      {/* Header */}
      <Box className={styles.studioHeader}>
        <Typography variant="h1">🎵 AI Music Studio</Typography>
      </Box>

      {/* Step Indicator */}
      <Box className={styles.stepIndicator}>
        <Box
          className={`${styles.step} ${
            activeStep === 1 ? styles.stepActive : ""
          } ${activeStep > 1 ? styles.stepComplete : ""}`}
        >
          <Box className={styles.stepNumber}>
            {activeStep > 1 ? <CheckCircleIcon fontSize="small" /> : "1"}
          </Box>
          <Typography>Analyze Artist</Typography>
        </Box>
        <Box
          className={`${styles.step} ${
            activeStep === 2 ? styles.stepActive : ""
          } ${activeStep > 2 ? styles.stepComplete : ""}`}
        >
          <Box className={styles.stepNumber}>
            {activeStep > 2 ? <CheckCircleIcon fontSize="small" /> : "2"}
          </Box>
          <Typography>Generate Music</Typography>
        </Box>
        <Box
          className={`${styles.step} ${
            activeStep === 3 ? styles.stepActive : ""
          }`}
        >
          <Box className={styles.stepNumber}>3</Box>
          <Typography>Voice Synthesis</Typography>
        </Box>
      </Box>

      {/* Step 1: Artist Analysis */}
      <Box className={styles.section}>
        <Typography className={styles.sectionTitle}>
          <SearchIcon /> Step 1: Analyze Artist Patterns
        </Typography>
        <Box className={styles.artistInput}>
          <TextField
            fullWidth
            label="Enter Artist Name"
            variant="outlined"
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleArtistSearch()}
            disabled={isSearching}
            sx={{
              "& .MuiOutlinedInput-root": {
                color: theme.palette.mode === "dark" ? "#e2e8f0" : "#1a1a1a",
                backgroundColor:
                  theme.palette.mode === "dark" ? "#0d0d0d" : "#fff",
                "& fieldset": {
                  borderColor: "#333",
                  borderWidth: "2px",
                },
                "&:hover fieldset": {
                  borderColor: "#6366f1",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#6366f1",
                },
              },
              "& .MuiInputLabel-root": {
                color: theme.palette.mode === "dark" ? "#94a3b8" : "#64748b",
              },
            }}
          />
          <Button
            className={styles.searchButton}
            onClick={handleArtistSearch}
            disabled={!artistName.trim() || isSearching}
            startIcon={
              isSearching ? <CircularProgress size={20} /> : <SearchIcon />
            }
          >
            {isSearching ? "Analyzing..." : "Analyze"}
          </Button>
        </Box>

        {/* Artist Results */}
        {artistData && (
          <>
            <Box className={styles.artistCard}>
              {artistData.artist.image && (
                <img
                  src={artistData.artist.image}
                  alt={artistData.artist.name}
                  className={styles.artistImage}
                />
              )}
              <Box className={styles.artistInfo}>
                <Typography className={styles.artistName}>
                  {artistData.artist.name}
                </Typography>
                <Box className={styles.artistMeta}>
                  <Chip
                    label={`${artistData.artist.followers.toLocaleString()} followers`}
                    className={styles.metaChip}
                    size="small"
                  />
                  <Chip
                    label={`Popularity: ${artistData.artist.popularity}/100`}
                    className={styles.metaChip}
                    size="small"
                  />
                  {artistData.artist.genres.slice(0, 3).map((genre, idx) => (
                    <Chip
                      key={idx}
                      label={genre}
                      className={styles.metaChip}
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            </Box>

            {/* Audio Features Pattern Grid */}
            {!artistData.averages && artistData.analysis?.message && (
              <Box className={styles.analysisNotice}>
                <Typography className={styles.analysisNoticeTitle}>
                  Artist metadata ready
                </Typography>
                <Typography>{artistData.analysis.message}</Typography>
              </Box>
            )}

            {artistData.averages && (
              <Box className={styles.patternGrid}>
                <Box
                  ref={(el) => (patternCardsRef.current[0] = el)}
                  className={styles.patternCard}
                >
                  <Typography className={styles.patternLabel}>Tempo</Typography>
                  <Typography className={styles.patternValue}>
                    {typeof artistData.averages.tempo === "number"
                      ? `${artistData.averages.tempo} BPM`
                      : "--"}
                  </Typography>
                </Box>
                <Box
                  ref={(el) => (patternCardsRef.current[1] = el)}
                  className={styles.patternCard}
                >
                  <Typography className={styles.patternLabel}>
                    Energy
                  </Typography>
                  <Typography className={styles.patternValue}>
                    {formatFeaturePercent(artistData.averages.energy)}
                  </Typography>
                </Box>
                <Box
                  ref={(el) => (patternCardsRef.current[2] = el)}
                  className={styles.patternCard}
                >
                  <Typography className={styles.patternLabel}>
                    Danceability
                  </Typography>
                  <Typography className={styles.patternValue}>
                    {formatFeaturePercent(artistData.averages.danceability)}
                  </Typography>
                </Box>
                <Box
                  ref={(el) => (patternCardsRef.current[3] = el)}
                  className={styles.patternCard}
                >
                  <Typography className={styles.patternLabel}>
                    Valence
                  </Typography>
                  <Typography className={styles.patternValue}>
                    {formatFeaturePercent(artistData.averages.valence)}
                  </Typography>
                </Box>
                <Box
                  ref={(el) => (patternCardsRef.current[4] = el)}
                  className={styles.patternCard}
                >
                  <Typography className={styles.patternLabel}>
                    Acousticness
                  </Typography>
                  <Typography className={styles.patternValue}>
                    {formatFeaturePercent(artistData.averages.acousticness)}
                  </Typography>
                </Box>
                <Box
                  ref={(el) => (patternCardsRef.current[5] = el)}
                  className={styles.patternCard}
                >
                  <Typography className={styles.patternLabel}>
                    Instrumentalness
                  </Typography>
                  <Typography className={styles.patternValue}>
                    {formatFeaturePercent(
                      artistData.averages.instrumentalness,
                    )}
                  </Typography>
                </Box>
                <Box
                  ref={(el) => (patternCardsRef.current[6] = el)}
                  className={styles.patternCard}
                >
                  <Typography className={styles.patternLabel}>
                    Speechiness
                  </Typography>
                  <Typography className={styles.patternValue}>
                    {formatFeaturePercent(artistData.averages.speechiness)}
                  </Typography>
                </Box>
                <Box
                  ref={(el) => (patternCardsRef.current[7] = el)}
                  className={styles.patternCard}
                >
                  <Typography className={styles.patternLabel}>
                    Liveness
                  </Typography>
                  <Typography className={styles.patternValue}>
                    {formatFeaturePercent(artistData.averages.liveness)}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Radar Chart */}
            {getRadarChartData() && (
              <Box className={styles.radarSection}>
                <Box sx={{ maxWidth: "500px", width: "100%" }}>
                  <Radar data={getRadarChartData()} options={radarOptions} />
                </Box>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Step 2: Music Generation */}
      {activeStep >= 2 && (
        <Box className={styles.section}>
          <Typography className={styles.sectionTitle}>
            <MusicNoteIcon /> Step 2: Generate Music
          </Typography>
          <Box className={styles.generatorForm}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Describe the song you want to create"
              variant="outlined"
              value={musicPrompt}
              onChange={(e) => setMusicPrompt(e.target.value)}
              placeholder="E.g., An upbeat summer anthem about freedom and adventure"
              disabled={isGenerating}
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: theme.palette.mode === "dark" ? "#e2e8f0" : "#1a1a1a",
                  backgroundColor:
                    theme.palette.mode === "dark" ? "#0d0d0d" : "#fff",
                  "& fieldset": {
                    borderColor: "#333",
                    borderWidth: "2px",
                  },
                  "&:hover fieldset": {
                    borderColor: "#6366f1",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#6366f1",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: theme.palette.mode === "dark" ? "#94a3b8" : "#64748b",
                },
              }}
            />

            <Box className={styles.formRow}>
              <FormControl fullWidth>
                <InputLabel
                  sx={{
                    color:
                      theme.palette.mode === "dark" ? "#94a3b8" : "#64748b",
                  }}
                >
                  Musical Style
                </InputLabel>
                <Select
                  value={selectedStyle}
                  label="Musical Style"
                  onChange={(e) => setSelectedStyle(e.target.value)}
                  disabled={isGenerating}
                  sx={{
                    color:
                      theme.palette.mode === "dark" ? "#e2e8f0" : "#1a1a1a",
                    backgroundColor:
                      theme.palette.mode === "dark" ? "#0d0d0d" : "#fff",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#333",
                      borderWidth: "2px",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#6366f1",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#6366f1",
                    },
                  }}
                >
                  {MUSICAL_STYLES.map((style) => (
                    <MenuItem key={style} value={style}>
                      {style}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel
                  sx={{
                    color:
                      theme.palette.mode === "dark" ? "#94a3b8" : "#64748b",
                  }}
                >
                  Musical Key
                </InputLabel>
                <Select
                  value={selectedKey}
                  label="Musical Key"
                  onChange={(e) => setSelectedKey(e.target.value)}
                  disabled={isGenerating}
                  sx={{
                    color:
                      theme.palette.mode === "dark" ? "#e2e8f0" : "#1a1a1a",
                    backgroundColor:
                      theme.palette.mode === "dark" ? "#0d0d0d" : "#fff",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#333",
                      borderWidth: "2px",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#6366f1",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#6366f1",
                    },
                  }}
                >
                  {MUSICAL_KEYS.map((key) => (
                    <MenuItem key={key} value={key}>
                      {key}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Typography
                sx={{
                  color: theme.palette.mode === "dark" ? "#94a3b8" : "#64748b",
                  mb: 1,
                }}
              >
                Tempo: {tempo} BPM
              </Typography>
              <Slider
                value={tempo}
                onChange={(e, newValue) => setTempo(newValue)}
                min={60}
                max={200}
                disabled={isGenerating}
                sx={{
                  color: "#6366f1",
                  "& .MuiSlider-thumb": {
                    backgroundColor: "#6366f1",
                  },
                  "& .MuiSlider-track": {
                    backgroundColor: "#6366f1",
                  },
                }}
              />
            </Box>

            <Button
              className={styles.generateButton}
              onClick={handleMusicGeneration}
              disabled={!musicPrompt.trim() || isGenerating}
              startIcon={
                isGenerating ? (
                  <CircularProgress size={20} />
                ) : (
                  <AudiotrackIcon />
                )
              }
            >
              {isGenerating ? "Generating..." : "Generate Music"}
            </Button>

            {isGenerating && (
              <Box className={styles.waveformLoader}>
                <Box className={styles.waveBar} />
                <Box className={styles.waveBar} />
                <Box className={styles.waveBar} />
                <Box className={styles.waveBar} />
                <Box className={styles.waveBar} />
              </Box>
            )}

            {/* Production Notes Display */}
            {generationResult && (
              <Box className={styles.productionNotes}>
                <Typography variant="h4" sx={{ color: "#6366f1", mb: 2 }}>
                  🎼 {generationResult.productionNotes.title}
                </Typography>

                <Box className={styles.generationStatus}>
                  <Typography className={styles.generationStatusTitle}>
                    {generationResult.audioGeneration?.status === "ready"
                      ? "Generated music ready"
                      : "Production notes ready"}
                  </Typography>
                  <Typography>
                    {generationResult.message ||
                      generationResult.audioGeneration?.message}
                  </Typography>
                  {generationResult.audioProvider && (
                    <Chip
                      label={`Provider: ${generationResult.audioProvider}`}
                      className={styles.metaChip}
                      size="small"
                    />
                  )}
                </Box>

                {generationResult.audioUrl && (
                  <Box className={styles.audioPlayer}>
                    <Typography variant="h5" sx={{ color: "#6366f1", mb: 2 }}>
                      Generated BGM
                    </Typography>
                    <audio controls src={generationResult.audioUrl} />
                    <Button
                      className={styles.downloadButton}
                      href={generationResult.audioUrl}
                      download="generated-music.mp3"
                      startIcon={<DownloadIcon />}
                    >
                      Download Music
                    </Button>
                  </Box>
                )}

                <Box className={styles.notesSection}>
                  <Typography variant="h6">Song Structure</Typography>
                  <Typography>
                    {generationResult.productionNotes.structure}
                  </Typography>
                </Box>

                <Box className={styles.notesSection}>
                  <Typography variant="h6">Chord Progression</Typography>
                  <Typography>
                    {generationResult.productionNotes.chordProgression}
                  </Typography>
                </Box>

                <Box className={styles.notesSection}>
                  <Typography variant="h6">Instrumentation</Typography>
                  <ul>
                    {generationResult.productionNotes.instrumentation.map(
                      (instrument, idx) => (
                        <li key={idx}>{instrument}</li>
                      ),
                    )}
                  </ul>
                </Box>

                <Box className={styles.notesSection}>
                  <Typography variant="h6">Production Notes</Typography>
                  <Typography>
                    {generationResult.productionNotes.productionNotes}
                  </Typography>
                </Box>

                <Box className={styles.notesSection}>
                  <Typography variant="h6">Melodic Ideas</Typography>
                  <Typography>
                    {generationResult.productionNotes.melodicIdeas}
                  </Typography>
                </Box>

                <Box className={styles.notesSection}>
                  <Typography variant="h6">Rhythmic Pattern</Typography>
                  <Typography>
                    {generationResult.productionNotes.rhythmicPattern}
                  </Typography>
                </Box>

                {generationResult.generatedLyrics && (
                  <Box className={styles.lyricsDisplay}>
                    <Typography variant="h6" sx={{ color: "#8b5cf6", mb: 2 }}>
                      📝 Generated Lyrics
                    </Typography>
                    {generationResult.generatedLyrics}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* Step 3: Voice Synthesis */}
      {activeStep >= 3 && generationResult && (
        <Box className={styles.section}>
          <Typography className={styles.sectionTitle}>
            <RecordVoiceOverIcon /> Step 3: Voice Synthesis
          </Typography>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel
              sx={{
                color: theme.palette.mode === "dark" ? "#94a3b8" : "#64748b",
              }}
            >
              Select Voice
            </InputLabel>
            <Select
              value={selectedVoice}
              label="Select Voice"
              onChange={(e) => setSelectedVoice(e.target.value)}
              disabled={isSynthesizing}
              sx={{
                color: theme.palette.mode === "dark" ? "#e2e8f0" : "#1a1a1a",
                backgroundColor:
                  theme.palette.mode === "dark" ? "#0d0d0d" : "#fff",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#333",
                  borderWidth: "2px",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#6366f1",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#6366f1",
                },
              }}
            >
              {VOICE_OPTIONS.map((voice) => (
                <MenuItem key={voice.id} value={voice.id}>
                  {voice.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            className={styles.generateButton}
            onClick={handleVoiceSynthesis}
            disabled={isSynthesizing}
            startIcon={
              isSynthesizing ? (
                <CircularProgress size={20} />
              ) : (
                <RecordVoiceOverIcon />
              )
            }
          >
            {isSynthesizing ? "Synthesizing..." : "Synthesize Voice"}
          </Button>

          {isSynthesizing && (
            <Box className={styles.waveformLoader}>
              <Box className={styles.waveBar} />
              <Box className={styles.waveBar} />
              <Box className={styles.waveBar} />
              <Box className={styles.waveBar} />
              <Box className={styles.waveBar} />
            </Box>
          )}

          {/* Audio Player */}
          {audioUrl && (
            <Box className={styles.audioPlayer}>
              <Typography variant="h5" sx={{ color: "#6366f1", mb: 2 }}>
                🎤 Your Generated Voice
              </Typography>
              <audio ref={audioRef} controls src={audioUrl} />
              <Button
                className={styles.downloadButton}
                href={audioUrl}
                download="generated-voice.mp3"
                startIcon={<DownloadIcon />}
              >
                Download Audio
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default MusicStudio;
