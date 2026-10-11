// ============================================================ present: pixel layer + crisp text
// layerBreak() (WORKFLOW 3): what is drawn so far (pixels + queued text) goes to the screen, the pixel layer is cleared
// and the next layer is drawn over it - so text of a lower layer never shows through a panel above it
// TQ keeps the whole frame's text (tests read it after render()); TQ0 = how much of it is already on the screen
let LAYERED = false, TQ0 = 0;
function screenBase() { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = 1; ctx.fillStyle = '#0b1020'; ctx.fillRect(0, 0, cv.width, cv.height); }
function flushLayer() {
  ctx.drawImage(low, 0, 0, W, H, 0, 0, W * K, H * K);
  for (let i = TQ0; i < TQ.length; i++) {
    const t = TQ[i], c = textSprite(t), tw = c.w - 2 * c.pad;
    ctx.globalAlpha = t.alpha; ctx.drawImage(c.cv, R(t.x * K - c.pad - (t.align === 'center' ? tw / 2 : t.align === 'right' ? tw : 0)), R(t.y * K - c.h / 2));
  }
  ctx.globalAlpha = 1; TQ0 = TQ.length;
}
function layerBreak() { if (!LAYERED) { screenBase(); LAYERED = true; } flushLayer(); g.clearRect(0, 0, W, H); }
function present() { if (!LAYERED) screenBase(); LAYERED = false; flushLayer(); }
// Outlined text rendered once per (text, size, colours, scale). The outline is the glyphs stamped around
// a circle rather than strokeText, so it hugs the fill with no hairline gap. Small text uses the pixel font.
const TXC = new Map();
function textSprite(t) {
  const key = t.s + '|' + t.size + '|' + t.col + '|' + t.stroke + '|' + K;
  let c = TXC.get(key); if (c) return c;
  if (TXC.size > 400) TXC.clear();
  const m = document.createElement('canvas'), x = m.getContext('2d'), font = t.size * K + 'px ' + fontFor(t.s, t.size);
  const r = t.stroke ? Math.max(.75, t.size * .14) * K : 0, pad = Math.ceil(r) + 2;
  x.font = font; m.width = Math.max(1, Math.ceil(x.measureText(t.s).width) + pad * 2); m.height = Math.ceil(t.size * K * 1.5) + pad * 2;
  x.font = font; x.textBaseline = 'middle'; x.textAlign = 'left';
  const oy = m.height / 2;
  if (t.stroke) { x.fillStyle = t.stroke; for (const f of [1, .55]) for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; x.fillText(t.s, pad + Math.cos(a) * r * f, oy + Math.sin(a) * r * f); } }
  x.fillStyle = t.col; x.fillText(t.s, pad, oy);
  c = { cv: m, w: m.width, h: m.height, pad }; TXC.set(key, c); return c;
}
try { if (document.fonts) { document.fonts.addEventListener('loadingdone', () => { TXC.clear(); TW.clear(); }); document.fonts.ready.then(() => { TXC.clear(); TW.clear(); }); } } catch (e) {}
const ALLTEXT = [...new Set((SCRIPT_TEXT.match(/[^\x00-\x7f]/g) || []))].join('') + '0123456789+-/!?';
try { if (document.fonts && document.fonts.load) { document.fonts.load('12px "ZCOOL QingKe HuangYou"', ALLTEXT).catch(() => {}); document.fonts.load('12px "Fusion Pixel"', ALLTEXT).catch(() => {}); } } catch (e) {}
