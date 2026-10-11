// ---- unlocks (3.4). pad: [tx, ty] | 'decor' (the two shop decor pads) | 'hat' / 'pet' (one booth each) - see padsUpdate().
// gate: opens an area (its pad is always shown); star: +1 star; staff: hires someone; need5: from star 5 on; vip: hosted that VIP first.
// card: the one line on the info card and the "new!" banner. at: the tile that sparkles (default: the pad).
const UN = (id, name, price, req, hearts, pad, icon, card, o) => Object.assign({ id, name, price, req, hearts, pad, icon, card }, o || {});
const UNLOCKS = [
  // star 1
  UN('room2', '客房', 25, [], 3, [18, 20], 'room', '开「竹」房'),
  UN('room3', '客房', 35, ['room2'], 3, [16, 16], 'room', '开「梅」房'),
  UN('shoes1', '跑鞋', 35, ['room2'], 1, [19, 28], 'shoes', '走路更快'),
  UN('onsen', '温泉', 50, ['room3'], 20, [17, 7], 'onsen', '客人泡汤付钱', { gate: true, star: true, at: [17, 3] }),
  // star 2 onsen + shop
  UN('recep', '前台', 20, ['onsen'], 2, [19, 25], 'recep', '小樱来接待', { staff: true }),
  UN('tea', '茶台', 50, ['recep'], 2, [11, 24], 'tea', '客人来喝茶', { at: [11, 24] }),   // pad where the urn goes (stage M: at (12,24) the desk hid it)
  UN('teaboy', '茶房', 80, ['tea'], 2, [12, 23], 'waiter', '阿麦来送茶', { staff: true }),   // v2.0.1 G3: the room calls go to staff
  UN('basket1', '竹篮', 70, ['onsen'], 1, [20, 28], 'basket', '多顶3条毛巾'),
  UN('maid1', '仲居', 65, ['recep'], 2, [19, 25], 'maid', '雪球来打扫', { staff: true }),
  UN('net1', '鱼网', 70, ['maid1'], 1, [21, 28], 'net', '捡鱼干更远'),
  UN('shop', '杂货', 100, ['recep'], 10, [11, 31], 'shop', '杂货铺开张', { gate: true, at: [4, 31] }),
  UN('d_scroll', '挂轴', 60, ['shop'], 5, 'decor', 'decor', '摆进客房加价', { decor: true }),
  UN('d_ikebana', '生花', 80, ['shop'], 5, 'decor', 'decor', '摆进客房加价', { decor: true }),
  UN('room4', '客房', 140, ['onsen'], 3, [18, 16], 'room', '开「樱」房'),
  UN('d_bonsai', '盆栽', 150, ['d_scroll', 'd_ikebana'], 5, 'decor', 'decor', '摆进客房加价', { decor: true }),
  UN('milk', '牛奶', 160, ['onsen'], 3, [20, 5], 'milk', '泡完买牛奶', { at: [22, 4] }),
  UN('d_screen', '屏风', 180, ['d_scroll', 'd_ikebana'], 5, 'decor', 'decor', '摆进客房加价', { decor: true }),
  UN('room5', '客房', 210, ['room4'], 3, [16, 12], 'room', '开「菊」房'),
  UN('shoes2', '跑鞋', 220, ['shoes1', 'room5'], 1, [19, 28], 'shoes', '走路更快'),
  UN('room6', '客房', 250, ['room5'], 3, [18, 12], 'room', '开「枫」房'),
  UN('dining', '食堂', 420, ['room5', 'maid1'], 20, [11, 26], 'dining', '客人来吃早饭', { gate: true, star: true, at: [5, 23] }),
  // star 3 dining + west wing
  UN('tray1', '托盘', 180, ['dining'], 1, [6, 21], 'tray', '多端一份'),
  UN('waiter1', '配膳', 200, ['dining'], 2, [9, 22], 'waiter', '阿福来上菜', { staff: true }),
  UN('d_tank', '鱼缸', 260, ['dining'], 5, 'decor', 'decor', '摆进客房加价', { decor: true }),
  UN('porter', '搬运', 300, ['maid1', 'milk', 'dining'], 2, [20, 25], 'porter', '阿灰来送毛巾', { staff: true }),
  UN('d_tower', '爬架', 300, ['dining'], 5, 'decor', 'decor', '摆进客房加价', { decor: true }),
  UN('table3', '餐桌', 300, ['waiter1'], 2, [3, 26], 'table', '多两个座位'),
  UN('w1', '西馆', 330, ['dining'], 4, [8, 19], 'west', '西馆「茶」房'),
  UN('chef', '厨师', 260, ['waiter1'], 2, [6, 20], 'chef', '黑糖来做饭', { staff: true }),
  UN('room7', '客房', 400, ['room6'], 3, [16, 8], 'room', '近汤房老人爱'),
  UN('w2', '客房', 420, ['w1'], 4, [7, 12], 'room', '静房爱点夜宵'),
  UN('maid2', '仲居', 450, ['room7', 'maid1'], 2, [19, 25], 'maid', '白玉来打扫', { staff: true }),
  UN('room8', '客房', 460, ['room7'], 3, [18, 8], 'room', '近汤房老人爱'),
  UN('shoes3', '跑鞋', 420, ['shoes2', 'room8'], 1, [19, 28], 'shoes', '走路更快'),
  UN('clerk', '账房', 260, ['porter'], 2, [20, 25], 'clerk', '老墨来收鱼干', { staff: true }),   // v2.0.1: 320 -> 260 (C1: the pile round before him had no calls to share the time with)
  UN('net2', '鱼网', 280, ['net1', 'clerk'], 1, [21, 28], 'net', '捡鱼干更远'),
  UN('w3', '客房', 520, ['w2'], 4, [7, 8], 'room', '静房爱点夜宵'),
  UN('bigbath', '浴池', 560, ['room8'], 3, [13, 5], 'bath', '多2个泡汤位', { at: [17, 3] }),
  UN('garden', '庭园', 900, ['w1', 'room7'], 20, [22, 26], 'garden', '贵宾会来住', { gate: true, star: true, at: [29, 16] }),
  // star 4 garden
  UN('g_shishi', '惊鹿', 250, ['garden'], 4, [27, 27], 'shishi', '庭园更风雅', { at: [26, 16] }),
  UN('d_maneki', '招财', 300, ['garden'], 5, 'decor', 'decor', '摆进客房加价', { decor: true }),
  UN('g_sakura', '樱树', 320, ['g_shishi'], 4, [27, 27], 'sakura', '庭园更风雅', { at: [27, 24] }),
  UN('d_daruma', '达摩', 340, ['garden'], 5, 'decor', 'decor', '摆进客房加价', { decor: true }),
  UN('g_maple', '枫树', 360, ['g_sakura'], 4, [27, 27], 'maple', '庭园更风雅', { at: [37, 18] }),
  UN('table4', '餐桌', 360, ['table3', 'chef', 'garden'], 2, [7, 26], 'table', '多两个座位'),
  UN('koi', '锦鲤', 600, ['garden'], 4, [31, 16], 'koi', '池里来三条鱼', { at: [28, 16] }),
  UN('waiter2', '配膳', 600, ['waiter1', 'table4'], 2, [9, 22], 'waiter', '咪咪来上菜', { staff: true }),
  UN('net3', '鱼网', 600, ['net2', 'garden'], 1, [21, 28], 'net', '捡鱼干更远'),
  UN('c2', '别院', 700, ['garden'], 6, [32, 21], 'cottage', '一家人爱住'),
  UN('maid3', '仲居', 600, ['maid2', 'c2'], 2, [19, 25], 'maid', '奶糖来打扫', { staff: true }),
  UN('shoes4', '跑鞋', 600, ['shoes3', 'c2'], 1, [19, 28], 'shoes', '走路更快'),
  UN('suiteB', '套房', 1000, ['garden'], 8, [32, 12], 'suite', '贵宾来得更勤'),
  UN('roten', '星见', 2800, ['c2', 'bigbath'], 25, [23, 4], 'roten', '看星星泡汤', { gate: true, star: true, at: [32, 3] }),
  // star 5 and after (v2.0)
  UN('maid4', '仲居', 800, ['maid3', 'suiteB'], 2, [19, 25], 'maid', '豆豆来打扫', { staff: true }),
  UN('h_straw', '草帽', 4000, [], 3, 'hat', 'hat', '戴上：草帽', { need5: true, hat: 'straw' }),
  UN('h_flower', '花簪', 12000, [], 6, 'hat', 'hat', '戴上：花簪', { need5: true, hat: 'flower' }),
  UN('h_beret', '贝雷', 18000, [], 10, 'hat', 'hat', '贵宾同款', { need5: true, hat: 'beret', vip: 'kawa' }),
  UN('p_duck', '小鸭', 24000, [], 10, 'pet', 'pet', '小鸭跟着你', { need5: true, pet: 'duck' }),
  UN('h_captain', '船长', 30000, [], 15, 'hat', 'hat', '贵宾同款', { need5: true, hat: 'captain', vip: 'captain' }),
  UN('h_shades', '墨镜', 40000, [], 25, 'hat', 'hat', '明星同款', { need5: true, hat: 'shades', vip: 'star' }),
  UN('h_fox', '狐面', 50000, [], 40, 'hat', 'hat', '戴上：狐面', { need5: true, hat: 'foxmask' }),
  UN('p_shiba', '柴犬', 55000, ['p_duck'], 40, 'pet', 'pet', '柴犬跟着你', { need5: true, pet: 'shiba' }),
  UN('h_crown', '皇冠', 90000, [], 50, 'hat', 'hat', '戴上：小皇冠', { need5: true, hat: 'crown' }),
  UN('h_gold', '金铃', 150000, [], 50, 'hat', 'hat', '走路带金光', { need5: true, hat: 'goldband' }),
  UN('statue', '金像', 1000000, ['shop'], 100, [13, 33], 'statue', '每位小费+1', { need5: true, at: [11, 33] }),   // + shop: SPEC_v2 10.2 (18.2)
  ...UNLOCKS_V21A,   // v2.1 core A (data/tables-v21a.js): the seasonal decor
];
const UNLOCK = NUL(); UNLOCKS.forEach(u => { UNLOCK[u.id] = u; });
UNLOCKS.forEach(u => {
  u.dyn = !Array.isArray(u.pad);                                          // decor / hat / pet: placed by padsUpdate()
  u.area = u.dyn ? 'shop' : (areaAt(u.pad[0], u.pad[1]) || {}).id || null; // a pad shows only once its area is open
  u.booth = !!(u.hat || u.pet) || u.id === 'statue';                      // shop booths + the statue: never the "cheapest pad"
});
// v2.0.1 G4: the later tray / basket levels (托盘 2, 竹篮 2) are gone - the staff carry those jobs by then. A save that
// bought them keeps what they did (trayCap / towelCap still read them); money poured into them is refunded on load.
const RETIRED = ['tray2', 'basket2'];
// per star: room fee, tip, bath, milk, breakfast (meal), souvenir, tea at the urn (v2.0.1 G3), seconds between guests (3.1)
const STARS = [null,
  { room: 12, tip: 5, bath: 6, milk: 4, meal: 0, souv: 0, tea: 0, gap: 7 },
  { room: 14, tip: 5, bath: 9, milk: 5, meal: 0, souv: 4, tea: 5, gap: 6 },
  { room: 16, tip: 6, bath: 10, milk: 6, meal: 10, souv: 6, tea: 6, gap: 5 },
  { room: 20, tip: 8, bath: 12, milk: 8, meal: 12, souv: 10, tea: 8, gap: 4.2 },
  { room: 25, tip: 10, bath: 15, milk: 10, meal: 15, souv: 12, tea: 10, gap: 3.6 },
];
// guest types (4.6): fee multipliers; spawn weights per star (regular / elder / couple / family)
const GUEST_TYPES = { regular: {}, elder: { bath: 1.5, milk: 1.5, speed: .8 }, couple: { room: 1.6, meal: 2 }, family: { room: 1.8, meal: 1.5 } };
const TYPE_W = [null, [100, 0, 0, 0], [85, 15, 0, 0], [65, 15, 20, 0], [50, 15, 20, 15], [45, 15, 20, 20]];
// decor combos (4.5); hint = the arrow may point at it (hidden ones are found by trying - or, after star 5, hinted from
// gold star HINT_GOLD[id] on: 18.2)
const COMBOS = [
  { id: 'c_ga', a: 'd_scroll', b: 'd_ikebana', col: '#8a5ac8', emb: 'ga', plate: '雅', name: '雅致和室', hint: true },
  { id: 'c_zen', a: 'd_bonsai', b: 'd_screen', col: '#5a9a5a', emb: 'zen', plate: '禅', name: '静心禅房', hint: true },
  { id: 'c_cat', a: 'd_tank', b: 'd_tower', col: '#f0a048', emb: 'cat', plate: '猫', name: '猫猫乐园', hint: true },
  { id: 'c_fuku', a: 'd_maneki', b: 'd_daruma', col: '#e0b030', emb: 'fuku', plate: '福', name: '好运连连', hint: true },
  { id: 's_fish', a: 'd_maneki', b: 'd_tank', col: '#d8b048', emb: 'fish', plate: '鱼', name: '招财进鱼', hint: false },
  { id: 's_tea', a: 'd_scroll', b: 'd_bonsai', col: '#4ab8a8', emb: 'tea2', plate: '茶', name: '茶禅一味', hint: false },
  ...COMBOS_V21A,    // v2.1 core A: the seasonal combos + two hidden ones
];
const COMBO = NUL(); COMBOS.forEach(c => { COMBO[c.id] = c; });
const HINT_GOLD = { s_fish: 3, s_tea: 4 };
// the six VIPs (4.4), in the order they first come
const VIPS = [
  { id: 'kawa', name: '猫川先生', fur: 'graytabby', robe: '#b88a5a', hat: 'beret', wishes: ['tea', 'bath', 'photo'], gift: 'book' },
  { id: 'ozeki', name: '大关', fur: 'cream', robe: '#4a6ab4', hat: 'topknot', wishes: ['kaiseki', 'bath', 'photo'], gift: 'hand' },
  { id: 'sakura', name: '樱小姐', fur: 'white', robe: '#f4a8be', hat: 'flower', wishes: ['tea', 'kaiseki', 'photo'], gift: 'pin' },
  { id: 'captain', name: '老船长', fur: 'black', robe: '#2a3a6a', hat: 'captain', wishes: ['bath', 'kaiseki', 'photo'], gift: 'ship' },
  { id: 'star', name: '喵星', fur: 'siamese', robe: '#c83a3a', hat: 'shades', wishes: ['photo', 'tea', 'photo'], gift: 'photo' },
  { id: 'granny', name: '茶婆婆', fur: 'calico', robe: '#6a4a8a', acc: 'cane', wishes: ['tea', 'tea', 'photo'], gift: 'bowl' },
];
const VIP = NUL(); VIPS.forEach(v => { VIP[v.id] = v; });
// rival inns (4.9): fixed heart thresholds; from star 5 the last five light the gold stars
const RIVALS = [
  { id: 'panda', name: '熊猫茶屋', h: 30 }, { id: 'penguin', name: '企鹅冰汤', h: 80 }, { id: 'otter', name: '水獭之家', h: 150 },
  { id: 'deer', name: '小鹿温泉', h: 250 }, { id: 'monkey', name: '猴子秘汤', h: 400 }, { id: 'rabbit', name: '兔兔温泉', h: 1100 },
  { id: 'tanuki', name: '狸猫汤屋', h: 2000 }, { id: 'bear', name: '熊熊山庄', h: 3000 }, { id: 'fox', name: '狐狸庵', h: 6000 },
  { id: null, name: '传说之汤', h: 10000 },
];
const SEEN_KEYS = ['call', 'decor', 'dine', 'vip', 'bath', 'kaiseki', 'photo', 'tryon'];
// day / night (4.10): [clock, tint, alpha, night]; linear in between
const DAY_LEN = 360;
const DAY_KEYS = [[0, '#2a3468', .42, 1], [.06, '#6a5a8a', .28, .6], [.10, '#ffd2a0', .14, 0], [.16, '#ffd2a0', 0, 0], [.55, '#ffb070', 0, 0],
  [.62, '#ffb070', .18, 0], [.68, '#c06a70', .26, .3], [.74, '#2a3468', .42, 1], [1, '#2a3468', .42, 1]];
