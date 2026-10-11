'use strict';
// tools/locate-source.cjs maps crash-panel positions (index.html line:col) to src/ files.
//   node tests/source-location.cjs      (part of npm test; adapted from 一喵天下/tests/source-location.cjs)
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { locate } = require('../tools/locate-source.cjs');
const sample = ['<script>', '// ==== source:src/core/example.js ====', 'const 猫 = 1;', 'run(猫);', '// ==== end source:src/core/example.js ====', '</script>'].join('\n');
assert.deepEqual(locate(sample, 3, 7), { file: 'src/core/example.js', line: 1, column: 7 });
assert.deepEqual(locate(sample.replace(/\n/g, '\r\n'), 4), { file: 'src/core/example.js', line: 2, column: 1 });
for (const line of [1, 2, 5, 6]) assert.equal(locate(sample, line), null);
for (const [line, column] of [[0, 1], [7, 1], [3, 0], [1.5, 1], [NaN, 1]]) assert.throws(() => locate(sample, line, column), /Position/);
assert.throws(() => locate(sample.replace('end source:src/core/example.js', 'end source:src/core/other.js'), 3), /Unmatched/);
assert.throws(() => locate(sample.replace('// ==== end source:src/core/example.js ====\n', ''), 3), /Unclosed/);
assert.throws(() => locate(sample.replace('run(猫);', '// ==== source:src/core/other.js ===='), 3), /Nested/);
// Check every real module's first and last lines against the shipped HTML and source file.
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8').replace(/\r\n/g, '\n');
const lines = html.split('\n');
const modules = JSON.parse(fs.readFileSync(path.join(root, 'src/modules.json'), 'utf8'));
for (const file of modules) {
  const start = lines.indexOf('// ==== source:' + file + ' ====');
  const source = fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n').split('\n');
  source.pop(); // Required terminal newline, not a source line.
  assert.ok(start >= 0 && source.length > 0);
  for (const offset of [0, source.length - 1]) {
    assert.equal(lines[start + 1 + offset], source[offset]);
    assert.deepEqual(locate(html, start + 2 + offset, 2), { file, line: offset + 1, column: 2 });
  }
}
console.log(`PASS: source location boundaries, invalid positions, CRLF, Chinese columns and all ${modules.length} shipped modules.`);
