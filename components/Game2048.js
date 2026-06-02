import React, { useEffect, useRef, useState } from "react";
import styles from "../styles/game2048.module.css";
import { drawGlowText } from "./gameUtils";

const GRID_SIZE = 4;
const CELL_SIZE = 110;
const CELL_GAP = 15;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE + (GRID_SIZE + 1) * CELL_GAP;

const TILE_COLORS = {
  0: { bg: "rgba(238, 228, 218, 0.35)", text: "#776e65" },
  2: { bg: "#eee4da", text: "#776e65" },
  4: { bg: "#ede0c8", text: "#776e65" },
  8: { bg: "#f2b179", text: "#f9f6f2" },
  16: { bg: "#f59563", text: "#f9f6f2" },
  32: { bg: "#f67c5f", text: "#f9f6f2" },
  64: { bg: "#f65e3b", text: "#f9f6f2" },
  128: { bg: "#edcf72", text: "#f9f6f2" },
  256: { bg: "#edcc61", text: "#f9f6f2" },
  512: { bg: "#edc850", text: "#f9f6f2" },
  1024: { bg: "#edc53f", text: "#f9f6f2" },
  2048: { bg: "#edc22e", text: "#f9f6f2" },
  super: { bg: "#3c3a32", text: "#f9f6f2" },
};

const COLORS = {
  bg: "#faf8ef",
  grid: "#bbada0",
  text: "#776e65",
  textGlow: "rgba(237, 194, 46, 0.5)",
};