// the tint colour is mixed too (no step half-way between two keys); memoised on the clock (called by fees, props, the light pass)
let DL_C = -1, DL_V = null;
function dayLight(c) {
  const memo = c === undefined; c = memo ? S.clock : c;
  if (memo && c === DL_C) return DL_V;
  let i = 0; while (i < DAY_KEYS.length - 2 && c >= DAY_KEYS[i + 1][0]) i++;
  const [c0, t0, a0, n0] = DAY_KEYS[i], [c1, t1, a1, n1] = DAY_KEYS[i + 1], k = clamp((c - c0) / Math.max(1e-6, c1 - c0), 0, 1);
  const v = { col: t0 === t1 ? t0 : mixHex(t0, t1, k), a: lerp(a0, a1, k), night: lerp(n0, n1, k) };
  if (memo) { DL_C = c; DL_V = v; }
  return v;
}
const DAWN_AT = .10, DUSK_AT = .68;      // sunrise rolls the day over (banner + yesterday's numbers); dusk rings the temple bell (4.10)
const LIGHT_MAX = 16, GLINT_MAX = 6;     // lamps drawn per frame (the nearest to the view centre), fish-pile glints
const GLOW_K = .4;                       // warm additive glow on top of the lamp's hole in the tint (stage M: see drawLighting)
// staff levels (4.7): experience 20 / 60 / 140 / 300 -> Lv2..Lv5; Lv3 silver trim, Lv5 gold trim on work clothes
const LV_XP = [0, 20, 60, 140, 300];
const TRIM_OUTFITS = new Set(['kimono', 'apron', 'porter', 'chef', 'waiter', 'clerk']);
// hearts (4.9 / 4.13): overtakes within 10 s share one banner; the 100th / 500th / 1000th / 5000th guest is a small event
const RANK_MERGE = 10, MILESTONES = [100, 500, 1000, 5000];
// the boutique (4.11): try-on within 2 tiles of a booth; the mirror / the pet cushion switch every 1 s; a pet walks 14 px behind
const TRYON_R = 2 * 16, MIRROR_T = 1, PET_GAP = 14, BOOTH_HINT_T = 60;
const PATIENCE = 45, PATIENCE_EARLY = 70, BATH_WAIT = 20, CHECKIN_T = .7, CLEAN_T = 1.5, MAID_CLEAN_T = 2.5, BATH_T = 6, SLEEP_T = 10, MILK_T = 1;
const POUR_T = .6;   // a pad fills in this long once you stand on it (stage 4: was 1.2 s; fewer half-poured pads left behind)
const P_SPEED = 56, G_SPEED = 34, STAFF_SPEED = 40, BASKET_MAX = 10, PAD_DELAY = .4, GUEST_MAX = 40;
// fish-pile pickup radius by net level (4.8). v2.0.1 G5: about 1.5 tiles more a level (was 10 / 18 / 28 / 40) and every
// pile inside it - small ones and the cash box too - flies to the innkeeper (the NEAR_MIN gate is gone)
const NET_R = [10, 34, 58, 82];
// tray + calls + dining (4.1-4.3, 11)
const TRAY_KINDS = ['tea', 'milk', 'rice', 'kaiseki'];
const DELIVER_SLACK = 10;   // rule 3 (stage 4): the nearest first while the most urgent one has this much slack
const DELIVER_R = 14, DELIVER_T = .2, CALL_GAP = 6, SEAT_WAIT = 30, EAT_T = 4, CHEF_T = 2.5, PASS_MAX = 6, WAITER_CARRY = 2;
const STOVE_T = 1, KAISEKI_T = 3, BROWSE_T = 2, BROWSE_P = .3, FOLLOW_GAP = 9;
// a call when a guest lies down (1 s in): by the room's trait (2.6). v2.0.1 G3: bathers no longer call for milk - they
// buy it at the machine themselves; a call still open when the guest gets its thing by itself (the urn, the machine,
// breakfast) just ends. Calls are a tip for whoever brings them: the innkeeper (optional, never pointed at) until the
// tea runner (茶房) is hired, then only the runner.
const CALL_ROLL = { std: ['tea', .3], near: ['milk', .35], quiet: ['rice', .35], cottage: ['tea', .4] };
// v2.0.1 G3: guests serve themselves tea at the lobby urn after checking out (like milk after the bath): TEA_P of them
// stop at TEA_SPOT for TEA_T s and pay into the tea pile by the urn (PILE_AT.tea)
const TEA_P = .5, TEA_T = 1, TEA_SPOT = [12, 24];
PILE_AT.tea = [11, 25];
// the tea runner: up to 2 calls of the same thing a trip, 0.3 s a portion; its tip = TEA_TIP_K x the innkeeper's (no
// fast bonus), into the cash box - a call is passive income once it runs them all
const TEABOY_CARRY = 2, TEABOY_PICK_T = .3, TEA_TIP_K = .5;
// favourite rooms (4.6): regulars take the plainest free room instead (roomRank)
const PREF = { elder: rm => rm.trait === 'near', couple: rm => !!roomCombo(rm), family: rm => !!rm.cottage };
const TYPE_IDS = ['regular', 'elder', 'couple', 'family'];
// decor (4.5): the 8 pieces in table order; every guest room (not the suites) has two slots A / B. Standing still on a
// slot for DECOR_T0 swaps in the next piece, then every DECOR_T while you stay (11).
const DECOR_IDS = UNLOCKS.filter(u => u.decor).map(u => u.id);
const DECOR_T0 = .8, DECOR_T = 1.2;
const DSLOTS = [];   // { rm, k: 'A' | 'B', at: [tx, ty], key: 'room1:A' }
GUEST_ROOMS.forEach(rm => { if (rm.slotA) for (const k of ['A', 'B']) DSLOTS.push({ rm, k, at: k === 'A' ? rm.slotA : rm.slotB, key: rm.id + ':' + k }); });
const DSLOT_AT = NUL(); DSLOTS.forEach(s => { DSLOT_AT[s.at[1] * MW + s.at[0]] = s; });
// VIPs (4.4, 11): the first one 20 s after garden, then 210 +- 30 s after the last one left (star 5: 180; suite B x0.7)
const VIP_FIRST = 20, VIP_GAP = 210, VIP_GAP5 = 180, VIP_JIT = 30, VIP_RELOAD = 60;
const VIP_GREET_T = .5, VIP_PHOTO_T = 1.2, VIP_TAP_T = 1.5, VIP_SOAK_T = 5, VIP_NEAR = 14;
// v2.0.1 G1: a wish never runs out (no more "改日再访" after 120 s); the faster, the bigger the tip. A wish done within
// VIP_WISH_FAST s of showing pays in full, then less down to 60 % at VIP_WISH_FAST + VIP_WISH_SLOW s. The arrow leads the
// first VIP ever all the way (greet, suite, every wish); later ones go ahead of the pads once a wish has waited VIP_URGENT s.
const VIP_URGENT = 60, VIP_WISH_FAST = 30, VIP_WISH_SLOW = 90, VIP_CARD_T = 240;
const VIP_SIP_T = { tea: 6, kaiseki: 8 };   // stage 4: the VIP drinks / eats this long before its next wish shows (like the soak); v2.0.1: 4 / 6 -> 6 / 8 (time for its tick)
const VIP_FOLLOW = 16, VIP_HALT = 96, VIP_RESUME = 48, VIP_NOGREET = 60, VIP_IDLE = 120, VIP_LEAD_MAX = 120, VIP_NOSUITE = 240;
// the clerk (4.8): claims piles >= 2 x the tip lying more than 48 px from the innkeeper and carries them to the cash box
const CLERK_MIN = 2, CLERK_KEEP = 48, CLERK_BAG_T = .4, CLERK_DUMP_T = .3, CHEST_SPOT = [16, 24];
