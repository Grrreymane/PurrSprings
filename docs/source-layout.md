# 代码目录与维护流程

2026-10-10（v2.0 上线后，基线提交 `91df539`）：`index.html` 约 8550 行，过了工作区「单文件约 8000 行」的信号线，照一喵天下的做法拆成 `src/`。沿现有的 `// ====` 分区和 ART / AUDIO 块，把游戏脚本**原样**切成 39 个源码文件，按原顺序嵌回同一个脚本：共享作用域、执行顺序、启动时机都不变。这里的「模块」只是维护用的文件，不是 ES Module。

## index.html 里有什么

- **生成区**：`// ==== source:src/x.js ====` 到 `// ==== end source:src/x.js ====` 之间，由 `npm run sync`（`tools/sync-inline.cjs`）从源码写入。别手改。
- **手工维护**（不在 `src/`）：`<head>`（meta、OG、标题）、字体块 `<!-- font:start -->…<!-- font:end -->`（`subset_font.py` 生成）、CSS、canvas、报错面板脚本（第一个 `<script>`）、游戏脚本外壳 `(() => { 'use strict'; const SCRIPT_TEXT = …` 和结尾 `})();`，以及生成区之间的空行。
- `SCRIPT_TEXT` 是整段游戏脚本的文字（含标记行）。标记行是纯 ASCII，不影响 `ALLTEXT` 和字体子集。

## 找到要改的位置

| 文件 | 行 | 负责内容 |
| --- | ---: | --- |
| `src/core/constants.js` | 18 | 画面尺寸、字体、地图尺寸、小工具（`rand / clamp / fmt / mk / load / save`） |
| `src/ui/pixel-painter.js` | 96 | 像素画板 `paint / Grid / rows / makeSpr / lit / eyeG …` |
| `src/art/stubs.js` | 8 | ART 总说明 + `/*ART:stubs*/`（占位，12.4；现在是空的） |
| `src/art/chars.js` | 702 | `/*ART:chars:BEGIN*/`：猫的头、帽子、服装、站 / 走 / 坐 / 泡澡 / 睡 / 鞠躬（`catSprite / catSit / catBathing / catSleepHead / catBow`） |
| `src/art/chars-small.js` | 242 | 小猫、宠物、团成球的猫（`kittenSprite / kittenSit / petSprite / catCurl`）`/*ART:chars:END*/` |
| `src/art/env.js` | 716 | `/*ART:env:BEGIN*/`：场景调色板、墙、地板（含 v2）、自然（私有 `_en*`） |
| `src/art/env-api.js` | 483 | 场景对外函数（`tileArt / waterArt / doorArt / glowArt …`）+ v2 新增 `/*ART:env:END*/` |
| `src/art/objects.js` | 611 | `/*ART:objects:BEGIN*/`：v1 家具、图标（`deskArt / futonArt / padIcon / arrowArt …`） |
| `src/art/objects-v2.js` | 703 | v2 物件：食堂、摆设、杂货铺 + 百货、庭园、贵宾纪念品 |
| `src/art/objects-ui.js` | 409 | v2 图标、纹章、菜单 / HUD、价格圈图标 `/*ART:objects:END*/` |
| `src/ui/input.js` | 69 | 画布适配、触控摇杆、键盘、`botMove` 测试钩子 |
| `src/audio/engine.js` | 843 | `/*AUDIO:BEGIN*/…END*/` 整段：合成音效、曲子、编配、环境音、`MUSIC_DBG` |
| `src/audio/hooks.js` | 6 | 核心这边的 `sfx() / vib()`，切后台存档、pagehide 关 AudioContext |
| `src/ui/drawing.js` | 78 | 文字队列 `txt`、`textW`、面板、按钮、飘字、`drawA / drawObj / ring` |
| `src/data/map.js` | 143 | 地块图 `MAP`、区域、15 间客房、门、站位、取物圈、座位 |
| `src/data/tables.js` | 179 | 解锁表 `UNLOCKS`、`STARS`、客人类型、组合、贵宾、对手旅馆、昼夜、全部常数 |
| `src/core/state-save.js` | 184 | `defaults / migrateV1 / loadState / saveNow`、收费 `fee`、价格圈 `padsUpdate` |
| `src/core/pathfinding.js` | 143 | `BLOCK`、物件 `PROPS`、BFS `findPath`、走路、碰撞 |
| `src/core/entities.js` | 83 | 掌柜 `P`、`GUESTS / STAFF / RUN` 等运行表、人气 ♥ / 金★、员工等级、`earn` |
| `src/systems/guests.js` | 275 | 客人类型、跟随者、选房、呼叫、食堂座位、`updGuest`、`checkIn` |
| `src/systems/staff.js` | 173 | `STAFF_DEF`、员工、配膳、仲居、账房 |
| `src/systems/decor.js` | 136 | 摆设 + 组合；也放着横幅队列 `banner()` 和画外标记 `edgeNew()` |
| `src/systems/vip.js` | 122 | 贵宾 |
| `src/systems/daynight.js` | 40 | 昼夜、灯 |
| `src/systems/boutique.js` | 81 | ★5 狸老板百货、试戴、宠物、金像 |
| `src/systems/zones.js` | 144 | 站上去就干活的区域：接待、打扫、毛巾、鱼干、倒钱、托盘 |
| `src/systems/unlock.js` | 63 | 买下（`unlock`）、买下后的台词与弹出 |
| `src/systems/guide.js` | 281 | 箭头 `guideTarget()`（也是机器人的大脑）、气泡 |
| `src/core/update.js` | 86 | 状态机 `go`、`update / gameUpdate`、镜头、`audioTick` |
| `src/ui/render-world.js` | 250 | 静态层 `rebuildWorld`、猫、价格圈、被褥、`drawScene` |
| `src/ui/render.js` | 303 | 夜间光照、覆盖层、箭头、HUD、`render()` |
| `src/systems/lines.js` | 117 | 猫猫台词（SPEC_v2 第 8 节） |
| `src/ui/cards.js` | 212 | 说明卡 + 预览、横幅、「新」标记、首次图示卡、`uiUpdate` |
| `src/ui/menu.js` | 220 | 菜单、声音页、图鉴、已购、旅馆页 |
| `src/ui/title.js` | 64 | 点按 `onPress`、`resetWorld / newGame / continueGame`、标题、庆祝 |
| `src/ui/share.js` | 66 | 分享卡、二维码 |
| `src/ui/cover.js` | 59 | `#cover` 封面 `renderCover` |
| `src/ui/present.js` | 35 | 像素层 + 清晰文字输出、文字精灵缓存、字体预载 |
| `src/boot.js` | 15 | 读档、`/*TEST_HOOK*/`、逐帧循环 |
| `src/modules.json` | | 全部源码的嵌入顺序清单 |

