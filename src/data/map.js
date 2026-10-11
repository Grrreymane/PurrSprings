// ============================================================ MAP & DATA (SPEC_v2 section 2)
// 40 x 36 tiles. The v1 inn sits in cols 10-24: every v1 coordinate is x + 10, y unchanged.
const MAP = [
  'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',   // r0
  'bfffzzzfffbfrrrrrrrrrrrfbfrrrrrrrrrrrrrb',   // r1  shrine (v2.1) | onsen | star-view bath (roten)
  'bfzzzpzzzfbfr~~~~~~~~~rfbfr~~~~~~~~~~~rb',
  'bfzzzpzzzfbfr~~~~~~~~~rfbfr~~~~~~~~~~~rb',   // r3  bathers sit in this row of water
  'bfzzzpppppDsssssssssssssDssssssssssssssb',   // r4  (10,4) shrine gate, (24,4) roten gate
  'bffzzzzzffbfssssssssssssbxxxxxxxxxxxxxxb',   // r5  roten deck r5-r7
  'b################D#######xxxxxxxxxxxxxxb',   // r6  (17,6) onsen door
  'b#tttt#...#tttt#...#tttt#xxxxxxxxxxxxxxb',   // r7  W3 | R7 / R8
  'b#ttttD...#ttttD...Dtttt#ffffffpppfffffb',   // r8  hedge gap (31-33,8): garden <-> roten
  'b#tttt#...#tttt#...#tttt#ggggggpppgggggb',
  'b######...######...######p######p######b',   // r10
  'b#tttt#...#tttt#...#tttt#p#tttt#p#tttt#b',   // r11 W2 | R5 / R6 | suites C3 / C4
  'b#ttttD...#ttttD...Dtttt#pDtttt#pDtttt#b',
  'b#tttt#...#tttt#...#tttt#p#tttt#p#tttt#b',
  'b######...######...######p######p######b',   // r14
  'b#tttt#...#tttt#...#tttt#pgoooogpggggggb',   // r15 W1 | R3 / R4 | koi pond + dry garden
  'b#ttttD...#ttttD...Dtttt#pgoooogpzzzzzzb',
  'b#tttt#...#tttt#...#tttt#pgoooogpzzzzzzb',
  'b#######D#######...######pggggggpggggggb',   // r18 (8,18) west wing door
  'b#kkkkmmmm#tttt#...#tttt#p######p######b',   // r19 kitchen + dining | R1 / R2
  'b#kkkkmmmm#ttttD...Dtttt#p#tttt#p#tttt#b',   // r20 cottages C1 / C2
  'b#mmmmmmmm#tttt#...#tttt#pDtttt#pDtttt#b',
  'b#mmmmmmmm######...######p#tttt#p#tttt#b',
  'b#mmmmmmmm#lllllllllllll#p######p######b',   // r23 lobby (r23-r28)
  'b#mmmmmmmm#lllllllllllll#pggggggpggggggb',
  'b#mmmmmmmm#lllllllllllll#pggggggpggggggb',
  'b#mmmmmmmmDlllllllllllllDppppppppggggggb',   // r26 (10,26) dining door, (24,26) garden door
  'b#mmmmmmmm#lllllllllllll#pggggggpggggggb',
  'b#mmmmmmmm#lllllllllllll#pggggggpggggggb',
  'b###############EEE######Dfffffffffffffb',   // r29 (16-18,29) main entrance, (25,29) plaza gate (v2.1)
  'bqqqqqqqqqgggggpppppgggggqqqqqqqqqqqqqqb',   // r30 shop | front garden | festival plaza (v2.1)
  'bqqqqqqqqqgggggpppppgggggqqqqqqqqqqqqqqb',
  'bqqqqqqqqqgggggpppppgggggqqqqqqqqqqqqqqb',
  'bqqqqqqqqqgggggpppppgggggqqqqqqqqqqqqqqb',
  'bqqqqqqqqqgggggpppppgggggqqqqqqqqqqqqqqb',
  'bbbbbbbbbbbbbbbpppppbbbbbbbbbbbbbbbbbbbb',   // r35 guests come in from (17,36)
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
  { id: 'front',  r: [10, 30, 24, 35], open: null,     music: 'lobby',  amb: 'wind' },
  { id: 'lobby',  r: [11, 23, 23, 28], open: null,     music: 'lobby',  amb: null },
  { id: 'main',   r: [11, 7, 23, 22],  open: null,     music: 'lobby',  amb: null },
  { id: 'onsen',  r: [11, 1, 23, 5],   open: 'onsen',  lock: 'door',  dim: true, music: 'onsen',  amb: 'water' },
  { id: 'shop',   r: [1, 30, 9, 34],   open: 'shop',   lock: 'block', dim: true, music: 'lobby',  amb: null, sign: [10, 30], n: 2 },
  { id: 'dining', r: [2, 19, 9, 28],   open: 'dining', lock: 'door',  dim: true, music: 'dining', amb: 'fire', sign: [10, 26], n: 3 },
  { id: 'west',   r: [2, 7, 9, 17],    open: 'w1',     lock: 'door',  dim: true, music: 'lobby',  amb: null },
  { id: 'garden', r: [25, 9, 38, 28],  open: 'garden', lock: 'block', dim: true, music: 'garden', amb: 'garden', sign: [24, 26], n: 4 },
  { id: 'roten',  r: [25, 1, 38, 8],   open: 'roten',  lock: 'block', dim: true, music: 'onsen',  amb: 'falls', sign: [24, 4], n: 5 },
  { id: 'shrine', r: [1, 1, 9, 5],     open: 'shrine', lock: 'block', dim: false, music: 'garden', amb: null, scenery: 'bamboo' },   // v2.1
  { id: 'plaza',  r: [25, 30, 38, 34], open: 'plaza',  lock: 'block', dim: false, music: 'lobby',  amb: null, scenery: 'plaza' },    // v2.1
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
    const x0 = id === 'c1' || id === 'c3' ? 27 : 34, y0 = wing === 'cottage' ? 20 : 11;
    Object.assign(r, { x0, y0, left: false, andon: [x0, y0], table: [x0 + 1, y0], futon: [x0 + 2, y0], stand: [x0 + 1, y0 + 1], pile: [x0, y0 + 2], door: [x0 - 1, y0 + 1], box: [x0, y0, x0 + 3, y0 + 2] });
    if (wing === 'cottage') Object.assign(r, { futonB: [x0 + 3, y0], slotA: [x0 + 3, y0 + 2], slotB: [x0 + 2, y0 + 2] });
    else Object.assign(r, { tub: [x0 + 3, y0 + 2], tap: [x0 + 2, y0 + 2] });
    r.cleanC = [(x0 + 3) * TILE, (y0 + 1) * TILE]; r.cleanR = 24;
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
const GUEST_ROOMS = ROOMS.filter(r => !r.vip);       // suites are only for VIPs
const roomOpen = (rm, s) => !rm.open || !!(s || S).unlocked[rm.open];
const futonC = rm => rm.cleanC;

// ---- doors (2.3): kind = doorArt geometry; open = unlock id (null = always open); base = floor tile drawn under it
const DOORS = [
  { at: [17, 6], kind: 'onsen', open: 'onsen' },
  { at: [8, 18], kind: 'hdoor', open: 'w1', col: '#8a6a3a' },                          // west wing, brown noren
  { at: [10, 26], kind: 'left', open: 'dining', col: '#5a3a26', emb: 'rice' },          // dining is left of the door
  { at: [24, 26], kind: 'right', open: 'garden', col: '#2f4a32', emb: 'pinebranch' },   // garden is right of the door
  { at: [24, 4], kind: 'gate', open: 'roten', base: 's' },
  { at: [10, 4], kind: 'gate', open: 'shrine', base: 's' },                             // v2.1
  { at: [25, 29], kind: 'gateH', open: 'plaza', base: 'p' },                            // v2.1
];
ROOMS.forEach(rm => DOORS.push({ at: rm.door, kind: rm.left ? 'left' : 'right', open: rm.open, room: rm.id, col: rm.col, emb: rm.emb, gold: rm.vip }));
const DOOR_AT = NUL(); DOORS.forEach(d => { DOOR_AT[d.at[1] * MW + d.at[0]] = d; });
const doorIsOpen = d => !d.open || !!S.unlocked[d.open];
function doorOpen(tx, ty) { const d = DOOR_AT[ty * MW + tx]; return !!d && doorIsOpen(d); }

// ---- spots (2.4); v1 ones moved x + 10
const DESK_SPOT = [13, 24], QSPOTS = [[13, 26], [13, 27], [13, 28], [14, 28], [15, 28]];
const SHELF_C = [23 * TILE, 23 * TILE + 8], SHELF_SPOT = [22, 24];
const BASKET_C = [15 * TILE + 8, 5 * TILE + 8], BASKET_SPOT = [14, 5], TOWEL_SPOT = [16, 5], WAIT_SPOT = [17, 5], MILK_SPOT = [22, 5];
const SLOT_X = [15, 17, 19, 13, 21], ROTEN_X = [27, 29, 31, 33, 35, 37];
// bath slots: stand at (x,4), sit in the water at (x,3). Onsen 0-2 open with the onsen, 3-4 need 浴池; 5-10 are the roten.
const SLOTS = SLOT_X.map((x, i) => ({ x, roten: false, need: i < 3 ? 'onsen' : 'bigbath' })).concat(ROTEN_X.map(x => ({ x, roten: true, need: 'roten' })));
const REST = [[21, 25], [22, 25], [23, 25]];          // staff idle spots
const EXIT = [17 * TILE + 8, 36 * TILE + 8], EXIT_TILE = [17, 35];   // half a tile below the map
const SPOT = { carpet: [17, 26], clerk: [16, 23], owner: [6, 30], browse: [7, 32], mirror: [2, 33], petCushion: [8, 34], chef: [3, 20],
  waiterIdle: [[9, 20], [9, 21]], urn1: [12, 24], urn2: [26, 26], rotenPile: [32, 5] };
// pick-up zones (4.1): centre px + radius
const ZONE = { urn1: { c: [11 * TILE + 8, 24 * TILE + 8], r: 18 }, urn2: { c: [26 * TILE + 8, 25 * TILE + 8], r: 18 }, milk: { c: [22 * TILE + 8, 5 * TILE + 8], r: 18 },
  stove: { c: [48, 312], r: 20 }, pass: { c: [56, 344], r: 22 } };
// dining seats (cushions, not blocking) beside their tables; need = the unlock that brings the table
const SEATS = [[2, 23, 3, 'dining'], [4, 23, 3, 'dining'], [6, 23, 7, 'dining'], [8, 23, 7, 'dining'], [2, 26, 3, 'table3'], [4, 26, 3, 'table3'], [6, 26, 7, 'table4'], [8, 26, 7, 'table4']]
  .map(([x, y, tx, need]) => ({ at: [x, y], table: [tx, y], need, face: x < tx ? 'right' : 'left' }));
const DECOR_PADS = [[2, 32], [4, 32]], HAT_PAD = [5, 33], PET_PAD = [7, 33], PAD_MAX = 4;
const PILE_AT = NUL();
Object.assign(PILE_AT, { recep: [15, 24], onsen: [18, 5], milk: [21, 5], dining: [9, 27], shop: [9, 32], roten: [32, 5] });
ROOMS.forEach(r => { PILE_AT[r.id] = r.pile; });
const pileOpen = (id, s) => id === 'recep' || (ROOM[id] ? roomOpen(ROOM[id], s) : !!(s || S).unlocked[id]);
const SHIRTS = ['#e05a5a', '#5a9ae0', '#6ac06a', '#e0b04a', '#b07ae0', '#e08ac0', '#4ac0b8', '#f08a4a'];
