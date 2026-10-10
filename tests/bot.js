// Kept so the old command lines still work: tests/bot.js = tests/bot_balance.js (the SPEC_v2 14.1 bot: profiles eager /
// casual / novice / afk / ignore / shopper, 14.2 metrics, 14.3 invariants). Same arguments:
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/bot.js --seed 1 -- eager [maxMin] [json] ...
// Run from the game folder (the path below is relative to the working directory).
eval(require('fs').readFileSync(require('path').resolve('tests/bot_balance.js'), 'utf8'));
