# Galgame Demo

Electron + React + TypeScript 的 Windows 桌面 galgame 垂直切片 demo。

## 开发

```bash
npm install
npm run dev
```

如果 Windows PowerShell 的 `npm` 被执行策略拦住，改用：

```bash
npm.cmd install
npm.cmd run dev
```

## 目录

- `electron/`: Electron 主进程与 preload。
- `src/`: React 渲染层、剧情驱动逻辑、UI。
- `data/scenes/`: 场景 JSON。
- `data/characters/`: 角色配置 JSON。
- `assets/`: 背景、立绘、头像、UI、音频资源目录。

## 当前能力

- 标题页、开始、继续、设置。
- JSON 驱动对话、背景、立绘、分支、条件跳转。
- 打字机效果、点击补全文字、点击推进。
- 最近进度存档和设置持久化。
- 资源目录已预留，可直接替换真实素材路径。
