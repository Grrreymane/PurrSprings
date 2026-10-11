// ============================================================ v2.1 data, core A (SPEC_v2 16.1-16.5, 16.12, 16.13)
// The four seasons, the seasonal decor + combos, the festivals, the reporter / TV crew, the yearly award and the cat
// mom. Loaded before tables.js, which spreads UNLOCKS_V21A into UNLOCKS and COMBOS_V21A into COMBOS (so DECOR_IDS,
// UNLOCK, COMBO and the pads see them like any other row). Only constants.js / map.js exist at this point: no UN(),
// STARS or DAWN_AT here - the few numbers that depend on them are written out (and checked in tests/sys_seasons.js).
// The systems are in src/systems/seasons.js, festival.js, press.js, yearly.js, mom.js.

// ---- 16.1 the calendar: a season = 3 days (18 min), a year = 4 seasons (72 min). Computed from S.day, never saved.
const SEASON_DAYS = 3, YEAR_DAYS = 12;
// name: the banner ("夏天来了"); col: the banner's rim; fest: the festival on its 2nd day (16.2)
const SEASONS = [
  { id: 'spring', name: '春天', col: '#f0a0c0', fest: '花见祭' },
  { id: 'summer', name: '夏天', col: '#5ab868', fest: '烟花大会' },
  { id: 'autumn', name: '秋天', col: '#e07a3a', fest: '月见祭' },
  { id: 'winter', name: '冬天', col: '#8ab8e8', fest: '新年初诣' },
];
// particles on screen at most (slow, never blinking): petals / fireflies (summer nights, garden) / leaves / snow
const SEASON_FX = [12, 8, 10, 20];
// the seasonal fees (16.1; PLAN_v2.1: summer milk machine x1.5 instead of the milk calls, which the tea runner brings)
const SEASON_ROOM = [{ room: 'c1', k: 1.3 }, { room: 'c2', k: 1.3 }, null, null];   // 花见亭 in spring, 萤见亭 in summer
const SUMMER_MILK = 1.5, WINTER_BATH = 1.2;
const SEASON_COMBO = 2.0;   // a seasonal combo room in its own season: room fee x2.0 instead of a combo's x1.6

// ---- 16.1 seasonal decor: two pieces a season, on sale (the shop's decor pads) from the end of that season's first
// festival on (S.fests[s] > 0), then always. `when` is read by padEligible(); festHeld() is in festival.js.
const SD_ROW = (id, name, price, season) => ({ id, name, price, req: ['shop'], hearts: 5, pad: 'decor', icon: 'decor', card: '春夏秋冬'[season] + '季组合加倍',
  decor: true, season, when: () => festHeld(season) });
const UNLOCKS_V21A = [
  SD_ROW('d_sakura', '樱枝', 1200, 0), SD_ROW('d_lantern', '灯笼', 1400, 0),
  SD_ROW('d_windbell', '风铃', 1200, 1), SD_ROW('d_fan', '团扇', 1400, 1),
  SD_ROW('d_momiji', '红叶', 1400, 2), SD_ROW('d_dango', '团子', 1600, 2),
  SD_ROW('d_kotatsu', '被炉', 2000, 3), SD_ROW('d_mikan', '橘子', 1400, 3),
];
// their combos: the four seasonal ones are pointed at by the arrow (hint) and pay SEASON_COMBO in their season; the two
// hidden ones are found by trying. emb = the noren crest (the objects art's emblem ids; an unknown one leaves the cloth plain)
const COMBOS_V21A = [
  { id: 'c_yozakura', a: 'd_sakura', b: 'd_lantern', col: '#f0a0c0', emb: 'yozakura', plate: '樱', name: '夜樱', hint: true, season: 0 },
  { id: 'c_ryo', a: 'd_windbell', b: 'd_fan', col: '#6ac8e8', emb: 'suzumi', plate: '凉', name: '夏日清凉', hint: true, season: 1 },
  { id: 'c_tsuki', a: 'd_momiji', b: 'd_dango', col: '#e07a3a', emb: 'tsukimi', plate: '月', name: '赏枫赏月', hint: true, season: 2 },
  { id: 'c_kotatsu', a: 'd_kotatsu', b: 'd_mikan', col: '#d84a3a', emb: 'kotatsu', plate: '暖', name: '冬日被炉', hint: true, season: 3 },
  { id: 's_dream', a: 'd_kotatsu', b: 'd_tank', col: '#4ab8a8', emb: 'yume', plate: '梦', name: '猫的梦想', hint: false },
  { id: 's_newyear', a: 'd_daruma', b: 'd_mikan', col: '#e0603a', emb: 'shinnen', plate: '春', name: '新年快乐', hint: false },
];

