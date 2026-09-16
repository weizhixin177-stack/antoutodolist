interface StatsBarProps {
  total: number;
  completed: number;
  active: number;
  highActive: number;
}

function getDateText(): string {
  const now = new Date();
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()];
  return `${now.getMonth() + 1}月${now.getDate()}日 · 星期${weekday}`;
}

export default function StatsBar({
  total,
  completed,
  active,
  highActive,
}: StatsBarProps) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <section className="theme-aware animate-fade-up rounded-xl border border-ink/[0.07] bg-[#fffdf8] p-5 shadow-card dark:border-white/[0.08] dark:bg-[#1f1d19]">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs tracking-wide text-ink-faint dark:text-[#8d8678]">
            {getDateText()}
          </p>
          <h2 className="mt-1 font-serifcn text-xl font-semibold text-ink dark:text-[#ece7dc]">
            今日案头
          </h2>
        </div>
        <div className="text-right">
          <span className="font-serifcn text-3xl font-bold tabular-nums text-pine-600 dark:text-[#5ea37e]">
            {pct}
            <span className="text-base">%</span>
          </span>
          <p className="text-xs text-ink-faint dark:text-[#8d8678]">完成率</p>
        </div>
      </div>

      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-paper-deep dark:bg-black/30"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-pine-600 transition-[width] duration-500 ease-out dark:bg-[#5ea37e]"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ink-soft dark:text-[#b3ab9c]">
        <span>
          全部 <b className="tabular-nums text-ink dark:text-[#ece7dc]">{total}</b>
        </span>
        <span>
          进行中{' '}
          <b className="tabular-nums text-ink dark:text-[#ece7dc]">{active}</b>
        </span>
        <span>
          已完成{' '}
          <b className="tabular-nums text-pine-600 dark:text-[#5ea37e]">
            {completed}
          </b>
        </span>
        {highActive > 0 && (
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-cinnabar-600 dark:text-[#e88070]">
            <span className="h-1.5 w-1.5 rounded-full bg-cinnabar-500" />
            高优待办 {highActive}
          </span>
        )}
      </div>
    </section>
  );
}
