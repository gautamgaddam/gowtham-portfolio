import React, { useEffect, useRef, useState } from "react";
import styles from "../styles/tetris.module.css";

const GS = 40; // cell size in px
const GW = 10; // grid width
const GH = 20; // grid height

const COLORS = [
  null,
  { main: "#00d4ff", dark: "#0080aa", glow: "rgba(0,212,255,0.9)" }, // 1 I - cyan
  { main: "#4f7cf7", dark: "#2b4bcc", glow: "rgba(79,124,247,0.9)" }, // 2 J - blue
  { main: "#ff7043", dark: "#bf360c", glow: "rgba(255,112,67,0.9)" }, // 3 L - orange
  { main: "#ffd600", dark: "#b39100", glow: "rgba(255,214,0,0.9)" }, // 4 O - yellow
  { main: "#00e676", dark: "#00843d", glow: "rgba(0,230,118,0.9)" }, // 5 S - green
  { main: "#ce93d8", dark: "#7b1fa2", glow: "rgba(206,147,216,0.9)" }, // 6 T - purple
  { main: "#ef5350", dark: "#b71c1c", glow: "rgba(239,83,80,0.9)" }, // 7 Z - red
];

// Cells store piece type (1-7) so locked pieces retain their color
const PIECES = [
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ], // I (1)
  [
    [2, 0, 0],
    [2, 2, 2],
    [0, 0, 0],
  ], // J (2)
  [
    [0, 0, 3],
    [3, 3, 3],
    [0, 0, 0],
  ], // L (3)
  [
    [4, 4],
    [4, 4],
  ], // O (4)
  [
    [0, 5, 5],
    [5, 5, 0],
    [0, 0, 0],
  ], // S (5)
  [
    [0, 6, 0],
    [6, 6, 6],
    [0, 0, 0],
  ], // T (6)
  [
    [7, 7, 0],
    [0, 7, 7],
    [0, 0, 0],
  ], // Z (7)
];

