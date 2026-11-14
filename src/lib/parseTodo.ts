import type { CategoryId, Priority } from '../types';

/** AI 从一句话中理解出的待办草稿 */
export interface ParsedTodoDraft {
  title: string;
  priority: Priority;
  category: CategoryId;
  /** "YYYY-MM-DDTHH:mm"，从文字中理解出的截止时间 */
  deadline?: string;
  /** 从文字中理解出的地点 */
  location?: string;
}

/**
 * 调用后端 /api/parse-todo，让 AI 理解一句话里的时间、地点、优先级、分类。
 * 解析失败或无后端（Tauri 桌面壳）时返回 null，调用方自行降级。
 */
export async function parseTodoText(
  text: string,
): Promise<ParsedTodoDraft | null> {
  try {
    const resp = await fetch('/api/parse-todo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!resp.ok) return null;
    const data = (await resp.json()) as { parsed?: ParsedTodoDraft };
    return data.parsed && data.parsed.title ? data.parsed : null;
  } catch {
    return null;
  }
}

/** "YYYY-MM-DDTHH:mm" → 毫秒时间戳（非法时返回 undefined） */
export function deadlineStringToTs(d?: string): number | undefined {
  if (!d) return undefined;
  const ts = new Date(d).getTime();
  return Number.isNaN(ts) ? undefined : ts;
}
