'use strict';
// Copy only the files players need into dist/ (npm run build:web): the inlined index.html and the pixel font.
// Used by the 1GP publisher (build_script "build:web", output_directory "dist").
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const out = path.join(root, 'dist');
fs.rmSync(out, { recursive: true, force: true });
for (const file of ['index.html', 'fonts/pixel.woff2', 'fonts/OFL-fusion-pixel.txt']) {
  fs.mkdirSync(path.dirname(path.join(out, file)), { recursive: true });
  // Rewrite rather than copyFileSync: on Windows a copy keeps the old mtime, and 1GP checks the output is fresh.
  fs.writeFileSync(path.join(out, file), fs.readFileSync(path.join(root, file)));
}
console.log('dist/ ready');
