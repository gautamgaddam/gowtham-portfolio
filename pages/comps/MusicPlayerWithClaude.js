// comps/MusicPlayer.js
import { useEffect, useState, useRef } from "react";
import { Howl } from "howler";
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Typography,
  Slider,
  Stack,
  Tab,
  Tabs,
} from "@mui/material";
import {
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  VolumeUp,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";

// Styled components
const PlayerCard = styled(Card)(({ theme }) => ({
  background: "linear-gradient(45deg, #FF8A65 30%, #FFB74D 90%)",
  boxShadow: "0 3px 5px 2px rgba(255, 105, 135, .3)",
  color: theme.palette.common.white,
  borderRadius: 16,
  padding: theme.spacing(2),
}));

const PlayerControls = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: theme.spacing(2),
}));

const MusicPlayerNew = () => {
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const soundRef = useRef(null);
  const progressInterval = useRef(null);

  // Sample data - Replace with your actual data
  const playlists = {
    trending: [
      { id: 1, title: "Song 1", artist: "Artist 1", url: "/path/to/song1.mp3" },
      { id: 2, title: "Song 2", artist: "Artist 2", url: "/path/to/song2.mp3" },
    ],
    artists: [
      { id: 3, title: "Song 3", artist: "Artist 3", url: "/path/to/song3.mp3" },
      { id: 4, title: "Song 4", artist: "Artist 4", url: "/path/to/song4.mp3" },
    ],
    recent: [
      { id: 5, title: "Song 5", artist: "Artist 5", url: "/path/to/song5.mp3" },
      { id: 6, title: "Song 6", artist: "Artist 6", url: "/path/to/song6.mp3" },
    ],
  };

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unload();
      }
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  const handlePlayPause = () => {
    if (!currentSong) return;

    if (!soundRef.current) {
      soundRef.current = new Howl({
        src: [currentSong.url],
        volume: volume,
        onend: () => {
          setIsPlaying(false);
          clearInterval(progressInterval.current);
          setProgress(0);
        },
      });
    }

    if (!isPlaying) {
      soundRef.current.play();
      setIsPlaying(true);
      progressInterval.current = setInterval(() => {
        setProgress(
          (soundRef.current.seek() / soundRef.current.duration()) * 100
        );
      }, 1000);
    } else {
      soundRef.current.pause();
      setIsPlaying(false);
      clearInterval(progressInterval.current);
    }
  };

  const handleVolumeChange = (event, newValue) => {
    setVolume(newValue);
    if (soundRef.current) {
      soundRef.current.volume(newValue);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSongSelect = (song) => {
    if (soundRef.current) {
      soundRef.current.unload();
    }
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    setCurrentSong(song);
    setProgress(0);
    soundRef.current = null;
    setIsPlaying(false);
  };

  return (
    <Box sx={{ maxWidth: 600, margin: "auto", p: 2 }}>
      <PlayerCard>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            संगीत Player
          </Typography>

          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            centered
            sx={{ mb: 2 }}
          >
            <Tab label="Trending" />
            <Tab label="Artists" />
            <Tab label="Recent" />
          </Tabs>

          <Box sx={{ mb: 4 }}>
            {Object.values(playlists)[activeTab].map((song) => (
              <Box
                key={song.id}
                onClick={() => handleSongSelect(song)}
                sx={{
                  p: 1,
                  cursor: "pointer",
                  "&:hover": {
                    bgcolor: "rgba(255, 255, 255, 0.1)",
                  },
                  borderRadius: 1,
                }}
              >
                <Typography variant="subtitle1">{song.title}</Typography>
                <Typography variant="caption">{song.artist}</Typography>
              </Box>
            ))}
          </Box>

          {currentSong && (
            <>
              <Typography variant="h6">{currentSong.title}</Typography>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                {currentSong.artist}
              </Typography>

              <Slider value={progress} sx={{ mb: 2 }} disabled />

              <PlayerControls>
                <IconButton color="inherit">
                  <SkipPrevious />
                </IconButton>
                <IconButton
                  color="inherit"
                  onClick={handlePlayPause}
                  sx={{
                    bgcolor: "rgba(255, 255, 255, 0.1)",
                    "&:hover": {
                      bgcolor: "rgba(255, 255, 255, 0.2)",
                    },
                  }}
                >
                  {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>
                <IconButton color="inherit">
                  <SkipNext />
                </IconButton>
              </PlayerControls>

              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{ mt: 2 }}
              >
                <VolumeUp />
                <Slider
                  value={volume}
                  onChange={handleVolumeChange}
                  min={0}
                  max={1}
                  step={0.1}
                  sx={{ color: "white" }}
                />
              </Stack>
            </>
          )}
        </CardContent>
      </PlayerCard>
    </Box>
  );
};

export default MusicPlayerNew;
