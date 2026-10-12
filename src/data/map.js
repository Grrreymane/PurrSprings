// ============================================================ MAP & DATA (SPEC_v2 section 2)
// 40 x 39 tiles (v2.4: 3 more rows for a bigger shop / front yard / plaza; was 36). The v1 inn sits in cols 10-24: every v1 coordinate is x + 10, y unchanged.
const MAP = [
  'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',   // r0
  'bfffzzzfffbfrrrrrrrrrrrfbfrrrrrrrrrrrrrb',   // r1  shrine (v2.1) | onsen | star-view bath (roten)
  'bfzzzpzzzfbfr~~~~~~~~~rfbfr~~~~~~~~~~~rb',
  'bfzzzpzzzfbfr~~~~~~~~~rfbfr~~~~~~~~~~~rb',   // r3  bathers sit in this row of water
  'bfzzzpppppDsssssssssssssDssssssssssssssb',   // r4  (10,4) shrine gate, (24,4) roten gate
  'bffzzpppppDsssssssssssssDxxxxxxxxxxxxxxb',   // r5  roten deck r5-r7; v2.4: (10,5) / (24,5) the gates are 2 tall, (8-9,5) sand from the west wing gate; v2.5: the approach r4-5 is 2 wide (5-9)
  'b#######DD#######DD######xxxxxxxxxxxxxxb',   // r6  (17-18,6) onsen door; v2.4 (8-9,6) west wing -> shrine gate
  'b#tttt#...#tttt#...#tttt#xxxxxxxxxxxxxxb',   // r7  W3 | R7 / R8
  'b#ttttD...#ttttD...Dtttt#ffffffppffffffb',   // r8  hedge gap (31-32,8): garden <-> roten (v2.5: the garden's one 2-wide walk, cols 31-32)
  'b#tttt#...#tttt#...#tttt#ggggggppggggggb',
  'b######...######...############pp######b',   // r10
  'b#tttt#...#tttt#...#tttt##tttt#pp#tttt#b',   // r11 W2 | R5 / R6 | suites C3 / C4 (v2.5: C3 / C1 at 25-30, doors on their east wall)
  'b#ttttD...#ttttD...Dtttt##ttttDppDtttt#b',
  'b#tttt#...#tttt#...#tttt##tttt#pp#tttt#b',
  'b######...######...############pp######b',   // r14
  'b#tttt#...#tttt#...#tttt#goooogppggggggb',   // r15 W1 | R3 / R4 | koi pond (26-29) + dry garden
  'b#ttttD...#ttttD...Dtttt#goooogppzzzzzzb',
  'b#tttt#...#tttt#...#tttt#goooogppzzzzzzb',
  'b#######DD######...######ggggggppggggggb',   // r18 (8-9,18) west wing door
  'b#kkkkmmmm#tttt#...#tttt#######pp######b',   // r19 kitchen + dining | R1 / R2
  'b#kkkkmmmm#ttttD...Dtttt##tttt#pp#tttt#b',   // r20 cottages C1 / C2
  'b#mmmmmmmm#tttt#...#tttt##ttttDppDtttt#b',
  'b#mmmmmmmm######...#######tttt#pp#tttt#b',
  'b#mmmmmmmm#lllllllllllll#######pp######b',   // r23 lobby (r23-r28)
  'b#mmmmmmmm#lllllllllllll#ggggggppggggggb',
  'b#mmmmmmmm#lllllllllllll#ggggggppggggggb',
  'b#mmmmmmmmDlllllllllllllDppppppppggggggb',   // r26 (10,26-27) dining door, (24,26-27) garden door (v2.4: 2 tall); v2.5: the garden row r26-27
  'b#mmmmmmmmDlllllllllllllDppppppppggggggb',
  'b#mmmmmmmm#lllllllllllll#ppggggggggggggb',
  'b#######DD######EEE######DDffffffffffffb',   // r29 (8-9,29) dining -> shop door (v2.4), (16-18,29) main entrance, (25-26,29) plaza gate (v2.1)
  'bqqqqqqqqqgggggpppppgggggppggfggfggfggfb',   // r30 shop (v2.4: r30-r37) | front garden | the lower garden (festival plaza in v2.1)
  'bqqqqqqqqqgggggpppppgggggppppppppppppffb',
  'bqqqqqqqqqgggggpppppgggggfpppppppppppffb',
  'bqqqqqqqqqgggggpppppgggggfgggggggggggggb',
  'bqqqqqqqqqgggggpppppgggggfgggggggggggggb',
  'bqqqqqqqqqgggggpppppgggggfgggggggggggggb',
  'bqqqqqqqqqgggggpppppgggggfgggggggggggggb',
  'bqqqqqqqqqgggggpppppgggggfffggfffffffffb',   // r37 (v2.4: the map grew 3 rows, MH 39)
  'bbbbbbbbbbbbbbbpppppbbbbbbbbbbbbbbbbbbbb',   // r38 guests come in from (17,39)
];
const WALK_CH = new Set(['s', 't', '.', 'l', 'E', 'g', 'p', 'k', 'm', 'z', 'x', 'q']);
const ch = (tx, ty) => (tx < 0 || ty < 0 || tx >= MW || ty >= MH) ? null : MAP[ty][tx];
const NUL = () => Object.create(null);                 // lookup tables without prototype keys ("constructor" ...)
const objOr = v => v && typeof v === 'object' ? v : {};
const tcx = t => t[0] * TILE + 8, tcy = t => t[1] * TILE + 8;   // tile centre in world px

