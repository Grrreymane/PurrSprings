// ============================================================ present: pixel layer + crisp text
// layerBreak() (WORKFLOW 3): what is drawn so far (pixels + queued text) goes to the screen, the pixel layer is cleared
// and the next layer is drawn over it - so text of a lower layer never shows through a panel above it
// TQ keeps the whole frame's text (tests read it after render()); TQ0 = how much of it is already on the screen
let LAYERED = false, TQ0 = 0;
function screenBase(covered) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = 1; if (!covered) { ctx.fillStyle = '#0b1020'; ctx.fillRect(0, 0, cv.width, cv.height); } }   // covered: the first layer is opaque over the whole screen (the world: no fill under it)
// src: the canvas holding the layer (default the UI canvas `low`), its pixel (0,0) put at device (ox, oy); the layer's
// queued text moves (tx, ty) device px with it. World layers come with the camera's sub-pixel remainder (render.js
// worldFlush): pixel art stays nearest-neighbour, text stays on whole device px.
function flushLayer(src, ox, oy, tx, ty) {
  const c = src || low;
  if (c === low) ctx.drawImage(low, 0, 0, W, H, 0, 0, W * K, H * K);
  else ctx.drawImage(c, 0, 0, c.width, c.height, ox, oy, c.width * K, c.height * K);
  tx = tx || 0; ty = ty || 0;
  for (let i = TQ0; i < TQ.length; i++) {
    const t = TQ[i], c = textSprite(t), tw = c.w - 2 * c.pad;
    ctx.globalAlpha = t.alpha; ctx.drawImage(c.cv, R(t.x * K + tx - c.pad - (t.align === 'center' ? tw / 2 : t.align === 'right' ? tw : 0)), R(t.y * K + ty - c.h / 2));
  }
  ctx.globalAlpha = 1; TQ0 = TQ.length;
}
function layerBreak() { if (!LAYERED) { screenBase(); LAYERED = true; } flushLayer(); g.clearRect(0, 0, W, H); }
function layerOn(covered) { if (!LAYERED) { screenBase(covered); LAYERED = true; } }
function present() { if (!LAYERED) screenBase(); LAYERED = false; flushLayer(); }
// Outlined text rendered once per (text, size, colours, scale) in the pixel font at txtPx(size) = u device px per glyph
// pixel. Baseline and every glyph edge land on whole device px (crisp); the outline is the glyphs stamped one glyph
// pixel away in 8 directions (a pixel-art outline that hugs the fill: no strokeText hairline gap, WORKFLOW 3).
// The glyphs' middle sits half a glyph pixel above the sprite's middle (t.y), as with the old 'middle' baseline.
const TXC = new Map(), OUTL = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
function pixText(s, px, col, stroke) {   // -> { cv, w, h, pad }; also used by the cover
  const u = px / 12, m = document.createElement('canvas'), x = m.getContext('2d'), font = px + 'px ' + PFONT;
  const r = stroke ? Math.max(1, R(u)) : 0, pad = r + 2;
  x.font = font; m.width = Math.max(1, Math.ceil(x.measureText(s).width) + pad * 2); m.height = Math.ceil(16 * u) + pad * 2;
  x.font = font; x.textBaseline = 'alphabetic'; x.textAlign = 'left';
  const by = R(m.height / 2 + 4 * u);
  if (stroke) { x.fillStyle = stroke; for (const [dx, dy] of OUTL) x.fillText(s, pad + dx * r, by + dy * r); }
  x.fillStyle = col; x.fillText(s, pad, by);
  return { cv: m, w: m.width, h: m.height, pad };
}
function textSprite(t) {
  const key = t.s + '|' + t.size + '|' + t.col + '|' + t.stroke + '|' + K;
  let c = TXC.get(key); if (c) return c;
  if (TXC.size > 400) TXC.clear();
  c = pixText(t.s, txtPx(t.size), t.col, t.stroke); TXC.set(key, c); return c;
}
try { if (document.fonts) { document.fonts.addEventListener('loadingdone', () => { TXC.clear(); TW.clear(); }); document.fonts.ready.then(() => { TXC.clear(); TW.clear(); }); } } catch (e) {}
const ALLTEXT = [...new Set((SCRIPT_TEXT.match(/[^\x00-\x7f]/g) || []))].join('') + '0123456789+-/!?';
try { if (document.fonts && document.fonts.load) document.fonts.load('12px "Fusion Pixel"', ALLTEXT).catch(() => {}); } catch (e) {}
