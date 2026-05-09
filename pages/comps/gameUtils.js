// Shared game utilities for all 2D games

export const createCanvas = (width, height) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas.getContext("2d");
};

export const drawRect = (ctx, x, y, w, h, color) => {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
};

export const drawRoundedRect = (ctx, x, y, w, h, r, color) => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
};

export const drawCircle = (ctx, x, y, radius, color) => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
};

export const drawGlowCircle = (ctx, x, y, radius, color, glowColor) => {
  ctx.save();
  ctx.shadowBlur = 15;
  ctx.shadowColor = glowColor || color;
  drawCircle(ctx, x, y, radius, color);
  ctx.restore();
};

export const randomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const createParticle = (x, y, color, vx = 0, vy = 0) => {
  return {
    x,
    y,
    vx: vx || (Math.random() - 0.5) * 4,
    vy: vy || (Math.random() - 0.5) * 4,
    life: 1,
    color,
    size: Math.random() * 3 + 2,
  };
};

export const updateParticles = (particles, deltaTime = 1) => {
  return particles
    .map((p) => ({
      ...p,
      x: p.x + p.vx * deltaTime,
      y: p.y + p.vy * deltaTime,
      vy: p.vy + 0.2 * deltaTime, // gravity
      life: p.life - 0.02 * deltaTime,
    }))
    .filter((p) => p.life > 0);
};

export const drawParticles = (ctx, particles) => {
  particles.forEach((p) => {
    ctx.save();
    ctx.globalAlpha = p.life;
    drawCircle(ctx, p.x, p.y, p.size, p.color);
    ctx.restore();
  });
};

export const collision = (x1, y1, w1, h1, x2, y2, w2, h2) => {
  return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
};

export const drawText = (ctx, text, x, y, size, color, align = "center") => {
  ctx.fillStyle = color;
  ctx.font = `${size}px 'Courier New', monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
};

export const drawGlowText = (ctx, text, x, y, size, color, glowColor) => {
  ctx.save();
  ctx.shadowBlur = 10;
  ctx.shadowColor = glowColor || color;
  drawText(ctx, text, x, y, size, color);
  ctx.restore();
};
