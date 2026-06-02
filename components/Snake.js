import React, { useEffect, useRef, useState } from "react";
import styles from "../styles/snake.module.css";
import {
  drawRect,
  drawCircle,
  drawGlowCircle,
  randomInt,
  createParticle,
  updateParticles,
  drawParticles,
  drawGlowText,
} from "./gameUtils";

const GRID_SIZE = 20; // 20x20 grid
const CELL_SIZE = 25; // 25px per cell
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE; // 500x500

const COLORS = {
  bg: "#0a0a1a",
  grid: "rgba(255,255,255,0.05)",
  snake: "#00e676",
  snakeGlow: "rgba(0,230,118,0.6)",
  food: "#ef5350",
  foodGlow: "rgba(239,83,80,0.8)",
  text: "#e2e8f0",
  textGlow: "rgba(0,212,255,0.8)",
};

const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

const Snake = () => {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [paused, setPaused] = useState(true);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    // Game state
    const game = {
      snake: [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 },
      ],
      direction: DIRECTIONS.RIGHT,
      nextDirection: DIRECTIONS.RIGHT,
      food: { x: 15, y: 15 },
      score: 0,
      level: 1,
      speed: 150,
      lastMove: 0,
      particles: [],
      over: false,
      paused: true,
      started: false,
    };

    // Initialize food position
    const spawnFood = () => {
      let newFood;
      let attempts = 0;
      do {
        newFood = {
          x: randomInt(0, GRID_SIZE - 1),
          y: randomInt(0, GRID_SIZE - 1),
        };
        attempts++;
      } while (
        game.snake.some((seg) => seg.x === newFood.x && seg.y === newFood.y) &&
        attempts < 100
      );
      game.food = newFood;
    };

    // Check collision with self
    const checkSelfCollision = () => {
      const head = game.snake[0];
      return game.snake
        .slice(1)
        .some((seg) => seg.x === head.x && seg.y === head.y);
    };

    // Update game state
    const update = (timestamp) => {
      if (game.over || game.paused) return;

      const elapsed = timestamp - game.lastMove;

      // Move snake
      if (elapsed > game.speed) {
        game.direction = game.nextDirection;
        const head = game.snake[0];
        const newHead = {
          x: head.x + game.direction.x,
          y: head.y + game.direction.y,
        };

        // Check wall collision
        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          game.over = true;
          setGameOver(true);
          return;
        }

        game.snake.unshift(newHead);

        // Check food collision
        if (newHead.x === game.food.x && newHead.y === game.food.y) {
          game.score += 10;
          setScore(game.score);

          // Create particles
          for (let i = 0; i < 10; i++) {
            game.particles.push(
              createParticle(
                game.food.x * CELL_SIZE + CELL_SIZE / 2,
                game.food.y * CELL_SIZE + CELL_SIZE / 2,
                COLORS.food,
              ),
            );
          }

          // Increase level and speed every 50 points
          if (game.score % 50 === 0) {
            game.level++;
            game.speed = Math.max(50, game.speed - 10);
            setLevel(game.level);
          }

          spawnFood();
        } else {
          game.snake.pop();
        }

        // Check self collision
        if (checkSelfCollision()) {
          game.over = true;
          setGameOver(true);
          return;
        }

        game.lastMove = timestamp;
      }

      // Update particles
      game.particles = updateParticles(game.particles);
    };

    // Render game
    const render = () => {
      // Clear canvas
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Draw grid
      ctx.strokeStyle = COLORS.grid;
      ctx.lineWidth = 1;
      for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
        ctx.stroke();
      }

      // Draw food with glow
      drawGlowCircle(
        ctx,
        game.food.x * CELL_SIZE + CELL_SIZE / 2,
        game.food.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 2 - 2,
        COLORS.food,
        COLORS.foodGlow,
      );

      // Draw snake
      game.snake.forEach((seg, i) => {
        const alpha = 1 - i * 0.015; // Fade tail slightly
        ctx.save();
        ctx.globalAlpha = alpha;

        if (i === 0) {
          // Head with glow
          ctx.shadowBlur = 15;
          ctx.shadowColor = COLORS.snakeGlow;
        }

        drawRect(
          ctx,
          seg.x * CELL_SIZE + 2,
          seg.y * CELL_SIZE + 2,
          CELL_SIZE - 4,
          CELL_SIZE - 4,
          COLORS.snake,
        );
        ctx.restore();
      });

      // Draw particles
      drawParticles(ctx, game.particles);

      // Draw game over overlay
      if (game.over) {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        drawGlowText(
          ctx,
          "GAME OVER",
          CANVAS_SIZE / 2,
          CANVAS_SIZE / 2 - 30,
          32,
          COLORS.text,
          COLORS.textGlow,
        );
        drawGlowText(
          ctx,
          `Score: ${game.score}`,
          CANVAS_SIZE / 2,
          CANVAS_SIZE / 2 + 10,
          20,
          COLORS.text,
          COLORS.textGlow,
        );
        drawGlowText(
          ctx,
          "Press R to Restart",
          CANVAS_SIZE / 2,
          CANVAS_SIZE / 2 + 40,
          16,
          COLORS.text,
          COLORS.textGlow,
        );
      }

      // Draw start screen
      if (!game.started && !game.over) {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        drawGlowText(
          ctx,
          "SNAKE",
          CANVAS_SIZE / 2,
          CANVAS_SIZE / 2 - 50,
          40,
          COLORS.text,
          COLORS.textGlow,
        );
        drawGlowText(
          ctx,
          "Use Arrow Keys or WASD",
          CANVAS_SIZE / 2,
          CANVAS_SIZE / 2,
          16,
          COLORS.text,
          COLORS.textGlow,
        );
        drawGlowText(
          ctx,
          "Press SPACE to Start",
          CANVAS_SIZE / 2,
          CANVAS_SIZE / 2 + 30,
          16,
          COLORS.text,
          COLORS.textGlow,
        );
        drawGlowText(
          ctx,
          "Press P to Pause",
          CANVAS_SIZE / 2,
          CANVAS_SIZE / 2 + 60,
          14,
          COLORS.text,
          COLORS.textGlow,
        );
      }

      // Draw pause overlay
      if (game.paused && game.started && !game.over) {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        drawGlowText(
          ctx,
          "PAUSED",
          CANVAS_SIZE / 2,
          CANVAS_SIZE / 2,
          32,
          COLORS.text,
          COLORS.textGlow,
        );
        drawGlowText(
          ctx,
          "Press P to Resume",
          CANVAS_SIZE / 2,
          CANVAS_SIZE / 2 + 40,
          16,
          COLORS.text,
          COLORS.textGlow,
        );
      }
    };

    // Game loop
    const gameLoop = (timestamp) => {
      update(timestamp);
      render();
      rafRef.current = requestAnimationFrame(gameLoop);
    };

    // Keyboard controls
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();

      // Start/pause
      if (key === " " || key === "spacebar") {
        e.preventDefault();
        if (!game.started) {
          game.started = true;
          game.paused = false;
          setStarted(true);
          setPaused(false);
        } else if (!game.over) {
          game.paused = !game.paused;
          setPaused(game.paused);
        }
        return;
      }

      // Pause
      if (key === "p") {
        e.preventDefault();
        if (game.started && !game.over) {
          game.paused = !game.paused;
          setPaused(game.paused);
        }
        return;
      }

      // Restart
      if (key === "r" && game.over) {
        e.preventDefault();
        game.snake = [
          { x: 10, y: 10 },
          { x: 9, y: 10 },
          { x: 8, y: 10 },
        ];
        game.direction = DIRECTIONS.RIGHT;
        game.nextDirection = DIRECTIONS.RIGHT;
        game.score = 0;
        game.level = 1;
        game.speed = 150;
        game.particles = [];
        game.over = false;
        game.paused = false;
        game.started = true;
        spawnFood();
        setGameOver(false);
        setScore(0);
        setLevel(1);
        setStarted(true);
        setPaused(false);
        return;
      }

      if (game.paused || game.over || !game.started) return;

      // Movement - prevent 180 degree turns
      if (
        (key === "arrowup" || key === "w") &&
        game.direction !== DIRECTIONS.DOWN
      ) {
        game.nextDirection = DIRECTIONS.UP;
      } else if (
        (key === "arrowdown" || key === "s") &&
        game.direction !== DIRECTIONS.UP
      ) {
        game.nextDirection = DIRECTIONS.DOWN;
      } else if (
        (key === "arrowleft" || key === "a") &&
        game.direction !== DIRECTIONS.RIGHT
      ) {
        game.nextDirection = DIRECTIONS.LEFT;
      } else if (
        (key === "arrowright" || key === "d") &&
        game.direction !== DIRECTIONS.LEFT
      ) {
        game.nextDirection = DIRECTIONS.RIGHT;
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
            <span className={styles.label}>LEVEL</span>
            <span className={styles.value}>{level}</span>
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
            SPACE: Start/Pause • P: Pause • R: Restart • ↑←↓→ / WASD: Move
          </div>
        </div>
      </div>
    </div>
  );
};

export default Snake;
