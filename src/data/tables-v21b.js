// ============================================================ v2.1 data, core B (SPEC_v2 16.6-16.10)
// The full boutique (innkeeper outfits, staff uniforms, three more pets, gold decor), the garden pieces + their rare
// guests, the cat shrine, the festival plaza. Everything that is bought is an UNLOCKS entry (tables.js appends
// UNLOCKS_V21B; shared S.unlocked / S.paid, 16.13). All of it opens from star 5 (need5): before that the eager bot's
// star timeline (14.2 A1) is the same as v2.0.1. Flags read by the core hooks:
//   outfit / uniform   a booth piece (like hat / pet): one booth each, cheapest first, try it on within 2 tiles
//   goldOf             a gold version of a decor piece: on sale in the shop's decor pads once a combo with that piece
//                      is found; owning it turns that piece gold in every room, and a combo with it pays +0.4 (16.6)
//   gz                 a garden piece: its own tile `at`, one chain pad in the garden; `rare` = the rare guest it brings
//   shrine             an offering level (1-10) on the shrine's pad; extra = always shown (not one of the 4 progress pads)
//   stall              a festival stall; repeat = bought again and again (the fireworks); noArrow = the arrow never points
//   ok()               on sale only while this holds (seasonal outfits, gold decor, the fireworks' cool-down)
function UNB(id, name, price, req, hearts, pad, icon, card, o) { return Object.assign({ id, name, price, req, hearts, pad, icon, card, need5: true, v21b: true }, o || {}); }
// the season of the year, 0 spring .. 3 winter: core A's calendar (seasons.js seasonNow; called at run time only - a
// `typeof seasonNow` here would throw while seasons.js's const is not yet initialised)
const seasonB = () => seasonNow();
const OUTFIT_PAD = [4, 36], UNIFORM_PAD = [6, 36];   // v2.4: under the hat / pet booths, a tile between
// the innkeeper's outfits (look.outfit; shirt = the colour shown until the character art draws the outfit itself)
const OUTFITS_B = [
  ['o_yukata', '浴衣', 15000, 6, '换上朝颜浴衣', '#6a9ae0'], ['o_chef', '割烹', 20000, 8, '换上割烹着', '#f4f0e6'],
  ['o_momiji', '羽织', 30000, 12, '秋天限定红叶', '#d8602a', 2], ['o_snow', '雪国', 30000, 12, '冬天限定雪国', '#e8f0f8', 3],
  ['o_hakama', '书生', 45000, 15, '换上书生袴', '#5a4a8a'], ['o_ninja', '忍者', 60000, 20, '换上忍者装', '#2a2a3a'],
  ['o_samurai', '武士', 80000, 25, '换上武士装', '#a83a3a'], ['o_maneki', '招财', 200000, 50, '站着会招手', '#f8f4ec'],
];
const OUTFIT_SHIRT = NUL(); OUTFITS_B.forEach(o => { OUTFIT_SHIRT[o[0]] = o[5]; });
// staff uniforms: one palette map per staff outfit (look.uniform = the id after 'u_')
const UNIFORMS_B = [['u_sakura', '樱色', 25000, 10, '全员换樱色', 'sakura'], ['u_aizome', '蓝染', 30000, 12, '全员换蓝染', 'indigo'], ['u_sailor', '水手', 40000, 15, '全员换水手服', 'sailor'], ['u_gold', '金边', 150000, 40, '全员换金边', 'gold']];   // look.uniform = the last (the character art's palette names)
// gold decor (16.6): the piece it gilds; on sale once a combo with that piece has been found
const GOLD_B = [['d_maneki_gold', '金猫', 'd_maneki', '金招财·组合加价'], ['d_daruma_gold', '金达', 'd_daruma', '金达摩·组合加价'], ['d_tank_gold', '金缸', 'd_tank', '金鱼缸·组合加价'], ['d_screen_gold', '金屏', 'd_screen', '金屏风·组合加价']];   // [id, name, base, card line]
const GOLD_PLUS = .4;   // a combo with a gold piece in it: room fee x(1.6 + 0.4)
// the garden pieces (16.7): chain pad, price order; at = its own ground (SPEC 2.4's eight spots; the stone lantern (29,24) -> (34,28)
// and the chime (34,24) -> (35,24): the v2.0.1 sakura grove hid the one, the path lamp crowded the other - 18.2)
const GZ_PAD = [34, 26];
const GARDEN_B = [
  ['gd_chime', '风铃', 8000, [35, 24], 'r_boy', 6], ['gd_zen', '禅石', 10000, [36, 18], 'r_zen', 8], ['gd_mill', '水车', 18000, [30, 17], 'r_fisher', 10],
  ['gd_lantern', '石灯', 20000, [34, 28], 'r_yuki', 10], ['gd_tower', '爬塔', 30000, [36, 26], 'r_kits', 12], ['gd_wisteria', '紫藤', 35000, [37, 24], 'r_painter', 14],
  ['gd_torii', '鸟居', 60000, [38, 26], 'r_bride', 20], ['gd_teahouse', '茶室', 120000, [38, 28], 'r_master', 30],
];
// the cat shrine (16.8): gate pad in the onsen, the offering pad in front of the hall; ten levels (all fees +1 % each)
const SHRINE_GATE_PAD = [11, 4], OFFER_PAD = [5, 2];
const OFFER_B = [[10000, '小祠落成'], [20000, '红鸟居'], [35000, '石灯笼'], [50000, '一对狛犬'], [70000, '朱漆本殿'], [90000, '樱花开了'], [120000, '千本鸟居'], [160000, '金铃'], [220000, '金屋顶'], [300000, '巨大金猫像']];
const SHRINE_FEE = .01;
// the festival plaza (16.9): gate pad in the front yard; four stalls on the north edge of the lower garden (a chain, one
// pad at a time, each under its stall's left tile); the fireworks pad on the lawn
const PLAZA_GATE_PAD = [23, 32], FW_PAD = [29, 33];   // v2.5: the fireworks pad on the dancing ground's west side
const STALLS_B = [['st_goldfish', '金鱼', 8000, 'goldfish', 27, '金鱼捞屋台'], ['st_tako', '章鱼', 10000, 'takoyaki', 30, '章鱼烧屋台'], ['st_ice', '刨冰', 10000, 'ice', 33, '刨冰屋台'], ['st_shoot', '射的', 15000, 'shoot', 36, '射的屋台']];
PILE_AT.plaza = [36, 33];   // v2.5 (was (31,32) on the walk)   // stall money (the bench at (30-31,34) sits where 16.9 put it: 18.2)
// fireworks: 5,000 + 500 a show (8,000 at most), 8 min cool-down; a 45 s show: fees x1.3, guests x1.5, hearts +10
const FW_PRICE = 5000, FW_STEP = 500, FW_MAX = 8000, FW_COOL = 480, FW_T = 45, FW_FEE = 1.3, FW_SPAWN = 1.5, FW_HEARTS = 10;
// a burst: fireworkArt(k, 0..5) 32 x 32, one second, never brighter than .6; FW_DUSK: the show's own dusk over the view
// (a multiply tint like the night's, none at night; fun check 18.2: the old plain .25 veil left the bursts invisible by day)
const FW_FRAMES = 6, FW_FPS = 6, FW_ALPHA = .6, FW_DUSK = .4;
const YATAI_P = .5, YATAI_T = 1;   // a festival guest buys at a stall on the way home: odds, seconds standing there
const FEST_STALLS = 6;              // 16.2: with stalls a festival's lantern goal is 6 more (festival.js festTargetExtra)
const fwPrice = () => Math.min(FW_MAX, FW_PRICE + FW_STEP * ((S.fw && S.fw.n) | 0));
// rare guests (16.7): due 2-5 min after their piece is bought, then about every 20 min; at most one every RARE_GAP s
// (a first visit excepted); they come in the VIP's place (one guest of honour at a time), so there is no extra work
// (fun check, 18.2: with 900-1500 s the zen master came 5 times in 2 h - a rare guest has to stay rare)
const RARE_FIRST = [120, 300], RARE_AGAIN = [1200, 2100], RARE_GAP = 480, RARE_STAY_T = 3, RARE_SHOW_R = 36, RARE_ADMIRE_T = 1.5;

