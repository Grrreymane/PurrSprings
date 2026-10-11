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
// the season of the year, 0 spring .. 3 winter (16.1: three days a season). Core A's calendar decides once merged.
const seasonB = () => typeof seasonNow === 'function' ? seasonNow() : Math.floor((Math.max(1, S.day | 0) - 1) / 3) % 4;
const OUTFIT_PAD = [3, 34], UNIFORM_PAD = [5, 34];
// the innkeeper's outfits (look.outfit; shirt = the colour shown until the character art draws the outfit itself)
const OUTFITS_B = [
  ['o_yukata', '浴衣', 15000, 6, '换上朝颜浴衣', '#6a9ae0'], ['o_chef', '割烹', 20000, 8, '换上割烹着', '#f4f0e6'],
  ['o_momiji', '羽织', 30000, 12, '秋天限定红叶', '#d8602a', 2], ['o_snow', '雪国', 30000, 12, '冬天限定雪国', '#e8f0f8', 3],
  ['o_hakama', '书生', 45000, 15, '换上书生袴', '#5a4a8a'], ['o_ninja', '忍者', 60000, 20, '换上忍者装', '#2a2a3a'],
  ['o_samurai', '武士', 80000, 25, '换上武士装', '#a83a3a'], ['o_maneki', '招财', 200000, 50, '站着会招手', '#f8f4ec'],
];
const OUTFIT_SHIRT = NUL(); OUTFITS_B.forEach(o => { OUTFIT_SHIRT[o[0]] = o[5]; });
// staff uniforms: one palette map per staff outfit (look.uniform = the id after 'u_')
const UNIFORMS_B = [['u_sakura', '樱色', 25000, 10, '全员换樱色'], ['u_aizome', '蓝染', 30000, 12, '全员换蓝染'], ['u_sailor', '水手', 40000, 15, '全员换水手服'], ['u_gold', '金边', 150000, 40, '全员换金边']];
// gold decor (16.6): the piece it gilds; on sale once a combo with that piece has been found
const GOLD_B = [['d_maneki_gold', '金猫', 'd_maneki', '金招财'], ['d_daruma_gold', '金达', 'd_daruma', '金达摩'], ['d_tank_gold', '金缸', 'd_tank', '金鱼缸'], ['d_screen_gold', '金屏', 'd_screen', '金屏风']];
const GOLD_PLUS = .4;   // a combo with a gold piece in it: room fee x(1.6 + 0.4)
// the garden pieces (16.7): chain pad, price order; at = its own ground (SPEC 2.4: all eight placed, every tile reachable)
const GZ_PAD = [34, 26];
const GARDEN_B = [
  ['gd_chime', '风铃', 8000, [34, 24], 'r_boy', 6], ['gd_zen', '禅石', 10000, [36, 18], 'r_zen', 8], ['gd_mill', '水车', 18000, [38, 15], 'r_fisher', 10],
  ['gd_lantern', '石灯', 20000, [29, 24], 'r_yuki', 10], ['gd_tower', '爬塔', 30000, [36, 26], 'r_kits', 12], ['gd_wisteria', '紫藤', 35000, [37, 24], 'r_painter', 14],
  ['gd_torii', '鸟居', 60000, [30, 28], 'r_bride', 20], ['gd_teahouse', '茶室', 120000, [38, 28], 'r_master', 30],
];
// the cat shrine (16.8): gate pad in the onsen, the offering pad in front of the hall; ten levels (all fees +1 % each)
const SHRINE_GATE_PAD = [11, 4], OFFER_PAD = [5, 2];
const OFFER_B = [[10000, '小祠落成'], [20000, '红鸟居'], [35000, '石灯笼'], [50000, '一对狛犬'], [70000, '朱漆本殿'], [90000, '樱花开了'], [120000, '千本鸟居'], [160000, '金铃'], [220000, '金屋顶'], [300000, '巨大金猫像']];
const SHRINE_FEE = .01;
// the festival plaza (16.9): gate pad in the front yard; four stalls on the north edge of the lower garden (a chain, one
// pad at a time, each under its stall's left tile); the fireworks pad on the lawn
const PLAZA_GATE_PAD = [23, 32], FW_PAD = [32, 33];
const STALLS_B = [['st_goldfish', '金鱼', 8000, 'goldfish', 27, '金鱼捞屋台'], ['st_tako', '章鱼', 10000, 'takoyaki', 30, '章鱼烧屋台'], ['st_ice', '刨冰', 10000, 'ice', 33, '刨冰屋台'], ['st_shoot', '射的', 15000, 'shoot', 36, '射的屋台']];
PILE_AT.plaza = [31, 32];   // stall money (the bench at (30-31,34) sits where 16.9 put it: 18.2)
// fireworks: 5,000 + 500 a show (8,000 at most), 8 min cool-down; a 45 s show: fees x1.3, guests x1.5, hearts +10
const FW_PRICE = 5000, FW_STEP = 500, FW_MAX = 8000, FW_COOL = 480, FW_T = 45, FW_FEE = 1.3, FW_SPAWN = 1.5, FW_HEARTS = 10;
const FW_FRAMES = 6, FW_FPS = 6, FW_ALPHA = .6;   // a burst: fireworkArt(k, 0..5) 32 x 32, one second, never brighter than .6
const YATAI_P = .5, YATAI_T = 1;   // a festival guest buys at a stall on the way home: odds, seconds standing there
const fwPrice = () => Math.min(FW_MAX, FW_PRICE + FW_STEP * ((S.fw && S.fw.n) | 0));
// rare guests (16.7): due 2-5 min after their piece is bought, then about every 20 min; at most one every RARE_GAP s
// (a first visit excepted); they come in the VIP's place (one guest of honour at a time), so there is no extra work
const RARE_FIRST = [120, 300], RARE_AGAIN = [900, 1500], RARE_GAP = 360, RARE_STAY_T = 3, RARE_SHOW_R = 36, RARE_ADMIRE_T = 1.5;

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
  UNIFORMS_B.forEach(([id, name, price, h, card]) => U(id, name, price, [], h, 'uniform', 'uniform', card, { uniform: id.slice(2) }));
  U('p_fox', '小狐', 60000, [], 20, 'pet', 'pet', '小狐跟着你', { pet: 'fox' });
  U('p_tanuki', '小狸', 90000, [], 30, 'pet', 'pet', '会变灯笼哦', { pet: 'tanuki' });
  U('p_crane', '白鹤', 150000, [], 40, 'pet', 'pet', '白鹤跟着你', { pet: 'crane' });
  GOLD_B.forEach(([id, name, base, full]) => U(id, name, 20000, [], 10, 'decor', 'gold:' + base, full + '·组合加价', { goldOf: base, ok: () => comboFoundWith(base) }));
}
// the fireworks' price follows the shows so far (padNeed / the pad / the card read u.price)
Object.defineProperty(UNLOCKS_V21B.find(u => u.id === 'fw'), 'price', { get: fwPrice, enumerable: true });
const GZ_IDS = GARDEN_B.map(g => g[0]);

