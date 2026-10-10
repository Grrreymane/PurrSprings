// Loads the audio engine from the game's index.html (the block between the AUDIO:BEGIN and AUDIO:END marker lines;
// index.html is its only copy since the v2.0 merge) as a classic inline script, so its top-level let / const become
// globals for the page's next <script>. Serve the game folder over http (python -m http.server; render.py does it).
(function () {
  const x = new XMLHttpRequest(); x.open('GET', '../../index.html?t=' + Date.now(), false); x.send();
  const s = x.responseText.replace(/\r\n/g, '\n'), a = '\n/*AUDIO:' + 'BEGIN*/\n', b = '\n/*AUDIO:' + 'END*/', i = s.indexOf(a), j = s.indexOf(b, i + 1);
  if (i < 0 || j < i) { document.title = 'ERR no AUDIO block in index.html'; throw new Error('no AUDIO block in index.html'); }
  const el = document.createElement('script'); el.textContent = s.slice(i + a.length, j); document.head.appendChild(el);
})();
