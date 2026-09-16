import { useEffect, useState, type ComponentType } from 'react';
import { Search, Eraser, Trash2, X } from 'lucide-react';
import { CATEGORIES } from '../lib/constants';
import type { CategoryId, Filters, StatusFilter } from '../types';

interface FilterBarProps {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  categoryCounts: Record<CategoryId, number>;
  totalCount: number;
  completedCount: number;
  onClearCompleted: () => void;
}

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'active', label: '进行中' },
  { id: 'completed', label: '已完成' },
];

export default function FilterBar({
  filters,
  onChange,
  categoryCounts,
  totalCount,
  completedCount,
  onClearCompleted,
}: FilterBarProps) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const timer = window.setTimeout(() => setConfirming(false), 3000);
    return () => window.clearTimeout(timer);
  }, [confirming]);

  const handleClear = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    onClearCompleted();
    setConfirming(false);
  };

  return (
    <section className="theme-aware animate-fade-up space-y-3 rounded-xl border border-ink/[0.07] bg-[#fffdf8] p-3.5 shadow-card dark:border-white/[0.08] dark:bg-[#1f1d19]">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint dark:text-[#7d7668]"
            strokeWidth={2}
          />
          <input
            type="search"
            value={filters.keyword}
            onChange={(e) => onChange({ keyword: e.target.value })}
            placeholder="搜索待办…"
            aria-label="按关键词搜索待办"
            className="w-full rounded-lg border border-ink/10 bg-paper py-2 pl-9 pr-8 text-sm text-ink outline-none transition-colors focus:border-pine-500 dark:border-white/10 dark:bg-black/20 dark:text-[#ece7dc] dark:placeholder:text-[#7d7668] dark:focus:border-pine-500"
          />
          {filters.keyword && (
            <button
              type="button"
              onClick={() => onChange({ keyword: '' })}
              aria-label="清空搜索"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-ink-faint hover:text-ink dark:text-[#7d7668] dark:hover:text-[#ece7dc]"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.2} />
            </button>
          )}
        </div>

        <div
          className="flex shrink-0 items-center gap-0.5 self-start rounded-lg bg-paper-deep p-0.5 dark:bg-white/[0.06] sm:self-auto"
          role="tablist"
          aria-label="按完成状态筛选"
        >
          {STATUS_TABS.map((tab) => {
            const selected = filters.status === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onChange({ status: tab.id })}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                  selected
                    ? 'bg-white text-ink shadow-sm dark:bg-white/[0.12] dark:text-[#ece7dc]'
                    : 'text-ink-faint hover:text-ink-soft dark:text-[#8d8678] dark:hover:text-[#cfc8ba]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div
          className="scrollbar-thin flex flex-1 items-center gap-1.5 overflow-x-auto pb-0.5"
          role="tablist"
          aria-label="按分类筛选"
        >
          <CategoryChip
            label="全部分类"
            count={totalCount}
            selected={filters.category === 'all'}
            onClick={() => onChange({ category: 'all' })}
          />
          {CATEGORIES.map((item) => (
            <CategoryChip
              key={item.id}
              label={item.label}
              icon={item.icon}
              count={categoryCounts[item.id]}
              selected={filters.category === item.id}
              onClick={() => onChange({ category: item.id })}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleClear}
          disabled={completedCount === 0}
          className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 ${
            confirming
              ? 'bg-cinnabar-500 text-white'
              : 'text-ink-faint hover:bg-cinnabar-50 hover:text-cinnabar-600 dark:text-[#8d8678] dark:hover:bg-cinnabar-500/15 dark:hover:text-[#e88070]'
          }`}
        >
          {confirming ? (
            <Eraser className="h-3.5 w-3.5" strokeWidth={2} />
          ) : (
            <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
          )}
          {confirming ? '确认清空？' : `清空已完成${completedCount > 0 ? ` (${completedCount})` : ''}`}
        </button>
      </div>
    </section>
  );
}

interface CategoryChipProps {
  label: string;
  icon?: ComponentType<{ className?: string; strokeWidth?: number }>;
  count: number;
  selected: boolean;
  onClick: () => void;
}

function CategoryChip({ label, icon: Icon, count, selected, onClick }: CategoryChipProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-200 ${
        selected
          ? 'border-pine-600 bg-pine-50 text-pine-700 dark:border-pine-500 dark:bg-pine-500/15 dark:text-[#8fc9a7]'
          : 'border-ink/10 text-ink-soft hover:border-ink/20 hover:text-ink dark:border-white/10 dark:text-[#a8a194] dark:hover:border-white/25 dark:hover:text-[#ece7dc]'
      }`}
    >
      {Icon && <Icon className="h-3.5 w-3.5" strokeWidth={2} />}
      {label}
      <span
        className={`tabular-nums ${
          selected
            ? 'text-pine-600 dark:text-[#8fc9a7]'
            : 'text-ink-faint dark:text-[#7d7668]'
        }`}
      >
        {count}
      </span>
    </button>
  );
}
