# 代码目录与维护流程

2026-10-10（v2.0 上线后，基线提交 `91df539`）：`index.html` 约 8550 行，过了工作区「单文件约 8000 行」的信号线，照一喵天下的做法拆成 `src/`。沿现有的 `// ====` 分区和 ART / AUDIO 块，把游戏脚本**原样**切成 39 个源码文件，按原顺序嵌回同一个脚本：共享作用域、执行顺序、启动时机都不变。这里的「模块」只是维护用的文件，不是 ES Module。

## index.html 里有什么

- **生成区**：`// ==== source:src/x.js ====` 到 `// ==== end source:src/x.js ====` 之间，由 `npm run sync`（`tools/sync-inline.cjs`）从源码写入。别手改。
- **手工维护**（不在 `src/`）：`<head>`（meta、OG、标题）、字体块 `<!-- font:start -->…<!-- font:end -->`（`subset_font.py` 生成）、CSS、canvas、报错面板脚本（第一个 `<script>`）、游戏脚本外壳 `(() => { 'use strict'; const SCRIPT_TEXT = …` 和结尾 `})();`，以及生成区之间的空行。
- `SCRIPT_TEXT` 是整段游戏脚本的文字（含标记行）。标记行是纯 ASCII，不影响 `ALLTEXT` 和字体子集。

## 找到要改的位置

