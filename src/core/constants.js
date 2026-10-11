// ============================================================ constants
const W = 180, H = 320, OUT = '#1b1b2f';           // logical pixels (portrait); everything is drawn at this size
const SAVE = 'purr-springs-';                       // localStorage key prefix — unique per game
const FONT = '"ZCOOL QingKe HuangYou","PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC",sans-serif';
// body text in a crisp pixel font; big headings keep the chunky display font
const PFONT = '"Fusion Pixel","PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC",sans-serif';   // fontFor(): >= 11 px the display font
const TILE = 16, MW = 40, MH = 36, MAPW = MW * TILE, MAPH = MH * TILE;   // world: 40 x 36 tiles = 640 x 576 px (SPEC_v2 2)
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const pick = a => a[Math.floor(Math.random() * a.length)];
const R = Math.round;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
// 8520 / 1.2万 / 25万 / 100万 (SPEC_v2 4.8)
const fmt = n => n >= 1e5 ? Math.floor(n / 1e4) + '万' : n >= 1e4 ? (Math.floor(n / 1e3) / 10).toFixed(1) + '万' : String(n);
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function load(k, d) { try { const v = localStorage.getItem(SAVE + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
function save(k, v) { try { localStorage.setItem(SAVE + k, JSON.stringify(v)); } catch (e) {} }