有些东西还放在原来的分区里，本轮只按既有边界拆文件，没有移动代码：例如 `resetWorld / newGame` 在 `ui/title.js`，横幅队列在 `systems/decor.js`。

## ART / AUDIO 块（美术 / 音频合同，SPEC_v2 第 12、13 节）

| 块 | 文件（按顺序） | 谁改 |
| --- | --- | --- |
| `/*ART:stubs*/` | `art/stubs.js` | 核心 |
| `/*ART:chars*/` | `art/chars.js` → `art/chars-small.js` | 角色美术 |
| `/*ART:env*/` | `art/env.js` → `art/env-api.js` | 场景美术 |
| `/*ART:objects*/` | `art/objects.js` → `art/objects-v2.js` → `art/objects-ui.js` | 物件 / 图标 / UI 美术 |
| `/*AUDIO*/` | `audio/engine.js`（整段） | 音频 |

- BEGIN 标记在第一个文件开头，END 在最后一个文件结尾；标记不要删（`tools/audio/engine_from_index*.js` 仍从 `index.html` 读 AUDIO 块，用音频实验页前先 `npm run sync`）。
- 规矩照旧：只用模板工具、私有名字加前缀、不许 `Math.random`、文件里不许有中文（`tests/source-layout.cjs` 查 `src/art/`、`src/audio/` 全是 ASCII）。
- 改完 `npm run sync` + `npm test`，再出精灵表自检。

## 改动与验证

1. 修改对应源码文件（UTF-8 无 BOM，结尾留换行）。
2. `npm run sync`。它先检查全部源文件和边界，检查失败不会写入 `index.html`；谁来跑结果都一样（总是用全部源码重建），几个代理并行时也安全。
3. 改了游戏文字：`python D:/Minigame/_workflow/tools/subset_font.py D:/Minigame/Hotelgame`。纯搬移不改字，字体版本不变。
4. `npm test`：布局检查（`tests/source-layout.cjs`）、`sync-inline.cjs --check`、报错定位（`tests/source-location.cjs`）、冒烟 / 地图 / 界面 headless 测试。改得多时 `npm run test:full`（拆分基线那一整套）和 `node tests/balance_all.js`。
5. 源码和同步后的 `index.html` 一起提交。

新增文件：在 `src/modules.json` 和 HTML 对应位置同时加成对标记，顺序 = 执行顺序。漏登记、缺文件、重复、顺序不对、嵌套标记、BOM、HTML 过期都会让检查失败。注意执行顺序：函数声明会提升，但 `const / let` 和顶层语句按顺序执行（例如 `boot.js` 的 `S = loadState()` 要用到前面的 `STAFF_DEF`）。`tests/`、`tools/` 里的文件不进 `src/`。

报错定位：`npm run locate -- 5200:31` 把浏览器报错面板的 `@行:列` 换成 `src/…js:行:列`；历史版本用 `--html 路径` 指向当时的 HTML（`git show <提交>:index.html`）。headless 测试的 LOAD ERROR 行号是相对游戏 `<script>` 的，不能直接用它换算。

## 本轮验证记录（2026-10-10）

- `index.html` 去掉 78 行标记后与拆分前逐字节相同（SHA-256 `e69129f7…57dae1`，593,528 字节）；`git diff` 只有这 78 行新增。
- `sync-inline.cjs --check` 通过；每个源码文件单独能当严格模式函数体解析（切点都在顶层语句之间）。
- 拆分前后跑同一套命令：smoke 种子 1 / 2、map_check、migrate_v1、ui_check 种子 2、lines_check 种子 3、music_check 种子 1 输出逐字相同；perf_render 只有耗时毫秒数不同（计数全同）；`balance_all.js` 3 个种子 × 7 档：文字输出相同，JSON 里 21 局结果相同（只是并行完成的先后顺序不同）。
- 截图：封面、标题逐像素相同；西馆、分享卡两个场景本身就有小抖动（背景里走动的猫，拆分前连拍也会变），拆分后出现的画面和拆分前出现过的某一张逐像素相同。
- 字体版本 `4ff8e435` 不变。
