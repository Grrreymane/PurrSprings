'use strict';
// Assemble src/ into index.html in place: one script scope, the original order, no runtime imports.
//   node tools/sync-inline.cjs           write the sources into their marked regions (npm run sync)
//   node tools/sync-inline.cjs --check   fail when index.html is stale (npm test)
// Adapted from 一喵天下/tools/sync-inline.cjs. index.html stays the one complete, playable deploy file; only the
// lines between '// ==== source:src/x.js ====' and '// ==== end source:src/x.js ====' are generated.
const fs = require('node:fs');
const path = require('node:path');
const normalize = text => text.replace(/\r\n/g, '\n');
function assemble(root) {
  const original = normalize(fs.readFileSync(path.join(root, 'index.html'), 'utf8'));
  const modules = JSON.parse(fs.readFileSync(path.join(root, 'src/modules.json'), 'utf8'));
  if (!Array.isArray(modules) || !modules.length || modules.some(p => typeof p !== 'string' || !/^src\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.js$/.test(p)) || new Set(modules).size !== modules.length)
    throw Error('Invalid or duplicate source paths in src/modules.json');
  const files = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? files(dir + '/' + e.name) : e.name.endsWith('.js') ? [dir + '/' + e.name] : []);
  const extra = files('src').filter(p => !modules.includes(p));
  if (extra.length) throw Error('Unregistered sources: ' + extra.join(', '));
  const markers = [...original.matchAll(/^\/\/ ==== (end )?source:([^\n]+) ====\n/gm)];
  if (markers.length !== modules.length * 2) throw Error('Missing or duplicate inline boundaries');
  let html = '', pos = 0;
  modules.forEach((file, i) => {
    const start = markers[i * 2], end = markers[i * 2 + 1];
    if (start[1] || !end[1] || start[2] !== file || end[2] !== file)
      throw Error('Inline source order/boundaries disagree with src/modules.json: ' + file);
    const source = normalize(fs.readFileSync(path.join(root, file), 'utf8'));
    if (!source.endsWith('\n') || /^\/\/ ==== (?:end )?source:/m.test(source))
      throw Error('Source must end with a newline and contain no inline boundary markers: ' + file);
    // A BOM would land mid-script (and in SCRIPT_TEXT, so in the font subset): save sources as UTF-8 without BOM.
    if (source.includes('\ufeff')) throw Error('Source contains a byte order mark (save as UTF-8 without BOM): ' + file);
    html += original.slice(pos, start.index + start[0].length) + source;
    pos = end.index;
  });
  return { original, html: html + original.slice(pos), count: modules.length };
}
function sync(root, check = false) {
  // Validate every source before writing anything; a failed sync leaves the playable file intact.
  const result = assemble(root);
  if (check && result.html !== result.original) throw Error('Inline modules are stale. Run npm run sync.');
  if (!check && result.html !== result.original) fs.writeFileSync(path.join(root, 'index.html'), result.html);
  return result.count;
}
if (require.main === module) {
  try {
    const check = process.argv.includes('--check');
    const count = sync(path.resolve(__dirname, '..'), check);
    console.log(check ? `Inline modules match all ${count} sources.` : `Synchronized ${count} sources into index.html.`);
  } catch (e) { console.error(e.message); process.exitCode = 1; }
}
module.exports = { assemble, sync };