const UNLOCKS_V21B = [];
{
  const U = (...a) => UNLOCKS_V21B.push(UNB(...a));
  // the shrine gate first: a gate is always shown (3.5), so the onsen shows it as soon as star 5 comes
  U('shrine', '神社', 10000, [], 20, SHRINE_GATE_PAD, 'shrine', '猫神社开门', { gate: true, at: [5, 3] });
  U('plaza', '广场', 20000, [], 20, PLAZA_GATE_PAD, 'plaza', '祭典广场开张', { gate: true, at: [31, 31] });
  OFFER_B.forEach(([price, card], i) => U('of' + (i + 1), '奉纳', price, i ? ['of' + i] : [], 5 + 2 * i, OFFER_PAD, 'offer', card, { shrine: i + 1, extra: true, at: [5, 1] }));
  GARDEN_B.forEach(([id, name, price, at, rare, h], i) => U(id, name, price, i ? [GARDEN_B[i - 1][0]] : [], h, GZ_PAD, id, '会引来', { gz: true, rare, at, extra: true }));
  STALLS_B.forEach(([id, name, price, kind, x, card], i) => U(id, name, price, i ? [STALLS_B[i - 1][0]] : [], 6, [x, 31], kind, card, { stall: kind, extra: true, at: [x, 30] }));
  U('fw', '烟花', FW_PRICE, [], 0, FW_PAD, 'firework', '放一场烟花', { repeat: true, noArrow: true, extra: true, ok: () => !fwCooling() });
  OUTFITS_B.forEach(([id, name, price, h, card, , season]) => U(id, name, price, [], h, 'outfit', 'outfit', card, Object.assign({ outfit: id }, season !== undefined ? { season, ok: () => seasonB() === season || (S.paid[id] | 0) > 0 } : {})));
  UNIFORMS_B.forEach(([id, name, price, h, card, look]) => U(id, name, price, [], h, 'uniform', 'uniform', card, { uniform: look }));
  U('p_fox', '小狐', 60000, [], 20, 'pet', 'pet', '小狐跟着你', { pet: 'fox' });
  U('p_tanuki', '小狸', 90000, [], 30, 'pet', 'pet', '会变灯笼哦', { pet: 'tanuki' });
  U('p_crane', '白鹤', 150000, [], 40, 'pet', 'pet', '白鹤跟着你', { pet: 'crane' });
  GOLD_B.forEach(([id, name, base, card]) => U(id, name, 20000, [], 10, 'decor', 'gold:' + base, card, { goldOf: base, ok: () => comboFoundWith(base) }));
}
// the fireworks' price follows the shows so far (padNeed / the pad / the card read u.price)
Object.defineProperty(UNLOCKS_V21B.find(u => u.id === 'fw'), 'price', { get: fwPrice, enumerable: true });
const GZ_IDS = GARDEN_B.map(g => g[0]);
// v2.5 (player feedback "what does the water wheel do?"): besides its rare guest every garden piece gives the two garden
// cottages (the rooms that look out on it) +GZ_FEE room fee, so a piece is never dead money
const GZ_FEE = .03;
const gzOwned = () => GZ_IDS.reduce((n, id) => n + (S.unlocked[id] ? 1 : 0), 0);

