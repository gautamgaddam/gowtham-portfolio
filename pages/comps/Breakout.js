import React, { useEffect, useRef, useState } from "react";
import styles from "../../styles/breakout.module.css";
import {
  drawRect,
  drawCircle,
  drawGlowCircle,
  createParticle,
  updateParticles,
  drawParticles,
  drawGlowText,
  collision,
} from "./gameUtils";

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 600;

const COLORS = {
  bg: "#0a0a1a",
  paddle: "#00d4ff",
  paddleGlow: "rgba(0,212,255,0.8)",
  ball: "#ffffff",
  ballGlow: "rgba(255,255,255,0.8)",
  bricks: [
    { main: "#ef5350", points: 50 }, // Red
    { main: "#ff9800", points: 40 }, // Orange
    { main: "#ffc107", points: 30 }, // Yellow
    { main: "#4caf50", points: 20 }, // Green
    { main: "#2196f3", points: 10 }, // Blue
  ],
  text: "#e2e8f0",
  textGlow: "rgba(0,212,255,0.8)",
};

const Breakout = () => {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [paused, setPaused] = useState(true);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    // Game state
    const game = {
      paddle: {
        x: CANVAS_WIDTH / 2 - 60,
        y: CANVAS_HEIGHT - 40,
        width: 120,
        height: 15,
        speed: 8,
        moveLeft: false,
        moveRight: false,
      },
      ball: {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
        radius: 8,
        vx: 4,
        vy: -4,
        speed: 4,
        attached: true,
      },
      bricks: [],
      particles: [],
      score: 0,
      level: 1,
      lives: 3,
      over: false,
      paused: true,
      started: false,
      mouseX: CANVAS_WIDTH / 2,
    };

    // Create bricks
    const createBricks = () => {
      const bricks = [];
      const rows = 5;
      const cols = 10;
      const brickWidth = 55;
      const brickHeight = 20;
      const padding = 5;
      const offsetX = 12.5;
      const offsetY = 60;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const colorData = COLORS.bricks[row];
          bricks.push({
            x: offsetX + col * (brickWidth + padding),
            y: offsetY + row * (brickHeight + padding),
            width: brickWidth,
            height: brickHeight,
            color: colorData.main,
            points: colorData.points,
            alive: true,
          });
        }
      }
      return bricks;
    };

    game.bricks = createBricks();

    // Update game
    const update = () => {
      if (game.over || game.paused) return;

      // Move paddle
      if (game.paddle.moveLeft) {
        game.paddle.x = Math.max(0, game.paddle.x - game.paddle.speed);
      }
      if (game.paddle.moveRight) {
        game.paddle.x = Math.min(
          CANVAS_WIDTH - game.paddle.width,
          game.paddle.x + game.paddle.speed,
        );
      }

      // Mouse control
      if (game.mouseX) {
        game.paddle.x = Math.max(
          0,
          Math.min(
            CANVAS_WIDTH - game.paddle.width,
            game.mouseX - game.paddle.width / 2,
          ),
        );
      }

      // Move ball
      if (game.ball.attached) {
        game.ball.x = game.paddle.x + game.paddle.width / 2;
        game.ball.y = game.paddle.y - game.ball.radius - 5;
      } else {
        game.ball.x += game.ball.vx;
        game.ball.y += game.ball.vy;

        // Ball collision with walls
        if (
          game.ball.x - game.ball.radius < 0 ||
          game.ball.x + game.ball.radius > CANVAS_WIDTH
        ) {
          game.ball.vx *= -1;
          game.ball.x = Math.max(
            game.ball.radius,
            Math.min(CANVAS_WIDTH - game.ball.radius, game.ball.x),
          );
        }
        if (game.ball.y - game.ball.radius < 0) {
          game.ball.vy *= -1;
          game.ball.y = game.ball.radius;
        }

        // Ball collision with paddle
        if (
          collision(
            game.ball.x - game.ball.radius,
            game.ball.y - game.ball.radius,
            game.ball.radius * 2,
            game.ball.radius * 2,
            game.paddle.x,
            game.paddle.y,
            game.paddle.width,
            game.paddle.height,
          )
        ) {
          if (game.ball.vy > 0) {
            // Only bounce if moving downward
            game.ball.vy *= -1;

            // Add spin based on where ball hits paddle
            const hitPos = (game.ball.x - game.paddle.x) / game.paddle.width; // 0 to 1
            const angle = (hitPos - 0.5) * 2; // -1 to 1
            game.ball.vx = angle * 6;

            // Ensure minimum vertical speed
            if (Math.abs(game.ball.vy) < 3) {
              game.ball.vy = game.ball.vy > 0 ? 3 : -3;
            }

            game.ball.y = game.paddle.y - game.ball.radius;
          }
        }

        // Ball falls below paddle
        if (game.ball.y - game.ball.radius > CANVAS_HEIGHT) {
          game.lives--;
          setLives(game.lives);

          if (game.lives <= 0) {
            game.over = true;
            setGameOver(true);
          } else {
            game.ball.attached = true;
            game.ball.vx = 4;
            game.ball.vy = -4;
          }
        }

        // Ball collision with bricks
        game.bricks.forEach((brick) => {
          if (
            brick.alive &&
            collision(
              game.ball.x - game.ball.radius,
              game.ball.y - game.ball.radius,
              game.ball.radius * 2,
              game.ball.radius * 2,
              brick.x,
              brick.y,
              brick.width,
              brick.height,
            )
          ) {
            brick.alive = false;
            game.score += brick.points;
            setScore(game.score);

            // Create particles
            for (let i = 0; i < 10; i++) {
              game.particles.push(
                createParticle(
                  brick.x + brick.width / 2,
                  brick.y + brick.height / 2,
                  brick.color,
                ),
              );
            }

            // Determine bounce direction
            const ballCenterX = game.ball.x;
            const ballCenterY = game.ball.y;
            const brickCenterX = brick.x + brick.width / 2;
            const brickCenterY = brick.y + brick.height / 2;

            const dx = Math.abs(ballCenterX - brickCenterX);
            const dy = Math.abs(ballCenterY - brickCenterY);

            if (dx > dy) {
              game.ball.vx *= -1;
            } else {
              game.ball.vy *= -1;
            }

            // Increase ball speed slightly
            const speedIncrease = 1.02;
            game.ball.vx *= speedIncrease;
            game.ball.vy *= speedIncrease;
          }
        });

        // Check if level complete
        const aliveBricks = game.bricks.filter((b) => b.alive);
        if (aliveBricks.length === 0) {
          game.level++;
          setLevel(game.level);
          game.bricks = createBricks();
          game.ball.attached = true;
          game.ball.speed += 0.5;
          game.ball.vx = game.ball.speed;
          game.ball.vy = -game.ball.speed;
        }
      }

      // Update particles
      game.particles = updateParticles(game.particles);
    };

    // Render game
    const render = () => {
      // Clear canvas
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw bricks
      game.bricks.forEach((brick) => {
        if (brick.alive) {
          ctx.save();
          ctx.shadowBlur = 8;
          ctx.shadowColor = brick.color;
          drawRect(
            ctx,
            brick.x,
            brick.y,
            brick.width,
            brick.height,
            brick.color,
          );
          ctx.restore();

          // Draw shine effect
          ctx.fillStyle = "rgba(255,255,255,0.2)";
          ctx.fillRect(brick.x, brick.y, brick.width, brick.height / 3);
        }
      });

      // Draw paddle
      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = COLORS.paddleGlow;
      drawRect(
        ctx,
        game.paddle.x,
        game.paddle.y,
        game.paddle.width,
        game.paddle.height,
        COLORS.paddle,
      );
      ctx.restore();

      // Draw ball
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

      // Draw game over overlay
      if (game.over) {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        drawGlowText(
          ctx,
          "GAME OVER",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 - 30,
          32,
          COLORS.text,
          COLORS.textGlow,
        );
        drawGlowText(
          ctx,
          `Score: ${game.score}`,
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 10,
          20,
          COLORS.text,
          COLORS.textGlow,
        );
        drawGlowText(
          ctx,
          `Level: ${game.level}`,
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 40,
          20,
          COLORS.text,
          COLORS.textGlow,
        );
        drawGlowText(
          ctx,
          "Press R to Restart",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 70,
          16,
          COLORS.text,
          COLORS.textGlow,
        );
      }

      // Draw start screen
      if (!game.started && !game.over) {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        drawGlowText(
          ctx,
          "BREAKOUT",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 - 60,
          40,
          COLORS.text,
          COLORS.textGlow,
        );
        drawGlowText(
          ctx,
          "Move Mouse or ← → Keys",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 - 10,
          14,
          COLORS.text,
          COLORS.textGlow,
        );
        drawGlowText(
          ctx,
          "Press SPACE to Launch Ball",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 20,
          16,
          COLORS.text,
          COLORS.textGlow,
        );
        drawGlowText(
          ctx,
          "Press P to Pause",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 50,
          14,
          COLORS.text,
          COLORS.textGlow,
        );
      }

      // Draw pause overlay
      if (game.paused && game.started && !game.over) {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        drawGlowText(
          ctx,
          "PAUSED",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2,
          32,
          COLORS.text,
          COLORS.textGlow,
        );
        drawGlowText(
          ctx,
          "Press P to Resume",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 40,
          16,
          COLORS.text,
          COLORS.textGlow,
        );
      }
    };

    // Game loop
    const gameLoop = () => {
      update();
      render();
      rafRef.current = requestAnimationFrame(gameLoop);
    };

    // Keyboard controls
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();

      if (key === " " || key === "spacebar") {
        e.preventDefault();
        if (!game.started) {
          game.started = true;
          game.paused = false;
          setStarted(true);
          setPaused(false);
        } else if (!game.over && !game.paused && game.ball.attached) {
          game.ball.attached = false;
        }
        return;
      }

      if (key === "p") {
        e.preventDefault();
        if (game.started && !game.over) {
          game.paused = !game.paused;
          setPaused(game.paused);
        }
        return;
      }

      if (key === "r" && game.over) {
        e.preventDefault();
        game.paddle.x = CANVAS_WIDTH / 2 - 60;
        game.ball = {
          x: CANVAS_WIDTH / 2,
          y: CANVAS_HEIGHT / 2,
          radius: 8,
          vx: 4,
          vy: -4,
          speed: 4,
          attached: true,
        };
        game.bricks = createBricks();
        game.particles = [];
        game.score = 0;
        game.level = 1;
        game.lives = 3;
        game.over = false;
        game.paused = false;
        game.started = true;
        setGameOver(false);
        setScore(0);
        setLevel(1);
        setLives(3);
        setStarted(true);
        setPaused(false);
        return;
      }

      if (key === "arrowleft" || key === "a") {
        game.paddle.moveLeft = true;
      }
      if (key === "arrowright" || key === "d") {
        game.paddle.moveRight = true;
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (key === "arrowleft" || key === "a") {
        game.paddle.moveLeft = false;
      }
      if (key === "arrowright" || key === "d") {
        game.paddle.moveRight = false;
      }
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      game.mouseX = e.clientX - rect.left;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("mousemove", handleMouseMove);
    rafRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("mousemove", handleMouseMove);
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
          <div className={styles.stat}>
            <span className={styles.label}>LIVES</span>
            <span className={styles.value}>{"●".repeat(lives)}</span>
          </div>
        </div>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className={styles.canvas}
        />
        <div className={styles.controls}>
          <div className={styles.controlText}>
            SPACE: Launch • P: Pause • R: Restart • Mouse/←→: Move Paddle
          </div>
        </div>
      </div>
    </div>
  );
};

export default Breakout;