// ---- areas (2.2). r = [x0, y0, x1, y1] inclusive; open = the unlock that opens it (null: open from the start).
// lock 'door': closed by its doors; 'block': the whole rect is BLOCK while locked. dim: darkened while locked.
// sign: where the star-n board stands while it is locked (n = the star it belongs to). scenery: what covers it in v2.0.
const AREAS = [
  { id: 'front',  r: [10, 30, 24, 37], open: null,     music: 'lobby',  amb: 'wind' },
  { id: 'lobby',  r: [11, 23, 23, 28], open: null,     music: 'lobby',  amb: null },
  { id: 'main',   r: [11, 7, 23, 22],  open: null,     music: 'lobby',  amb: null },
  { id: 'onsen',  r: [11, 1, 23, 5],   open: 'onsen',  lock: 'door',  dim: true, music: 'onsen',  amb: 'water' },
  { id: 'shop',   r: [1, 30, 9, 37],   open: 'shop',   lock: 'block', dim: true, music: 'lobby',  amb: null, sign: [10, 30], n: 2 },
  { id: 'dining', r: [2, 19, 9, 28],   open: 'dining', lock: 'door',  dim: true, music: 'dining', amb: 'fire', sign: [10, 26], n: 3 },
  { id: 'west',   r: [2, 7, 9, 17],    open: 'w1',     lock: 'door',  dim: true, music: 'lobby',  amb: null },
  { id: 'garden', r: [25, 9, 38, 28],  open: 'garden', lock: 'block', dim: true, music: 'garden', amb: 'garden', sign: [24, 26], n: 4 },
  { id: 'roten',  r: [25, 1, 38, 8],   open: 'roten',  lock: 'block', dim: true, music: 'onsen',  amb: 'falls', sign: [24, 4], n: 5 },
  { id: 'shrine', r: [1, 1, 9, 5],     open: 'shrine', lock: 'block', dim: false, music: 'garden', amb: null, scenery: 'bamboo', v21: true },   // v2.1 (16.8, star 5: gate pad (11,4))
  { id: 'plaza',  r: [25, 30, 38, 37], open: 'plaza',  lock: 'block', dim: false, music: 'lobby',  amb: null, v21: true },   // v2.1 (16.9, star 5: gate pad (23,32)); v2.0.1: the lower garden (A3)
];
const AREA = NUL(); AREAS.forEach((a, i) => { a.i = i; AREA[a.id] = a; });
const AREA_AT = new Int8Array(MW * MH).fill(-1);
AREAS.forEach((a, i) => { for (let y = a.r[1]; y <= a.r[3]; y++) for (let x = a.r[0]; x <= a.r[2]; x++) AREA_AT[y * MW + x] = i; });
const areaAt = (tx, ty) => { const i = (tx < 0 || ty < 0 || tx >= MW || ty >= MH) ? -1 : AREA_AT[ty * MW + tx]; return i < 0 ? null : AREAS[i]; };
const areaOpen = (a, s) => !a || !a.open || !!(s || S).unlocked[a.open];

