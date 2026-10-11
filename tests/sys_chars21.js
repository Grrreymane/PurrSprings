// v2.1 character art contract (SPEC_v2 16.14 "characters"): the innkeeper's o_* outfits, staff uniforms, accessories,
// the new pets and LOOKS_V21 - sizes, anchors, no Math.random, and that every look field reaches the cache key.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_chars21.js --seed 1
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
for (const k in ART) delete ART[k];
const realRandom = Math.random; Math.random = () => { throw new Error('Math.random in art'); };
let n = 0;
const sz = (name, fn, w, h) => {
  n++;
  try { const c = fn(); ok(c && c.width === w && c.height === h, name + ' is ' + (c ? c.width + 'x' + c.height : c) + ', want ' + w + 'x' + h); return c; }
  catch (e) { ok(false, name + ' threw ' + (e && e.message || e)); return null; }
};
const OUTFITS = ['o_yukata', 'o_chef', 'o_momiji', 'o_snow', 'o_hakama', 'o_ninja', 'o_samurai', 'o_maneki'];
const VIEWS = ['down', 'up', 'side'];
const HATS = [null, 'straw', 'flower', 'beret', 'captain', 'shades', 'foxmask', 'crown', 'goldband', 'topknot', 'ribbon'];
const ACCS = ['cane', 'rod', 'palette', 'camera', 'mic', 'bundle', 'tvcam'];
// every outfit x view x frame (+ every hat), the maneki wave frames
for (const o of OUTFITS) for (const v of VIEWS) {
  for (const f of [0, 1, 2]) for (const h of HATS) sz('catSprite ' + o + ' ' + v + f + ' ' + h, () => catSprite(v, f, { fur: 'orange', outfit: o, hat: h }), 16, 24);
  for (const f of [3, 4]) {
    const c = sz('catSprite ' + o + ' ' + v + f, () => catSprite(v, f, { fur: 'orange', outfit: o }), 16, 24);
    const c0 = catSprite(v, 0, { fur: 'orange', outfit: o });
    ok(o === 'o_maneki' ? c !== c0 : c === c0, o + ' ' + v + ' frame ' + f + (o === 'o_maneki' ? ' should be its own wave frame' : ' should fall back to frame 0'));
  }
  for (const f of [0, 1, 2, 3]) sz('catSit ' + o + f, () => catSit(f, { fur: 'orange', outfit: o }), 16, 24);
}
for (const o of OUTFITS.concat(['happi', undefined, 'kimono'])) for (const h of HATS) for (const f of [0, 1]) sz('catBow ' + o + ' ' + h + f, () => catBow('orange', f, h, o), 16, 24);
ok(catBow('orange', 1, null) === catBow('orange', 1, null, 'happi'), 'catBow(.., happi) should be the v2.0 bow');
// accessories on several outfits, all views and frames
for (const a of ACCS) for (const o of ['guest', 'robe', 'haori', 'apron', 'o_snow', 'o_samurai']) for (const v of VIEWS) for (const f of [0, 1, 2])
  sz('catSprite acc ' + a + ' ' + o + ' ' + v + f, () => catSprite(v, f, { fur: 'tabby', outfit: o, shirt: '#e0b050', acc: a }), 16, 24);
