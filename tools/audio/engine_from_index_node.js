// node: the audio engine's source, cut from the game's index.html (between the AUDIO:BEGIN and AUDIO:END marker lines)
const fs = require('fs'), path = require('path');
module.exports = function engineSource() {
  const s = fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf8').replace(/\r\n/g, '\n');
  const a = '\n/*AUDIO:' + 'BEGIN*/\n', b = '\n/*AUDIO:' + 'END*/', i = s.indexOf(a), j = s.indexOf(b, i + 1);
  if (i < 0 || j < i) throw new Error('no AUDIO block in index.html');
  return s.slice(i + a.length, j);
};