// ---- the 15 rooms (2.5 / 2.6), nearest the lobby first in each wing. wing: mainL | mainR | west | cottage | suite.
// trait: std | near (by the onsen) | quiet (west wing) | cottage (2 futons) | suite (VIP only). open: the unlock that opens it.
const ROOM_DEF = [
  ['room1', '松', 'pine', '#3d6a3a', 'mainL', 'std', null],      ['room2', '竹', 'bamboo', '#6aa84a', 'mainR', 'std', 'room2'],
  ['room3', '梅', 'plum', '#c8463a', 'mainL', 'std', 'room3'],    ['room4', '樱', 'sakura', '#e890a8', 'mainR', 'std', 'room4'],
  ['room5', '菊', 'chrys', '#e0b030', 'mainL', 'std', 'room5'],   ['room6', '枫', 'maple', '#e0602a', 'mainR', 'std', 'room6'],
  ['room7', '桔', 'bush', '#a05aa8', 'mainL', 'near', 'room7'],   ['room8', '椿', 'camellia', '#b02a4a', 'mainR', 'near', 'room8'],
  ['w1', '茶', 'tea', '#7a8a3a', 'west', 'quiet', 'w1'],          ['w2', '藤', 'wisteria', '#8a7ad8', 'west', 'quiet', 'w2'],
  ['w3', '兰', 'orchid', '#d070c0', 'west', 'quiet', 'w3'],
  ['c1', '花见亭', 'hana', '#f0a8c0', 'cottage', 'cottage', 'garden'], ['c2', '萤见亭', 'firefly', '#2f5a3a', 'cottage', 'cottage', 'c2'],
  ['c3', '月见亭', 'moon', '#2f3a7a', 'suite', 'suite', 'garden'],     ['c4', '雪见亭', 'snow', '#a8c8e8', 'suite', 'suite', 'suiteB'],
];
function roomGeom([id, name, emb, col, wing, trait, open]) {
  const r = { id, name, emb, col, wing, trait, open, vip: wing === 'suite', cottage: wing === 'cottage', mult: wing === 'cottage' ? 1.5 : 1, cleanMul: wing === 'cottage' ? 1.5 : 1 };
  if (wing === 'cottage' || wing === 'suite') {
    // v2.5 (all walks 2 wide): the west column (c1 / c3, x 26-29) faces the middle walk through its east wall (a 'left'
    // room, mirrored: m), the east column (c2 / c4, x 34-37) through its west wall as before
    const west = id === 'c1' || id === 'c3', x0 = west ? 26 : 34, y0 = wing === 'cottage' ? 20 : 11, m = west ? (x => 2 * x0 + 3 - x) : (x => x);
    Object.assign(r, { x0, y0, left: west, andon: [m(x0), y0], table: [m(x0 + 1), y0], futon: [m(x0 + 2), y0], stand: [m(x0 + 1), y0 + 1], pile: [m(x0), y0 + 2], door: [west ? x0 + 4 : x0 - 1, y0 + 1], box: [x0, y0, x0 + 3, y0 + 2] });
    if (wing === 'cottage') Object.assign(r, { futonB: [m(x0 + 3), y0], slotA: [m(x0 + 3), y0 + 2], slotB: [m(x0 + 2), y0 + 2] });
    else Object.assign(r, { tub: [m(x0 + 3), y0 + 2], tap: [m(x0 + 2), y0 + 2] });
    r.cleanC = [(Math.min(m(x0 + 2), m(x0 + 3)) + 1) * TILE, (y0 + 1) * TILE]; r.cleanR = 24;
  } else {
    // main left rooms are the reference; right rooms mirror them (x' = 34 - x); west rooms are the left layout 9 cols west
    const n = wing === 'west' ? +id.slice(1) : +id.slice(4), y0 = wing === 'west' ? [0, 15, 11, 7][n] : 19 - 4 * Math.floor((n - 1) / 2);
    const m = wing === 'mainR' ? (x => 34 - x) : wing === 'west' ? (x => x - 9) : (x => x);
    Object.assign(r, { y0, left: wing !== 'mainR', andon: [m(11), y0], futon: [m(12), y0], table: [m(13), y0], stand: [m(13), y0 + 1], pile: [m(13), y0 + 2],
      slotA: [m(14), y0], slotB: [m(12), y0 + 2], door: [m(15), y0 + 1], box: [Math.min(m(11), m(14)), y0, Math.max(m(11), m(14)), y0 + 2] });
    r.cleanC = [r.futon[0] * TILE + 8, y0 * TILE + 16]; r.cleanR = 18;   // v1: the futon's centre, radius 18
  }
  r.cleanT = [r.futon[0], r.y0 + 1];   // the tile the arrow / bot goes to for cleaning (lower half of the futon)
  return r;
}
const ROOMS = ROOM_DEF.map(roomGeom);
const ROOM = NUL(); ROOMS.forEach(r => { ROOM[r.id] = r; });
// ---- v2.0.1 (FEEDBACK A1): every room its own floor + wall (art presets: _EN_FLOOR / _EN_WALL in src/art/env.js).
// Main wing: washitsu variations after each room's noren colour; west wing: Taisho roman (wood floor + rug, wallpaper,
// furn 'west' = bed, table lamp, tea table on the same tiles); cottages: rustic; suites: the richest (gold, brocade).
const ROOM_LOOK = {
  room1: ['tatami', 'shikkui'],  room2: ['aotatami', 'uguisu'], room3: ['ume', 'juraku'],    room4: ['ryukyu', 'sakura'],
  room5: ['kiku', 'kuchiba'],    room6: ['momiji', 'bengara'],  room7: ['hagi', 'fuji'],     room8: ['tsubaki', 'gunjo'],
  w1: ['oak', 'stripe', 'west'], w2: ['chevron', 'trellis', 'west'], w3: ['basket', 'damask', 'west'],
  c1: ['hana', 'tsuchi'],        c2: ['hotaru', 'itakabe'],     c3: ['tsuki', 'kinpaku'],    c4: ['yuki', 'karakami'],
};
ROOMS.forEach(r => { const [floor, wall, furn] = ROOM_LOOK[r.id] || ['tatami', 'shikkui']; Object.assign(r, { floor, wall, furn: furn || null }); });
const GUEST_ROOMS = ROOMS.filter(r => !r.vip);       // suites are only for VIPs
const roomOpen = (rm, s) => !rm.open || !!(s || S).unlocked[rm.open];
const futonC = rm => rm.cleanC;

