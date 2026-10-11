// ============================================================ v2.1 the cat shrine (SPEC_v2 16.8), core B
// From star 5 a gate pad by the onsen's west fence (11,4) opens the bamboo: the gate (10,4) swings open and the approach
// (9,4) -> (5,4) -> (5,2) leads to the offering pad in front of the hall. Ten offerings (10K ... 300K, 1.075 M in all);
// every level shows on the shrine (the hall grows: a small shrine, the vermilion hall, a gold bell, a gold roof, the
// giant gold cat that glows at night; around it the red torii, stone lanterns, the komainu pair, sakura, a tunnel of
// small torii) and adds 1 % to every fee. A level-up rings the shrine bell once.
// Props: data/tables-v21b.js PROPS_V21B (need = the level that brings them). Fee hook: state-save.js fee() -> feeMulB().
function shrineLv() { let n = 0; while (n < OFFER_B.length && S.unlocked['of' + (n + 1)]) n++; return n; }
// levels where the hall itself changes (its pop-in + the info card's preview of the next hall)
const HALL_LV = new Set([1, 5, 8, 9, 10]);
function shrineLevelUp(u) {
  const lv = u.shrine;   // the bell "ding--" (SFX.bellShrine) rings from unlock() in place of the unlock chime
  if (HALL_LV.has(lv)) POPA['shrine:hall'] = T;
  fxSpark(tcx([5, 1]) + 8, tcy([5, 1]) - 8, 10);
  if (lv === OFFER_B.length) banner('shrine', lv);   // the giant gold cat: one more banner, gold
}
// every fee: + 1 % a shrine level; x1.3 during a fireworks show (16.9)
const feeMulB = () => (1 + SHRINE_FEE * shrineLv()) * (fwOn() ? FW_FEE : 1);
// a small vermilion torii over the approach (level 7, 16 x 22, one tile, walk-under)
function senbonArt() {
  return art('core:senbon', () => paint(16, 22, G => {
    const V = '#d8442e', D = '#a8301e';
    G.rect(0, 1, 16, 2, '#2a2420'); G.rect(1, 3, 14, 2, V); G.rect(2, 7, 12, 1, V);
    G.rect(3, 3, 2, 19, V); G.rect(11, 3, 2, 19, V); G.rect(4, 3, 1, 19, D); G.rect(12, 3, 1, 19, D);
  }));
}
// the info card's preview (cards.js drawPreview -> drawPreviewB): an offering that changes the hall shows the next hall
function shrinePreview(u, gh) {
  if (!u.shrine || !HALL_LV.has(u.shrine)) return;
  if (VIS(5 * TILE + 8, 2 * TILE, 48)) drawObj(gh(hokoraArt(u.shrine, seasonB())), 4, 2 * TILE, 3);
}
// in the 3/4 view the torii (rows 1.75-3) stands in front of the offering pad (5,2) and of you when you stand at it: it
// fades while you are behind it; the small torii over the approach fade while you walk under one
const behindTorii = () => P.y < 4 * TILE && P.y > TILE && Math.abs(P.x - (5 * TILE + 8)) < 2.5 * TILE;
const underSenbon = x => Math.abs(P.x - (x * TILE + 8)) < 14 && P.y > 3 * TILE + 8 && P.y < 5 * TILE;
const FADED = new Map();
function fadeArt(c, a) { const k = c; let m = FADED.get(k); if (!m) { m = mk(c.width, c.height); const x = m.getContext('2d'); x.globalAlpha = a; x.drawImage(c, 0, 0); FADED.set(k, m); } return m; }
// the camera may go up to CAM_TOP_B px above the map while you are at the shrine: its hall stands in rows 0-2, under the
// HUD otherwise (update.js updCam; the band above the map is the plain dark-green ground colour)
const CAM_TOP_B = 30;
const camTopB = () => { const a = areaAt(Math.floor(P.x / TILE), Math.floor(P.y / TILE)); return a && a.id === 'shrine' ? -CAM_TOP_B : 0; };
// winter: snow on a prop (the scenery art's snowCapArt, once it is there)
const snowy = c => seasonB() === 3 && typeof snowCapArt === 'function' ? snowCapArt(c) : c;
