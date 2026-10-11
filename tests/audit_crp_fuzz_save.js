// Save fuzz (stage 5 audit): the boot runs `S = loadState(); resetWorld();` with no try/catch, so ANY stored save that makes
// them throw bricks the game for good (the save is never rewritten). Random shapes around the real schema (v1 and v2),
// then load + reset + a few frames of play + render + save round trip.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/audit_crp_fuzz_save.js --seed 1 -- 3000
const N = +ARGS[0] || 3000, DT = 1 / 30;
const ids = Object.keys(UNLOCK).concat(['sign', 'room9', 'desk', '__proto__', 'constructor', 'toString', 'hasOwnProperty', '']);
const vals = () => pick([0, 1, -1, 7, 1e9, 1e300, -1e300, NaN, '12', 'x', '', null, true, false, [], [1, 2], {}, { a: 1 }, 'clean', 'messy', 'occupied', 'reserved', 'd_scroll', 'kawa', 0.5, 2.5, Infinity]);
const rid = () => pick(ROOMS.map(r => r.id).concat(['room9', 'c5', '', 'constructor']));
const objOf = (keys, n) => { const o = {}; for (let i = 0; i < n; i++) o[pick(keys)] = vals(); return o; };
function randomSave() {
  const s = Math.random() < .5 ? JSON.parse(JSON.stringify(defaults())) : { v: pick([1, undefined, '1', 0]) };
  const fields = ['v', 'money', 'earned', 'unlocked', 'paid', 'basket', 'piles', 'rooms', 'stats', 'tut', 'done', 'peak', 'hearts', 'clock', 'day', 'dayLog', 'decor', 'combos', 'seen', 'album', 'gifts', 'equip', 'staff', 'vipNext', 'opts', 'gift', 'vipOwe'];
  for (let k = 0; k < 6; k++) {
    const f = pick(fields), r = Math.random();
    if (r < .3) s[f] = vals();
    else if (f === 'unlocked' || f === 'paid' || f === 'piles') s[f] = objOf(ids, 6);
    else if (f === 'rooms') s[f] = Object.fromEntries(Array.from({ length: 6 }, () => [rid(), pick(['clean', 'messy', 'occupied', 'reserved', 7, null])]));
    else if (f === 'decor') s[f] = Object.fromEntries(Array.from({ length: 6 }, () => [rid() + ':' + pick(['A', 'B', 'C', '']), pick(DECOR_IDS.concat(['x', null, 3]))]));
    else if (f === 'album') s[f] = pick([{ vip: objOf(VIPS.map(v => v.id).concat(['x']), 3), photos: pick([[{ v: 'kawa', d: 'x', h: 'h_straw', p: 7 }, null, 3, { v: 'zz' }], 'x', null, {}]), furs: objOf(['white', 'x'], 2), types: pick([[], 'x', { elder: 1 }]) }, vals()]);
    else if (f === 'gifts') s[f] = pick([['kawa', 'kawa', 'x', 3, null], 'kawa', {}, null]);
    else if (f === 'equip') s[f] = { hat: pick(['h_straw', 'h_crown', 'x', 3, null]), pet: pick(['p_duck', 'x', null, {}]) };
    else if (f === 'staff') s[f] = objOf(Object.keys(STAFF_DEF).concat(['x']), 4);
    else if (f === 'stats' || f === 'dayLog' || f === 'tut' || f === 'opts' || f === 'seen' || f === 'combos') s[f] = objOf(['guests', 'angry', 'time', 'calls', 'g', 'h', 'best', 'moved', 'lines', 'call', 'vip', 'c_ga', 's_fish', 'x'], 4);
    else s[f] = vals();
  }
  if (Math.random() < .3) { s.unlocked = s.unlocked && typeof s.unlocked === 'object' ? s.unlocked : {}; for (const u of UNLOCKS) if (Math.random() < .4) s.unlocked[u.id] = true; }   // arbitrary (inconsistent) unlock sets
  return s;
}
let fails = 0; const seen = new Set();
for (let i = 0; i < N; i++) {
  const raw = randomSave(), txt = JSON.stringify(raw);
  let stage = 'load';
  try {
    localStorage.setItem(SAVE + 'state', txt);
    S = loadState(); stage = 'reset'; resetWorld(); stage = 'play'; go('play'); S.tut.moved = true;
    for (let k = 0; k < 20; k++) { update(DT); if (state === 'celebrate') { S.done = true; go('play'); } if (state === 'card') modalClose(); }
    stage = 'render'; render();
    stage = 'roundtrip'; saveNow(); S = loadState(); resetWorld(); go('play'); update(DT); render();
    stage = 'menu'; openMenu(); for (const pg of ['home', 'sound', 'book', 'bought', 'inn']) { MENU.page = pg; for (let t = 0; t < 4; t++) { MENU.tab = t; render(); } } closeMenu();
    if (!Number.isFinite(S.money) || !Number.isFinite(S.hearts) || !Number.isFinite(S.clock)) throw new Error('non-finite number in S');
  } catch (e) {
    const sig = stage + ': ' + String(e && e.message);
    if (!seen.has(sig)) { seen.add(sig); console.log('FAIL [' + sig + ']\n  save: ' + txt.slice(0, 600) + '\n  ' + String(e && e.stack || '').split('\n').slice(1, 4).join(' | ')); }
    fails++;
  }
}
console.log(fails ? 'FUZZ SAVE: ' + fails + '/' + N + ' saves fail (' + seen.size + ' distinct)' : 'FUZZ SAVE OK  ' + N + ' random saves load, play, render, round-trip');
process.exitCode = fails ? 1 : 0;
