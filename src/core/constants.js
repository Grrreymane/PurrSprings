// ============================================================ constants
const W = 180, H = 320, OUT = '#1b1b2f';           // logical pixels (portrait); everything is drawn at this size
const SAVE = 'purr-springs-';                       // localStorage key prefix — unique per game
// every piece of text (titles, cover, share card, buttons, banners) uses the crisp pixel font Fusion Pixel (v2.0.1 F1);
// FONT is the same font under its old name
const PFONT = '"Fusion Pixel","PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC",sans-serif';
const FONT = PFONT;
const TILE = 16, MW = 40, MH = 39, MAPW = MW * TILE, MAPH = MH * TILE;   // world: 40 x 39 tiles = 640 x 624 px (SPEC_v2 2; v2.4: 39 rows, was 36)
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const pick = a => a[Math.floor(Math.random() * a.length)];
const R = Math.round;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
// 8520 / 1.2万 / 25万 / 100万 (SPEC_v2 4.8)
// i18n.js: 万 in Chinese / Japanese, 만 in Korean, K / M elsewhere (the same few characters wide)
const fmt = n => { const w = LANG === 'ko' ? '만' : LANG === 'zh' || LANG === 'ja' ? '万' : null;
  if (!w) return n >= 1e6 ? (Math.floor(n / 1e5) / 10) + 'M' : n >= 1e4 ? Math.floor(n / 1e3) + 'K' : String(n);
  return n >= 1e5 ? Math.floor(n / 1e4) + w : n >= 1e4 ? (Math.floor(n / 1e3) / 10).toFixed(1) + w : String(n); };
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function load(k, d) { try { const v = localStorage.getItem(SAVE + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
function save(k, v) { try { localStorage.setItem(SAVE + k, JSON.stringify(v)); } catch (e) {} }
