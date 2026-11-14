/**
 * API 地址自动探测：
 * 1. 同源（Web 版，后端同端口）
 * 2. 公开云端域名（Tauri 桌面壳本地无后端时回退，
 *    由 CI 构建时写入 .env.production 的 VITE_API_BASE_URL 注入）
 */

const FALLBACK_BASE = import.meta.env.VITE_API_BASE_URL || '';

let resolvedBase: string | null | undefined;

async function probe(base: string, signal: AbortSignal): Promise<boolean> {
  try {
    const resp = await fetch(`${base}/api/health`, { signal });
    return resp.ok;
  } catch {
    return false;
  }
}

/** 探测可用 API 基地址；不可达返回 null。带 3s 超时，结果全局缓存一次。 */
export async function resolveApiBase(): Promise<string | null> {
  if (resolvedBase !== undefined) return resolvedBase ?? null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3000);
  let base: string | null = null;
  try {
    if (await probe('', ctrl.signal)) {
      base = '';
    } else if (FALLBACK_BASE && (await probe(FALLBACK_BASE, ctrl.signal))) {
      base = FALLBACK_BASE;
    }
  } finally {
    clearTimeout(timer);
  }
  resolvedBase = base;
  return base;
}

/** 统一 API 请求入口；返回 null 表示后端不可达（调用方自行降级）。 */
export async function apiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response | null> {
  const base = await resolveApiBase();
  if (base === null) return null;
  try {
    return await fetch(`${base}${path}`, init);
  } catch {
    // 缓存的地址失效（如云端短暂抖动），清除后下次重探
    resolvedBase = undefined;
    return null;
  }
}