const Tetris = () => {
  const canvasRef = useRef(null);
  const nextRef = useRef(null);
  const rafRef = useRef(null);
  const handlersRef = useRef({});

  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [paused, setPaused] = useState(true);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const nextCanvas = nextRef.current;
    if (!canvas || !nextCanvas) return;

    const ctx = canvas.getContext("2d");
    const nCtx = nextCanvas.getContext("2d");

    // All mutable game state — avoids stale closure issues
    const g = {
      grid: null,
      cur: null,
      nxt: null,
      score: 0,
      level: 1,
      lines: 0,
      over: false,
      paused: true,
      started: false,
      speed: 800,
      lastDrop: 0,
      particles: [],
    };

    // ── Helpers ──────────────────────────────────────────────────────────────

    const randIdx = () => Math.floor(Math.random() * PIECES.length);
    const emptyGrid = () => Array.from({ length: GH }, () => Array(GW).fill(0));

    function newPiece(idx = randIdx()) {
      const shape = PIECES[idx];
      return {
        shape,
        type: idx + 1,
        rotation: 0,
        x: Math.floor(GW / 2) - Math.floor(shape[0].length / 2),
        y: 0,
      };
    }

    function rotateMatrix(m) {
      const rows = m.length,
        cols = m[0].length;
      const out = [];
      for (let r = 0; r < cols; r++) {
        out[r] = [];
        for (let c = 0; c < rows; c++) out[r][c] = m[rows - 1 - c][r];
      }
      return out;
    }

    function getShape(piece) {
      let s = piece.shape;
      for (let i = 0; i < piece.rotation; i++) s = rotateMatrix(s);
      return s;
    }

    function valid(piece, x, y) {
      const s = getShape(piece);
      for (let r = 0; r < s.length; r++) {
        for (let c = 0; c < s[r].length; c++) {
          if (!s[r][c]) continue;
          const nx = x + c,
            ny = y + r;
          if (nx < 0 || nx >= GW || ny >= GH) return false;
          if (ny >= 0 && g.grid[ny][nx]) return false;
        }
      }
      return true;
    }

    function ghostY(piece) {
      let gy = piece.y;
      while (valid(piece, piece.x, gy + 1)) gy++;
      return gy;
    }

    // ── Drawing ───────────────────────────────────────────────────────────────

    function drawCell(context, x, y, type, alpha = 1) {
      const col = COLORS[type];
      const pad = 1.5,
        r = 3;
      const bx = x * GS + pad,
        by = y * GS + pad;
      const bw = GS - pad * 2,
        bh = GS - pad * 2;

      context.save();
      context.globalAlpha = alpha;
      context.shadowColor = col.glow;
      context.shadowBlur = 8;

      const grad = context.createLinearGradient(bx, by, bx + bw, by + bh);
      grad.addColorStop(0, col.main);
      grad.addColorStop(1, col.dark);

      context.beginPath();
      context.moveTo(bx + r, by);
      context.lineTo(bx + bw - r, by);
      context.arcTo(bx + bw, by, bx + bw, by + r, r);
      context.lineTo(bx + bw, by + bh - r);
      context.arcTo(bx + bw, by + bh, bx + bw - r, by + bh, r);
      context.lineTo(bx + r, by + bh);
      context.arcTo(bx, by + bh, bx, by + bh - r, r);
      context.lineTo(bx, by + r);
      context.arcTo(bx, by, bx + r, by, r);
      context.closePath();
      context.fillStyle = grad;
      context.fill();

      // Inner shine
      context.shadowBlur = 0;
      context.globalAlpha = alpha * 0.35;
      context.fillStyle = "rgba(255,255,255,0.7)";
      context.fillRect(bx + 2, by + 2, bw - 4, 3);
      context.restore();
    }

    function drawGrid() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bg.addColorStop(0, "#06060f");
      bg.addColorStop(1, "#0c0c22");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 0.5;
      for (let row = 0; row < GH; row++) {
        for (let col = 0; col < GW; col++) {
          ctx.strokeRect(col * GS, row * GS, GS, GS);
          if (g.grid?.[row][col]) drawCell(ctx, col, row, g.grid[row][col]);
        }
      }
    }

    function drawCurrent(piece) {
      if (!piece) return;
      const shape = getShape(piece);
      const gy = ghostY(piece);

      // Ghost outline
      if (gy !== piece.y) {
        shape.forEach((row, r) =>
          row.forEach((cell, c) => {
            if (!cell) return;
            ctx.save();
            ctx.globalAlpha = 0.18;
            ctx.strokeStyle = COLORS[piece.type].main;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(
              (piece.x + c) * GS + 2,
              (gy + r) * GS + 2,
              GS - 4,
              GS - 4,
            );
            ctx.restore();
          }),
        );
      }

      // Active piece
      shape.forEach((row, r) =>
        row.forEach((cell, c) => {
          if (cell) drawCell(ctx, piece.x + c, piece.y + r, piece.type);
        }),
      );
    }

    function drawNextPiece() {
      const nw = nextCanvas.width,
        nh = nextCanvas.height;
      nCtx.clearRect(0, 0, nw, nh);
      const bg = nCtx.createLinearGradient(0, 0, 0, nh);
      bg.addColorStop(0, "#06060f");
      bg.addColorStop(1, "#0c0c22");
      nCtx.fillStyle = bg;
      nCtx.fillRect(0, 0, nw, nh);
      if (!g.nxt) return;

      const shape = getShape(g.nxt);
      const cs = 23;
      const ox = Math.floor((nw - shape[0].length * cs) / 2);
      const oy = Math.floor((nh - shape.length * cs) / 2);
      const col = COLORS[g.nxt.type];

      shape.forEach((row, r) =>
        row.forEach((cell, c) => {
          if (!cell) return;
          const px = ox + c * cs,
            py = oy + r * cs;
          nCtx.save();
          nCtx.shadowColor = col.glow;
          nCtx.shadowBlur = 5;
          const grad = nCtx.createLinearGradient(px, py, px + cs, py + cs);
          grad.addColorStop(0, col.main);
          grad.addColorStop(1, col.dark);
          nCtx.fillStyle = grad;
          nCtx.fillRect(px + 1, py + 1, cs - 2, cs - 2);
          nCtx.globalAlpha = 0.3;
          nCtx.fillStyle = "rgba(255,255,255,0.8)";
          nCtx.fillRect(px + 2, py + 2, cs - 4, 2);
          nCtx.restore();
        }),
      );
    }

    // ── Particles ─────────────────────────────────────────────────────────────

    function spawnParticles(row, type) {
      const col = COLORS[type] || COLORS[1];
      const count = Math.min(22, 80 - g.particles.length);
      for (let i = 0; i < count; i++) {
        g.particles.push({
          x: Math.random() * canvas.width,
          y: (row + 0.5) * GS,
          vx: (Math.random() - 0.5) * 9,
          vy: -(Math.random() * 5 + 2),
          size: Math.random() * 3 + 1.5,
          life: 1,
          decay: 0.015 + Math.random() * 0.025,
          color: col.main,
        });
      }
    }

    function tickParticles() {
      g.particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.28;
        p.life -= p.decay;
      });
      g.particles = g.particles.filter((p) => p.life > 0);
    }

    function drawParticles() {
      g.particles.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 7;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    // ── Game logic ────────────────────────────────────────────────────────────

    function clearLines() {
      let cleared = 0;
      for (let y = GH - 1; y >= 0; y--) {
        if (g.grid[y].every((c) => c !== 0)) {
          spawnParticles(
            y,
            g.grid[y].find((c) => c > 0),
          );
          g.grid.splice(y, 1);
          g.grid.unshift(Array(GW).fill(0));
          cleared++;
          y++;
        }
      }
      if (!cleared) return;
      const mult = [0, 40, 100, 300, 1200];
      g.score += (mult[cleared] || 0) * g.level;
      g.lines += cleared;
      g.level = Math.floor(g.lines / 10) + 1;
      g.speed = Math.max(80, 800 - (g.level - 1) * 75);
      setScore(g.score);
      setLevel(g.level);
    }

    function lockPiece() {
      const shape = getShape(g.cur);
      shape.forEach((row, r) =>
        row.forEach((cell, c) => {
          if (cell && g.cur.y + r >= 0)
            g.grid[g.cur.y + r][g.cur.x + c] = g.cur.type;
        }),
      );
    }

    function move(dir) {
      if (!g.cur) return;
      let x = g.cur.x,
        y = g.cur.y;
      if (dir === "L") x--;
      if (dir === "R") x++;
      if (dir === "D") y++;
      if (valid(g.cur, x, y)) {
        g.cur.x = x;
        g.cur.y = y;
      }
    }

    function rotateCur() {
      if (!g.cur) return;
      const rot = (g.cur.rotation + 1) % 4;
      const p = { ...g.cur, rotation: rot };
      if (valid(p, g.cur.x, g.cur.y)) {
        g.cur.rotation = rot;
        return;
      }
      if (valid(p, g.cur.x + 1, g.cur.y)) {
        g.cur.rotation = rot;
        g.cur.x++;
        return;
      }
      if (valid(p, g.cur.x - 1, g.cur.y)) {
        g.cur.rotation = rot;
        g.cur.x--;
      }
    }

    function hardDrop() {
      if (!g.cur) return;
      while (valid(g.cur, g.cur.x, g.cur.y + 1)) g.cur.y++;
    }

    // ── Input ─────────────────────────────────────────────────────────────────

    function onKey(e) {
      if (g.paused || g.over || !g.started) return;
      if (e.code === "ArrowLeft") move("L");
      else if (e.code === "ArrowRight") move("R");
      else if (e.code === "ArrowDown") move("D");
      else if (e.code === "ArrowUp") rotateCur();
      else if (e.code === "Space") {
        e.preventDefault();
        hardDrop();
      } else return;
    }

    let tx = 0,
      ty = 0;
    function onTouchStart(e) {
      tx = e.touches[0].clientX;
      ty = e.touches[0].clientY;
    }
    function onTouchMove(e) {
      e.preventDefault();
      if (g.paused || g.over || !g.started) return;
      const dx = e.touches[0].clientX - tx;
      const dy = e.touches[0].clientY - ty;
      if (Math.abs(dx) < 15 && Math.abs(dy) < 15) return;
      if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? "R" : "L");
      else dy > 0 ? move("D") : rotateCur();
      tx = e.touches[0].clientX;
      ty = e.touches[0].clientY;
    }

    // ── Game loop ─────────────────────────────────────────────────────────────

    function startLoop() {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const loop = () => {
        if (g.over || g.paused) return;
        const now = Date.now();
        if (now - g.lastDrop > g.speed) {
          if (valid(g.cur, g.cur.x, g.cur.y + 1)) {
            g.cur.y++;
          } else {
            lockPiece();
            clearLines();
            g.cur = g.nxt;
            g.nxt = newPiece();
            drawNextPiece();
            if (!valid(g.cur, g.cur.x, g.cur.y)) {
              g.over = true;
              g.paused = true;
              setGameOver(true);
              setPaused(true);
              drawGrid();
              drawCurrent(g.cur);
              drawParticles();
              return;
            }
          }
          g.lastDrop = now;
        }
        tickParticles();
        drawGrid();
        drawCurrent(g.cur);
        drawParticles();
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    }

    // ── Exposed handlers ──────────────────────────────────────────────────────

    handlersRef.current.start = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      g.grid = emptyGrid();
      g.cur = newPiece();
      g.nxt = newPiece();
      g.score = 0;
      g.level = 1;
      g.lines = 0;
      g.speed = 800;
      g.over = false;
      g.paused = false;
      g.started = true;
      g.particles = [];
      g.lastDrop = Date.now();
      setScore(0);
      setLevel(1);
      setGameOver(false);
      setPaused(false);
      setStarted(true);
      drawNextPiece();
      startLoop();
    };

    handlersRef.current.togglePause = () => {
      if (g.over || !g.started) return;
      g.paused = !g.paused;
      setPaused(g.paused);
      if (!g.paused) {
        g.lastDrop = Date.now();
        startLoop();
      }
    };

    // Initial background render
    drawGrid();

    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("keydown", onKey);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className={styles.tetrisBody}>
      <div className={styles.gameWrap}>
        {/* Main canvas */}
        <div className={styles.canvasWrap}>
          <canvas
            ref={canvasRef}
            width={GW * GS}
            height={GH * GS}
            className={styles.gameCanvas}
          />
          {gameOver && (
            <div className={styles.overlay}>
              <div className={styles.overlayContent}>
                <p className={styles.gameOverTitle}>GAME OVER</p>
                <p className={styles.gameOverStat}>Score: {score}</p>
                <p className={styles.gameOverStat}>Level: {level}</p>
                <button
                  className={styles.restartBtn}
                  onClick={() => handlersRef.current.start?.()}
                >
                  PLAY AGAIN
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className={styles.panel}>
          <div className={styles.panelBox}>
            <span className={styles.panelLabel}>NEXT</span>
            <canvas
              ref={nextRef}
              width={108}
              height={108}
              className={styles.nextCanvas}
            />
          </div>
          <div className={styles.panelBox}>
            <span className={styles.panelLabel}>SCORE</span>
            <span className={styles.scoreValue}>{score}</span>
          </div>
          <div className={styles.panelBox}>
            <span className={styles.panelLabel}>LEVEL</span>
            <span className={styles.levelValue}>{level}</span>
          </div>
          <div className={styles.btnGroup}>
            {!started || gameOver ? (
              <button
                className={styles.btnStart}
                onClick={() => handlersRef.current.start?.()}
              >
                {gameOver ? "RESTART" : "START"}
              </button>
            ) : (
              <button
                className={styles.btnPause}
                onClick={() => handlersRef.current.togglePause?.()}
              >
                {paused ? "▶ PLAY" : "⏸ PAUSE"}
              </button>
            )}
          </div>
          <div className={styles.hints}>
            <div>← → Move</div>
            <div>↑ Rotate</div>
            <div>↓ Soft drop</div>
            <div>Space Hard drop</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tetris;