// ---- rare guests (16.7): look (robe / hat / acc combinations, 16.14), wishes, the keepsake it leaves, its arrival line
// (E11), the condition it waits for (season 0-3 | 'night'). `kits`: the three kitten brothers (kittenSprite x 3).
const RARES = [
  { id: 'r_zen', name: '禅师', piece: 'gd_zen', fur: 'black', robe: '#e08a2a', wishes: ['tea', 'stay', 'photo'], keep: 'beads', keepName: '念珠', line: '心静了' },
  { id: 'r_fisher', name: '钓鱼爷爷', piece: 'gd_mill', fur: 'tabby', robe: '#4a6a5a', hat: 'straw', acc: 'rod', wishes: ['rice', 'stay', 'photo'], keep: 'gyotaku', keepName: '鱼拓', line: '钓到大鱼啦' },
  { id: 'r_boy', name: '夏日少年', piece: 'gd_chime', fur: 'cream', outfit: 'guest', shirt: '#6ac8e8', hat: 'straw', wishes: ['milk', 'bath', 'photo'], keep: 'chime', keepName: '小风铃', line: '冰牛奶！', when: 1 },
  { id: 'r_yuki', name: '雪女猫', piece: 'gd_lantern', fur: 'white', robe: '#a8d8f0', wishes: ['milk', 'bath', 'photo'], keep: 'snowball', keepName: '雪球', line: '好暖和…', when: 3 },
  { id: 'r_kits', name: '小猫三兄弟', piece: 'gd_tower', fur: 'orange', kits: ['orange', 'calico', 'gray'], wishes: ['show', 'milk', 'photo'], keep: 'teaser', keepName: '逗猫棒', line: '爬到最高！' },
  { id: 'r_painter', name: '画家猫', piece: 'gd_wisteria', fur: 'gray', robe: '#5a6ab0', hat: 'beret', acc: 'palette', wishes: ['show', 'tea', 'photo'], keep: 'painting', keepName: '风景画', line: '得画下来', when: 0 },
  { id: 'r_bride', name: '狐新娘', piece: 'gd_torii', fur: 'white', robe: '#f8f4ec', hat: 'foxmask', wishes: ['kaiseki', 'bath', 'photo'], keep: 'foxmask', keepName: '狐面', line: '今夜出嫁', when: 'night' },
  { id: 'r_master', name: '茶道宗师', piece: 'gd_teahouse', fur: 'gray', outfit: 'haori', wishes: ['tea', 'tea', 'photo'], keep: 'chawan', keepName: '名茶碗', line: '一期一会' },
];
const RARE = NUL(); RARES.forEach((r, i) => { r.rare = true; r.lineId = 'E11' + 'abcdefgh'[i]; RARE[r.id] = r; });
const RARE_LOOK = NUL(); RARES.forEach(r => { RARE_LOOK[r.id] = { fur: r.fur, outfit: r.outfit || 'robe', robe: r.robe || null, shirt: r.shirt || null, hat: r.hat || null, acc: r.acc || null }; });

