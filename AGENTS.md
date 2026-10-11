# 猫猫温泉旅馆：项目维护约定

本目录的游戏代码以 `src/` 为准。发布仍是单个 `index.html`（GitHub Pages 直接用，玩家端没有构建步骤），但不要在 HTML 中直接维护游戏逻辑。

- 修改玩法、数据、界面、美术或音频时，编辑对应的 `src/` 文件，然后运行 `npm run sync` 和 `npm test`。
- **禁止直接编辑 `index.html` 的 `// ==== source:src/... ====` 与对应结束标记之间的生成内容。** 同步会用源码覆盖这些区域。如果发现有人直接改过，先比较并把需要保留的修改迁回对应源码，再同步，不要直接覆盖。
- 生成区之外的页面外壳在 HTML 中直接维护：`<head>`、字体块（`subset_font.py` 生成）、CSS、报错面板脚本、游戏脚本开头的 `(() => { 'use strict'; const SCRIPT_TEXT = …` 和结尾的 `})();`。
- 全部源码按 `src/modules.json` 的顺序拼进同一个函数作用域，不是 ES Module，没有 import。新增或移动文件时同时更新清单和 HTML 中的成对标记；不得改变执行顺序（清单不能按字母排），不得改成异步加载。
- **美术 / 音频代理**：直接改 `src/art/*.js`（ART 块，SPEC_v2 第 12 节）或 `src/audio/engine.js`（AUDIO 块，第 13 节），再 `npm run sync` 和 `npm test`；不再单独拷一份 `art/*.js` 去整段替换。`/*ART:x:BEGIN*/…END*/`、`/*AUDIO:BEGIN*/…END*/` 标记留在源码里，不要删；这些文件里不许有中文（`npm test` 会查）。一个块分在几个文件时，新函数放进最贴近的那个文件。
- `/*TEST_HOOK*/` 只在 `src/boot.js` 出现一次（`headless.js`、`make_test_page.py` 靠它）。
- 改了游戏文字后运行 `python D:/Minigame/_workflow/tools/subset_font.py D:/Minigame/Hotelgame`（`src/` 也会被扫描）。
- 测试：`npm test` = 布局检查 + 同步检查 + 报错定位 + 冒烟 / 地图 / 界面三项 headless 测试（约 10 秒）。改得多时再跑 `npm run test:full` 和 `node tests/balance_all.js`。单个测试照旧：`node D:/Minigame/_workflow/tools/headless.js . tests/xxx.js --seed N`。
- 报错定位：玩家截图里的 `@行:列` 用 `npm run locate -- 行:列` 换成 `src/…js:行:列`。必须用出错那一版的 HTML，历史版本加 `--html 路径`。
- 提交时源码和同步后的 `index.html` 一起提交。截图、测试输出放 `.shots/`（已忽略）。

目录地图、验证和维护流程见 [docs/source-layout.md](docs/source-layout.md)。

## 换引擎提醒

接到较大需求时对照 `D:/Minigame/CLAUDE.md` 的「技术栈与换引擎提醒」信号表；命中时在汇报末尾用一两句说明信号、建议方案和迁移代价，由用户决定，不擅自迁移。