// ---- doors (2.3): kind = doorArt geometry; open = unlock id, or a list of them that must all be bought (null = always
// open); base = floor tile drawn under it. v2.4 (player feedback "wider doors, more ways through"): w / h = a door 2
// tiles wide (in a horizontal wall) or 2 tall (in a vertical wall); `at` is its top-left tile, DOOR_AT maps every tile.
const DOORS = [
  { at: [17, 6], w: 2, kind: 'onsen', open: 'onsen' },
  { at: [8, 18], w: 2, kind: 'hdoor', open: 'w1', col: '#8a6a3a' },                     // west wing, brown noren
  { at: [10, 26], h: 2, kind: 'left', open: 'dining', col: '#5a3a26', emb: 'rice' },     // dining is left of the door
  { at: [24, 26], h: 2, kind: 'right', open: 'garden', col: '#2f4a32', emb: 'pinebranch' },   // garden is right of the door
  { at: [24, 4], h: 2, kind: 'gate', open: 'roten', base: 's' },
  { at: [10, 4], h: 2, kind: 'gate', open: 'shrine', base: 's' },                        // v2.1
  { at: [25, 29], w: 2, kind: 'gateH', open: 'plaza', base: 'p' },                       // v2.1
  { at: [8, 29], w: 2, kind: 'hdoor', open: ['dining', 'shop'], col: '#3a6a4a', emb: 'fish', beyond: 'din' },   // v2.4: dining hall -> shop (green noren)
  { at: [8, 6], w: 2, kind: 'hdoor', open: ['w1', 'shrine'], col: '#c8402a', emb: 'torii', beyond: 'sand' },   // v2.4: west wing hall -> the shrine (vermilion noren)
];
ROOMS.forEach(rm => DOORS.push({ at: rm.door, kind: rm.left ? 'left' : 'right', open: rm.open, room: rm.id, col: rm.col, emb: rm.emb, gold: rm.vip }));
const DOOR_AT = NUL(); DOORS.forEach(d => { d.w = d.w || 1; d.h = d.h || 1; for (let j = 0; j < d.h; j++) for (let i = 0; i < d.w; i++) DOOR_AT[(d.at[1] + j) * MW + d.at[0] + i] = d; });
const doorIsOpen = d => !d.open || (Array.isArray(d.open) ? d.open.every(k => !!S.unlocked[k]) : !!S.unlocked[d.open]);
function doorOpen(tx, ty) { const d = DOOR_AT[ty * MW + tx]; return !!d && doorIsOpen(d); }

