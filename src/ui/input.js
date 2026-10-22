// ============================================================ screen + input
const wrap = document.getElementById('wrap'), cv = document.getElementById('c'), ctx = cv.getContext('2d');
const low = mk(W, H);
let g = low.getContext('2d');   // current drawing target (swap it to paint into another canvas)
let K = 1;                      // device pixels per logical pixel
function fit() {
  const r = wrap.getBoundingClientRect(), cs = getComputedStyle(wrap);
  const aw = r.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), ah = r.height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  const sc = Math.max(.5, Math.min(aw / W, ah / H)), cw = Math.floor(W * sc), ch = Math.floor(H * sc);
  cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  cv.width = R(cw * dpr); cv.height = R(ch * dpr); K = cv.width / W;
}
window.addEventListener('resize', fit); fit();
function toLogical(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }
const inR = (p, r) => p.x >= r[0] && p.x <= r[0] + r[2] && p.y >= r[1] && p.y <= r[1] + r[3];
let hold = false;
// Floating joystick: press anywhere (except the menu button / the title's speaker) = base, drag = direction, 14px = full speed.
const JOY = { on: false, id: null, bx: 0, by: 0, dx: 0, dy: 0 };
const PTRS = new Map();   // pointerId -> { bx, by, x, y } for every finger held down (the newest one steers)
const KEYS = {};
let botMove = null;   // test hook: {x, y} (length <= 1) replaces joystick / keyboard input when not null
window.addEventListener('pointerdown', e => {
  if (shareEl) return;   // the share overlay handles its own taps
  // preventDefault also cancels the mousedown that would move focus into a frame: in the 1GP player (an iframe) the
  // keys then went to the outer page, so a press takes the keyboard back for WASD / arrows
  try { if (!document.hasFocus()) window.focus(); } catch (err) {}
  e.preventDefault(); initAudio();
  const p = toLogical(e);
  if (state === 'title' && p.x >= 162 && p.x <= W && p.y <= 18) { toggleSound(); return; }   // the title's speaker, top-right (not the side bars)
  if (state === 'play' && inR(p, MENU_HIT)) { openMenu(); return; }                         // the menu button: no joystick there (7.1)
  hold = true; JOY.id = e.pointerId; PTRS.set(e.pointerId, { bx: p.x, by: p.y, x: p.x, y: p.y }); onPress(p);
}, { passive: false });
window.addEventListener('pointermove', e => {
  const q = PTRS.get(e.pointerId); if (q) { const p = toLogical(e); q.x = p.x; q.y = p.y; }
  if (!JOY.on || e.pointerId !== JOY.id) return;
  const p = toLogical(e); JOY.dx = p.x - JOY.bx; JOY.dy = p.y - JOY.by;
});
// the steering finger lifts while another is still down: that finger takes over from its own base (no dead stop)
['pointerup', 'pointercancel'].forEach(ev => window.addEventListener(ev, e => {
  if (e.type === 'pointerup' && !shareEl) initAudio();   // touch: pointerdown is no user gesture, pointerup is (WORKFLOW 2)
  hold = false; PTRS.delete(e.pointerId); if (e.pointerId !== JOY.id) return;
  JOY.on = false;
  if (state === 'play' && PTRS.size) { const [id, q] = [...PTRS].pop(); Object.assign(JOY, { on: true, id, bx: q.bx, by: q.by, dx: q.x - q.bx, dy: q.y - q.by }); }
}));
window.addEventListener('blur', () => { hold = false; JOY.on = false; PTRS.clear(); for (const k in KEYS) KEYS[k] = false; });
window.addEventListener('contextmenu', e => { if (!shareEl) e.preventDefault(); });
// Cancelling raw touches stops phones from showing the long-press bubble / magnifier; pointer events still arrive.
// The crash panel (#game-err) keeps its taps: its onclick needs the click a touch makes (18.2).
['touchstart', 'touchmove', 'touchend'].forEach(ev => window.addEventListener(ev, e => {
  if (ev === 'touchend' && !shareEl) initAudio();
  if (!shareEl && e.cancelable && !(e.target && e.target.closest && e.target.closest('#game-err'))) e.preventDefault();
}, { passive: false }));
['selectstart', 'dragstart', 'gesturestart'].forEach(ev => window.addEventListener(ev, e => { if (!shareEl) e.preventDefault(); }));
window.addEventListener('keydown', e => {
  if (shareEl) return;
  initAudio(); KEYS[e.code] = true;
  if (e.code === 'KeyM' && !e.repeat) toggleSound();                                   // M: music + sound effects together (7.1)
  if (!e.repeat && (e.code === 'Escape' || e.code === 'KeyP')) {                         // Esc / P: the menu (Esc in a page = back)
    if (state === 'play') openMenu(); else if (state === 'menu') { if (e.code === 'KeyP') closeMenu(); else menuBack(); }
  }
  if ((e.code === 'Enter' || e.code === 'Space') && state === 'title') onPress({ x: BTN.start[0] + 1, y: BTN.start[1] + 1 });
  if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
});
window.addEventListener('keyup', e => { KEYS[e.code] = false; });
function inputVec() {
  if (botMove) { const l = Math.hypot(botMove.x, botMove.y); return l > 1 ? { x: botMove.x / l, y: botMove.y / l } : { x: botMove.x, y: botMove.y }; }
  const kx = (KEYS.ArrowRight || KEYS.KeyD ? 1 : 0) - (KEYS.ArrowLeft || KEYS.KeyA ? 1 : 0), ky = (KEYS.ArrowDown || KEYS.KeyS ? 1 : 0) - (KEYS.ArrowUp || KEYS.KeyW ? 1 : 0);
  if (kx || ky) { const l = Math.hypot(kx, ky); return { x: kx / l, y: ky / l }; }
  if (JOY.on) { const d = Math.hypot(JOY.dx, JOY.dy); if (d > 1.5) { const m = Math.min(1, d / 14); return { x: JOY.dx / d * m, y: JOY.dy / d * m }; } }
  return { x: 0, y: 0 };
}
