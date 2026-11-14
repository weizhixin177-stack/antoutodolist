# 项目上下文

「案头清单」—— 东方纸感编辑风的待办清单（Todo List），纯前端应用，数据存 localStorage。同时提供 Web 版与 Tauri 2 桌面版（macOS .app / .dmg）。

## 技术栈

- **核心**: Vite 7, React 19, TypeScript 5, Express（仅承载 Vite 中间件与静态产物）
- **桌面**: Tauri 2（`src-tauri/`），复用 `dist/` 产物，壳内数据同样走 localStorage
- **UI**: Tailwind CSS 3（`darkMode: 'class'`）
- **拖拽**: @dnd-kit/core + @dnd-kit/sortable（支持鼠标 / 触摸 / 键盘）
- **图标**: lucide-react；App 图标 `src-tauri/app-icon.jpg`（AI 生成，2048²）
- **字体**: Noto Serif SC（标题）+ Noto Sans SC（正文），Google Fonts `.cn` 域名引入

## 目录结构

```
├── scripts/                    # 构建与启动脚本（dev/build/start，勿改）
├── server/
│   ├── routes/index.ts         # 示例 API（/api/hello /api/data /api/health）
│   ├── routes/voice.ts         # 语音转待办 API（POST /api/voice-todo，ASR+LLM）
│   ├── server.ts               # Express 入口（错误中间件必须 4 参数）
│   └── vite.ts                 # Vite 中间件：勿 import vite.config 展开，否则插件重复注册
├── src/
│   ├── components/
│   │   ├── App 内引用：TodoForm(添加，含语音) / FilterBar(搜索+状态+分类+清空)
│   │   ├── TodoItem.tsx        # 单条待办（勾选/行内编辑/删除/卡片内嵌倒计时进度条）
│   │   ├── SortableTodoItem.tsx# @dnd-kit 可拖拽包装，手柄 listeners
│   │   ├── VoiceInput.tsx      # 麦克风语音输入（录音→后端识别→填充表单）
│   │   ├── StatsBar.tsx        # 总数/进行中/完成数/完成率进度条/高优提醒
│   │   ├── EmptyState.tsx      # 空数据 / 无搜索结果
│   │   └── ThemeToggle.tsx     # 深/浅色切换
│   ├── hooks/
│   │   ├── useLocalStorage.ts  # 状态与 localStorage 双向同步
│   │   └── useTheme.ts         # 主题持久化 + html.dark 切换
│   ├── lib/
│   │   ├── constants.ts        # 分类、优先级元数据与 Tailwind 类、示例数据
│   │   └── utils.ts            # createId / formatTime / formatCountdown / describeDeadline
│   ├── types.ts                # Todo(含 deadline?) / Priority / CategoryId / Filters
│   ├── App.tsx                 # 状态中枢：增删改、筛选、统计、拖拽重排
│   ├── main.tsx                # React 入口
│   └── index.css               # Tailwind + 字体 + 主题变量 + 动效
├── index.html                  # 含首屏防深色闪烁内联脚本
├── src-tauri/                  # Tauri 2 桌面壳（Rust）
│   ├── tauri.conf.json         # 窗口/打包配置，identifier: com.antou.todo
│   ├── Cargo.toml              # lib 名 antou_todo_lib（勿改，main.rs 引用）
│   ├── src/main.rs + lib.rs    # 标准入口，无自定义 command
│   ├── capabilities/default.json
│   ├── app-icon.jpg            # 图标源图（JPEG 2048²，改后用 pnpm tauri icon 重生成）
│   └── icons/                  # 由 tauri icon 生成的全套图标（含 icon.icns）
├── DESIGN.md                   # 设计语言（改 UI 前必读）
├── tailwind.config.js
├── tsconfig.json               # moduleResolution: bundler（勿改回 node）
└── vite.config.ts              # 双环境：TAURI_ENV_PLATFORM 存在时走 Tauri 配置（5173 strictPort）
```

## 包管理规范

仅允许 **pnpm**，严禁 npm / yarn。

## 开发命令

- `pnpm dev`（经 scripts/dev.sh，监听 `$DEPLOY_RUN_PORT`，HMR 路径 `/hot/vite-hmr`）
- `pnpm build`：Vite 构建到 `dist/` + tsup 打包 server 到 `dist-server/`
- `pnpm ts-check` / `pnpm lint --quiet`：交付前必过

## Mac 桌面打包（在本机 Mac 上执行，沙箱为 Linux 无法出包）

前置（一次性）：`xcode-select --install`；Rust 工具链（`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`）；Node + pnpm。

- `pnpm tauri:dev`：桌面开发模式（自动起 Vite 5173 + 壳窗口，HMR 生效）
- `pnpm tauri:build`：发布构建（自动执行 `pnpm vite build`）
  - 产物：`src-tauri/target/release/bundle/macos/案头清单.app`
  - 安装包：`src-tauri/target/release/bundle/dmg/案头清单_1.0.0_<arch>.dmg`