// ---- props (2.4 / pathfinding.js PROPS): the shrine's parts by level, the garden pieces, the stalls, the plaza's
// lantern string. need: an unlock id or () => bool; prev: the unlock whose info card previews it (drawPreviewB).
const NO_ART = mk(1, 1);
const PROPS_V21B = [
  // the shrine (16.8): the hall grows with the levels; the torii's two posts block, you walk under its beam
  { k: 'hokora', at: [4, 1], fw: 3, need: 'shrine', uid: 'shrine:hall', img: () => hokoraArt(shrineLv()) },
  { k: 'torii', at: [4, 3], fw: 3, block: false, need: 'of2', img: () => toriiArt() },
  { k: 'post', at: [4, 3], need: 'of2', img: () => NO_ART }, { k: 'post', at: [6, 3], need: 'of2', img: () => NO_ART },
  { k: 'slantern', at: [2, 2], need: 'of3', img: () => shrineLanternArt(), light: [14, 2, 'lamp'] },
  { k: 'slantern', at: [8, 2], need: 'of3', img: () => shrineLanternArt(), light: [14, 2, 'lamp'] },
  { k: 'komainu', at: [3, 2], need: 'of4', img: () => komainuArt('l') }, { k: 'komainu', at: [7, 2], need: 'of4', img: () => komainuArt('r') },
  { k: 'tree', at: [1, 3], need: 'of6', block: false, img: () => treeArt('sakura', seasonB(), 1) },
  { k: 'tree', at: [8, 5], need: 'of6', block: false, img: () => flipOf(treeArt('sakura', seasonB(), 2)) },
  { k: 'senbon', at: [6, 4], need: 'of7', block: false, img: () => senbonArt() }, { k: 'senbon', at: [7, 4], need: 'of7', block: false, img: () => senbonArt() },
  { k: 'senbon', at: [8, 4], need: 'of7', block: false, img: () => senbonArt() }, { k: 'senbon', at: [9, 4], need: 'of7', block: false, img: () => senbonArt() },
  { k: 'glow', at: [5, 1], need: 'of10', block: false, ground: true, img: () => NO_ART, light: [28, -6, 'lamp'] },   // the gold cat glows at night
  // the garden pieces (16.7), each on its own ground
  ...GARDEN_B.map(([id, , , at]) => ({ k: 'gz', at, need: id, img: () => gardenDecorArt(id, Math.floor(T * 1.5) & 1), light: id === 'gd_lantern' ? [18, 0, 'lamp'] : undefined })),
  // the plaza (16.9): stalls under their cloth, open at a festival / a fireworks show; a lantern string along the hedge
  ...STALLS_B.map(([id, , , kind, x]) => ({ k: 'stall', at: [x, 30], fw: 2, need: id, img: () => stallArt(kind, stallsOpen(), Math.floor(T * 2) & 1) })),
  { k: 'chochin', at: [26, 29], fw: 13, need: 'plaza', ground: true, block: false, img: () => chochinRow(13) },
  ...[27, 31, 35].map(x => ({ k: 'chochinLamp', at: [x, 29], need: 'plaza', ground: true, block: false, img: () => NO_ART, light: [10, 10, 'lamp'] })),
];
