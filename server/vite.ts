// ABOUTME: Vite integration for Express server
// ABOUTME: Handles dev middleware and production static file serving

import type { Application, Request, Response } from 'express';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const isDev = process.env.COZE_PROJECT_ENV !== 'PROD';

/**
 * 集成 Vite 开发服务器（中间件模式）
 *
 * 注意：不要在此处 import 并展开项目根目录的 vite.config.ts —— Vite 会自动
 * 加载该配置文件，再展开一遍会导致其中的插件（如 @vitejs/plugin-react）被
 * 注册两次，Fast Refresh 代码重复注入，触发
 * `The symbol "$RefreshReg$" has already been declared` 转换错误。
 * 此处仅补充中间件模式必须的 server 覆盖项。
 */
export async function setupViteMiddleware(app: Application) {
  const vite = await createViteServer({
    root: process.cwd(),
    appType: 'spa',
    server: {
      middlewareMode: true,
      host: '0.0.0.0',
      allowedHosts: true,
      hmr: {
        path: '/hot/vite-hmr',
      },
      watch: {
        usePolling: true,
        interval: 100,
      },
    },
  });

  // 使用 Vite middleware
  app.use(vite.middlewares);

  console.log('🚀 Vite dev server initialized');
}

/**
 * 设置生产环境静态文件服务
 */
export function setupStaticServer(app: Application) {
  const distPath = path.resolve(process.cwd(), 'dist');

  if (!fs.existsSync(distPath)) {
    console.error('❌ dist folder not found. Please run "pnpm build" first.');
    process.exit(1);
  }

  // 1. 服务静态文件（如果存在对应文件则直接返回）
  app.use(express.static(distPath));

  // 2. SPA fallback - 所有未处理的请求返回 index.html
  // 到达这里的请求说明：
  //   - 不是 API 请求（已被前面注册的路由处理）
  //   - 不是静态文件（express.static 未找到对应文件）
  //   - 需要返回 index.html 让前端路由处理
  app.use((_req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  console.log('📦 Serving static files from dist/');
}

/**
 * 根据环境设置 Vite
 */
export async function setupVite(app: Application) {
  if (isDev) {
    await setupViteMiddleware(app);
  } else {
    setupStaticServer(app);
  }
}
