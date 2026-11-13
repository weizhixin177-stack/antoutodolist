import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Tauri CLI 在执行 dev/build 时会注入 TAURI_ENV_PLATFORM 环境变量。
// Tauri 桌面开发与沙箱 Web 开发使用不同的 server 配置。
const isTauri = !!process.env.TAURI_ENV_PLATFORM;

export default defineConfig({
  plugins: [react()],
  // Tauri 场景保留 Cargo 编译日志，禁止 Vite 清屏
  clearScreen: !isTauri,
  server: isTauri
    ? {
        // 桌面开发：严格占用 5173，与 tauri.conf.json 的 devUrl 对应
        port: 5173,
        strictPort: true,
        host: '127.0.0.1',
        watch: {
          ignored: ['**/src-tauri/**'],
        },
      }
    : {
        // 沙箱 Web 开发：Express 中间件模式（5000 端口由 server/vite.ts 控制）
        port: 5000,
        host: '0.0.0.0',
        allowedHosts: true,
        hmr: {
          overlay: true,
          path: '/hot/vite-hmr',
          port: 6000,
          clientPort: 443,
          timeout: 30000,
        },
        watch: {
          usePolling: true,
          interval: 100,
        },
      },
});
