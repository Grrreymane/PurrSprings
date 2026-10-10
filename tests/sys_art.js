// SPEC_v2 12 art contract: every art function the core calls exists, takes the documented arguments, returns a canvas
// of the documented size, and does not use Math.random. Passes on the stubs now; run it again after merging art/*.js.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_art.js
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
for (const k in ART) delete ART[k];   // build everything fresh
const realRandom = Math.random; Math.random = () => { throw new Error('Math.random in art'); };
let n = 0;
function sz(name, fn, w, h) {
  n++;
  try { const c = fn(); ok(c && c.width === w && c.height === h, name + ' is ' + (c ? c.width + 'x' + c.height : c) + ', want ' + w + 'x' + h); }
  catch (e) { ok(false, name + ' threw ' + (e && e.message || e)); }
}
// ---- characters
const looks = [{}, { fur: 'calico', outfit: 'kimono' }, { fur: 'white', outfit: 'apron', hat: 'ribbon', trim: 2 }, { fur: 'black', outfit: 'chef', trim: 1 }, { fur: 'cow', outfit: 'waiter' },
  { fur: 'tabby', outfit: 'clerk' }, { fur: 'tabby', outfit: 'shop' }, { fur: 'gray', outfit: 'haori', acc: 'cane' }, { fur: 'graytabby', outfit: 'robe', robe: '#b88a5a', hat: 'beret' },
  { fur: 'orange', outfit: 'happi', hat: 'goldband' }, { fur: 'siamese', outfit: 'guest', shirt: '#5a9ae0', bag: true, hat: 'straw' }];