// ---- rare guests (16.7): look (robe / hat / acc combinations, 16.14), wishes, the keepsake it leaves, its arrival line
// (E11), the condition it waits for (season 0-3 | 'night'). `kits`: the three kitten brothers (kittenSprite x 3).
const RARES = [
  { id: 'r_zen', name: '禅师', piece: 'gd_zen', fur: 'black', robe: '#e08a2a', wishes: ['tea', 'stay', 'photo'], keep: 'beads', keepName: '念珠', line: '心静了' },
  { id: 'r_fisher', name: '钓鱼爷爷', piece: 'gd_mill', fur: 'tabby', robe: '#4a6a5a', hat: 'straw', acc: 'rod', wishes: ['rice', 'stay', 'photo'], keep: 'gyotaku', keepName: '鱼拓', line: '钓到大鱼啦' },
  { id: 'r_boy', name: '夏日少年', piece: 'gd_chime', fur: 'cream', outfit: 'guest', shirt: '#6ac8e8', hat: 'straw', wishes: ['milk', 'bath', 'photo'], keep: 'chime', keepName: '小风铃', line: '冰牛奶！', when: 1 },
  { id: 'r_yuki', name: '雪女猫', piece: 'gd_lantern', fur: 'white', robe: '#a8d8f0', wishes: ['milk', 'bath', 'photo'], keep: 'snowball', keepName: '雪球', line: '好暖和…', when: 3 },
  { id: 'r_kits', name: '小猫三兄弟', piece: 'gd_tower', fur: 'calico', kits: ['calico', 'tabby', 'black'], wishes: ['show', 'milk', 'photo'], keep: 'teaser', keepName: '逗猫棒', line: '爬到最高！' },
  { id: 'r_painter', name: '画家猫', piece: 'gd_wisteria', fur: 'gray', robe: '#5a6ab0', hat: 'beret', acc: 'palette', wishes: ['show', 'tea', 'photo'], keep: 'painting', keepName: '风景画', line: '得画下来', when: 0 },
  { id: 'r_bride', name: '狐新娘', piece: 'gd_torii', fur: 'white', robe: '#f8f4ec', hat: 'foxmask', wishes: ['kaiseki', 'bath', 'photo'], keep: 'foxmask', keepName: '狐面', line: '今夜出嫁', when: 'night' },
  { id: 'r_master', name: '茶道宗师', piece: 'gd_teahouse', fur: 'gray', outfit: 'haori', wishes: ['tea', 'tea', 'photo'], keep: 'chawan', keepName: '名茶碗', line: '一期一会' },
];
const RARE = NUL(); RARES.forEach((r, i) => { r.rare = true; r.lineId = 'E11' + 'abcdefgh'[i]; RARE[r.id] = r; });
// their looks: the character art's ready-made LOOKS_V21 when it is there (16.14: zen fisher boy yukionna painter bride tea,
// .kittens = the brothers' furs), else robe / hat / acc built from the table above
const RARE_ART = { r_zen: 'zen', r_fisher: 'fisher', r_boy: 'boy', r_yuki: 'yukionna', r_painter: 'painter', r_bride: 'bride', r_master: 'tea' };
const RARE_LOOK = NUL();
RARES.forEach(r => {
  const L = typeof LOOKS_V21 === 'object' && LOOKS_V21 ? LOOKS_V21 : null;
  if (r.kits && L && Array.isArray(L.kittens) && L.kittens.length >= 3) r.kits = L.kittens.slice(0, 3);
  if (r.kits) r.fur = r.kits[0];
  RARE_LOOK[r.id] = L && L[RARE_ART[r.id]] ? L[RARE_ART[r.id]] : { fur: r.fur, outfit: r.outfit || 'robe', robe: r.robe || null, shirt: r.shirt || null, hat: r.hat || null, acc: r.acc || null };
});

