// Live-site upgrade path (stage 5 audit): a v1 player's localStorage, exactly as the v1 game (7f59a73, live) left it,
// meets the v2 page at BOOT (not via loadState(raw) in a running game): the 'purr-springs-mute' key, the v1 'state'.
// Standalone (not a hook script) because the storage must be filled before the page's script runs:
//   node D:/Minigame/Hotelgame/tests/audit_crp_v1_upgrade.js
// It patches a copy of _workflow/tools/headless.js in memory so its localStorage starts with the given keys, then runs
// a small hook script per case. Checks: music / sfx follow the old mute key (and keep following the new keys after),
// the title shows the migrated star, continue keeps everything, a reload does not migrate twice.
const fs = require('fs'), path = require('path'), os = require('os'), { spawnSync } = require('child_process');
const GAME = path.resolve(__dirname, '..'), TOOL = 'D:/Minigame/_workflow/tools/headless.js';
let src = fs.readFileSync(TOOL, 'utf8');
if (!src.includes('const storage = new Map();')) { console.log('headless.js changed: cannot preseed storage'); process.exit(2); }
src = src.replace('const storage = new Map();', 'const storage = new Map(JSON.parse(process.env.PRESEED || "[]"));')
  .replace("console, Math: MathX", "console, Math: MathX, DUMP: () => [...storage]");
const runner = path.join(os.tmpdir(), 'purr_headless_preseed_' + process.pid + '.js');
fs.writeFileSync(runner, src);
const hook = path.join(os.tmpdir(), 'purr_hook_' + process.pid + '.js');
fs.writeFileSync(hook, `
const DT = 1 / 30, out = { musicOn, sfxOn, keys: DUMP().map(([k]) => k).sort(), star: star(), hasSave, money: S.money, peak: S.peak, gift: S.gift };
if (hasSave) { continueGame(); for (let i = 0; i < 30 * 60; i++) update(DT); saveNow(); out.after = { star: star(), money: S.money, v: S.v, gift: S.gift, banner: BANNER_Q.length ? BANNER_Q[0].kind : (RUN.news.length ? 'shown' : '-'), unlocked: Object.keys(S.unlocked).length }; }
if (ARGS[0] === 'toggle') { setMusicOn(false); }
console.log('RESULT ' + JSON.stringify(out));
console.log('STORE ' + JSON.stringify(DUMP()));
`);
const run = (pre, args) => {
  const r = spawnSync(process.execPath, [runner, GAME, hook, '--seed', '1', '--', ...(args || [])], { env: Object.assign({}, process.env, { PRESEED: JSON.stringify(pre) }), encoding: 'utf8', maxBuffer: 1 << 26 });
  const res = (r.stdout.match(/^RESULT (.*)$/m) || [])[1], store = (r.stdout.match(/^STORE (.*)$/m) || [])[1];
  if (!res) console.log(r.stdout.slice(-2000), r.stderr.slice(-2000));
  return { res: res && JSON.parse(res), store: store && JSON.parse(store) };
};
const fx = n => fs.readFileSync(path.join(GAME, 'tests', 'fixtures', n + '.json'), 'utf8').trim();
let bad = 0; const check = (c, m) => { if (!c) { bad++; console.log('  FAIL ' + m); } };
// 1. muted v1 player at star 3
{ const a = run([['purr-springs-state', fx('v1_s3')], ['purr-springs-mute', 'true']]);
  console.log('v1 ★3 muted:', JSON.stringify(a.res));
  check(a.res && a.res.musicOn === false && a.res.sfxOn === false, 'v1 mute=true must start with music + sfx off');
  check(a.res && a.res.after && a.res.after.v === 2, 'state migrated to v2');
  // the same storage booted again (second visit): still muted, no second migration
  const b = run(a.store);
  console.log('  second visit:', JSON.stringify(b.res));
  check(b.res && b.res.musicOn === false && b.res.sfxOn === false, 'still muted on the second visit');
  check(b.res && b.res.gift === false, 'the "inn grew" banner flag is spent after the first visit');
}
// 2. v1 player who never pressed mute; 3. who turned it back on (mute=false); 4. a junk key
for (const [name, pre] of [['never muted', []], ['mute=false', [['purr-springs-mute', 'false']]], ['junk key', [['purr-springs-mute', '{oops']]]]) {
  const a = run([['purr-springs-state', fx('v1_s5')]].concat(pre));
  console.log('v1 ★5 ' + name + ':', JSON.stringify(a.res));
  check(a.res && a.res.musicOn && a.res.sfxOn, name + ': sound on');
  check(a.res && a.res.star === 5 && a.res.after && a.res.after.star === 5, name + ': star 5 kept');
}
// 5. v2 player turns music off only: the next visit keeps it off and sfx on
{ const a = run([], ['toggle']); const b = run(a.store);
  console.log('v2 music off -> next visit:', JSON.stringify({ musicOn: b.res.musicOn, sfxOn: b.res.sfxOn }));
  check(b.res && b.res.musicOn === false && b.res.sfxOn === true, 'v2 music toggle persists alone'); }
try { fs.unlinkSync(runner); fs.unlinkSync(hook); } catch (e) {}
console.log(bad ? 'V1 UPGRADE: ' + bad + ' FAIL' : 'V1 UPGRADE OK');
process.exitCode = bad ? 1 : 0;
