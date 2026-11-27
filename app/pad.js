'use strict';

// Keep the same texture between frames. A sensor needs features that travel
// together across its tiny field of view to estimate displacement.
const pad = (() => {
  const surface = document.querySelector('#surface');
  const preview = document.querySelector('#previewCanvas');
  const patterns = new Map();

  function fit(canvas) {
    const bounds = canvas.getBoundingClientRect();
    const scale = Math.min(window.devicePixelRatio || 1, 4);
    const width = Math.round(bounds.width * scale);
    const height = Math.round(bounds.height * scale);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    return { ctx, width: bounds.width, height: bounds.height, scale };
  }

  function makePattern(ctx, method) {
    const tile = document.createElement('canvas');
    tile.width = tile.height = 192;
    const ink = tile.getContext('2d');
    let seed = 107;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    ink.fillStyle = '#fff';
    ink.fillRect(0, 0, tile.width, tile.height);
    ink.fillStyle = '#000';
    // Irregular edges in both directions give the sensor landmarks. Sizes
    // are backing pixels so small features stay sharp on dense phone screens.
    const rowHeight = method === 'bars' ? 8 : 2;
    for (let y = 0; y < tile.height; y += rowHeight) {
      let x = -Math.floor(random() * rowHeight);
      while (x < tile.width) {
        const length = rowHeight * (1 + Math.floor(random() * 3));
        ink.fillRect(x, y, length, rowHeight);
        x += length + rowHeight * (1 + Math.floor(random() * 3));
      }
    }
    return ctx.createPattern(tile, 'repeat');
  }

  function drawSurface(method, position) {
    const { ctx, width, height, scale } = fit(surface);
    if (!width || !height) return;
    if (!patterns.has(method)) patterns.set(method, makePattern(ctx, method));
    const x = Math.round(position * 40 * scale);
    const y = Math.round(position * 14 * scale);
    ctx.setTransform(1, 0, 0, 1, x, y);
    ctx.fillStyle = patterns.get(method);
    ctx.fillRect(-x, -y, surface.width, surface.height);
  }

  function drawPreview() {
    const { ctx, width: w, height: h } = fit(preview);
    if (!w || !h) return;
    ctx.fillStyle = '#19251e';
    ctx.fillRect(0, 0, w, h);
    // A contour plot and mouse outline illustrate placement on the pad.
    ctx.strokeStyle = '#3c5140';
    ctx.lineWidth = 1;
    for (let line = -7; line < 24; line++) {
      ctx.beginPath();
      for (let x = -2; x < w + 3; x += 3) {
        const base = line * 11;
        const crest = Math.exp(-Math.pow((x - w * 0.48) / (w * 0.31), 2));
        const y = base - crest * (16 + 13 * Math.cos(base / 29 + x / 75)) + 9 * Math.sin(x / 74 + base / 51);
        if (x === -2) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    const s = Math.min(h / 127, 1.18);
    ctx.save();
    ctx.translate(w / 2, h * 0.50);
    ctx.scale(s, s);
    ctx.rotate(0.28);
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = '#d4fa75';
    ctx.fillStyle = '#223327';
    ctx.beginPath();
    ctx.moveTo(0, -45);
    ctx.bezierCurveTo(21, -45, 26, -28, 26, -9);
    ctx.bezierCurveTo(26, 17, 27, 43, 0, 43);
    ctx.bezierCurveTo(-27, 43, -26, 17, -26, -9);
    ctx.bezierCurveTo(-26, -28, -21, -45, 0, -45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-25, -9);
    ctx.quadraticCurveTo(0, 0, 25, -9);
    ctx.moveTo(0, -45);
    ctx.lineTo(0, -5);
    ctx.stroke();
    ctx.fillStyle = '#d4fa75';
    ctx.fillRect(-2.3, -30, 4.6, 12);
    ctx.restore();
    ctx.strokeStyle = '#9dbb79';
    ctx.lineWidth = 1.5;
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        const x = w / 2 + sx * 65 * s;
        const y = h * .50 + sy * 45 * s;
        ctx.beginPath();
        ctx.moveTo(x - sx * 9, y);
        ctx.lineTo(x, y);
        ctx.lineTo(x, y - sy * 9);
        ctx.stroke();
      }
    }
  }
  return { drawPreview, drawSurface };
})();