// ---- spots (2.4); v1 ones moved x + 10
const DESK_SPOT = [13, 24], QSPOTS = [[13, 26], [13, 27], [13, 28], [14, 28], [15, 28]];
const SHELF_C = [23 * TILE, 23 * TILE + 8], SHELF_SPOT = [22, 24];
const BASKET_C = [15 * TILE + 8, 5 * TILE + 8], BASKET_SPOT = [14, 5], TOWEL_SPOT = [16, 5], WAIT_SPOT = [17, 5], MILK_SPOT = [22, 5];
// v2.4 ("a milk machine by the front door, handier for everyone"): a second machine (unlock milk2) against the facade left
// of the main entrance, off the walk; guests leaving the bath use the nearer free one, staff / the arrow the nearer one
const MILK2_AT = [14, 30], MILK2_SPOT = [14, 31];
const SLOT_X = [15, 17, 19, 13, 21], ROTEN_X = [27, 29, 31, 33, 35, 37];
// bath slots: stand at (x,4), sit in the water at (x,3). Onsen 0-2 open with the onsen, 3-4 need 浴池; 5-10 are the roten.
const SLOTS = SLOT_X.map((x, i) => ({ x, roten: false, need: i < 3 ? 'onsen' : 'bigbath' })).concat(ROTEN_X.map(x => ({ x, roten: true, need: 'roten' })));
const REST = [[21, 25], [22, 25], [23, 25]];          // staff idle spots
const EXIT = [17 * TILE + 8, MH * TILE + 8], EXIT_TILE = [17, MH - 1];   // half a tile below the map
const SPOT = { carpet: [17, 26], clerk: [16, 23], owner: [6, 30], browse: [7, 32], mirror: [2, 35], petCushion: [8, 35], chef: [3, 20],   // v2.4: the bigger shop
  waiterIdle: [[9, 20], [9, 21]], urn1: [12, 24], urn2: [30, 26], rotenPile: [32, 5] };   // v2.5: the garden's tea stand (30,25) beside the walk
// pick-up zones (4.1): centre px + radius
const ZONE = { urn1: { c: [11 * TILE + 8, 24 * TILE + 8], r: 18 }, urn2: { c: [30 * TILE + 8, 25 * TILE + 8], r: 18 }, milk: { c: [22 * TILE + 8, 5 * TILE + 8], r: 18 },
  milk2: { c: [MILK2_SPOT[0] * TILE + 8, MILK2_SPOT[1] * TILE + 8], r: 18 },
  stove: { c: [48, 312], r: 20 }, pass: { c: [56, 344], r: 22 } };
// dining seats (cushions, not blocking) beside their tables; need = the unlock that brings the table
const SEATS = [[2, 23, 3, 'dining'], [4, 23, 3, 'dining'], [6, 23, 7, 'dining'], [8, 23, 7, 'dining'], [2, 26, 3, 'table3'], [4, 26, 3, 'table3'], [6, 26, 7, 'table4'], [8, 26, 7, 'table4']]
  .map(([x, y, tx, need]) => ({ at: [x, y], table: [tx, y], need, face: x < tx ? 'right' : 'left' }));
// v2.4 ("the shop is cramped, I step on what I didn't want"): every shop pad has an empty tile round it and none is on the
// way from the dining door / the front yard; the four booths are a 2 x 2 block with a gap, the mirror and the cushion beside it
const DECOR_PADS = [[2, 32], [4, 32]], HAT_PAD = [4, 34], PET_PAD = [6, 34], PAD_MAX = 4;
const PILE_AT = NUL();
Object.assign(PILE_AT, { recep: [15, 24], onsen: [18, 5], milk: [21, 5], dining: [9, 27], shop: [8, 31], roten: [32, 5], milk2: [13, 30] });
ROOMS.forEach(r => { PILE_AT[r.id] = r.pile; });
const pileOpen = (id, s) => id === 'recep' || (ROOM[id] ? roomOpen(ROOM[id], s) : !!(s || S).unlocked[id]);
const SHIRTS = ['#e05a5a', '#5a9ae0', '#6ac06a', '#e0b04a', '#b07ae0', '#e08ac0', '#4ac0b8', '#f08a4a'];