// ---- 16.2 festivals: from star 3, on the 2nd day of every season at dusk (clock .62) for 72 s
const FEST_AT = .62, FEST_T = 72, FEST_STAR = 3;
const FEST_SPAWN = 1.3, FEST_PAT = 20;            // guests come 1.3x as often; their patience in line +20 s
const FEST_LANTERN = 1.4;                         // lanterns to light = ceil(1.4 x open guest rooms) (+ festTargetExtra())
const FEST_HEARTS = 40, FEST_RED = 30;            // all lit: hearts +40, a medal, a red packet round(30 x room fee x Q) in the cash box
const FIREWORK_MAX = 2, FIREWORK_R = 16, FIREWORK_A = .6;   // summer: <= 2 new bursts a second, radius <= 16, alpha .6, no white
const FIREWORK_COLS = ['#ff7a9a', '#ffb43a', '#7ad0ff', '#a6e070', '#c890ff', '#ffd23f'];

// ---- 16.4 the reporter / the TV crew: from star 3, on the 1st day of every season 90 s after sunrise (clock .10 + 90 / 360)
const PRESS_AT = .35, PRESS_END = .70, PRESS_STAR = 3, PRESS_TV_STAR = 4;   // TV (star 4+) in autumn and winter
const PRESS_DESK_T = 10, PRESS_TOWEL_T = 5;       // checks: checked in within 10 s at the front; a towel within 5 s at the basket
const PRESS_HEARTS = 15, PRESS_TV_HEARTS = 30;    // hearts = stars x 15 (TV x 30)
const POP_T = 90, POP_TV_T = 120, POP_K = 1.3;    // "popular": room fees and tips x1.3, every check-in hearts +1
// (the looks are the character art's LOOKS_V21: beret + camera / mic / the TV camera; mom in her own outfit with a bundle)
const PRESS_LOOK = { fur: 'tabby', outfit: 'guest', shirt: '#e0b050', hat: 'beret', acc: 'camera' };
const TV_LOOK = { fur: 'white', outfit: 'guest', shirt: '#e8486e', acc: 'mic' };
const CAMERA_LOOK = { fur: 'black', outfit: 'guest', shirt: '#5e6e80', acc: 'tvcam' };

// ---- 16.3 the yearly award: before sunrise ending the year's last day (clock .05 of day 12, 24 ...), by this year's hearts.
// The thresholds (SPEC 2,500 / 1,500 / 800 / 400) are set from the bots (SPEC_v2 18.2): year 1 brings eager ~4,850,
// casual ~4,500, novice 2,900-3,600 hearts, eager's 2nd year ~5,500 -> eager / casual silver, novice 人气奖, gold from year 2
const YEAR_AT = .05;
const AWARDS = [
  { k: 'gold', h: 5000, prize: 30000, name: '金奖' }, { k: 'silver', h: 4200, prize: 15000, name: '银奖' },
  { k: 'bronze', h: 3700, prize: 8000, name: '铜奖' }, { k: 'pop', h: 2000, prize: 4000, name: '人气奖' },
  { k: 'effort', h: 0, prize: 2000, name: '努力奖' },
];
const CARD_CLOSE_T = .8;   // a paused card (year report, press result, family photo) closes on a tap after 0.8 s

// ---- 16.5 the cat mom: from star 5, once a year on the 3rd day of spring (from clock .30, when no VIP is in)
const MOM_AT = .30, MOM_STAR = 5;
const MOM_DEF = { id: 'mom', name: '猫妈妈', fur: 'orange', robe: '#e07a5a', look: { fur: 'orange', outfit: 'mom', acc: 'bundle' }, wishes: ['tea', 'bath', 'photo'] };

// ---- 16.12 lines (registered into LINES by seasons.js; E11 is core B's): [id, who, text, odds, event]
const LINES_V21A = [
  ['E01', 'g', '樱花开了', .1], ['E02', 'g', '夏天要冰奶', .1], ['E03', 'g', '下雪泡汤！', .2], ['E04', 'g', '月亮好圆喵', .2],
  ['E05', 'g', '烟花好美', .3], ['E06', 'g', '祭典来啦！', .3], ['E07', 'g', '我是记者喵', 1, 1], ['E08', 'g', '直播开始！', 1, 1],
  ['E09', 'g', n => n <= 2 ? '还需努力' : n === 3 ? '还不错' : n === 4 ? '值得推荐！' : '完美旅馆！', 1, 1],
  ['E10', 'v', k => ({ grown: '又长大了呢', ten: '十年了呀', go: '妈妈为你骄傲' })[k] || '来看看你喵', 1, 1],
  ['E12', 'o', '本季新品！', 1, 1],
];
