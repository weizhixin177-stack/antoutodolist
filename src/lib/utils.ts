/** 生成带时间戳随机性的唯一 ID，兼容无 crypto.randomUUID 的环境 */
export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** 格式化为 M月D日 HH:MM */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${month}月${day}日 ${hour}:${minute}`;
}

/** 描述距截止时间的倒数：还剩 X 或 已超时 X */
export function describeDeadline(deadlineTs: number, nowTs: number): string {
  const diff = deadlineTs - nowTs;
  const m = Math.floor(Math.abs(diff) / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  const dayPart = d > 0 ? `${d}天${h % 24}小时` : h > 0 ? `${h}小时${m % 60}分` : `${m}分`;
  return diff >= 0 ? `还剩 ${dayPart}` : `已超时 ${dayPart}`;
}

/** 时间戳 → datetime-local 输入框需要的 "YYYY-MM-DDTHH:mm" */
export function toDatetimeLocal(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 秒数 → "HH:MM:SS" 大倒计时 */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(mm)}:${pad(ss)}`;
}
