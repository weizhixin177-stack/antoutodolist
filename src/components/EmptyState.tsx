import { ClipboardList, SearchX } from 'lucide-react';

interface EmptyStateProps {
  type: 'empty' | 'no-result';
}

export default function EmptyState({ type }: EmptyStateProps) {
  const isSearch = type === 'no-result';
  const Icon = isSearch ? SearchX : ClipboardList;
  return (
    <div className="animate-fade-up flex flex-col items-center justify-center rounded-xl border border-dashed border-ink/15 py-14 text-center dark:border-white/15">
      <Icon
        className="h-9 w-9 text-ink-faint/50 dark:text-[#7d7668]/60"
        strokeWidth={1.5}
      />
      <p className="mt-3 font-serifcn text-base text-ink-soft dark:text-[#b3ab9c]">
        {isSearch ? '没有找到匹配的待办' : '案头空空，先记下一件事吧'}
      </p>
      <p className="mt-1 text-xs text-ink-faint dark:text-[#7d7668]">
        {isSearch ? '换个关键词或筛选条件试试' : '任何想法，都值得写下来'}
      </p>
    </div>
  );
}