// ---- v2.0.1 tile looks (FEEDBACK A1 / A3 / A4): what tileArt paints over a tile's char (null = the plain char).
// Room floors 'preset|i,j' and walls 'preset|i,n' carry the tile's place in the room (rugs, windows line up).
const TILE_LOOK = new Array(MW * MH).fill(null);
{
  const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < MW && y < MH) TILE_LOOK[y * MW + x] = v; };
  for (const r of ROOMS) {
    const [x0, y0] = r.box;   // every room is 4 x 3 tiles; its wall face is the row above it
    for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) set(x0 + i, y0 + j, (r.tub && j === 2 && i >= 2 ? 'bath' : r.floor) + '|' + i + ',' + j);   // a suite's tub stands on hinoki slats
    if (r.wing === 'mainL' || r.wing === 'mainR') set(r.slotA[0], r.slotA[1], r.floor + '|' + (r.slotA[0] - x0) + ',0,1');   // main wing: the decor corner is a tokonoma
    for (let i = 0; i < 4; i++) set(x0 + i, y0 - 1, r.wall + '|' + i + ',4');
  }
  for (let y = 7; y <= 17; y++) for (let x = 7; x <= 9; x++) set(x, y, 'hall');             // west wing hall: parquet + runner
  for (let x = 7; x <= 9; x++) set(x, 6, 'hall|' + (x - 7) + ',3');                          // its wallpapered north wall
  for (let y = 2; y <= 3; y++) { for (let x = 27; x <= 37; x++) set(x, y, 'milky'); set(26, y, 'roten'); set(38, y, 'roten'); }   // star-view bath
  for (let x = 26; x <= 38; x++) set(x, 1, 'rockdry');
  for (let x = 25; x <= 38; x++) set(x, 4, 'sunoko');
  // the lower garden (A3): flower beds (v 0 hydrangea, 1 iris, 2 cosmos, 3 marigold), a clipped hedge and a low bamboo
  // fence on its west side (towards the front yard), stepping stones from the walk to the bench
  // v2.5: beds between the stalls and along the east fence, the south border, a few by the yagura / pergola
  [[29, 30, 0], [32, 30, 2], [35, 30, 3], [38, 30, 0], [37, 31, 1], [38, 31, 1], [37, 32, 2], [38, 32, 0],
    [26, 37, 1], [27, 37, 3], [30, 37, 0], [31, 37, 2], [32, 37, 2], [33, 37, 3], [34, 37, 3], [35, 37, 0], [36, 37, 0], [37, 37, 1], [38, 37, 1]].forEach(([x, y, v]) => set(x, y, 'bed|' + v));
  for (let y = 32; y <= 37; y++) set(25, y, 'hedge|0,1');   // v2.4: the plaza runs to r37 (its south beds moved down 3)
  set(25, 30, 'gd|0,1'); set(25, 31, 'gd|0,1');
}
const POND = [26, 29, 15, 17];   // v2.5: the koi pond's tiles x0, x1, y0, y1 (was 27-30)
const tileLook = (tx, ty) => (tx < 0 || ty < 0 || tx >= MW || ty >= MH) ? null : TILE_LOOK[ty * MW + tx];

