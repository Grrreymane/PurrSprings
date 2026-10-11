// AUDIT (balance / variety, 2026-10-10): what the music sounds like to a player, not only "is an identical section
// repeated within 6 min" (music_check). An eager guide follower plays a new game to star 5 and MIN more minutes; every
// frame we read the engine's current player (_auCur) and log which song / section / pass is playing. Reported:
//   - time per song, and per song the share of A-material (A / A2 / A3) vs B-material (B / B2)
//   - song entries per 10 min and how many of them start the song at its very first bar (section 0 = the same opening)
//   - sections cut before their end by an area switch
//   - "same tune" repeats: the gap between two plays of the same song + section name + variation row (k = pass % 4),
//     ignoring the accompaniment colour, night and layers - what an ear calls "this again"
// Variants (prototypes, patched in this closure, index.html untouched):
//   resume   a song re-entered goes on with the section after the one that was cut (not its A)
//   rest     after every full pass of a song, 2 bars of ambience only (the tune breathes)
//   dwell=N  an area song switch needs N s in the new area (was 1.5 s)
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/audit_bal_music.js --seed 1 -- [min=30] [resume] [rest] [dwell=N] [json]
const ARG = k => { const a = ARGS.find(s => s.startsWith(k + '=')); return a ? a.slice(k.length + 1) : null; };
const MIN = +(ARG('min') || 30), RESUME = ARGS.includes('resume'), REST = ARGS.includes('rest'), JSONOUT = ARGS.includes('json');
function bPatchFn(name, pairs) {
  let s = eval(name).toString();
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error('patch ' + name + ': no "' + a + '"'); s = s.split(a).join(b); }
  eval(name + ' = (' + s + ')');
}
const bRes = {}, bDw = ARG('dwell'), bDwell = bDw ? +bDw : 1.5;   // song -> the section to resume at; area dwell before a switch
if (RESUME) {
  // remember where a song was cut; a new player for it starts at the next section (its pass number still advances)
  bPatchFn('_auNewPlayer', [['secIdx: 0,', 'secIdx: bRes[song] || 0,']]);
  bPatchFn('_auStop', [['p.stopAt = t;', 'p.stopAt = t; if (p.sd && !p.sd.fix) bRes[p.song] = (p.secIdx + 1) % p.sd.form.length;']]);
}
if (bDw) bPatchFn('_auSwitch', [['(areaSw ? 1.5 : .25)', '(areaSw ? bDwell : .25)']]);
if (REST) {
  // a 2-bar rest (no tune) after the last section of every pass: _auRun skips ahead in time without events
  bPatchFn('_auRun', [['if (++p.secIdx >= p.sd.form.length) { p.secIdx = 0; p.pass = _auNextPass(p.song); }',
    'if (++p.secIdx >= p.sd.form.length) { p.secIdx = 0; p.pass = _auNextPass(p.song); if (!p.sd.fix && p.song !== "fest") { p.t += 2 * p.sd.beat * 2 * 60 / p.sd.bpm / 2; MUSIC_DBG.rests = (MUSIC_DBG.rests || 0) + 1; } }']]);
}
const DT = 1 / 30, mmss = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
newGame();
let path = [], key = '', think = 0, fin = null;
function follow(dt) {
  think -= dt;
  if (think <= 0) {
    think = .3;
    const t = S.tut.moved ? GUIDE : { tx: 17, ty: 24, key: 'start' };
    if (!t || t.here) { path = []; key = ''; }
    else if (t.key + t.tx + ',' + t.ty !== key || !path.length) { key = t.key + t.tx + ',' + t.ty; const [sx, sy] = tileOf(P); path = findPath(sx, sy, t.tx, t.ty) || []; }
  }
  if (path.length) {
    const [tx, ty] = path[0], cx = tx * 16 + 8, cy = ty * 16 + 8, dx = cx - P.x, dy = cy - P.y, d = Math.hypot(dx, dy);
    if (d < 1.5) path.shift();
    botMove = d > .01 ? { x: dx / d * Math.min(1, d / 3), y: dy / d * Math.min(1, d / 3) } : null;
  } else botMove = null;
}
// ---- watch every frame
const songT = {}, secT = {}, plays = [], entries = [];   // plays: { song, name, k, cc, si, t0, t1, len }
let curP = null, curKey = '', clock = 0, silent = 0;
function watch() {
  clock += DT;
  if (state !== 'play') return;
  const c = _auCur();
  if (!c || !c.sec) { silent += DT; return; }
  const song = c.song; songT[song] = (songT[song] || 0) + DT;
  const name = c.sec.name, base = song + '|' + name[0]; secT[base] = (secT[base] || 0) + DT;
  const k = song + '|' + name + '|' + c.pass + '|' + c.secIdx + '|' + (c.secT || 0).toFixed(2);
  if (k !== curKey) {
    if (curP) curP.t1 = clock;
    curKey = k;
    curP = { song, name, k: c.pass % 4, cc: Math.floor(c.pass / 4) % 3, si: c.secIdx, t0: clock, t1: clock, len: c.sec.len * c.sec.dt };
    plays.push(curP);
    if (!plays[plays.length - 2] || plays[plays.length - 2].song !== song) entries.push({ t: clock, song, si: c.secIdx });
  } else curP.t1 = clock;
}
for (let i = 0; i < 90 * 60 * 30; i++) {
  follow(DT); update(DT); watch();
  if (state === 'celebrate' && st > 4) { S.done = true; go('play'); } if (state === 'card') modalClose();
  if (star() >= 5 && fin === null) fin = S.stats.time;
  if (fin !== null && S.stats.time - fin > MIN * 60) break;
}
// ---- report
for (const p of plays) p.full = p.t1 - p.t0 >= p.len * .97;
const total = Object.values(songT).reduce((a, b) => a + b, 0);
const per = {};
for (const s in songT) {
  const ps = plays.filter(p => p.song === s), aT = (secT[s + '|A'] || 0), bT = (secT[s + '|B'] || 0);
  per[s] = { share: +(songT[s] / total).toFixed(3), min: +(songT[s] / 60).toFixed(1), Ashare: +(aT / Math.max(1e-9, aT + bT)).toFixed(2), sections: ps.length, cut: ps.filter(p => !p.full).length };
}
const ent = entries.filter(e => e.song !== 'title' && e.song !== 'fest');
const fromTop = ent.filter(e => e.si === 0).length;
const lastEnd = {}, gaps = [];
for (const p of plays) {
  if (p.song === 'title' || p.song === 'fest') continue;
  const id = p.song + '|' + p.name + '|' + p.k;
  if (lastEnd[id] !== undefined) gaps.push(p.t0 - lastEnd[id]);
  lastEnd[id] = p.t1;
}
gaps.sort((a, b) => a - b);
const q = f => gaps.length ? Math.round(gaps[Math.min(gaps.length - 1, Math.floor(gaps.length * f))]) : null;
const openings = plays.filter(p => p.si === 0 && p.song !== 'title' && p.song !== 'fest').length;
const playMin = total / 60;
const out = { fin, min: +playMin.toFixed(1), per, entriesPer10: +(ent.length / playMin * 10).toFixed(1), fromTopShare: +(fromTop / Math.max(1, ent.length)).toFixed(2),
  openingsPer10: +(openings / playMin * 10).toFixed(1), cutShare: +(plays.filter(p => !p.full).length / plays.length).toFixed(2),
  sameTune: { n: gaps.length, p10: q(.1), med: q(.5), under60: +(gaps.filter(g => g < 60).length / Math.max(1, gaps.length)).toFixed(2) },
  silentShare: +(silent / (total + silent)).toFixed(3), rests: MUSIC_DBG.rests || 0,
  variant: ((RESUME ? 'resume ' : '') + (REST ? 'rest ' : '') + (bDw ? 'dwell=' + bDw : '')).trim() || 'base' };
if (JSONOUT) console.log(JSON.stringify(out));
else {
  console.log(`[${out.variant}] ★5 ${mmss(fin)} + ${MIN} min, music ${out.min} min`);
  for (const s in per) console.log(`  ${s.padEnd(7)} ${(per[s].share * 100).toFixed(0)}% (${per[s].min} min)  A-material ${(per[s].Ashare * 100).toFixed(0)}%  sections ${per[s].sections}, cut early ${per[s].cut}`);
  console.log(`  song entries ${out.entriesPer10}/10 min, ${(out.fromTopShare * 100).toFixed(0)}% start at the song's first bar | openings (section 0) ${out.openingsPer10}/10 min | sections cut by a switch ${(out.cutShare * 100).toFixed(0)}%`);
  console.log(`  same tune again (song+section+variation): ${out.sameTune.n} times, gap p10 ${out.sameTune.p10} s, median ${out.sameTune.med} s, ${(out.sameTune.under60 * 100).toFixed(0)}% within 60 s | silence ${(out.silentShare * 100).toFixed(1)}%`);
}
