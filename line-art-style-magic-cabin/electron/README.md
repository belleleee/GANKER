# 桌面版打包

游戏本体是纯静态的 HTML/CSS/JS（无构建步骤），`electron/main.js` 只是
起一个 Electron 窗口加载 `../index.html`。

## 开发时试跑

```bash
npm install
npm start
```

## 打包成桌面应用

优先用 `electron-packager`（`pack:mac` / `pack:win`）——它直接复用
`npm install` 时已经下载好的本地 Electron 二进制，不会再单独发请求
下载，网络不稳的时候更可靠：

```bash
npm run pack:mac   # 产物在 dist/线稿风格魔女小屋-darwin-<arch>/
npm run pack:win   # 需要先联网让 electron-packager 拉一份 win32 的 Electron
```

`electron-builder`（`dist:mac` / `dist:win`）功能更全（能出 dmg/nsis
安装包、代码签名），但它的下载器在部分网络环境下容易在下载 Electron
release zip 时报 `EOF`——如果遇到这个问题，改用上面的 `pack:*` 脚本，
或者保证网络通畅之后再试 `dist:*`。

`package.json` 的 `build.files` 字段是打包范围的唯一来源，加新的
子游戏/资源目录时记得同步加进去。
