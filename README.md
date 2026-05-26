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
- 多幕串联：一幕结束后自动进入 `nextSceneId` 指向的下一幕。
- 打字机效果、点击补全文字、点击推进。
- 对话语音播放，跟随设置中的总音量和语音音量。
- 背景音乐播放，支持每章默认 BGM 和剧情中途切换。
- 最近进度存档和设置持久化。
- 资源目录已预留，可直接替换真实素材路径。

## 内容修改

- 新增一幕：在 `data/scenes/` 下添加新的 `.json` 文件，并把它的 `id` 写进 `data/config/story.json`。
- 幕尾自动切换：在当前 scene 顶层加 `"nextSceneId": "下一幕id"`。
- 中途切换场景：使用事件 `{ "type": "changeScene", "targetSceneId": "chapter-02" }`。
- 背景切换：写 `background` 事件，值可为 `/assets/bg/xxx.jpg`。
- 章节默认 BGM：在 `initialState` 里写 `"bgm": "/assets/audio/bgm/chapter-01.mp3"`。
- 中途切换 BGM：写事件 `{ "type": "bgm", "track": "/assets/audio/bgm/tension.mp3" }`。
- 停止当前 BGM：写事件 `{ "type": "bgm", "track": "" }`。
- 立绘切换：改 `showCharacter` 的 `sprite`、`position`。
- 语音：在 `dialogue` 事件里加 `"voice": "/assets/audio/角色/文件.ogg"`。
- 默认已经附带可替换的 SVG 占位立绘和头像；你只要把 `characters.json` 里的路径换成正式素材即可。
