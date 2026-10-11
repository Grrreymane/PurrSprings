# v2.1「温泉乡四季」构建计划（2026-10-11）

设计：`docs/SPEC_v2.md` 第 16 节（以它为准）+ 下面的修正。基线：v2.0.1（commit `ca2c90f`，已上线）。
用户最近的要求：四季 + 掌柜衣服放进这一版；**自己试玩时要看「好不好玩」**，不只看指标（见 WORKFLOW 第 3 节、`docs/FEEDBACK_v2.0.md`）。

## 对第 16 节的修正（v2.0.1 之后的现实）

- 房间呼叫现在由「茶房」员工送（`docs/FEEDBACK_v2.0.md` G3），16.1「夏 牛奶呼叫几率 ×1.5」改成「夏 牛奶机收入 ×1.5」。
- 字体只有像素体（Fusion Pixel），文字宽度一律用 `textW()` 量。
- 新玩法不能让玩家变忙变烦：祭典、记者、猫妈妈、稀客都是**惊喜和奖励**，不是新的打卡任务；没做到也不罚（第 16 节已经这么写，实现时守住）。
- 稀客的「🧘 陪站 / 🌸 带去看」要和贵宾一样清楚（大号金色愿望气泡 + 箭头图标），照 v2.0.1 G1 的做法。
- 季节粒子（花瓣、萤火虫、落叶、雪）慢、少、不闪，夜里也不晃眼。

## 分工（六个代理，各在自己的 git worktree 里；同一个文件尽量只一个人改）

| 代理 | 做什么（第 16 节） | 自己的文件（新文件要登记进 `src/modules.json`） | 共享文件（只加最小的钩子，报告里列清楚） |
|---|---|---|---|
| 核心 A | 16.1 四季日历 + 季节效果 + 季节摆设和组合、16.2 季节祭典、16.3 年度大赏、16.4 记者 / 电视、16.5 猫妈妈、16.12 台词、16.13 存档字段（本组的） | `src/systems/seasons.js`、`festival.js`、`yearly.js`、`press.js`、`mom.js`（新）、`src/data/tables-v21a.js`（新：本组数据）、`src/art/stubs-v21a.js`（新：本组要用的美术占位） | `tables.js`、`guide.js`、`render.js`、`cards.js`、`menu.js`、`state-save.js`、`update.js`、`lines.js`、`unlock.js`、`guests.js` |
| 核心 B | 16.6 百货完整版（掌柜衣服、员工制服、宠物、金摆设 + 菜单「装扮」页）、16.7 庭院摆设 + 稀客、16.8 猫神社、16.9 祭典广场 + 屋台 + 烟花、16.10 小地图 + 图鉴分页 | `src/systems/wardrobe.js`、`rare.js`、`shrine.js`、`plaza.js`（新）、`src/ui/minimap.js`（新）、`src/data/tables-v21b.js`（新）、`src/art/stubs-v21b.js`（新） | 同上；`boutique.js`、`map.js`（神社、广场的格子） |
| 场景美术 | 16.14「场景」：`tileArt` 四季配色、`treeArt(kind, season, size)` 四季、雪 / 冬天的汤、`wallDecorArt` 加 `trophy cover family`、神社 `hokoraArt(lv) toriiArt komainuArt shrineLanternArt`、`chochinString` | `src/art/env.js`、`src/art/env-api.js` | — |
| 物件美术 | 16.14「物件 / 图标」：季节摆设 8 + 金摆设 4、庭院摆设 8、屋台 4、奖杯 / 封面 / 奖章、衣服 / 制服 / 宠物图标、季节图标、灯笼进度 | `src/art/objects*.js` | — |
| 角色美术 | 16.14「角色」：掌柜衣服 8 套、员工制服调色板、宠物 fox tanuki crane、配件、记者 / 主持 / 摄影猫 / 猫妈妈 / 8 位稀客 | `src/art/chars*.js` | — |
| 音频 | 16.11：季节层、祭典之夜、神社、新音效 `firework bellShrine stamp`（**轻、不吵**，照 v2.0.1 S1 的标准） | `src/audio/engine.js` | — |

- 美术函数的名字、参数、尺寸照第 16.14 节；那里没写死的，美术代理定，并在报告里写清楚（核心代理先用占位，合并时对齐）。
- 占位只写 `function` 声明（后面的真美术会覆盖），合并后删掉被覆盖的。
- 核心 A 和核心 B 都会改 `tables.js / guide.js / menu.js` 等共享文件：**新数据放自己的新文件**，共享文件里只加一两行钩子（例如在 `UNLOCKS` 末尾 `...UNLOCKS_V21A`）。
- 每个代理：改 `src/` → `npm run sync` → `npm test` + 相关 `tests/`；美术出精灵表自检（WORKFLOW 第 4 节）；核心写本组的 `tests/sys_*.js`；提交在自己的分支上，不推送、不合并。

## 之后

合并（我来）→ 全量测试 + `balance_all` → **好玩度试玩审查**（新玩家视角 + 五星后玩家视角，各走一遍每个新系统）→ 修 → 上线。