- 首次构建需下载编译 Rust 依赖，耐心等待；之后增量编译很快
- 默认只出当前架构包；Intel+M 芯片通用包：`rustup target add aarch64-apple-darwin x86_64-apple-darwin` 后 `pnpm tauri build -- --target universal-apple-darwin`
- 未签名分发：接收方首次需右键「打开」，或 `xattr -cr /Applications/案头清单.app`；正式分发需 Apple 开发者账号签名公证

## 数据与功能约定

- Todo：`{ id, title, completed, category, priority, createdAt, deadline?, location? }`
- 分类固定 4 项：work / life / study / other；优先级：high / medium / low
- 存储 key：`antou.todos.v1`、`antou.theme.v1`
- 拖拽重排基于**筛选后的可见列表**计算 index，再映射回完整数组，保持隐藏项槽位
- 清空已完成需二次点击确认（3s 超时复位）
- 编辑态：Enter 保存、Esc 取消；可改标题、分类、优先级（截止时间只能由 AI 理解生成，无手动入口）

## AI 智能理解（依赖后端）

- 入口组件 `src/components/VoiceInput.tsx`：探测 `/api/health` 可达才渲染（Web 可用；Tauri 桌面壳无后端则隐藏）。
- 录音：`getUserMedia({audio:true})` + MediaRecorder，按能力优选 ASR 支持的编码 `audio/ogg;codecs=opus` / `audio/mp4`，最后经 onstop 后再停轨道以避免截尾。
- 后端 `server/routes/voice.ts`：
  - `POST /api/voice-todo`：接收 `{ audioBase64, mimeType }` → 扣子 ASR `recognize` 转写 → LLM 解析。
  - `POST /api/parse-todo`：接收 `{ text }` → LLM 直接理解文本（TodoForm 手动输入提交时调用，无 datetime-local 手动选时间）。
  - 两者共享 `parseTodoText`：LLM（`doubao-seed-2-0-mini-260215`，`invoke` 非流式）解析为 `{ title, priority, category, deadline?, location? }`，deadline 规整为 `YYYY-MM-DDTHH:mm`，location 为提取的简短地点名。
- 走 `coze-coding-dev-sdk`（ASRClient / LLMClient / Config / HeaderUtils），消耗扣子额度；SDK 有 CJS 构建，tsup 到 `dist-server` 可正常打包（勿 external）。
- 前端解析客户端在 `src/lib/parseTodo.ts`（`parseTodoText` + `deadlineStringToTs`）；解析失败/无后端时降级为按原文 + 表单所选分类优先级记下。
- 语音入口的可用性依赖 Express 后端，桌面壳（纯静态）自动降级为纯手输。

## 倒计时与截止

- `deadline` 为可选时间戳（ms），只能由 AI 理解输入文本产生（如「今晚8点完成华为项目」），已移除 datetime-local 手动选择。
- 单界面原则：不做全屏倒计时页。倒计时内嵌在卡片元信息下方（`TodoItem.tsx` 内 `DeadlineProgress` 组件）。
- `DeadlineProgress` 为 BOSS 血条：血量 = 剩余时间占比（满血→耗尽），每秒 tick 线性扣减；深红血槽 + 朱砂渐变血量 + 顶部高光 + 外发光；左侧 Swords 图标读秒「还剩/已超时 HH:MM:SS」，右侧截止时刻；30 分钟内低血量脉冲，超时血量归零且空槽红光闪烁。
- 工具函数在 `src/lib/utils.ts`：`formatCountdown` / `formatTime`。

## 关键排障记录

1. `Cannot find module '@vitejs/plugin-react'`：需 `moduleResolution: bundler`。
2. `$RefreshReg$ has already been declared`：server/vite.ts 不得 import 展开根目录 vite.config（Vite 会自动加载，导致 react 插件注册两次）。
3. @vitejs/plugin-react 6.x peer 为 Vite 8，会引用未导出的 `vite/internal`；本项目锁定 5.x。
4. Express 错误处理中间件必须是 `(err, req, res, next)` 四参数签名。
5. AI 生图 CLI 下载的文件可能是 JPEG 却带 .png 扩展名，`tauri icon` 会按签名解码报 `Invalid PNG signature`——按真实格式命名即可。
6. `vite.config.ts` 依赖 `TAURI_ENV_PLATFORM` 区分 Tauri / Web 两套 server 配置，修改时两侧都要顾及。

## 编码规范

- TypeScript strict：禁止隐式 any / as any，函数参数与回调显式标注类型。
- 半角标点；组件文件默认导出；样式用 Tailwind，深色模式用 `dark:` 变体。