const Game2048 = () => {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [paused, setPaused] = useState(true);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    // Load best score from localStorage
    const saved = localStorage.getItem("2048-best-score");
    if (saved) {
      setBestScore(parseInt(saved, 10));
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    // Game state
    const game = {
      grid: [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      score: 0,
      bestScore: parseInt(localStorage.getItem("2048-best-score") || "0", 10),
      over: false,
      won: false,
      paused: true,
      started: false,
      animations: [],
    };

    // Add random tile
    const addRandomTile = () => {
      const emptyCells = [];
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          if (game.grid[row][col] === 0) {
            emptyCells.push({ row, col });
          }
        }
      }

      if (emptyCells.length > 0) {
        const { row, col } =
          emptyCells[Math.floor(Math.random() * emptyCells.length)];
        game.grid[row][col] = Math.random() < 0.9 ? 2 : 4;
        return true;
      }
      return false;
    };

    // Initialize game
    const initGame = () => {
      game.grid = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      addRandomTile();
      addRandomTile();
    };

    initGame();

    // Check if any moves available
    const hasMovesAvailable = () => {
      // Check for empty cells
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          if (game.grid[row][col] === 0) return true;
        }
      }

      // Check for possible merges
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          const current = game.grid[row][col];
          if (col < GRID_SIZE - 1 && current === game.grid[row][col + 1])
            return true;
          if (row < GRID_SIZE - 1 && current === game.grid[row + 1][col])
            return true;
        }
      }

      return false;
    };

    // Move tiles
    const move = (direction) => {
      if (game.over || game.paused || !game.started) return false;

      let moved = false;
      const oldGrid = game.grid.map((row) => [...row]);

      // Rotate grid based on direction to always move left
      const rotateLeft = () => {
        const newGrid = [];
        for (let col = GRID_SIZE - 1; col >= 0; col--) {
          const newRow = [];
          for (let row = 0; row < GRID_SIZE; row++) {
            newRow.push(game.grid[row][col]);
          }
          newGrid.push(newRow);
        }
        game.grid = newGrid;
      };

      const rotateRight = () => {
        const newGrid = [];
        for (let col = 0; col < GRID_SIZE; col++) {
          const newRow = [];
          for (let row = GRID_SIZE - 1; row >= 0; row--) {
            newRow.push(game.grid[row][col]);
          }
          newGrid.push(newRow);
        }
        game.grid = newGrid;
      };

      const rotate180 = () => {
        game.grid = game.grid.reverse().map((row) => row.reverse());
      };

      // Transform grid to move left
      if (direction === "up") rotateLeft();
      else if (direction === "down") rotateRight();
      else if (direction === "right") rotate180();

      // Move and merge
      for (let row = 0; row < GRID_SIZE; row++) {
        let newRow = game.grid[row].filter((val) => val !== 0);

        // Merge tiles
        for (let i = 0; i < newRow.length - 1; i++) {
          if (newRow[i] === newRow[i + 1]) {
            newRow[i] *= 2;
            game.score += newRow[i];
            setScore(game.score);

            if (newRow[i] === 2048 && !game.won) {
              game.won = true;
              setWon(true);
            }

            newRow.splice(i + 1, 1);
          }
        }

        // Pad with zeros
        while (newRow.length < GRID_SIZE) {
          newRow.push(0);
        }

        game.grid[row] = newRow;
      }

      // Transform back
      if (direction === "up") rotateRight();
      else if (direction === "down") rotateLeft();
      else if (direction === "right") rotate180();

      // Check if anything moved
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          if (oldGrid[row][col] !== game.grid[row][col]) {
            moved = true;
          }
        }
      }

      if (moved) {
        addRandomTile();

        // Update best score
        if (game.score > game.bestScore) {
          game.bestScore = game.score;
          localStorage.setItem("2048-best-score", game.bestScore.toString());
          setBestScore(game.bestScore);
        }

        // Check for game over
        if (!hasMovesAvailable()) {
          game.over = true;
          setGameOver(true);
        }
      }

      return moved;
    };

    // Draw tile
    const drawTile = (value, row, col) => {
      const x = CELL_GAP + col * (CELL_SIZE + CELL_GAP);
      const y = CELL_GAP + row * (CELL_SIZE + CELL_GAP);

      const colors =
        value > 2048 ? TILE_COLORS.super : TILE_COLORS[value] || TILE_COLORS[0];

      // Draw tile background
      ctx.fillStyle = colors.bg;
      ctx.beginPath();
      ctx.roundRect(x, y, CELL_SIZE, CELL_SIZE, 8);
      ctx.fill();

      // Draw tile value
      if (value > 0) {
        ctx.fillStyle = colors.text;
        ctx.font =
          value < 100
            ? "bold 55px Arial"
            : value < 1000
              ? "bold 45px Arial"
              : "bold 35px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(value.toString(), x + CELL_SIZE / 2, y + CELL_SIZE / 2);
      }
    };

    // Render game
    const render = () => {
      // Clear canvas
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Draw grid background
      ctx.fillStyle = COLORS.grid;
      ctx.beginPath();
      ctx.roundRect(0, 0, CANVAS_SIZE, CANVAS_SIZE, 8);
      ctx.fill();

      // Draw empty cells
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          const x = CELL_GAP + col * (CELL_SIZE + CELL_GAP);
          const y = CELL_GAP + row * (CELL_SIZE + CELL_GAP);
          ctx.fillStyle = TILE_COLORS[0].bg;
          ctx.beginPath();
          ctx.roundRect(x, y, CELL_SIZE, CELL_SIZE, 8);
          ctx.fill();
        }
      }

      // Draw tiles
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          drawTile(game.grid[row][col], row, col);
        }
      }

      // Draw overlays
      if (game.won && !game.over) {
        ctx.fillStyle = "rgba(237, 194, 46, 0.5)";
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        ctx.fillStyle = "#776e65";
        ctx.font = "bold 60px Arial";
        ctx.textAlign = "center";
        ctx.fillText("You Win!", CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 20);

        ctx.font = "20px Arial";
        ctx.fillText(
          "Press R to restart",
          CANVAS_SIZE / 2,
          CANVAS_SIZE / 2 + 30,
        );
        ctx.fillText(
          "or continue playing",
          CANVAS_SIZE / 2,
          CANVAS_SIZE / 2 + 60,
        );
      }

      if (game.over) {
        ctx.fillStyle = "rgba(238, 228, 218, 0.73)";
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        ctx.fillStyle = "#776e65";
        ctx.font = "bold 60px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Game Over!", CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 20);

        ctx.font = "20px Arial";
        ctx.fillText(
          "Press R to restart",
          CANVAS_SIZE / 2,
          CANVAS_SIZE / 2 + 30,
        );
      }

      // Draw start screen
      if (!game.started) {
        ctx.fillStyle = "rgba(238, 228, 218, 0.9)";
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        ctx.fillStyle = "#776e65";
        ctx.font = "bold 70px Arial";
        ctx.textAlign = "center";
        ctx.fillText("2048", CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 50);

        ctx.font = "18px Arial";
        ctx.fillText(
          "Use arrow keys to move tiles",
          CANVAS_SIZE / 2,
          CANVAS_SIZE / 2 + 10,
        );
        ctx.fillText(
          "Tiles with same numbers merge!",
          CANVAS_SIZE / 2,
          CANVAS_SIZE / 2 + 40,
        );
        ctx.fillText(
          "Get to 2048 to win!",
          CANVAS_SIZE / 2,
          CANVAS_SIZE / 2 + 70,
        );

        ctx.font = "bold 20px Arial";
        ctx.fillText(
          "Press any arrow key to start",
          CANVAS_SIZE / 2,
          CANVAS_SIZE / 2 + 110,
        );
      }

      // Draw pause overlay
      if (game.paused && game.started && !game.over) {
        ctx.fillStyle = "rgba(238, 228, 218, 0.7)";
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        ctx.fillStyle = "#776e65";
        ctx.font = "bold 50px Arial";
        ctx.textAlign = "center";
        ctx.fillText("PAUSED", CANVAS_SIZE / 2, CANVAS_SIZE / 2);

        ctx.font = "18px Arial";
        ctx.fillText(
          "Press P to resume",
          CANVAS_SIZE / 2,
          CANVAS_SIZE / 2 + 40,
        );
      }
    };

    // Game loop
    const gameLoop = () => {
      render();
      rafRef.current = requestAnimationFrame(gameLoop);
    };

    // Keyboard controls
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();

      // Start game on arrow key
      if (
        !game.started &&
        ["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)
      ) {
        e.preventDefault();
        game.started = true;
        game.paused = false;
        setStarted(true);
        setPaused(false);
        return;
      }

      if (key === "p" && game.started && !game.over) {
        e.preventDefault();
        game.paused = !game.paused;
        setPaused(game.paused);
        return;
      }

      if (key === "r" && (game.over || game.won)) {
        e.preventDefault();
        initGame();
        game.score = 0;
        game.over = false;
        game.won = false;
        game.paused = false;
        game.started = true;
        setGameOver(false);
        setWon(false);
        setScore(0);
        setStarted(true);
        setPaused(false);
        return;
      }

      if (game.paused || game.over || !game.started) return;

      let direction = null;
      if (key === "arrowup" || key === "w") {
        e.preventDefault();
        direction = "up";
      } else if (key === "arrowdown" || key === "s") {
        e.preventDefault();
        direction = "down";
      } else if (key === "arrowleft" || key === "a") {
        e.preventDefault();
        direction = "left";
      } else if (key === "arrowright" || key === "d") {
        e.preventDefault();
        direction = "right";
      }

      if (direction) {
        move(direction);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    rafRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.gameWrapper}>
        <div className={styles.header}>
          <div className={styles.stat}>
            <span className={styles.label}>SCORE</span>
            <span className={styles.value}>{score}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.label}>BEST</span>
            <span className={styles.value}>{bestScore}</span>
          </div>
        </div>
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className={styles.canvas}
        />
        <div className={styles.controls}>
          <div className={styles.controlText}>
            Arrow Keys / WASD: Move • P: Pause • R: Restart
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game2048;
