'use strict';
// Run the game's headless checks (D:/Minigame/_workflow/tools/headless.js) against index.html and report pass / fail.
//   node tools/test-game.cjs          quick: smoke seed 1, map_check, ui_check seed 2 (part of npm test)
//   node tools/test-game.cjs full     the split baseline set: + smoke seed 2, migrate_v1, lines_check, music_check, sys_chars21, migrate_v201,
//                                     then perf_render alone (it times frames)        (npm run test:full)
// Balance is separate and slower: node tests/balance_all.js [seeds=3].
const { execFile } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
// the workspace's headless runner: ../_workflow beside the game folder, or a few levels up (a checkout nested in .claude/)
const headless = (() => { for (let d = root, i = 0; i < 6; i++, d = path.dirname(d)) { const f = path.resolve(d, '../_workflow/tools/headless.js'); if (fs.existsSync(f)) return f; } return path.resolve(root, '../_workflow/tools/headless.js'); })();
const QUICK = [['smoke.js', 1], ['map_check.js', 1], ['ui_check.js', 2]];
const FULL = QUICK.concat([['smoke.js', 2], ['migrate_v1.js', 1], ['lines_check.js', 3], ['music_check.js', 1], ['sys_chars21.js', 1], ['migrate_v201.js', 1]]);
const run = ([file, seed]) => new Promise(done => {
  const t0 = Date.now();
  execFile(process.execPath, [headless, root, 'tests/' + file, '--seed', String(seed)], { cwd: root, maxBuffer: 64 << 20 }, (err, out, errOut) => {
    const text = (out + errOut).trim(), last = text.split('\n').pop() || '';
    done({ name: `${file} --seed ${seed}`, ok: !err, last, text, s: ((Date.now() - t0) / 1000).toFixed(1) });
  });
});
(async () => {
  if (!fs.existsSync(headless)) { console.error('headless.js not found at ' + headless + ' (needs the D:/Minigame workspace)'); process.exitCode = 1; return; }
  const full = process.argv.includes('full');
  const results = await Promise.all((full ? FULL : QUICK).map(run));
  if (full) results.push(await run(['perf_render.js', 1]));
  for (const r of results) {
    console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.name.padEnd(26)} ${r.s.padStart(5)} s  ${r.last.slice(0, 110)}`);
    if (!r.ok) console.log(r.text.split('\n').slice(-15).map(l => '     ' + l).join('\n'));
  }
  const bad = results.filter(r => !r.ok).length;
  console.log(bad ? `${bad} of ${results.length} game checks FAILED` : `PASS: ${results.length} headless game checks`);
  process.exitCode = bad ? 1 : 0;
})();
