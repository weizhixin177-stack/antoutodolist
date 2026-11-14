export type Priority = 'high' | 'medium' | 'low';

export type CategoryId = 'work' | 'life' | 'study' | 'other';

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  category: CategoryId;
  priority: Priority;
  createdAt: number;
  /** 截止时间（毫秒时间戳），用于倒计时 */
  deadline?: number;
}

export type StatusFilter = 'all' | 'active' | 'completed';

export interface Filters {
  status: StatusFilter;
  category: CategoryId | 'all';
  keyword: string;
}
