'use strict';
// The src/ split (2026-10-10): packaging failures must not overwrite a playable build or silently omit a source, and the
// real index.html must keep the contracts other tools rely on.
//   node tests/source-layout.cjs        (part of npm test)
// Part 1 runs tools/sync-inline.cjs on a throwaway folder; part 2 checks this game's own index.html + src/.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { sync } = require('../tools/sync-inline.cjs');
let checks = 0;

// ---- part 1: the sync tool on a throwaway folder (adapted from 一喵天下/tests/source-layout.cjs)
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'purr-source-layout-'));
const write = (file, text) => fs.writeFileSync(path.join(tmp, file), text);
const read = file => fs.readFileSync(path.join(tmp, file), 'utf8');
const manifest = ['src/first.js', 'src/nested/second.js'];
const block = (file, body) => `// ==== source:${file} ====\n${body}// ==== end source:${file} ====\n`;
const initial = '<script>\n' + block(manifest[0], 'oldFirst();\n') + block(manifest[1], 'oldSecond();\n') + '</script>\n';
function reset() {
  write('src/modules.json', JSON.stringify(manifest));
  write(manifest[0], 'first();\n\n');
  write(manifest[1], 'second();\n');
  write('index.html', initial);
}
function rejects(change, pattern) {
  reset(); change(); const before = read('index.html');
  assert.throws(() => sync(tmp), pattern);
  assert.equal(read('index.html'), before, 'A rejected build must preserve the full published file');
  checks++;
}
try {
  fs.mkdirSync(path.join(tmp, 'src/nested'), { recursive: true });
  reset();
  assert.throws(() => sync(tmp, true), /stale/); assert.equal(read('index.html'), initial); checks++;
  assert.equal(sync(tmp), 2);
  const built = read('index.html');
  assert.equal(built, '<script>\n' + block(manifest[0], 'first();\n\n') + block(manifest[1], 'second();\n') + '</script>\n');
  sync(tmp); assert.equal(read('index.html'), built); sync(tmp, true); checks++;
  write('index.html', built.replace(/\n/g, '\r\n'));
  write(manifest[0], 'first();\r\n\r\n'); sync(tmp, true); checks++;
  rejects(() => write('src/modules.json', JSON.stringify([...manifest].reverse())), /order/);
  rejects(() => write('src/modules.json', JSON.stringify([manifest[0], manifest[0]])), /duplicate/);
  rejects(() => write('src/modules.json', JSON.stringify(['src/../outside.js'])), /Invalid/);
  rejects(() => write('src/modules.json', JSON.stringify(['tests/smoke.js', manifest[1]])), /Invalid/);
  rejects(() => write('src/modules.json', JSON.stringify(['src/猫.js', manifest[1]])), /Invalid/);
  rejects(() => write('index.html', initial.replace(block(manifest[1], 'oldSecond();\n'), '')), /boundaries/);
  rejects(() => write('index.html', initial + block(manifest[0], 'duplicate();\n')), /boundaries/);
  rejects(() => write(manifest[1], 'second();'), /newline/);
  rejects(() => write(manifest[1], block(manifest[0], 'nested();\n')), /markers/);
  rejects(() => write(manifest[1], '\ufeffsecond();\n'), /byte order mark/);
  rejects(() => fs.unlinkSync(path.join(tmp, manifest[1])), /ENOENT/);
  rejects(() => write('src/unregistered.js', 'forgottenRule();\n'), /Unregistered/);
} finally {
  // Only remove the exact fresh temporary directory created above.
  assert.equal(path.dirname(path.resolve(tmp)), path.resolve(os.tmpdir()));
  assert.ok(path.basename(tmp).startsWith('purr-source-layout-'));
  fs.rmSync(tmp, { recursive: true, force: true });
}

// ---- part 2: this game's index.html + src/
const root = path.resolve(__dirname, '..');
// a CRLF checkout (core.autocrlf) is fine: sync-inline.cjs normalises line endings, so these checks do too
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8').replace(/\r\n/g, '\n');
const modules = JSON.parse(fs.readFileSync(path.join(root, 'src/modules.json'), 'utf8'));
const raw = Object.fromEntries(modules.map(m => [m, fs.readFileSync(path.join(root, m), 'utf8')]));
const src = Object.fromEntries(modules.map(m => [m, raw[m].replace(/\r\n/g, '\n')]));
const count = (s, sub) => s.split(sub).length - 1;
const where = sub => modules.filter(m => src[m].includes(sub));

