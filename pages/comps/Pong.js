import React, { useEffect, useRef, useState } from "react";
import styles from "../../styles/pong.module.css";
import {
  drawRect,
  drawCircle,
  drawGlowCircle,
  drawGlowText,
  createParticle,
  updateParticles,
  drawParticles,
} from "./gameUtils";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 100;
const BALL_RADIUS = 8;
const WINNING_SCORE = 5;

const COLORS = {
  bg: "#0a0a1a",
  paddle: "#00d4ff",
  paddleGlow: "rgba(0,212,255,0.8)",
  aiPaddle: "#ff006e",
  aiPaddleGlow: "rgba(255,0,110,0.8)",
  ball: "#ffffff",
  ballGlow: "rgba(255,255,255,0.8)",
  text: "#e2e8f0",
  textGlow: "rgba(0,212,255,0.8)",
  centerLine: "rgba(100,116,139,0.3)",
};

const Pong = () => {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState("");
  const [paused, setPaused] = useState(true);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    // Game state
    const game = {
      player: {
        x: 30,
        y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
        speed: 6,
        dy: 0,
      },
      ai: {
        x: CANVAS_WIDTH - 30 - PADDLE_WIDTH,
        y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
        speed: 4.5,
        dy: 0,
      },
      ball: {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
        radius: BALL_RADIUS,
        vx: 5,
        vy: 3,
        speed: 5,
      },
      particles: [],
      playerScore: 0,
      aiScore: 0,
      over: false,
      winner: "",
      paused: true,
      started: false,
      keys: {},
    };

    // Reset ball to center
    const resetBall = (directionToPlayer = true) => {
      game.ball.x = CANVAS_WIDTH / 2;
      game.ball.y = CANVAS_HEIGHT / 2;
      game.ball.speed = 5;

      // Random angle but not too steep
      const angle = (Math.random() * Math.PI) / 4 - Math.PI / 8;
      game.ball.vx =
        Math.cos(angle) * game.ball.speed * (directionToPlayer ? -1 : 1);
      game.ball.vy = Math.sin(angle) * game.ball.speed;
    };

    // Keyboard controls
    const handleKeyDown = (e) => {
      game.keys[e.key] = true;

      if (e.key === " " && !game.started) {
        game.started = true;
        game.paused = false;
        setStarted(true);
        setPaused(false);
      } else if (e.key === "p" && game.started) {
        game.paused = !game.paused;
        setPaused(!game.paused);
      } else if (e.key === "r" && game.over) {
        resetGame();
      }

      // Prevent default for arrow keys and spacebar
      if (["ArrowUp", "ArrowDown", " "].includes(e.key)) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e) => {
      game.keys[e.key] = false;
    };

    // AI movement (simple follow ball with some delay)
    const updateAI = () => {
      const aiCenter = game.ai.y + game.ai.height / 2;
      const ballCenter = game.ball.y;

      // AI only reacts when ball is moving towards it
      if (game.ball.vx > 0) {
        if (ballCenter < aiCenter - 10) {
          game.ai.dy = -game.ai.speed;
        } else if (ballCenter > aiCenter + 10) {
          game.ai.dy = game.ai.speed;
        } else {
          game.ai.dy = 0;
        }
      } else {
        // Return to center when ball is going away
        if (aiCenter < CANVAS_HEIGHT / 2 - 10) {
          game.ai.dy = game.ai.speed * 0.5;
        } else if (aiCenter > CANVAS_HEIGHT / 2 + 10) {
          game.ai.dy = -game.ai.speed * 0.5;
        } else {
          game.ai.dy = 0;
        }
      }

      game.ai.y += game.ai.dy;
    };

    // Update game state
    const update = () => {
      if (game.paused || game.over) return;

      // Player movement
      if (game.keys["ArrowUp"] || game.keys["w"] || game.keys["W"]) {
        game.player.y -= game.player.speed;
      }
      if (game.keys["ArrowDown"] || game.keys["s"] || game.keys["S"]) {
        game.player.y += game.player.speed;
      }

      // Keep player paddle in bounds
      game.player.y = Math.max(
        0,
        Math.min(CANVAS_HEIGHT - game.player.height, game.player.y),
      );

      // AI movement
      updateAI();

      // Keep AI paddle in bounds
      game.ai.y = Math.max(
        0,
        Math.min(CANVAS_HEIGHT - game.ai.height, game.ai.y),
      );

      // Ball movement
      game.ball.x += game.ball.vx;
      game.ball.y += game.ball.vy;

      // Ball collision with top/bottom walls
      if (
        game.ball.y - game.ball.radius <= 0 ||
        game.ball.y + game.ball.radius >= CANVAS_HEIGHT
      ) {
        game.ball.vy = -game.ball.vy;
        // Create particles on wall bounce
        for (let i = 0; i < 5; i++) {
          game.particles.push(
            createParticle(game.ball.x, game.ball.y, COLORS.ball),
          );
        }
      }

      // Ball collision with player paddle
      if (
        game.ball.x - game.ball.radius <= game.player.x + game.player.width &&
        game.ball.y >= game.player.y &&
        game.ball.y <= game.player.y + game.player.height &&
        game.ball.vx < 0
      ) {
        // Calculate hit position on paddle (-1 to 1)
        const hitPos =
          (game.ball.y - (game.player.y + game.player.height / 2)) /
          (game.player.height / 2);

        game.ball.vx = Math.abs(game.ball.vx) * 1.05; // Speed up slightly
        game.ball.vy = hitPos * game.ball.speed * 0.8;
        game.ball.x = game.player.x + game.player.width + game.ball.radius;

        // Create particles
        for (let i = 0; i < 8; i++) {
          game.particles.push(
            createParticle(game.ball.x, game.ball.y, COLORS.paddle),
          );
        }
      }

      // Ball collision with AI paddle
      if (
        game.ball.x + game.ball.radius >= game.ai.x &&
        game.ball.y >= game.ai.y &&
        game.ball.y <= game.ai.y + game.ai.height &&
        game.ball.vx > 0
      ) {
        const hitPos =
          (game.ball.y - (game.ai.y + game.ai.height / 2)) /
          (game.ai.height / 2);

        game.ball.vx = -Math.abs(game.ball.vx) * 1.05;
        game.ball.vy = hitPos * game.ball.speed * 0.8;
        game.ball.x = game.ai.x - game.ball.radius;

        // Create particles
        for (let i = 0; i < 8; i++) {
          game.particles.push(
            createParticle(game.ball.x, game.ball.y, COLORS.aiPaddle),
          );
        }
      }

      // Scoring - ball goes past left edge (AI scores)
      if (game.ball.x - game.ball.radius < 0) {
        game.aiScore++;
        setAiScore(game.aiScore);

        // Create explosion particles
        for (let i = 0; i < 20; i++) {
          game.particles.push(
            createParticle(game.ball.x, game.ball.y, COLORS.aiPaddle),
          );
        }

        if (game.aiScore >= WINNING_SCORE) {
          game.over = true;
          game.winner = "AI Wins!";
          setGameOver(true);
          setWinner("AI Wins!");
        } else {
          resetBall(true);
        }
      }

      // Scoring - ball goes past right edge (Player scores)
      if (game.ball.x + game.ball.radius > CANVAS_WIDTH) {
        game.playerScore++;
        setPlayerScore(game.playerScore);

        // Create explosion particles
        for (let i = 0; i < 20; i++) {
          game.particles.push(
            createParticle(game.ball.x, game.ball.y, COLORS.paddle),
          );
        }

        if (game.playerScore >= WINNING_SCORE) {
          game.over = true;
          game.winner = "You Win!";
          setGameOver(true);
          setWinner("You Win!");
        } else {
          resetBall(false);
        }
      }

      // Update particles
      game.particles = updateParticles(game.particles);
    };

    // Draw everything
    const draw = () => {
      // Clear canvas
      drawRect(ctx, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS.bg);

      // Draw center line
      for (let i = 0; i < CANVAS_HEIGHT; i += 30) {
        drawRect(ctx, CANVAS_WIDTH / 2 - 2, i, 4, 15, COLORS.centerLine);
      }

      // Draw player paddle with glow
      ctx.save();
      ctx.shadowBlur = 20;
      ctx.shadowColor = COLORS.paddleGlow;
      drawRect(
        ctx,
        game.player.x,
        game.player.y,
        game.player.width,
        game.player.height,
        COLORS.paddle,
      );
      ctx.restore();

      // Draw AI paddle with glow
      ctx.save();
      ctx.shadowBlur = 20;
      ctx.shadowColor = COLORS.aiPaddleGlow;
      drawRect(
        ctx,
        game.ai.x,
        game.ai.y,
        game.ai.width,
        game.ai.height,
        COLORS.aiPaddle,
      );
      ctx.restore();

      // Draw ball with glow
      drawGlowCircle(
        ctx,
        game.ball.x,
        game.ball.y,
        game.ball.radius,
        COLORS.ball,
        COLORS.ballGlow,
      );

      // Draw particles
      drawParticles(ctx, game.particles);

      // Draw scores
      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = COLORS.paddleGlow;
      ctx.fillStyle = COLORS.paddle;
      ctx.font = "48px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.fillText(game.playerScore, CANVAS_WIDTH / 4, 60);
      ctx.restore();

      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = COLORS.aiPaddleGlow;
      ctx.fillStyle = COLORS.aiPaddle;
      ctx.font = "48px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.fillText(game.aiScore, (CANVAS_WIDTH * 3) / 4, 60);
      ctx.restore();

      // Draw instructions or game over
      if (!game.started) {
        drawGlowText(
          ctx,
          "Press SPACE to Start",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 80,
          20,
          COLORS.text,
          COLORS.textGlow,
        );
        drawGlowText(
          ctx,
          "Use ↑↓ or W/S to move",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 110,
          16,
          COLORS.text,
          COLORS.textGlow,
        );
      } else if (game.paused && !game.over) {
        drawGlowText(
          ctx,
          "PAUSED",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2,
          48,
          COLORS.text,
          COLORS.textGlow,
        );
      } else if (game.over) {
        const winColor = game.winner.includes("You")
          ? COLORS.paddle
          : COLORS.aiPaddle;
        const winGlow = game.winner.includes("You")
          ? COLORS.paddleGlow
          : COLORS.aiPaddleGlow;

        drawGlowText(
          ctx,
          game.winner,
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 - 40,
          56,
          winColor,
          winGlow,
        );
        drawGlowText(
          ctx,
          `Final Score: ${game.playerScore} - ${game.aiScore}`,
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 20,
          24,
          COLORS.text,
          COLORS.textGlow,
        );
        drawGlowText(
          ctx,
          "Press R to Restart",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 60,
          20,
          COLORS.text,
          COLORS.textGlow,
        );
      }
    };

    // Game loop
    const gameLoop = () => {
      update();
      draw();
      rafRef.current = requestAnimationFrame(gameLoop);
    };

    // Reset game
    const resetGame = () => {
      game.playerScore = 0;
      game.aiScore = 0;
      game.over = false;
      game.winner = "";
      game.started = false;
      game.paused = true;
      game.particles = [];

      setPlayerScore(0);
      setAiScore(0);
      setGameOver(false);
      setWinner("");
      setStarted(false);
      setPaused(true);

      resetBall(true);
    };

    // Event listeners
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Start game loop
    resetBall(true);
    gameLoop();

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
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
            <div className={styles.label}>PLAYER</div>
            <div className={styles.value} style={{ color: "#00d4ff" }}>
              {playerScore}
            </div>
          </div>
          <div className={styles.stat}>
            <div className={styles.label}>AI</div>
            <div className={styles.value} style={{ color: "#ff006e" }}>
              {aiScore}
            </div>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className={styles.canvas}
        />

        <div className={styles.controls}>
          {!started && <div className={styles.hint}>Press SPACE to start</div>}
          {started && !gameOver && (
            <button
              onClick={() => setPaused(!paused)}
              className={styles.button}
            >
              {paused ? "Resume (P)" : "Pause (P)"}
            </button>
          )}
          {gameOver && (
            <button
              onClick={() => {
                window.location.reload();
              }}
              className={styles.button}
            >
              Restart (R)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Pong;
