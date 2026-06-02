import React, { useEffect, useRef, useState } from "react";
import styles from "../styles/spaceinvaders.module.css";
import {
  drawRect,
  drawCircle,
  randomInt,
  createParticle,
  updateParticles,
  drawParticles,
  drawGlowText,
  collision,
} from "./gameUtils";

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 600;

const COLORS = {
  bg: "#000008",
  player: "#00d4ff",
  playerGlow: "rgba(0,212,255,0.8)",
  enemy1: "#ff1744",
  enemy2: "#e040fb",
  enemy3: "#ffc400",
  enemyGlow: "rgba(255,23,68,0.6)",
  bullet: "#00ff88",
  enemyBullet: "#ff4444",
  shield: "#00ffff",
  text: "#e2e8f0",
  textGlow: "rgba(0,212,255,0.8)",
};

const SpaceInvaders = () => {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [lives, setLives] = useState(3);
  const [paused, setPaused] = useState(true);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    // Game state
    const game = {
      player: {
        x: CANVAS_WIDTH / 2 - 25,
        y: CANVAS_HEIGHT - 60,
        width: 50,
        height: 30,
        speed: 5,
        moveLeft: false,
        moveRight: false,
      },
      bullets: [],
      enemyBullets: [],
      enemies: [],
      shields: [],
      particles: [],
      score: 0,
      wave: 1,
      lives: 3,
      enemyDirection: 1,
      enemySpeed: 1,
      enemyDropAmount: 20,
      lastEnemyShot: 0,
      enemyShootDelay: 1000,
      over: false,
      paused: true,
      started: false,
      lastTime: 0,
    };

    // Initialize enemies
    const createEnemies = () => {
      const enemies = [];
      const rows = 5;
      const cols = 11;
      const enemyWidth = 35;
      const enemyHeight = 25;
      const padding = 10;
      const offsetX = 50;
      const offsetY = 60;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          let color;
          if (row === 0) color = COLORS.enemy3;
          else if (row < 3) color = COLORS.enemy2;
          else color = COLORS.enemy1;

          enemies.push({
            x: offsetX + col * (enemyWidth + padding),
            y: offsetY + row * (enemyHeight + padding),
            width: enemyWidth,
            height: enemyHeight,
            color,
            alive: true,
            points: row === 0 ? 30 : row < 3 ? 20 : 10,
          });
        }
      }
      return enemies;
    };

    // Initialize shields
    const createShields = () => {
      const shields = [];
      const shieldCount = 4;
      const shieldWidth = 60;
      const shieldHeight = 40;
      const spacing =
        (CANVAS_WIDTH - shieldCount * shieldWidth) / (shieldCount + 1);

      for (let i = 0; i < shieldCount; i++) {
        shields.push({
          x: spacing + i * (shieldWidth + spacing),
          y: CANVAS_HEIGHT - 140,
          width: shieldWidth,
          height: shieldHeight,
          health: 5,
        });
      }
      return shields;
    };

    game.enemies = createEnemies();
    game.shields = createShields();

    // Update game
    const update = (timestamp) => {
      if (game.over || game.paused) return;

      const deltaTime = Math.min((timestamp - game.lastTime) / 16, 2);
      game.lastTime = timestamp;

      // Move player
      if (game.player.moveLeft) {
        game.player.x = Math.max(0, game.player.x - game.player.speed);
      }
      if (game.player.moveRight) {
        game.player.x = Math.min(
          CANVAS_WIDTH - game.player.width,
          game.player.x + game.player.speed,
        );
      }

      // Move player bullets
      game.bullets = game.bullets.filter((bullet) => {
        bullet.y -= 8;
        return bullet.y > 0;
      });

      // Move enemy bullets
      game.enemyBullets = game.enemyBullets.filter((bullet) => {
        bullet.y += 4;
        return bullet.y < CANVAS_HEIGHT;
      });

      // Check bullet collisions with enemies
      game.bullets.forEach((bullet, bIndex) => {
        game.enemies.forEach((enemy) => {
          if (
            enemy.alive &&
            collision(
              bullet.x,
              bullet.y,
              bullet.width,
              bullet.height,
              enemy.x,
              enemy.y,
              enemy.width,
              enemy.height,
            )
          ) {
            enemy.alive = false;
            bullet.y = -100; // Mark for removal
            game.score += enemy.points;
            setScore(game.score);

            // Create particles
            for (let i = 0; i < 8; i++) {
              game.particles.push(
                createParticle(
                  enemy.x + enemy.width / 2,
                  enemy.y + enemy.height / 2,
                  enemy.color,
                ),
              );
            }
          }
        });

        // Check bullet collisions with shields
        game.shields.forEach((shield) => {
          if (
            shield.health > 0 &&
            collision(
              bullet.x,
              bullet.y,
              bullet.width,
              bullet.height,
              shield.x,
              shield.y,
              shield.width,
              shield.height,
            )
          ) {
            shield.health--;
            bullet.y = -100;
          }
        });
      });

      // Check enemy bullet collisions with player
      game.enemyBullets.forEach((bullet) => {
        if (
          collision(
            bullet.x,
            bullet.y,
            bullet.width,
            bullet.height,
            game.player.x,
            game.player.y,
            game.player.width,
            game.player.height,
          )
        ) {
          game.lives--;
          setLives(game.lives);
          bullet.y = CANVAS_HEIGHT + 100;

          // Create particles
          for (let i = 0; i < 15; i++) {
            game.particles.push(
              createParticle(
                game.player.x + game.player.width / 2,
                game.player.y + game.player.height / 2,
                COLORS.player,
              ),
            );
          }

          if (game.lives <= 0) {
            game.over = true;
            setGameOver(true);
          }
        }

        // Check enemy bullet collisions with shields
        game.shields.forEach((shield) => {
          if (
            shield.health > 0 &&
            collision(
              bullet.x,
              bullet.y,
              bullet.width,
              bullet.height,
              shield.x,
              shield.y,
              shield.width,
              shield.height,
            )
          ) {
            shield.health--;
            bullet.y = CANVAS_HEIGHT + 100;
          }
        });
      });

      // Move enemies
      const aliveEnemies = game.enemies.filter((e) => e.alive);
      if (aliveEnemies.length === 0) {
        // Wave complete
        game.wave++;
        setWave(game.wave);
        game.enemySpeed += 0.3;
        game.enemyShootDelay = Math.max(500, game.enemyShootDelay - 100);
        game.enemies = createEnemies();
        game.shields = createShields();
      }

      // Check if enemies need to change direction
      let shouldDrop = false;
      aliveEnemies.forEach((enemy) => {
        const nextX = enemy.x + game.enemyDirection * game.enemySpeed;
        if (nextX < 0 || nextX + enemy.width > CANVAS_WIDTH) {
          shouldDrop = true;
        }
      });

      if (shouldDrop) {
        game.enemyDirection *= -1;
        game.enemies.forEach((enemy) => {
          if (enemy.alive) {
            enemy.y += game.enemyDropAmount;
            // Check if enemies reached player
            if (enemy.y + enemy.height >= game.player.y) {
              game.over = true;
              setGameOver(true);
            }
          }
        });
      }

      game.enemies.forEach((enemy) => {
        if (enemy.alive) {
          enemy.x += game.enemyDirection * game.enemySpeed;
        }
      });

      // Enemy shooting
      if (timestamp - game.lastEnemyShot > game.enemyShootDelay) {
        if (aliveEnemies.length > 0) {
          const shooter = aliveEnemies[randomInt(0, aliveEnemies.length - 1)];
          game.enemyBullets.push({
            x: shooter.x + shooter.width / 2 - 2,
            y: shooter.y + shooter.height,
            width: 4,
            height: 12,
          });
        }
        game.lastEnemyShot = timestamp;
      }

      // Update particles
      game.particles = updateParticles(game.particles);
    };

    // Render game
    const render = () => {
      // Clear canvas
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw stars background
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      for (let i = 0; i < 50; i++) {
        const x = (i * 47) % CANVAS_WIDTH;
        const y = (i * 73) % CANVAS_HEIGHT;
        ctx.fillRect(x, y, 1, 1);
      }

      // Draw shields
      game.shields.forEach((shield) => {
        if (shield.health > 0) {
          ctx.globalAlpha = shield.health / 5;
          drawRect(
            ctx,
            shield.x,
            shield.y,
            shield.width,
            shield.height,
            COLORS.shield,
          );
          ctx.globalAlpha = 1;
        }
      });

      // Draw player
      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = COLORS.playerGlow;
      drawRect(
        ctx,
        game.player.x,
        game.player.y,
        game.player.width,
        game.player.height,
        COLORS.player,
      );
      // Draw player cannon
      drawRect(
        ctx,
        game.player.x + game.player.width / 2 - 3,
        game.player.y - 10,
        6,
        10,
        COLORS.player,
      );
      ctx.restore();

      // Draw enemies
      game.enemies.forEach((enemy) => {
        if (enemy.alive) {
          ctx.save();
          ctx.shadowBlur = 10;
          ctx.shadowColor = COLORS.enemyGlow;
          drawRect(
            ctx,
            enemy.x,
            enemy.y,
            enemy.width,
            enemy.height,
            enemy.color,
          );
          ctx.restore();
        }
      });

      // Draw bullets
      game.bullets.forEach((bullet) => {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = COLORS.bullet;
        drawRect(
          ctx,
          bullet.x,
          bullet.y,
          bullet.width,
          bullet.height,
          COLORS.bullet,
        );
        ctx.restore();
      });

      // Draw enemy bullets
      game.enemyBullets.forEach((bullet) => {
        drawRect(
          ctx,
          bullet.x,
          bullet.y,
          bullet.width,
          bullet.height,
          COLORS.enemyBullet,
        );
      });

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
          `Wave: ${game.wave}`,
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
          "SPACE INVADERS",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 - 60,
          36,
          COLORS.text,
          COLORS.textGlow,
        );
        drawGlowText(
          ctx,
          "← → : Move  |  SPACE: Shoot",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 - 10,
          14,
          COLORS.text,
          COLORS.textGlow,
        );
        drawGlowText(
          ctx,
          "Press SPACE to Start",
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
    const gameLoop = (timestamp) => {
      update(timestamp);
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
          game.lastTime = performance.now();
          setStarted(true);
          setPaused(false);
        } else if (!game.over && !game.paused) {
          // Shoot
          if (game.bullets.length < 3) {
            game.bullets.push({
              x: game.player.x + game.player.width / 2 - 2,
              y: game.player.y - 10,
              width: 4,
              height: 15,
            });
          }
        }
        return;
      }

      if (key === "p") {
        e.preventDefault();
        if (game.started && !game.over) {
          game.paused = !game.paused;
          setPaused(game.paused);
          if (!game.paused) {
            game.lastTime = performance.now();
          }
        }
        return;
      }

      if (key === "r" && game.over) {
        e.preventDefault();
        game.player.x = CANVAS_WIDTH / 2 - 25;
        game.bullets = [];
        game.enemyBullets = [];
        game.enemies = createEnemies();
        game.shields = createShields();
        game.particles = [];
        game.score = 0;
        game.wave = 1;
        game.lives = 3;
        game.enemyDirection = 1;
        game.enemySpeed = 1;
        game.enemyShootDelay = 1000;
        game.over = false;
        game.paused = false;
        game.started = true;
        game.lastTime = performance.now();
        setGameOver(false);
        setScore(0);
        setWave(1);
        setLives(3);
        setStarted(true);
        setPaused(false);
        return;
      }

      if (key === "arrowleft" || key === "a") {
        game.player.moveLeft = true;
      }
      if (key === "arrowright" || key === "d") {
        game.player.moveRight = true;
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (key === "arrowleft" || key === "a") {
        game.player.moveLeft = false;
      }
      if (key === "arrowright" || key === "d") {
        game.player.moveRight = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    rafRef.current = requestAnimationFrame(gameLoop);

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
            <span className={styles.label}>SCORE</span>
            <span className={styles.value}>{score}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.label}>WAVE</span>
            <span className={styles.value}>{wave}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.label}>LIVES</span>
            <span className={styles.value}>{"❤".repeat(lives)}</span>
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
            SPACE: Start/Shoot • P: Pause • R: Restart • ←→ / AD: Move
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpaceInvaders;