// ---- v2.0.1 scenery props (FEEDBACK A2 / A3), spread into PROPS (core/pathfinding.js); same fields as PROPS.
// light: [radius, dy, colour key] = a lamp for the night pass (render-world adds it next to buildLights()).
// A2: each tree unlock plants a small grove. The first tree of each stays where SPEC_v2 2.4 put it (it blocks); the
// others are walk-over (block: false) on lawn tiles off the walks, so no walkable / reachable tile changes (map_check).
const SCENERY = [
  // v2.5 (player feedback "the trees look dropped wherever"): the garden composed like a Japanese garden. One walk down
  // the middle; the sakura grove is a cluster of three on the lawn by the garden door, tallest at the back (the first one
  // blocks), its fourth tree the focal tree at the koi pond's north-west corner, the water's south / east side left open
  // for the reflection; the maple grove frames the dry garden opposite (back pair on the north lawn, front pair on the
  // south lawn); small maples / pines along the north hedge as a backdrop. No canopy hangs over a walk, a pad or a door
  // (map_check). Walk-over trees (block: false) stand on lawn tiles, so they change nothing reachable.
  { k: 'tree', at: [27, 24], need: 'g_sakura', img: () => treeArt('sakura', seasonNow()) },   // v2.1: the season's tree (16.1)
  { k: 'tree', at: [25, 25], need: 'g_sakura', block: false, img: () => flipOf(treeArt('sakura', seasonNow(), 1)) },
  { k: 'tree', at: [29, 25], need: 'g_sakura', block: false, img: () => treeArt('sakura', seasonNow(), 2) },
  { k: 'tree', at: [25, 15], need: 'g_sakura', block: false, img: () => treeArt('sakura', seasonNow(), 1) },   // the pond's focal tree
  { k: 'tree', at: [37, 15], need: 'g_maple', img: () => treeArt('maple', seasonNow()) },
  { k: 'tree', at: [35, 15], need: 'g_maple', block: false, img: () => flipOf(treeArt('maple', seasonNow(), 2)) },
  { k: 'tree', at: [38, 18], need: 'g_maple', block: false, img: () => treeArt('maple', seasonNow(), 1) },
  { k: 'tree', at: [34, 18], need: 'g_maple', block: false, img: () => flipOf(treeArt('maple', seasonNow(), 2)) },
  { k: 'tree', at: [26, 9], need: 'garden', block: false, img: () => treeArt('maple', seasonNow(), 2) },   // the backdrop under the hedge
  { k: 'tree', at: [29, 9], need: 'garden', block: false, img: () => flipOf(treeArt('sakura', seasonNow(), 2)) },
  { k: 'tree', at: [35, 9], need: 'garden', block: false, img: () => flipOf(treeArt('maple', seasonNow(), 2)) },
  // A4: bamboo lanterns at the star-view bath's two corners (on rock tiles: nothing walkable)
  { k: 'bambooLamp', at: [26, 3], need: 'roten', block: false, img: () => deckLanternArt(lampLit()), light: [10, 2, 'deck'] },
  { k: 'bambooLamp', at: [38, 2], need: 'roten', block: false, img: () => deckLanternArt(lampLit()), light: [10, 2, 'deck'] },
  // A3: the lower garden = the v2.1 festival plaza. v2.5 (player feedback "the plaza's lower half is empty"): the stalls
  // along the north, a 2-wide walk (r31-32) in front of them, and below it the dancing ground round a drum tower
  // (yagura), a wisteria pergola with a bench, a notice board by the gate, the stone basin + lantern in the east beds,
  // the parasol bench, sleeping cats; the lawn r33-34 stays open for the crowd
  { k: 'yagura', at: [31, 35], fw: 3, fh: 2, need: 'plaza', img: () => yaguraArt(lampLit(), seasonNow()), light: [24, -20, 'lamp'] },
  { k: 'pergola', at: [35, 36], fw: 3, img: () => pergolaArt(seasonNow()) },
  { k: 'notice', at: [27, 34], need: 'plaza', img: () => noticeBoardArt(seasonNow()) },
  { k: 'nodate', at: [28, 37], fw: 2, img: () => nodateArt('gray') },           // red bench under a parasol, a cat asleep on it
  { k: 'tsukubai', at: [38, 34], img: () => tsukubaiArt() },                     // stone water basin in the east beds
  { k: 'toro', at: [38, 33], img: () => toroArt(), light: [18, 0, 'lamp'] },     // its stone lantern
  { k: 'curl', at: [29, 34], block: false, img: () => catCurl('orange') },       // cats asleep in the sun
  { k: 'curl', at: [36, 35], block: false, img: () => catCurl('calico') },       // ... under the pergola
  { k: 'kitten', at: [37, 33], block: false, img: () => kittenSit('white') },    // a kitten watching the water drip
  { k: 'kitten', at: [34, 35], block: false, img: () => kittenSit('gray') },     // and one watching the drum tower
];
