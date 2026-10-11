'use strict';
// Map an index.html position (the crash panel's "@line:col") to src/...js:line:col, without executing or changing files.
//   npm run locate -- 5200:31                      the current index.html (checked to be in sync first)
//   npm run locate -- 5200:31 --html old.html      the HTML of the build that crashed (git show <commit>:index.html)
// Adapted from 一喵天下/tools/locate-source.cjs.
const fs = require('node:fs');
const path = require('node:path');
function locate(html, line, column = 1) {
  const lines = html.replace(/\r\n/g, '\n').split('\n');
  if (!Number.isSafeInteger(line) || line < 1 || line > lines.length || !Number.isSafeInteger(column) || column < 1)
    throw Error('Position must be a valid one-based HTML line and positive column.');
  let active = null, result = null;
  for (let i = 0; i < lines.length; i++) {
    const marker = /^\/\/ ==== (end )?source:(src\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.js) ====$/.exec(lines[i]);
    if (marker) {
      if (marker[1]) {
        if (!active || active.file !== marker[2]) throw Error('Unmatched source boundary at HTML line ' + (i + 1));
        active = null;
      } else {
        if (active) throw Error('Nested source boundary at HTML line ' + (i + 1));
        active = { file: marker[2], markerLine: i + 1 };
      }
    } else if (i + 1 === line && active) {
      result = { file: active.file, line: line - active.markerLine, column };
    }
  }
  if (active) throw Error('Unclosed source boundary: ' + active.file);
  return result; // null: HTML shell, wrapper, blank separators or boundary comments themselves.
}
function main(args) {
  let htmlFile = path.resolve(__dirname, '../index.html'), custom = false;
  const remaining = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--html') {
      if (custom || !args[i + 1]) throw Error('Pass --html once with the matching published HTML path.');
      custom = true; htmlFile = path.resolve(args[++i]);
    } else remaining.push(args[i]);
  }
  if (remaining.length !== 1 || !/^\d+(?::\d+)?$/.test(remaining[0]))
    throw Error('Usage: npm run locate -- LINE[:COLUMN] [--html path/to/matching-index.html]');
  const [line, column = 1] = remaining[0].split(':').map(Number);
  if (!custom) require('./sync-inline.cjs').sync(path.resolve(__dirname, '..'), true);
  const result = locate(fs.readFileSync(htmlFile, 'utf8'), line, column);
  console.log(result ? `${result.file}:${result.line}:${result.column}` : `${htmlFile}:${line}:${column} (HTML shell/boundary; no source mapping)`);
  if (custom) console.log('Mapped using the supplied HTML; source contents must come from that same version.');
}
if (require.main === module) {
  try { main(process.argv.slice(2)); }
  catch (e) { console.error(e.message); process.exitCode = 1; }
}
module.exports = { locate };
