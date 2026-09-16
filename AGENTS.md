# 项目上下文

「案头清单」—— 东方纸感编辑风的网页版待办清单（Todo List），纯前端应用，数据存 localStorage。

## 技术栈

- **核心**: Vite 7, React 19, TypeScript 5, Express（仅承载 Vite 中间件与静态产物）
- **UI**: Tailwind CSS 3（`darkMode: 'class'`）
- **拖拽**: @dnd-kit/core + @dnd-kit/sortable（支持鼠标 / 触摸 / 键盘）
- **图标**: lucide-react
- **字体**: Noto Serif SC（标题）+ Noto Sans SC（正文），Google Fonts `.cn` 域名引入

## 目录结构

```
├── scripts/                    # 构建与启动脚本（dev/build/start，勿改）
├── server/
│   ├── routes/index.ts         # 示例 API（/api/hello /api/data /api/health）
│   ├── server.ts               # Express 入口（错误中间件必须 4 参数）
│   └── vite.ts                 # Vite 中间件：勿 import vite.config 展开，否则插件重复注册
├── src/
│   ├── components/
│   │   ├── App 内引用：TodoForm(添加) / FilterBar(搜索+状态+分类+清空)
│   │   ├── TodoItem.tsx        # 单条待办（勾选/行内编辑/删除）
│   │   ├── SortableTodoItem.tsx# @dnd-kit 可拖拽包装，手柄 listeners
│   │   ├── StatsBar.tsx        # 总数/进行中/完成数/完成率进度条/高优提醒
│   │   ├── EmptyState.tsx      # 空数据 / 无搜索结果
│   │   └── ThemeToggle.tsx     # 深/浅色切换
│   ├── hooks/
│   │   ├── useLocalStorage.ts  # 状态与 localStorage 双向同步
│   │   └── useTheme.ts         # 主题持久化 + html.dark 切换
│   ├── lib/
│   │   ├── constants.ts        # 分类、优先级元数据与 Tailwind 类、示例数据
│   │   └── utils.ts            # createId / formatTime
│   ├── types.ts                # Todo / Priority / CategoryId / Filters
│   ├── App.tsx                 # 状态中枢：增删改、筛选、统计、拖拽重排
│   ├── main.tsx                # React 入口
│   └── index.css               # Tailwind + 字体 + 主题变量 + 动效
├── index.html                  # 含首屏防深色闪烁内联脚本
├── DESIGN.md                   # 设计语言（改 UI 前必读）
├── tailwind.config.js
├── tsconfig.json               # moduleResolution: bundler（勿改回 node）
└── vite.config.ts              # @vitejs/plugin-react 必须 5.x（6.x peer 为 Vite 8）
```

## 包管理规范

仅允许 **pnpm**，严禁 npm / yarn。

## 开发命令

- `pnpm dev`（经 scripts/dev.sh，监听 `$DEPLOY_RUN_PORT`，HMR 路径 `/hot/vite-hmr`）
- `pnpm build`：Vite 构建到 `dist/` + tsup 打包 server 到 `dist-server/`
- `pnpm ts-check` / `pnpm lint --quiet`：交付前必过

## 数据与功能约定

- Todo：`{ id, title, completed, category, priority, createdAt }`
- 分类固定 4 项：work / life / study / other；优先级：high / medium / low
- 存储 key：`antou.todos.v1`、`antou.theme.v1`
- 拖拽重排基于**筛选后的可见列表**计算 index，再映射回完整数组，保持隐藏项槽位
- 清空已完成需二次点击确认（3s 超时复位）
- 编辑态：Enter 保存、Esc 取消；同时可改分类与优先级

## 关键排障记录

1. `Cannot find module '@vitejs/plugin-react'`：需 `moduleResolution: bundler`。
2. `$RefreshReg$ has already been declared`：server/vite.ts 不得 import 展开根目录 vite.config（Vite 会自动加载，导致 react 插件注册两次）。
3. @vitejs/plugin-react 6.x peer 为 Vite 8，会引用未导出的 `vite/internal`；本项目锁定 5.x。
4. Express 错误处理中间件必须是 `(err, req, res, next)` 四参数签名。

## 编码规范

- TypeScript strict：禁止隐式 any / as any，函数参数与回调显式标注类型。
- 半角标点；组件文件默认导出；样式用 Tailwind，深色模式用 `dark:` 变体。