// ---- props (2.4 / pathfinding.js PROPS): the shrine's parts by level, the garden pieces, the stalls, the plaza's
// lantern string. need: an unlock id or () => bool; prev: the unlock whose info card previews it (drawPreviewB).
const NO_ART = mk(1, 1);
const PROPS_V21B = [
  // the shrine (16.8; scenery art: hokoraArt(lv 1-10, season) 48 x 44, cumulative): the hall from the first offering on;
  // the torii's two posts block, you walk under its beam - it fades while you stand behind it (in the 3/4 view it would
  // hide you and the offering pad), and so do the small torii over the approach while you walk under them
  { k: 'hokora', at: [4, 1], fw: 3, need: 'of1', uid: 'shrine:hall', img: () => hokoraArt(shrineLv(), seasonB()) },
  { k: 'torii', at: [4, 3], fw: 3, block: false, need: 'of2', img: () => behindTorii() ? fadeArt(toriiArt(seasonB()), .4) : toriiArt(seasonB()) },
  { k: 'post', at: [4, 3], need: 'of2', img: () => NO_ART }, { k: 'post', at: [6, 3], need: 'of2', img: () => NO_ART },
  { k: 'slantern', at: [2, 2], need: 'of3', img: () => shrineLanternArt(lampLit(), seasonB()), light: [18, 2, 'lamp'] },
  { k: 'slantern', at: [8, 2], need: 'of3', img: () => shrineLanternArt(lampLit(), seasonB()), light: [18, 2, 'lamp'] },
  { k: 'komainu', at: [3, 2], need: 'of4', img: () => komainuArt('l', seasonB()) }, { k: 'komainu', at: [7, 2], need: 'of4', img: () => komainuArt('r', seasonB()) },
  { k: 'tree', at: [1, 3], need: 'of6', block: false, img: () => treeArt('sakura', seasonB(), 1) },
  { k: 'tree', at: [9, 2], need: 'of6', block: false,   // v2.4: off the west wing's new way in (was (8,5))
    img: () => flipOf(treeArt('sakura', seasonB(), 2)) },
  ...[6, 7, 8, 9].map(x => ({ k: 'senbon', at: [x, 4], need: 'of7', block: false, img: () => underSenbon(x) ? fadeArt(senbonArt(), .45) : senbonArt() })),
  { k: 'glow', at: [5, 0], fw: 1.5, need: 'of10', block: false, ground: true, img: () => NO_ART, light: [28, 8, 'lamp'] },   // the gold cat on the roof glows at night (92, 8)
  // the garden pieces (16.7), each on its own ground (snow on them in winter)
  ...GARDEN_B.map(([id, , , at]) => ({ k: 'gz', at, need: id, img: () => snowy(gardenDecorArt(id, Math.floor(T * 1.5) & 1)), light: id === 'gd_lantern' ? [18, 0, 'lamp'] : undefined })),
  // the plaza (16.9): stalls under their cloth, open at a festival / a fireworks show; a lantern string along the hedge
  ...STALLS_B.map(([id, , , kind, x]) => ({ k: 'stall', at: [x, 30], fw: 2, need: id, img: () => stallArt(kind, stallsOpen(), Math.floor(T * 2) & 1) })),   // (snow in winter: seasons.js propImg, k 'stall')
  { k: 'chochin', at: [27, 29], fw: 12, need: 'plaza', ground: true, block: false, img: () => chochinRow(12) },   // v2.4: from col 27 (the gate is 2 wide now)
  ...[27, 31, 35].map(x => ({ k: 'chochinLamp', at: [x, 29], need: 'plaza', ground: true, block: false, img: () => NO_ART, light: [10, 10, 'lamp'] })),
];
