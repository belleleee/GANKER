# 发家之路

原生 JavaScript + Three.js r128 的多页面经营游戏。每个页面按 HTML 中的普通 `<script>` 顺序加载，共享页面内的全局作用域；页面之间通过同源 `localStorage` 存档交换数据。

## 入口与运行

| 页面 | 用途 |
| --- | --- |
| `index.html` | 项目入口与账号选择 |
| `game.html` | 主屋、农场、茶场、剧情和存档 |
| `coin-game/index.html` | 钱滚钱商店 |
| `investment-room/index.html` | 股市小屋 |
| `line-art-cafe/index.html` | 咖啡馆 |
| `tea-hut/index.html` | 独立茶屋页面 |
| `jourmal.html` | 个人日志 |

在项目根目录运行 `python3 -m http.server 8000`，打开 `http://127.0.0.1:8000/`。Three.js 统一从根目录的 `three.min.js` 加载，不依赖运行时 CDN。

改动脚本路径或 CSS 导入后运行 `node scripts/check-structure.mjs`。它检查页面引用、样式导入和所有游戏脚本的语法。

## 代码结构

```text
css/style.css                  主游戏样式入口；具体样式在 css/modules/
js/01-core-setup.js            Three.js、场景、材质与通用构造函数
js/02-...js/09-...             主屋场景、玩家与天气
js/crop-types.js               作物类型数据
js/10-...js/18-...             主循环、农田、工具、商店与报刊
js/tea-farm/01-core-hut.js     茶场状态、制茶流程与小屋
js/tea-farm/02-field-plants.js 茶田、茶树与环境模型
js/tea-farm/03-harvest-workers.js 采摘、更新与雇员
js/tea-farm/04-collisions-save.js 碰撞、建场与存档接口
js/20-...js/32-...             子游戏入口、主线、成就、引导等
js/15-app-shell.js             主游戏账号、钱包与存档；在 game.html 最后加载
coin-game/                     硬币游戏的页面、样式与脚本
investment-room/               股市页面；js/ 按 core、market、scene 等分层
line-art-cafe/                 咖啡馆页面、样式与脚本
tea-hut/                       独立茶屋页面
prologue/assets/               序章图像与音频资源
scripts/check-structure.mjs    路径与语法检查
```

`game.html` 和各子页面的脚本顺序是依赖顺序。新增功能应放在对应系统的文件中，并在页面入口明确登记，不要靠文件名自动加载。

## 存档边界

主游戏、钱滚钱商店和股市小屋使用同一个 `magicCabin.save.<用户id>.v1` 键。主游戏的 `js/15-app-shell.js` 负责整体存档，并保留子游戏管理的 `economy.coinGame`、`economy.investment`；子游戏只更新自己拥有的部分和共享金币。剧情产生的 `pendingMarketEvents` 由主游戏写入，股市小屋读取、排期并清空，避免重复结算。

修改跨页面数据时，要验证进入子页面、刷新、返回主屋和主屋自动存档四条路径。