for (const v of ['down', 'up', 'side']) for (const f of [0, 1, 2]) for (const l of looks) sz('catSprite ' + v + f + ' ' + JSON.stringify(l), () => catImg(v, f, l), 16, 24);
for (const h of [null, 'straw', 'flower', 'beret', 'captain', 'shades', 'foxmask', 'crown', 'goldband', 'topknot', 'ribbon']) for (const f of [0, 1]) sz('catBow ' + h + f, () => bowImg('orange', f, h), 16, 24);
for (const f of [0, 1, 2]) sz('catSit ' + f, () => catSit(f, { fur: 'calico', outfit: 'yukata' }), 16, 24);
for (const v of ['down', 'up', 'side']) for (const f of [0, 1, 2]) sz('kittenSprite ' + v + f, () => kittenSprite(v, f, 'cream'), 10, 14);
sz('kittenSit', () => kittenSit('white'), 10, 12);
for (const v of ['down', 'up', 'side']) for (const f of [0, 1, 2]) { sz('petSprite duck ' + v + f, () => petSprite('duck', v, f), 10, 10); sz('petSprite shiba ' + v + f, () => petSprite('shiba', v, f), 16, 16); }
sz('petSprite shiba sit', () => petSprite('shiba', 'down', 3), 16, 16);
sz('catCurl', () => catCurl('orange'), 14, 10);
for (const fur of Object.keys(FURS)) { sz('catBathing ' + fur, () => catBathing(fur, 1), 18, 12); sz('catSleepHead ' + fur, () => catSleepHead(fur), 12, 9); }
// ---- scenery
const chars = new Set(MAP.join('')); chars.delete('D');
for (const c of chars) sz('tile ' + c, () => tileImg(c, 5, 5, { u: c, d: c, l: c, r: c }), 16, 16);
for (const d of DOORS) for (const o of [false, true]) sz('doorArt ' + d.kind + ' ' + d.at + ' ' + o, () => doorArt(d.kind, o, d.col || null, d.emb || null, !!d.gold), 16, 16);
for (const f of [0, 1, 2, 3]) { sz('pondArt ' + f, () => pondArt(f, 28, 16), 16, 16); sz('waterfallArt ' + f, () => waterfallArt(f), 32, 40); sz('waterArt ' + f, () => waterArt(f, 14, 2), 16, 16); }
for (const k of ['giftshelf', 'photo', 'menu', 'lantern', 'bell']) sz('wallDecorArt ' + k, () => wallDecorArt(k), 16, 16);
sz('bambooGroveArt', () => bambooGroveArt(3, 2), 16, 24);
for (const nn of [2, 3, 4, 5]) for (const lit of [false, true]) sz('areaSignArt ' + nn + lit, () => areaSignArt(nn, lit), 14, 18);
sz('ropeArt', () => ropeArt('v'), 16, 16);
for (const r of [10, 18, 24, 28]) sz('glowArt ' + r, () => glowArt(r, '#ffd890'), 2 * r, 2 * r);
sz('plazaDecor', () => plazaDecor(30, 32), 16, 16);
sz('entranceNoren', () => entranceNoren(), 48, 14);
// ---- objects
sz('urnArt', () => urnArt(), 16, 22);
for (const f of [0, 1]) { sz('stoveArt', () => stoveArt(f), 32, 30); sz('ricePotArt', () => ricePotArt(f), 16, 22); sz('tubArt', () => tubArt(f), 16, 18); sz('shishiArt', () => shishiArt(f), 16, 18); sz('koiArt', () => koiArt(['red', 'gold', 'black'][f], f), 9, 5); }
for (let i = 0; i <= 6; i++) sz('passArt ' + i, () => passArt(i), 48, 24);
for (const s of ['empty', 'set', 'eaten']) sz('dTableArt ' + s, () => dTableArt(s), 16, 16);
sz('cushionArt', () => cushionArt(), 12, 6);
for (const u of UNLOCKS.filter(x => x.decor)) { sz('decorArt ' + u.id, () => decorArt(u.id, 1), 16, 22); sz('decorIcon ' + u.id, () => decorIcon(u.id), 10, 10); }
sz('slotMarkArt', () => slotMarkArt(), 12, 6);
sz('displayShelfArt', () => displayShelfArt(), 64, 24); sz('shopCounterArt', () => shopCounterArt(), 32, 24); sz('awningArt', () => awningArt(), 144, 16);
sz('curtainArt', () => curtainArt(), 64, 16); sz('mirrorArt', () => mirrorArt(), 16, 28); sz('petCushionArt', () => petCushionArt(), 16, 10);
for (const p of [0, .35, 1]) sz('statueArt covered ' + p, () => statueArt('covered', p), 32, 48);
sz('statueArt gold', () => statueArt('gold', 1), 32, 48);
sz('treeArt sakura', () => treeArt('sakura'), 32, 44); sz('treeArt maple', () => treeArt('maple'), 28, 36); sz('treeArt pine', () => treeArt('pine'), 32, 40);
for (const k of [0, 1]) sz('rockArt ' + k, () => rockArt(k), 16, 12);
sz('yukimiArt', () => yukimiArt(), 16, 22);
for (const l of [false, true]) { sz('gardenLampArt', () => gardenLampArt(l), 10, 24); sz('deckLanternArt', () => deckLanternArt(l), 12, 24); }
for (const k of [0, 1, 2]) sz('flowerPotArt ' + k, () => flowerPotArt(k), 12, 14);
for (const l of [1, 2]) sz('chestArt ' + l, () => chestArt(l), 16, 16);
for (const v of VIPS) sz('giftArt ' + v.gift, () => giftArt(v.gift), 8, 8);
sz('polaroidArt', () => polaroidArt(), 12, 14); sz('wishBoardArt', () => wishBoardArt(), 40, 14);
// ---- icons + UI
for (const k of new Set(UNLOCKS.map(u => u.icon))) sz('padIcon ' + k, () => padIcon(k), 12, 12);
for (const k of ['bed', 'towel', 'dots', 'angry', 'heart', 'zzz', 'milk', 'tea', 'rice', 'kaiseki', 'bath', 'photo', 'card', 'heart2', 'blank']) for (const g2 of [false, true]) sz('bubbleArt ' + k + g2, () => bubbleArt(k, 1, g2), 14, 13);
for (const on of [false, true]) for (const gd of [false, true]) sz('starIcon', () => starIcon(on, gd), 7, 7);
for (const k of ['tea', 'milk', 'rice', 'kaiseki']) sz('itemIcon ' + k, () => itemIcon(k), 7, 7);
for (const u of UNLOCKS.filter(x => x.hat)) sz('hatIcon ' + u.id, () => hatIcon(u.id), 10, 10);
for (const u of UNLOCKS.filter(x => x.pet)) sz('petIcon ' + u.id, () => petIcon(u.id), 10, 10);
for (const e of ROOMS.map(r => r.emb).concat(['rice', 'pinebranch'], COMBOS.map(c => c.emb))) sz('emblemArt ' + e, () => emblemArt(e), 7, 7);
for (const k of ['play', 'sound', 'music', 'sfx', 'talk', 'book', 'bag', 'house', 'back', 'prev', 'next', 'lock', 'camera']) sz('menuIcon ' + k, () => menuIcon(k), 12, 12);
sz('pauseIcon', () => pauseIcon(), 5, 7);
for (const on of [false, true]) sz('toggleArt', () => toggleArt(on), 22, 11);
for (const r of RIVALS.filter(x => x.id).map(x => x.id).concat('me')) sz('rankBadge ' + r, () => rankBadge(r), 9, 9);
sz('trophyIcon', () => trophyIcon(), 7, 7); sz('heartIcon', () => heartIcon(), 7, 6); sz('bellIcon', () => bellIcon(), 7, 7);
sz('skyDialArt', () => skyDialArt(), 21, 11); sz('sunIcon', () => sunIcon(), 5, 5); sz('moonIcon', () => moonIcon(), 5, 5); sz('newTagArt', () => newTagArt(), 13, 9);
sz('ghostTint', () => ghostTint(urnArt()), 16, 22);
// the v1 set the core still calls
for (const [nm, fn, w, h] of [['deskArt', deskArt, 48, 28], ['shelfArt', shelfArt, 32, 30], ['basketArt', () => basketArt(5, 10), 16, 16], ['milkArt', () => milkArt(1), 16, 30],
  ['futonArt', () => futonArt('sleep', 1), 16, 32], ['tableArt', tableArt, 16, 16], ['andonArt', andonArt, 12, 20], ['toroArt', toroArt, 14, 26], ['plantArt', () => plantArt('pot'), 14, 22],
  ['benchArt', benchArt, 32, 16], ['signArt', () => signArt(true), 32, 28], ['fishIcon', fishIcon, 9, 7], ['towelArt', towelArt, 10, 4], ['arrowArt', () => arrowArt(1), 9, 8],
  ['handArt', handArt, 10, 11], ['joyBase', joyBase, 28, 28], ['joyKnob', joyKnob, 12, 12], ['sparkleArt', () => sparkleArt(2), 9, 9], ['poofArt', () => poofArt(2), 16, 12]]) sz(nm, fn, w, h);
Math.random = realRandom;
console.log(errs.length ? 'SYS ART FAIL (' + errs.length + '/' + n + ')\n  ' + errs.slice(0, 40).join('\n  ') : 'SYS ART OK  ' + n + ' sprites match SPEC_v2 12');
if (errs.length) process.exitCode = 1;