| 文件 | 行 | 负责内容 |
| --- | ---: | --- |
| `src/core/constants.js` | 19 | 画面尺寸、字体、地图尺寸、小工具（`rand / clamp / fmt / mk / load / save`） |
| `src/ui/pixel-painter.js` | 96 | 像素画板 `paint / Grid / rows / makeSpr / lit / eyeG …` |
| `src/art/stubs.js` | 8 | ART 总说明 + `/*ART:stubs*/`（占位，12.4；现在是空的） |
| `src/art/stubs-v21a.js` | 2 | v2.1 核心 A 的美术占位，合并后已清空（`seasonIcon lanternIcon trophyArt coverArt medalArt chochinString seasonWarm snowCapArt` 都由 `src/art/*` 的真美术提供） |
| `src/art/stubs-v21b.js` | 3 | v2.1 核心 B 的美术占位，合并后已清空（神社件、屋台、烟花、庭院摆设、衣服 / 制服图标、奖杯 / 封面 / 奖章、季节图标都由真美术提供；核心画的只剩美术合同没列的：价格圈 / 菜单的几个图标、陪站 / 带去看的愿望气泡、纪念品） |
| `src/art/chars.js` | 1171 | `/*ART:chars:BEGIN*/`：猫的头、帽子、服装、站 / 走 / 坐 / 泡澡 / 睡 / 鞠躬（`catSprite / catSit / catBathing / catSleepHead / catBow`） |
| `src/art/chars-small.js` | 432 | 小猫、宠物、团成球的猫（`kittenSprite / kittenSit / petSprite / catCurl`）`/*ART:chars:END*/` |
| `src/art/env.js` | 1650 | `/*ART:env:BEGIN*/`：场景调色板、墙、地板（含 v2）、自然（私有 `_en*`） |
| `src/art/env-api.js` | 876 | 场景对外函数（`tileArt / waterArt / doorArt / glowArt …`）+ v2 新增 `/*ART:env:END*/` |
| `src/art/objects.js` | 692 | `/*ART:objects:BEGIN*/`：v1 家具、图标（`deskArt / futonArt / padIcon / arrowArt …`） |
| `src/art/objects-v2.js` | 1152 | v2 物件：食堂、摆设、杂货铺 + 百货、庭园、贵宾纪念品 |
| `src/art/objects-ui.js` | 731 | v2 图标、纹章、菜单 / HUD、价格圈图标 `/*ART:objects:END*/` |
| `src/ui/input.js` | 69 | 画布适配、触控摇杆、键盘、`botMove` 测试钩子 |
| `src/audio/engine.js` | 1052 | `/*AUDIO:BEGIN*/…END*/` 整段：合成音效、曲子、编配、环境音、`MUSIC_DBG` |
| `src/audio/hooks.js` | 6 | 核心这边的 `sfx() / vib()`，切后台存档、pagehide 关 AudioContext |
| `src/ui/drawing.js` | 82 | 文字队列 `txt`、`textW`、面板、按钮、飘字、`drawA / drawObj / ring` |
| `src/data/map.js` | 203 | 地块图 `MAP`、区域、15 间客房、门、站位、取物圈、座位 |
| `src/data/tables-v21a.js` | 85 | v2.1 核心 A 的数据（在 `tables.js` 之前）：四季、季节摆设 `UNLOCKS_V21A` + 组合 `COMBOS_V21A`、祭典 / 记者 / 年度大赏 / 猫妈妈的常数、台词 E01–E12 |
| `src/data/tables-v21b.js` | 128 | v2.1 核心 B 的数据：`UNLOCKS_V21B`（衣服、制服、宠物、金摆设、庭院摆设、神社、广场、烟花）、稀客表 `RARES`、物件 `PROPS_V21B`（由 `tables.js` / `pathfinding.js` 拼进去） |
| `src/data/tables.js` | 200 | 解锁表 `UNLOCKS`、`STARS`、客人类型、组合、贵宾、对手旅馆、昼夜、全部常数 |
| `src/core/state-save.js` | 204 | `defaults / migrateV1 / loadState / saveNow`、收费 `fee`、价格圈 `padsUpdate` |
| `src/core/pathfinding.js` | 162 | `BLOCK`、物件 `PROPS`、BFS `findPath`、走路、碰撞（门口吸附 `laneOff`，18.2） |
| `src/core/entities.js` | 86 | 掌柜 `P`、`GUESTS / STAFF / RUN` 等运行表、人气 ♥ / 金★、员工等级、`earn` |
| `src/systems/guests.js` | 291 | 客人类型、跟随者、选房、呼叫、食堂座位、`updGuest`、`checkIn` |
| `src/systems/staff.js` | 223 | `STAFF_DEF`、员工、配膳、仲居、账房 |
| `src/systems/decor.js` | 140 | 摆设 + 组合；也放着横幅队列 `banner()` 和画外标记 `edgeNew()` |
| `src/systems/vip.js` | 135 | 贵宾 |
| `src/systems/daynight.js` | 40 | 昼夜、灯 |
| `src/systems/boutique.js` | 87 | ★5 狸老板百货、试戴、宠物、金像 |
| `src/systems/zones.js` | 154 | 站上去就干活的区域：接待、打扫、毛巾、鱼干、倒钱、托盘 |
| `src/systems/unlock.js` | 66 | 买下（`unlock`）、买下后的台词与弹出 |
| `src/systems/guide.js` | 303 | 箭头 `guideTarget()`（也是机器人的大脑）、气泡 |
| `src/systems/wardrobe.js` | 97 | v2.1 百货完整版（16.6）：衣服 / 制服 / 宠物 / 金摆设、买下后的 `unlockB`、小狸的灯笼、招财猫招手 |
| `src/systems/rare.js` | 184 | v2.1 稀客（16.7）：到期、占贵宾的位置、陪站 / 带去看、小猫三兄弟、愿望气泡、纪念品 |
| `src/systems/vipguide.js` | 125 | v2.2 贵宾「去哪做」（19.1）：只要做得出的愿望、发光的地方 + 牌子、`[地方] › [物品]` 泡泡 / 箭头小图、每种愿望的图示卡 |
| `src/systems/business.js` | 240 | v2.2 营业压力（19.2）：口碑（每位客人的星、傍晚小结）、傍晚高峰、鱼干堆上限（`deposit`）、HUD 小钟、存档 `S.rep`；v2.3 五星大高峰（19.3）：急客、只有掌柜能送的东西、大堂等候、高峰成绩 / 大成功 |
| `src/systems/shrine.js` | 47 | v2.1 猫神社（16.8）：等级、收费 +1%、鸟居变淡、神社 / 商店里的镜头边距 |
| `src/systems/plaza.js` | 142 | v2.1 祭典广场（16.9）：烟花、屋台（夜市）、客人买屋台；核心 B 的 `tickB / resetB / loadStateB` |
| `src/core/update.js` | 88 | 状态机 `go`、`update / gameUpdate`、镜头、`audioTick` |
| `src/ui/render-world.js` | 260 | 静态层 `rebuildWorld`、猫、价格圈、被褥、`drawScene` |
| `src/ui/render.js` | 414 | 夜间光照、世界分层（亚像素镜头：`worldBegin / worldFlush`、掌柜自己的小层 `playerLayer / attachLayer`，18.2）、覆盖层、箭头、HUD、`render()` |
| `src/systems/lines.js` | 118 | 猫猫台词（SPEC_v2 第 8 节） |
| `src/systems/seasons.js` | 245 | v2.1 四季（16.1）：日历、换季横幅 + 重建、季节收费、粒子 / 萤火虫 / 满月、冬天蒸汽和雪帽、季节组合的重新布置；核心 A 的总入口 `v21aReset / v21aTick`、存档字段 `loadV21a`、HUD 第二行、横幅、大堂北墙 |
| `src/systems/festival.js` | 96 | v2.1 季节祭典（16.2）：灯笼进度、提灯串、夏天烟花、奖励 |
| `src/systems/press.js` | 90 | v2.1 记者 / 电视台（16.4）：插队、四项打分、结果卡、「人气爆棚」、箭头 2b |
| `src/systems/yearly.js` | 90 | v2.1 年度大赏（16.3）+ 暂停卡片（`state 'card'`、`MODAL_Q`）：年报卡、奖杯、殿堂旅馆 |
| `src/systems/mom.js` | 75 | v2.1 猫妈妈（16.5）：走贵宾流程、全家福（按数据重画）、大堂北墙的小相框 |
| `src/ui/cards.js` | 243 | 说明卡 + 预览、横幅、「新」标记、首次图示卡、`uiUpdate` |
| `src/ui/menu.js` | 235 | 菜单、声音页、图鉴、已购、旅馆页 |
| `src/ui/minimap.js` | 44 | v2.1 小地图（16.10，旅馆页的「地图」） |
| `src/ui/menu-v21b.js` | 205 | v2.1 菜单「装扮」页、图鉴的稀客 / 纪念 / 装扮分页、核心画的图标、横幅、台词登记 |
| `src/ui/title.js` | 67 | 点按 `onPress`、`resetWorld / newGame / continueGame`、标题、庆祝 |
| `src/ui/share.js` | 66 | 分享卡、二维码 |
| `src/ui/cover.js` | 59 | `#cover` 封面 `renderCover` |
| `src/ui/present.js` | 40 | 像素层 + 清晰文字输出、文字精灵缓存、字体预载 |
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
