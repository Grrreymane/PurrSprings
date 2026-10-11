// Real-browser repros (stage 5 audit) - headless Chrome over the DevTools protocol, no files written into the game:
//   node D:/Minigame/Hotelgame/tests/audit_crp_browser.js [touchaudio] [crashpanel] [perf] [memory]   (default: the first three)
// The page is index.html served from memory with the TEST_HOOK replaced by `window.__eval = s => eval(s)` (closure access).
//   touchaudio  a touch tap on the title's start button: is the AudioContext running afterwards? (pointerdown is not a user
//               activation for touch in Chrome; WORKFLOW 2: create / resume audio in pointerup / touchend / click / keydown)
//   crashpanel  the crash panel says "tap here to reload": does a touch tap reload? (window touchend preventDefault eats the click)
//   perf        SPEC 14.2 P1 picture (night, garden, a following VIP, 40 guests) at 390x844 DPR 3: real update + render ms
//   memory      renderer / GPU process private memory over 80 min of play, and with the sprite caches dropped (slow: ~8 min)
const { spawn, execFileSync } = require('child_process');
const path = require('path'), fs = require('fs'), http = require('http'), os = require('os');
const GAME = path.resolve(__dirname, '..');
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p));
const want = process.argv.slice(2).length ? process.argv.slice(2) : ['touchaudio', 'crashpanel', 'perf'];
const html = fs.readFileSync(path.join(GAME, 'index.html'), 'utf8').replace('/*TEST_HOOK*/', () => "window.__eval = s => eval(s); if (location.hash === '#noloop') { window.__gameBooted = true; return; }");
const srv = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  if (u === '/' || u === '/game.html') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(html); return; }
  const p = path.join(GAME, u); if (!p.startsWith(GAME) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200); fs.createReadStream(p).pipe(res);
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
let bad = 0;
srv.listen(0, async () => {
  const HTTP = 'http://127.0.0.1:' + srv.address().port, PORT = 9400 + Math.floor(Math.random() * 400), prof = path.join(os.tmpdir(), 'purr_audit_prof_' + PORT);
  const ch = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + prof, '--no-first-run', '--no-default-browser-check', '--autoplay-policy=document-user-activation-required', 'about:blank'], { stdio: 'ignore' });
  let ws = null;
  for (let i = 0; i < 60 && !ws; i++) { await sleep(200); try { const j = await (await fetch('http://127.0.0.1:' + PORT + '/json/list')).json(); const pg = j.find(t => t.type === 'page'); if (pg) ws = pg.webSocketDebuggerUrl; } catch (e) {} }
  const sock = new WebSocket(ws); let id = 0; const pend = new Map();
  sock.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
  await new Promise(r => sock.onopen = r);
  const send = (method, params) => new Promise(r => { const i = ++id; pend.set(i, r); sock.send(JSON.stringify({ id: i, method, params: params || {} })); });
  const ev = async (expr, awaitP) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: !!awaitP, returnByValue: true }); return r.result && r.result.result ? r.result.result.value : r; };
  const inGame = code => ev('__eval(' + JSON.stringify(code) + ')');
  const open = async (hash, touch) => {
    await send('Emulation.setTouchEmulationEnabled', { enabled: !!touch, maxTouchPoints: touch ? 5 : 1 });
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
    await send('Page.navigate', { url: HTTP + '/game.html?' + Date.now() + (hash || '') }); await sleep(2500);
  };
  const tap = async (x, y) => { await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await sleep(60); await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(400); };
  const canvasXY = async (lx, ly) => { const r = await ev('(() => { const c = document.getElementById("c").getBoundingClientRect(); return [c.left, c.top, c.width, c.height]; })()'); return [r[0] + lx / 180 * r[2], r[1] + ly / 320 * r[3]]; };
  await send('Page.enable'); await send('Runtime.enable');
  try {
    if (want.includes('touchaudio')) {
      await open('', true);
      const [x, y] = await canvasXY(90, 212); await tap(x, y);
      const s1 = await inGame('AC ? AC.state : null'), st = await inGame('state');
      const [x2, y2] = await canvasXY(90, 160); await tap(x2, y2);
      const s2 = await inGame('AC ? AC.state : null');
      console.log(`touchaudio: 1st tap (start button -> ${st}): AudioContext ${s1} | 2nd tap: ${s2}`);
      if (s1 !== 'running') { bad++; console.log('  FAIL the first tap does not start the sound (pointerdown only; add initAudio() to pointerup)'); }
    }
    if (want.includes('crashpanel')) {
      for (const how of ['touch', 'mouse']) {
        await open('', how === 'touch');
        await ev('window.__mark = 1; window.__gameErr("TypeError: test @1:1"); 1');
        const r = await ev('(() => { const b = document.getElementById("game-err").getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; })()');
        if (how === 'touch') await tap(r[0], r[1]);
        else { await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: r[0], y: r[1], button: 'left', clickCount: 1 }); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: r[0], y: r[1], button: 'left', clickCount: 1 }); }
        await sleep(1500); const reloaded = (await ev('window.__mark')) !== 1;
        console.log(`crashpanel: ${how} tap on "点这里重新加载" -> reloaded: ${reloaded}`);
        if (!reloaded) { bad++; console.log('  FAIL the crash panel cannot be tapped to reload (' + how + ')'); }
      }
    }
    if (want.includes('perf')) {
      await open('#noloop', false);
      await inGame(`(() => { const DT = 1/30; newGame(); S.tut.moved = true;
        for (const u of UNLOCKS) if (!u.need5 || u.id === 'h_straw' || u.id === 'p_shiba') { S.unlocked[u.id] = true; S.paid[u.id] = u.price; }
        for (const rm of ROOMS) if (roomOpen(rm) && !S.rooms[rm.id]) S.rooms[rm.id] = 'clean';
        S.peak = 5; S.done = true; S.equip = { hat: 'h_straw', pet: 'p_shiba' }; S.clock = .85;
        for (const sl of DSLOTS) if (roomOpen(sl.rm)) S.decor[sl.key] = sl.k === 'A' ? 'd_scroll' : 'd_ikebana';
        resetWorld(); go('play'); for (let i = 0; i < 30 * 40; i++) { update(DT); if (state === 'celebrate') { S.done = true; go('play'); } }
        window.__garden = []; for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) { const ar = areaAt(tx, ty); if (ar && ar.id === 'garden' && walkable(tx, ty)) __garden.push([tx, ty]); }
        window.__crowd = () => { while (GUESTS.length < GUEST_MAX) { const q = Q.length < QSPOTS.length - 1; addGuest(); if (q) continue; const gu = GUESTS[GUESTS.length - 1]; Q.splice(Q.indexOf(gu), 1); const t = __garden[Math.floor(Math.random() * __garden.length)]; gu.x = tcx(t); gu.y = tcy(t); guestLeave(gu, false); } };
        __crowd(); P.x = tcx([30, 22]); P.y = tcy([30, 23]);
        window.__keepVip = () => { if (!VIPG) vipArrive(); if (VIPG.st !== 'follow') { VIPG.x = P.x + 12; VIPG.y = P.y + 4; setSt(VIPG, 'follow'); VIPG.q = []; VIPG.halt = false; VIPG.greetAt = S.stats.time; } VIPG.t = 0; };
        __keepVip(); for (const id in S.piles) S.piles[id] = 50; updCam(0, true); return 1; })()`);
      const run = `(() => { const DT = 1/30, ts = []; for (let i = 0; i < 330; i++) { const a = i / 90 * Math.PI * 2; botMove = { x: Math.cos(a) * .5, y: Math.sin(a) * .4 }; __crowd(); __keepVip();
          const t0 = performance.now(); update(DT); render(); if (i >= 30) ts.push(performance.now() - t0); } botMove = null; ts.sort((a, b) => a - b);
          return 'avg ' + (ts.reduce((a, b) => a + b, 0) / ts.length).toFixed(2) + ' p95 ' + ts[Math.floor(ts.length * .95)].toFixed(2) + ' max ' + ts[ts.length - 1].toFixed(2) + ' ms | guests ' + GUESTS.length + ' lamps ' + LIGHT_N + ' vip ' + (VIPG && VIPG.st) + ' night ' + dayLight().night.toFixed(2); })()`;
      await inGame(run); console.log('perf: P1 night/garden/VIP/40 guests, real Chrome, update + render per frame:', await inGame(run));
    }
    if (want.includes('memory')) {
      await open('#noloop', false);
      const TAG = path.basename(prof), ps1 = "Get-CimInstance Win32_Process -Filter \"name='chrome.exe'\" | ForEach-Object { [string]$_.ProcessId + '|' + $_.PrivatePageCount + '|' + $_.CommandLine }";
      const mem = async () => { await send('HeapProfiler.collectGarbage'); await sleep(1500);
        const L = execFileSync('powershell', ['-NoProfile', '-Command', ps1], { maxBuffer: 1 << 26 }).toString().split(/\r?\n/).filter(l => l.includes(TAG) && /--type=(renderer|gpu-process)/.test(l));
        let r = 0, g = 0; for (const l of L) { const p = l.split('|'); if (l.includes('--type=renderer')) r = Math.max(r, +p[1]); else g += +p[1]; } return 'renderer ' + (r / 1e6).toFixed(0) + ' MB, gpu ' + (g / 1e6).toFixed(0) + ' MB'; };
      await inGame(`window.__drv = (() => { let path = [], key = '', think = 0; return dt => { think -= dt; if (think <= 0) { think = .3; const t = S.tut.moved ? guideTarget() : { tx: 17, ty: 24 };
        if (!t || t.here) { path = []; key = ''; } else if (t.tx + ',' + t.ty !== key || !path.length) { key = t.tx + ',' + t.ty; const [sx, sy] = tileOf(P); path = findPath(sx, sy, t.tx, t.ty) || []; } }
        if (path.length) { const [tx, ty] = path[0], cx = tx * 16 + 8, cy = ty * 16 + 8, dx = cx - P.x, dy = cy - P.y, d = Math.hypot(dx, dy); if (d < 1.5) path.shift(); botMove = d > .01 ? { x: dx / d * Math.min(1, d / 3), y: dy / d * Math.min(1, d / 3) } : null; } else botMove = null; }; })(); newGame(); 1`);
      console.log('memory: boot', await mem(), '| ART', await inGame('Object.keys(ART).length'));
      for (let c = 1; c <= 2; c++) {
        await inGame(`for (let i = 0; i < 30 * 60 * 40; i++) { __drv(1/30); update(1/30); if (i % 3 === 0) render(); if (state === 'celebrate') { S.done = true; go('play'); } } 1`);
        console.log('memory: ' + c * 40 + ' min', await mem(), '| ART', await inGame("Object.keys(ART).length + ' FLIPS ' + FLIPS.size + ' TXC ' + TXC.size"));
      }
      await inGame("for (const k in ART) delete ART[k]; FLIPS.clear(); TXC.clear(); GHOSTS.clear(); FACES.clear(); 1");
      console.log('memory: sprite caches dropped', await mem());
    }
  } catch (e) { bad++; console.log('ERROR', e); }
  sock.close(); ch.kill(); srv.close();
  setTimeout(() => { try { fs.rmSync(prof, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 }); } catch (e) {} console.log(bad ? 'BROWSER AUDIT: ' + bad + ' FAIL' : 'BROWSER AUDIT OK'); process.exit(bad ? 1 : 0); }, 2000);
});
