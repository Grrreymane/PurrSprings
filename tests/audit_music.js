// Audit (BGM repetition as heard): a casual-ish arrow follower plays; every frame read the engine's MUSIC_DBG (headless:
// the engine runs dry on musicTick). Time share per song + section, how often a song (re)starts from its first section,
// how long a song plays before the area changes it, and how much of the time the v1 loop is playing (the lobby's A / A2 /
// A3 = the v1 melody; the title song is lobby A too).
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/audit_music.js --seed N -- [minutes] [react] [distract]
const DT = 1 / 30, MIN = +ARGS[0] || 30, REACT = +ARGS[1] || 1, DIS = ARGS[2] !== undefined ? +ARGS[2] : .3; newGame();
let aPath = [], aKey = '', aThink = 0, aMode = 'follow', aEp = 0;
const aRand = () => { for (let k = 0; k < 200; k++) { const tx = Math.floor(Math.random() * MW), ty = Math.floor(Math.random() * MH); if (walkable(tx, ty)) { const [sx, sy] = tileOf(P), p = findPath(sx, sy, tx, ty); if (p) return p; } } return []; };
function aDrive(dt) {
  aEp -= dt; if (aEp <= 0) { aEp = 3 + Math.random() * 5; const was = aMode; aMode = Math.random() < DIS ? (Math.random() < .5 ? 'wander' : 'idle') : 'follow'; if (aMode !== was) { aPath = []; aKey = ''; aThink = 0; if (aMode === 'wander') aPath = aRand(); } }
  aThink -= dt;
  if (aThink <= 0 && aMode === 'follow') { aThink = REACT; const t = S.tut.moved ? GUIDE : { key: 's', tx: 17, ty: 24 }; if (!t || t.here) { aPath = []; aKey = ''; } else { const k = t.key + '@' + t.tx + ',' + t.ty; if (k !== aKey || !aPath.length) { aKey = k; const [sx, sy] = tileOf(P); aPath = findPath(sx, sy, t.tx, t.ty) || []; } } }
  if (aPath.length) { const [tx, ty] = aPath[0], cx = tx * 16 + 8, cy = ty * 16 + 8, dx = cx - P.x, dy = cy - P.y, d = Math.hypot(dx, dy); if (d < 1.5) aPath.shift(); botMove = d > .01 ? { x: dx / d * Math.min(1, d / 3), y: dy / d * Math.min(1, d / 3) } : null; } else botMove = null;
}
const share = {}, runs = []; let cur = null, prevKey = '', starts = {}, firstSec = {};
for (let i = 0; i < MIN * 60 / DT; i++) {
  aDrive(DT); update(DT); if (state === 'celebrate') { S.done = true; go('play'); } if (state === 'card') modalClose();
  const D = MUSIC_DBG; if (!D.song) continue;
  const k = D.song + ':' + D.section; share[k] = (share[k] || 0) + DT;
  if (!cur || cur.song !== D.song || D.pass !== cur.pass && D.section === SONGS[D.song].form[0] && cur.lastSec !== D.section) {
    if (cur) runs.push(cur);
    cur = { song: D.song, pass: D.pass, t: 0, from: D.section, lastSec: D.section };
    starts[D.song] = (starts[D.song] || 0) + 1; firstSec[D.song + ':' + D.section] = (firstSec[D.song + ':' + D.section] || 0) + 1;
  }
  cur.t += DT; cur.lastSec = D.section;
}
if (cur) runs.push(cur);
const tot = Object.values(share).reduce((a, b) => a + b, 0);
console.log(`${MIN} min played (react ${REACT}, distract ${DIS}); music time by song:section:`);
console.log('  ' + Object.entries(share).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + Math.round(v / tot * 100) + '%').join(', '));
const v1 = ['lobby:A', 'lobby:A2', 'lobby:A3'].reduce((a, k) => a + (share[k] || 0), 0);
console.log(`  the v1 melody (lobby A / A2 / A3) plays ${Math.round(v1 / tot * 100)}% of all music time; lobby B ${Math.round((share['lobby:B'] || 0) / tot * 100)}%`);
const lob = runs.filter(r => r.song === 'lobby').map(r => r.t).sort((a, b) => a - b);
console.log(`  lobby song entered ${lob.length} times; it then played median ${lob[lob.length >> 1].toFixed(0)} s before the area changed it (a pass is ~101 s; B starts ~50 s in); ${lob.filter(t => t < 50).length} of ${lob.length} stays ended before B`);
console.log('  each song entry starts at: ' + Object.entries(firstSec).map(([k, n]) => k + ' x' + n).join(', '));
