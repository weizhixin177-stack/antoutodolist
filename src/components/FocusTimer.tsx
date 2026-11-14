import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, StepBack, X } from 'lucide-react';
import { formatCountdown, formatTime } from '../lib/utils';
import { CATEGORY_MAP } from '../lib/constants';
import type { Todo } from '../types';

interface FocusTimerProps {
  todo: Todo;
  candidates: Todo[]; // 可选倒计时的任务（带截止、未完成）
  onPick: (todo: Todo) => void;
  onComplete: (id: string) => void;
  onClose: () => void;
}

/** 用 Web Audio 生成一声提示音，纯前端、无需音频文件 */
function playChime() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const notes = [880, 1174.66];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.28;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.28, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.45);
    });
    window.setTimeout(() => void ctx.close(), 1600);
  } catch {
    /* 声音失败不影响倒计时 */
  }
}

export default function FocusTimer({
  todo,
  candidates,
  onPick,
  onComplete,
  onClose,
}: FocusTimerProps) {
  const [now, setNow] = useState(() => Date.now());
  // deadline 在调用方保证存在；这里兜底为 1 小时后，避免可选字段空值
  const deadlineMs = todo.deadline ?? todo.createdAt + 3600 * 1000;
  const totalRef = useRef(Math.max(deadlineMs - todo.createdAt, 1));
  const deadlineRef = useRef(deadlineMs);
  const chimedRef = useRef(false);

  useEffect(() => {
    deadlineRef.current = todo.deadline ?? todo.createdAt + 3600 * 1000;
    totalRef.current = Math.max(deadlineRef.current - todo.createdAt, 1);
    chimedRef.current = false;
    setNow(Date.now());
  }, [todo]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = deadlineRef.current - now;
  const overdue = remaining <= 0;
  const elapsed = now - todo.createdAt;
  const progress = Math.min(
    1,
    Math.max(0, elapsed / totalRef.current),
  );

  useEffect(() => {
    if (overdue && !chimedRef.current) {
      chimedRef.current = true;
      playChime();
    }
  }, [overdue]);

  const category = CATEGORY_MAP[todo.category];
  const CategoryIcon = category.icon;

  const options = useMemo(
    () =>
      candidates.filter((c) => c.id !== todo.id).length > 0
        ? candidates.filter((c) => c.id !== todo.id)
        : [],
    [candidates, todo.id],
  );

  return (
    <div
      className="theme-aware fixed inset-0 z-50 flex flex-col items-center justify-between overflow-hidden p-6 sm:p-10"
      style={{ backgroundColor: 'rgba(247,245,240,0.94)' }}
    >
      {/* 顶部：任务信息 + 关闭 */}
      <div className="flex w-full max-w-xl items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-pine-600 px-2.5 py-1 text-xs font-medium text-white dark:bg-pine-500 dark:text-[#0f1a14]">
            <CategoryIcon className="h-3.5 w-3.5" strokeWidth={2} />
            {category.label}
          </div>
          <h2 className="mt-3 break-words font-serifcn text-2xl font-semibold leading-snug text-ink dark:text-[#ece7dc] sm:text-3xl">
            {todo.title}
          </h2>
          <p className="mt-2 text-sm text-ink-faint dark:text-[#8d8678]">
            {todo.completed ? '已完成' : '进行中'} · {formatTime(deadlineMs)}{' '}
            截止
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭倒计时"
          className="shrink-0 rounded-lg p-2 text-ink-faint transition-colors hover:bg-paper-deep hover:text-ink dark:text-[#8d8678] dark:hover:bg-white/10 dark:hover:text-[#ece7dc]"
        >
          <X className="h-5 w-5" strokeWidth={1.9} />
        </button>
      </div>

      {/* 中间：大倒计时 */}
      <div className="flex w-full max-w-xl flex-col items-center text-center">
        {overdue ? (
          <div className="animate-pulse font-serifcn text-5xl font-bold text-cinnabar-600 dark:text-[#e88070] sm:text-7xl">
            时间到
          </div>
        ) : (
          <div
            className="font-serifcn text-6xl font-bold tabular-nums tracking-tight text-ink dark:text-[#ece7dc] sm:text-8xl"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {formatCountdown(remaining / 1000)}
          </div>
        )}
        {overdue && (
          <p className="mt-3 text-ink-soft dark:text-[#a8a194]">
            该项待办已到截止时间，请及时处理
          </p>
        )}

        {/* 进度条 */}
        <div className="mt-10 h-1.5 w-full overflow-hidden rounded-full bg-paper-deep dark:bg-black/30">
          <div
            className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${
              overdue ? 'bg-cinnabar-500' : 'bg-pine-600 dark:bg-[#5ea37e]'
            }`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-ink-faint dark:text-[#8d8678]">
          起于 {formatTime(todo.createdAt)} · 计划 {formatTime(deadlineMs)}{' '}
          前完成
        </p>
      </div>

      {/* 底部：操作 */}
      <div className="flex w-full max-w-xl flex-wrap items-center justify-center gap-3">
        {options.length > 0 && (
          <select
            value=""
            onChange={(e) => {
              const t = candidates.find((c) => c.id === e.target.value);
              if (t) onPick(t);
            }}
            aria-label="切换倒计时的任务"
            className="rounded-lg border border-ink/15 bg-[#fffdf8] px-3 py-2 text-sm text-ink-soft outline-none dark:border-white/15 dark:bg-[#26241f] dark:text-[#cfc8ba] [&>option]:dark:bg-[#26241f]"
          >
            <option value="" disabled>
              切换任务…
            </option>
            {options.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        )}
        {!todo.completed && (
          <button
            type="button"
            onClick={() => onComplete(todo.id)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-pine-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-pine-700 active:scale-95 dark:bg-pine-500 dark:text-[#0f1a14] dark:hover:bg-[#6fb38d]"
          >
            <Check className="h-4 w-4" strokeWidth={2.2} />
            标记完成
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm text-ink-soft transition-colors hover:bg-paper-deep hover:text-ink dark:text-[#a8a194] dark:hover:bg-white/10 dark:hover:text-[#ece7dc]"
        >
          <StepBack className="h-4 w-4" strokeWidth={2} />
          返回清单
        </button>
      </div>
    </div>
  );
}