// staff uniforms: each changes the sprite of each staff outfit; ignored elsewhere; unlock-id aliases
const UNIS = ['sakura', 'indigo', 'sailor', 'gold'];
for (const o of ['kimono', 'apron', 'porter', 'chef', 'waiter', 'clerk']) for (const v of VIEWS) {
  const base = catSprite(v, 1, { fur: 'white', outfit: o });
  for (const u of UNIS) {
    const c = sz('uniform ' + u + ' ' + o + ' ' + v, () => catSprite(v, 1, { fur: 'white', outfit: o, uniform: u }), 16, 24);
    ok(c !== base, 'uniform ' + u + ' on ' + o + ' gave the plain sprite');
    ok(catSprite(v, 1, { fur: 'white', outfit: o, uniform: 'u_' + u }) === c, 'u_' + u + ' alias differs');
    sz('catSit uniform ' + u + ' ' + o, () => catSit(1, { fur: 'white', outfit: o, uniform: u }), 16, 24);
  }
}
for (const o of ['guest', 'robe', 'happi', 'o_ninja', 'shop']) ok(catSprite('down', 0, { fur: 'gray', outfit: o, uniform: 'sakura' }) === catSprite('down', 0, { fur: 'gray', outfit: o }), 'uniform should not touch ' + o);
// a uniform swap must never hit a fur colour (it runs on the whole grid)
const furCols = new Set(); for (const k in FURS) for (const c in FURS[k]) if (typeof FURS[k][c] === 'string' && FURS[k][c][0] === '#') furCols.add(FURS[k][c].toLowerCase());
for (const u in _chUni) for (const o in _chUni[u]) for (const col in _chUniMap(o, u)) ok(!furCols.has(col.toLowerCase()), 'uniform ' + u + '/' + o + ' swaps fur colour ' + col);
// every look field is in the cache key
const keyed = (a, b, what) => ok(catSprite('side', 1, a) !== catSprite('side', 1, b), what + ' is not in the catSprite cache key');
keyed({ outfit: 'robe', robe: '#112233' }, { outfit: 'robe', robe: '#445566' }, 'robe');
keyed({ outfit: 'haori', robe: '#112233' }, { outfit: 'haori' }, 'haori robe');
keyed({ outfit: 'guest', acc: 'mic' }, { outfit: 'guest', acc: 'camera' }, 'acc');
keyed({ outfit: 'waiter', uniform: 'sakura' }, { outfit: 'waiter', uniform: 'indigo' }, 'uniform');
keyed({ outfit: 'o_ninja', hat: 'crown' }, { outfit: 'o_ninja' }, 'hat');
ok(catSit(0, { outfit: 'guest', acc: 'camera' }) !== catSit(0, { outfit: 'guest' }), 'acc is not in the catSit cache key');
ok(catSit(0, { outfit: 'chef', uniform: 'gold' }) !== catSit(0, { outfit: 'chef' }), 'uniform is not in the catSit cache key');
// the cat mom
for (const v of VIEWS) for (const f of [0, 1, 2]) sz('mom ' + v + f, () => catSprite(v, f, LOOKS_V21.mom), 16, 24);
sz('mom sit', () => catSit(1, LOOKS_V21.mom), 16, 24);
// LOOKS_V21: every ready look draws; kittens are kitten furs
for (const k in LOOKS_V21) {
  if (Array.isArray(LOOKS_V21[k])) { for (const fu of LOOKS_V21[k]) { ok(!!FURS[fu], k + ' fur ' + fu); sz('kitten ' + fu, () => kittenSprite('down', 1, fu), 10, 14); } continue; }
  ok(!!FURS[LOOKS_V21[k].fur], k + ' has an unknown fur');
  for (const v of VIEWS) for (const f of [0, 1, 2]) sz('LOOKS_V21.' + k + ' ' + v + f, () => catSprite(v, f, LOOKS_V21[k]), 16, 24);
  sz('LOOKS_V21.' + k + ' sit', () => catSit(0, LOOKS_V21[k]), 16, 24);
}
// pets: sizes, anchors, frames (p_ ids too); duck / shiba unchanged
const PETS = { fox: [16, 16, 8, 15, 4], tanuki: [16, 16, 8, 15, 5], crane: [16, 20, 8, 19, 4], shiba: [16, 16, 8, 15, 4], duck: [10, 10, 5, 9, 2] };
for (const k in PETS) {
  const [w, h, ax, ay, mx] = PETS[k];
  ok(JSON.stringify(petAnchor(k)) === JSON.stringify([ax, ay]) && JSON.stringify(petAnchor('p_' + k)) === JSON.stringify([ax, ay]), 'petAnchor ' + k);
  for (const v of VIEWS) for (let f = 0; f <= mx; f++) sz('petSprite ' + k + ' ' + v + f, () => petSprite(k, v, f), w, h);
  ok(petSprite('p_' + k, 'side', 1) === petSprite(k, 'side', 1), 'p_' + k + ' alias');
  ok(petSprite(k, 'down', mx + 1) === petSprite(k, 'down', 0), k + ' frame past the last should fall back to 0');
}
ok(petSprite('tanuki', 'down', 5) !== petSprite('tanuki', 'down', 3), 'tanuki lantern frame');
Math.random = realRandom;
console.log(errs.length ? 'SYS CHARS21 FAIL (' + errs.length + '/' + n + ')\n  ' + errs.slice(0, 40).join('\n  ') : 'SYS CHARS21 OK  ' + n + ' sprites match SPEC_v2 16.14 (characters)');
if (errs.length) process.exitCode = 1;
