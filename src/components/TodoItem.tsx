import { useEffect, useRef, useState } from 'react';
import { Check, GripVertical, Pencil, Save, Trash2, X } from 'lucide-react';
import { CATEGORIES, CATEGORY_MAP, PRIORITIES, PRIORITY_MAP } from '../lib/constants';
import { formatTime } from '../lib/utils';
import type { CategoryId, Priority, Todo } from '../types';

interface TodoItemViewProps {
  todo: Todo;
  editing: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onStartEdit: (todo: Todo) => void;
  onSaveEdit: (
    id: string,
    title: string,
    category: CategoryId,
    priority: Priority,
  ) => void;
  onCancelEdit: () => void;
  dragHandleProps?: Record<string, unknown>;
  dragging?: boolean;
}

export default function TodoItem({
  todo,
  editing,
  onToggle,
  onDelete,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  dragHandleProps,
  dragging = false,
}: TodoItemViewProps) {
  const priority = PRIORITY_MAP[todo.priority];
  const category = CATEGORY_MAP[todo.category];
  const CategoryIcon = category.icon;

  return (
    <li
      className={`theme-aware group relative flex animate-fade-up items-start gap-3 overflow-hidden rounded-xl border bg-[#fffdf8] py-3 pl-4 pr-3 transition-shadow duration-200 dark:bg-[#1f1d19] ${
        dragging
          ? 'z-10 border-pine-500/40 shadow-lift'
          : 'border-ink/[0.07] shadow-card hover:border-ink/[0.13] dark:border-white/[0.08] dark:hover:border-white/20'
      } ${todo.completed ? 'opacity-60' : ''}`}
    >
      <span
        aria-hidden
        className={`absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full ${priority.dot}`}
      />

      <button
        type="button"
        onClick={() => onToggle(todo.id)}
        aria-label={todo.completed ? '标记为未完成' : '标记为完成'}
        aria-pressed={todo.completed}
        className={`mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 active:scale-90 ${
          todo.completed
            ? 'border-pine-600 bg-pine-600 text-white dark:border-pine-500 dark:bg-pine-500 dark:text-[#0f1a14]'
            : 'border-ink/25 text-transparent hover:border-pine-600 dark:border-white/30 dark:hover:border-pine-500'
        }`}
      >
        <Check
          className={`h-3.5 w-3.5 ${todo.completed ? 'animate-pop-in' : ''}`}
          strokeWidth={3}
        />
      </button>

      {editing ? (
        <EditForm
          key="edit"
          todo={todo}
          onSave={(title, cat, pri) => onSaveEdit(todo.id, title, cat, pri)}
          onCancel={onCancelEdit}
        />
      ) : (
        <div className="min-w-0 flex-1">
          <p
            className={`strike-line break-words text-[15px] leading-6 ${
              todo.completed ? 'is-done text-ink-faint dark:text-[#8d8678]' : 'text-ink dark:text-[#ece7dc]'
            }`}
          >
            {todo.title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-ink-faint dark:text-[#8d8678]">
            <span className="inline-flex items-center gap-1">
              <CategoryIcon className="h-3 w-3" strokeWidth={2} />
              {category.label}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-1.5 py-px ${priority.chipLight} ${priority.chipDark}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${priority.dot}`} />
              {priority.label}优先级
            </span>
            <span className="tabular-nums">{formatTime(todo.createdAt)}</span>
          </div>
        </div>
      )}

      {!editing && (
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => onStartEdit(todo)}
            aria-label="编辑待办"
            className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-paper-deep hover:text-ink dark:text-[#8d8678] dark:hover:bg-white/10 dark:hover:text-[#ece7dc]"
          >
            <Pencil className="h-4 w-4" strokeWidth={1.9} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(todo.id)}
            aria-label="删除待办"
            className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-cinnabar-50 hover:text-cinnabar-600 dark:text-[#8d8678] dark:hover:bg-cinnabar-500/15 dark:hover:text-[#e88070]"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.9} />
          </button>
          <button
            type="button"
            aria-label="拖拽排序"
            title="拖拽调整顺序"
            className="cursor-grab touch-none rounded-lg p-1.5 text-ink-faint/60 transition-colors hover:bg-paper-deep hover:text-ink active:cursor-grabbing dark:text-[#7d7668] dark:hover:bg-white/10 dark:hover:text-[#cfc8ba]"
            {...dragHandleProps}
          >
            <GripVertical className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      )}
    </li>
  );
}

interface EditFormProps {
  todo: Todo;
  onSave: (title: string, category: CategoryId, priority: Priority) => void;
  onCancel: () => void;
}

function EditForm({ todo, onSave, onCancel }: EditFormProps) {
  const [title, setTitle] = useState(todo.title);
  const [category, setCategory] = useState<CategoryId>(todo.category);
  const [priority, setPriority] = useState<Priority>(todo.priority);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSave = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onSave(trimmed, category, priority);
  };

  return (
    <div className="min-w-0 flex-1 space-y-2.5">
      <input
        ref={inputRef}
        type="text"
        value={title}
        maxLength={120}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') onCancel();
        }}
        aria-label="编辑待办内容"
        className="w-full rounded-lg border border-pine-500/50 bg-transparent px-2.5 py-1.5 text-[15px] text-ink outline-none dark:text-[#ece7dc]"
      />
      <div className="flex items-center gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as CategoryId)}
          aria-label="编辑分类"
          className="rounded-lg border border-ink/15 bg-paper px-2 py-1 text-xs text-ink-soft outline-none dark:border-white/15 dark:bg-[#26241f] dark:text-[#cfc8ba] [&>option]:dark:bg-[#26241f]"
        >
          {CATEGORIES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          aria-label="编辑优先级"
          className="rounded-lg border border-ink/15 bg-paper px-2 py-1 text-xs text-ink-soft outline-none dark:border-white/15 dark:bg-[#26241f] dark:text-[#cfc8ba] [&>option]:dark:bg-[#26241f]"
        >
          {PRIORITIES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}优先级
            </option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={!title.trim()}
            aria-label="保存修改"
            className="inline-flex items-center gap-1 rounded-lg bg-pine-600 px-2.5 py-1 text-xs font-medium text-white transition-all hover:bg-pine-700 active:scale-95 disabled:opacity-40 dark:bg-pine-500 dark:text-[#0f1a14]"
          >
            <Save className="h-3.5 w-3.5" strokeWidth={2} />
            保存
          </button>
          <button
            type="button"
            onClick={onCancel}
            aria-label="取消编辑"
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-ink-faint transition-colors hover:bg-paper-deep hover:text-ink dark:text-[#8d8678] dark:hover:bg-white/10 dark:hover:text-[#ece7dc]"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} />
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
