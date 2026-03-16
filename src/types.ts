export type TaskStatus = 'pending' | 'in_progress' | 'done';

export interface Task {
  id: string;
  list_id: string | null;
  parent_id: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  due_date: string | null;
  sort_order: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskList {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  /** Present when from list API: 'owner' | 'member' */
  role?: 'owner' | 'member';
}

export interface ListMemberInfo {
  user_id: string;
  email: string;
}


export function isOverdue(task: Task): boolean {
  if (!task.due_date || task.status === 'done') return false;
  return new Date(task.due_date) < new Date();
}

export function formatDueDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
}

export function formatArchivedAt(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}