// every source registered, in sync (= sync-inline.cjs --check), and nothing from tests/ or tools/
assert.equal(sync(root, true), modules.length); checks++;
assert.ok(modules.every(m => /^src\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.js$/.test(m)), 'ASCII kebab-case paths under src/ only'); checks++;

// the markers pair up, in modules.json order, once each, all inside the one game <script> (the one with /*TEST_HOOK*/,
// which _workflow/tools/headless.js and make_test_page.py pick)
const marks = [...html.matchAll(/^\/\/ ==== (end )?source:(.+) ====$/gm)].map(m => (m[1] ? 'end ' : '') + m[2]);
assert.deepEqual(marks, modules.flatMap(m => [m, 'end ' + m])); checks++;
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const game = scripts.filter(s => s.includes('/*TEST_HOOK*/'));
assert.equal(game.length, 1, 'exactly one <script> with /*TEST_HOOK*/');
assert.equal(count(game[0], '// ==== source:'), modules.length, 'every region inside the game script');
assert.ok(game[0].startsWith("\n(() => {\n'use strict';\nconst SCRIPT_TEXT = ") && game[0].endsWith('\n})();\n'), 'the IIFE shell stays in index.html'); checks++;

// /*TEST_HOOK*/ exactly once, in src/boot.js (headless.js / make_test_page.py replace it in index.html)
assert.equal(count(html, '/*TEST_HOOK*/'), 1);
assert.deepEqual(where('/*TEST_HOOK*/'), ['src/boot.js']); checks++;

// the art / audio contract (SPEC_v2 12 + 13): every ART block opens and closes once, in src/art/*.js, in order; the
// AUDIO block is whole in src/audio/engine.js and still matches tools/audio/engine_from_index*.js
let lastArt = -1;
for (const k of ['stubs', 'chars', 'env', 'objects']) {
  const b = `/*ART:${k}:BEGIN*/`, e = `/*ART:${k}:END*/`;
  assert.equal(count(html, b), 1, b); assert.equal(count(html, e), 1, e);
  const [fb] = where(b), [fe] = where(e), ib = modules.indexOf(fb), ie = modules.indexOf(fe);
  assert.ok(fb.startsWith('src/art/') && fe.startsWith('src/art/') && ib <= ie && ib >= lastArt, k + ' block order');
  assert.ok(html.indexOf(b) < html.indexOf(e));
  lastArt = ie;
}
const artFiles = modules.filter(m => m.startsWith('src/art/'));
const i0 = modules.indexOf(where('/*ART:stubs:BEGIN*/')[0]), i1 = modules.indexOf(where('/*ART:objects:END*/')[0]);
assert.deepEqual(artFiles, modules.slice(i0, i1 + 1), 'src/art/ = exactly the files of the ART blocks, contiguous'); checks++;
assert.deepEqual(where('/*AUDIO:BEGIN*/'), ['src/audio/engine.js']); assert.deepEqual(where('/*AUDIO:END*/'), ['src/audio/engine.js']);
assert.equal(count(html, '/*AUDIO:BEGIN*/'), 1);
assert.ok(html.includes('\n/*AUDIO:BEGIN*/\n') && html.includes('\n/*AUDIO:END*/'), 'engine_from_index*.js pattern'); checks++;

// SPEC_v2 12.0 / 13: no Chinese (no non-ASCII at all) in art / audio sources; every source UTF-8 without BOM
for (const m of modules) {
  assert.ok(!raw[m].includes('\ufeff') && !src[m].includes('\r'), m + ': no BOM, no stray CR');
  if (/^src\/(art|audio)\//.test(m)) {
    const bad = [...new Set(src[m].match(/[^\x00-\x7f]/g) || [])];
    assert.equal(bad.join(''), '', m + ': art / audio files are ASCII only (SPEC_v2 12.0)');
  }
}
checks++;
console.log(`PASS: ${checks} source layout checks; sync tool (order, stale output, missing/duplicate/unregistered sources, ` +
  `BOM, line endings, failed-sync preservation) + this game's ${modules.length} regions, TEST_HOOK, ART / AUDIO blocks, ASCII art / audio.`);
