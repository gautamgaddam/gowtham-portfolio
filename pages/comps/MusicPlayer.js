import React, { useState, useRef, useEffect } from "react";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import { IconButton } from "@mui/material";
import { Howl } from "howler";
import styles from "../../styles/vinyl.module.css";

const songs = [
  { id: 1, title: "Song 1", src: "../songs/Prince.mp3" },
  { id: 2, title: "Song 2", src: "../songs/Prince.mp3" },
  { id: 3, title: "Song 3", src: "../songs/Prince.mp3" },
];

export default function MusicPlayer() {
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  useEffect(() => {
    return () => {
      // console.log("unmount", isPlaying);
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);
  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      const audio = new Howl({ src: [songs[currentSongIndex].src] });
      audioRef.current = audio;
      audio.play();
      setIsPlaying(true);
    }
  };
  const handleNext = () => {
    setCurrentSongIndex((prevIndex) =>
      prevIndex === songs.length - 1 ? 0 : prevIndex + 1
    );
    audioRef.current = new Howl({ src: [songs[currentSongIndex].src] });
    audioRef.current.play();
    setIsPlaying(true);
  };

  const handlePrevious = () => {
    setCurrentSongIndex((prevIndex) =>
      prevIndex === 0 ? songs.length - 1 : prevIndex - 1
    );
    audioRef.current = new Howl({ src: [songs[currentSongIndex].src] });
    audioRef.current.play();
    setIsPlaying(true);
  };
  // console.log(isPlaying);
  return (
    <div className={styles.wrap}>
      <div className={styles.album}>
        <div className={styles.musicPlayer}>
          <IconButton aria-label="Previous" onClick={handlePrevious}>
            <SkipPreviousIcon />
          </IconButton>
          <IconButton
            aria-label={isPlaying ? "Pause" : "Play"}
            onClick={handlePlayPause}
          >
            {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>
          <IconButton aria-label="Next" onClick={handleNext}>
            <SkipNextIcon />
          </IconButton>
        </div>
        <div className={styles.vinyl + (isPlaying ? " " : " " + styles.pause)}>
          <div className={styles.print}></div>
        </div>
      </div>
    </div>
  );
}
