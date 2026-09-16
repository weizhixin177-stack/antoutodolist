import {
  Briefcase,
  Coffee,
  BookOpen,
  Layers,
  type LucideIcon,
} from 'lucide-react';
import type { CategoryId, Priority, Todo } from '../types';

interface CategoryMeta {
  id: CategoryId;
  label: string;
  icon: LucideIcon;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'work', label: '工作', icon: Briefcase },
  { id: 'life', label: '生活', icon: Coffee },
  { id: 'study', label: '学习', icon: BookOpen },
  { id: 'other', label: '其他', icon: Layers },
];

export const CATEGORY_MAP: Record<CategoryId, CategoryMeta> = CATEGORIES.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<CategoryId, CategoryMeta>,
);

interface PriorityMeta {
  id: Priority;
  label: string;
  /** 色点 / 左边条 */
  dot: string;
  /** 浅色模式芯片 */
  chipLight: string;
  /** 深色模式芯片 */
  chipDark: string;
}

export const PRIORITIES: PriorityMeta[] = [
  {
    id: 'high',
    label: '高',
    dot: 'bg-cinnabar-500',
    chipLight: 'bg-cinnabar-50 text-cinnabar-600',
    chipDark: 'dark:bg-cinnabar-500/15 dark:text-cinnabar-100',
  },
  {
    id: 'medium',
    label: '中',
    dot: 'bg-amber2-500',
    chipLight: 'bg-amber2-50 text-amber2-600',
    chipDark: 'dark:bg-amber2-500/15 dark:text-amber2-100',
  },
  {
    id: 'low',
    label: '低',
    dot: 'bg-[#6f8890]',
    chipLight: 'bg-[#eef2f4] text-[#4d6670]',
    chipDark: 'dark:bg-[#6f8890]/15 dark:text-[#b7c8cf]',
  },
];

export const PRIORITY_MAP: Record<Priority, PriorityMeta> = PRIORITIES.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<Priority, PriorityMeta>,
);

export const STORAGE_KEYS = {
  todos: 'antou.todos.v1',
  theme: 'antou.theme.v1',
} as const;

export const SAMPLE_TODOS: Todo[] = [
  {
    id: 'sample-1',
    title: '整理本周项目周报，下午四点前发出',
    completed: false,
    category: 'work',
    priority: 'high',
    createdAt: Date.now() - 1000 * 60 * 42,
  },
  {
    id: 'sample-2',
    title: '读完《设计中的设计》第三章',
    completed: false,
    category: 'study',
    priority: 'medium',
    createdAt: Date.now() - 1000 * 60 * 60 * 3,
  },
  {
    id: 'sample-3',
    title: '给窗台上的薄荷浇水',
    completed: true,
    category: 'life',
    priority: 'low',
    createdAt: Date.now() - 1000 * 60 * 60 * 26,
  },
];
