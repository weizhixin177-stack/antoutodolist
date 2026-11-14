import { useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import TodoForm from './components/TodoForm';
import StatsBar from './components/StatsBar';
import FilterBar from './components/FilterBar';
import SortableTodoItem from './components/SortableTodoItem';
import EmptyState from './components/EmptyState';
import FocusTimer from './components/FocusTimer';
import ThemeToggle from './components/ThemeToggle';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useTheme } from './hooks/useTheme';
import { SAMPLE_TODOS, STORAGE_KEYS } from './lib/constants';
import { createId } from './lib/utils';
import type {
  CategoryId,
  Filters,
  Priority,
  Todo,
} from './types';

function applyFilters(todos: Todo[], filters: Filters): Todo[] {
  const keyword = filters.keyword.trim().toLowerCase();
  return todos.filter((todo) => {
    if (filters.status === 'active' && todo.completed) return false;
    if (filters.status === 'completed' && !todo.completed) return false;
    if (filters.category !== 'all' && todo.category !== filters.category)
      return false;
    if (keyword && !todo.title.toLowerCase().includes(keyword)) return false;
    return true;
  });
}

export default function App() {
  const [todos, setTodos] = useLocalStorage<Todo[]>(
    STORAGE_KEYS.todos,
    SAMPLE_TODOS,
  );
  const { theme, toggleTheme } = useTheme();
  const [filters, setFilters] = useState<Filters>({
    status: 'all',
    category: 'all',
    keyword: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const stats = useMemo(() => {
    const completed = todos.filter((t) => t.completed).length;
    return {
      total: todos.length,
      completed,
      active: todos.length - completed,
      highActive: todos.filter((t) => !t.completed && t.priority === 'high')
        .length,
    };
  }, [todos]);

  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryId, number> = {
      work: 0,
      life: 0,
      study: 0,
      other: 0,
    };
    todos.forEach((t) => {
      counts[t.category] += 1;
    });
    return counts;
  }, [todos]);

  const visibleTodos = useMemo(
    () => applyFilters(todos, filters),
    [todos, filters],
  );

  const focusCandidates = useMemo(
    () => todos.filter((t) => t.deadline && !t.completed),
    [todos],
  );
  const focusTodo = useMemo(
    () => todos.find((t) => t.id === focusId) ?? null,
    [todos, focusId],
  );

  const addTodo = (
    title: string,
    category: CategoryId,
    priority: Priority,
    deadline?: number,
  ) => {
    const todo: Todo = {
      id: createId(),
      title,
      completed: false,
      category,
      priority,
      createdAt: Date.now(),
      deadline: deadline && !Number.isNaN(deadline) ? deadline : undefined,
    };
    setTodos((prev) => [todo, ...prev]);
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    setEditingId((current) => (current === id ? null : current));
  };

  const saveEdit = (
    id: string,
    title: string,
    category: CategoryId,
    priority: Priority,
    deadline?: number,
  ) => {
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              title,
              category,
              priority,
              deadline:
                deadline && !Number.isNaN(deadline) ? deadline : undefined,
            }
          : t,
      ),
    );
    setEditingId(null);
  };

  const clearCompleted = () => {
    setTodos((prev) => prev.filter((t) => !t.completed));
  };

  const patchFilters = (patch: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    setTodos((prev) => {
      const visible = applyFilters(prev, filters);
      const oldIndex = visible.findIndex((t) => t.id === activeId);
      const newIndex = visible.findIndex((t) => t.id === overId);
      if (oldIndex === -1 || newIndex === -1) return prev;

      const reorderedVisible = arrayMove(visible, oldIndex, newIndex);
      const visibleIdSet = new Set(reorderedVisible.map((t) => t.id));

      // 不可见项保持原槽位，可见项按新顺序依次填入
      const result: Todo[] = [];
      let cursor = 0;
      for (const todo of prev) {
        if (visibleIdSet.has(todo.id)) {
          result.push(reorderedVisible[cursor]);
          cursor += 1;
        } else {
          result.push(todo);
        }
      }
      return result;
    });
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-serifcn text-3xl font-bold tracking-wide text-ink dark:text-[#f2ede2]">
            案头清单
          </h1>
          <p className="mt-1 text-sm text-ink-faint dark:text-[#8d8678]">
            把今天的事，一件件完成
          </p>
        </div>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </header>

      <div className="space-y-4">
        <StatsBar
          total={stats.total}
          completed={stats.completed}
          active={stats.active}
          highActive={stats.highActive}
        />

        <TodoForm onAdd={addTodo} />

        <FilterBar
          filters={filters}
          onChange={patchFilters}
          categoryCounts={categoryCounts}
          totalCount={stats.total}
          completedCount={stats.completed}
          onClearCompleted={clearCompleted}
        />

        {visibleTodos.length === 0 ? (
          <EmptyState type={stats.total === 0 ? 'empty' : 'no-result'} />
        ) : (
          <>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={visibleTodos.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-2">
                  {visibleTodos.map((todo) => (
                    <SortableTodoItem
                      key={todo.id}
                      todo={todo}
                      editing={editingId === todo.id}
                      onToggle={toggleTodo}
                      onDelete={deleteTodo}
                      onStartEdit={(t) => setEditingId(t.id)}
                      onSaveEdit={saveEdit}
                      onCancelEdit={() => setEditingId(null)}
                      onFocus={(t) => setFocusId(t.id)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
            <p className="pb-4 text-center text-xs text-ink-faint/80 dark:text-[#7d7668]">
              拖动右侧手柄可调整顺序
            </p>
          </>
        )}

        {focusTodo && (
          <FocusTimer
            key={focusTodo.id}
            todo={focusTodo}
            candidates={focusCandidates}
            onPick={(t) => setFocusId(t.id)}
            onComplete={(id) => {
              toggleTodo(id);
              setFocusId(null);
            }}
            onClose={() => setFocusId(null)}
          />
        )}
      </div>
    </main>
  );
}
