import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CSSProperties } from 'react';
import type { CategoryId, Priority, Todo } from '../types';
import TodoItem from './TodoItem';

interface SortableTodoItemProps {
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
    deadline?: number,
  ) => void;
  onCancelEdit: () => void;
  onFocus: (todo: Todo) => void;
}

export default function SortableTodoItem(props: SortableTodoItemProps) {
  const { todo } = props;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TodoItem
        {...props}
        dragging={isDragging}
        dragHandleProps={listeners}
      />
    </div>
  );
}
