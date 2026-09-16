import { useState, type FormEvent } from 'react';
import { CornerDownLeft, Plus } from 'lucide-react';
import { CATEGORIES, PRIORITIES } from '../lib/constants';
import type { CategoryId, Priority } from '../types';

interface TodoFormProps {
  onAdd: (title: string, category: CategoryId, priority: Priority) => void;
}

export default function TodoForm({ onAdd }: TodoFormProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryId>('work');
  const [priority, setPriority] = useState<Priority>('medium');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed, category, priority);
    setTitle('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="theme-aware animate-fade-up rounded-xl border border-ink/[0.07] bg-[#fffdf8] p-4 shadow-card dark:border-white/[0.08] dark:bg-[#1f1d19]"
    >
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="写下一件待办，回车即可记下…"
        maxLength={120}
        aria-label="待办内容"
        className="w-full bg-transparent text-base text-ink outline-none placeholder:text-ink-faint dark:text-[#ece7dc] dark:placeholder:text-[#7d7668]"
      />

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-ink/[0.06] pt-3 dark:border-white/[0.07]">
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="radiogroup"
          aria-label="选择分类"
        >
          {CATEGORIES.map((item) => {
            const Icon = item.icon;
            const selected = category === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setCategory(item.id)}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-200 ${
                  selected
                    ? 'bg-pine-600 text-white shadow-sm dark:bg-pine-500 dark:text-[#0f1a14]'
                    : 'bg-paper-deep text-ink-soft hover:text-ink dark:bg-white/[0.06] dark:text-[#a8a194] dark:hover:text-[#ece7dc]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div
            className="flex items-center gap-0.5 rounded-lg bg-paper-deep p-0.5 dark:bg-white/[0.06]"
            role="radiogroup"
            aria-label="选择优先级"
          >
            {PRIORITIES.map((item) => {
              const selected = priority === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setPriority(item.id)}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all duration-200 ${
                    selected
                      ? `${item.chipLight} ${item.chipDark} bg-white shadow-sm dark:bg-white/[0.1]`
                      : 'text-ink-faint hover:text-ink-soft dark:text-[#8d8678] dark:hover:text-[#cfc8ba]'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${item.dot}`}
                    aria-hidden
                  />
                  {item.label}
                </button>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={!title.trim()}
            className="inline-flex items-center gap-1 rounded-lg bg-pine-600 px-3.5 py-1.5 text-sm font-medium text-white transition-all duration-200 hover:bg-pine-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-pine-500 dark:text-[#0f1a14] dark:hover:bg-[#6fb38d]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.2} />
            记下
            <CornerDownLeft className="h-3 w-3 opacity-70" strokeWidth={2} />
          </button>
        </div>
      </div>
    </form>
  );
}
