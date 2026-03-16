import { getToken, clearToken } from './auth.js';
import type { Task, TaskList, ListMemberInfo } from './types.js';

export const API_BASE = (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? '/api';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public body?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
  get isUnauthorized(): boolean {
    return this.statusCode === 401;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    clearToken();
    throw new ApiError(401, 'Unauthorized');
  }

  const text = await res.text();
  if (!res.ok) {
    throw new ApiError(res.status, res.statusText, text);
  }

  if (text.length === 0) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined as T;
  }
}

export interface ApkVersions {
  versions: string[];
  latest: string;
}

export const api = {
  async login(email: string, password: string): Promise<{ token: string; user_id?: string }> {
    return request<{ token: string; user_id?: string }>('POST', '/auth/login', { email, password });
  },

  async register(email: string, password: string): Promise<{ token: string; user_id?: string }> {
    return request<{ token: string; user_id?: string }>('POST', '/auth/register', { email, password });
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message?: string }> {
    return request<{ message?: string }>('POST', '/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  /** List APK versions the API can serve (no auth). Use .latest for the download link. */
  async getApkVersions(): Promise<ApkVersions> {
    return request<ApkVersions>('GET', '/apk/versions');
  },

  async listLists(): Promise<TaskList[]> {
    return request<TaskList[]>('GET', '/lists');
  },

  async createList(name: string): Promise<TaskList> {
    return request<TaskList>('POST', '/lists', { name });
  },

  async updateList(id: string, name: string): Promise<TaskList> {
    return request<TaskList>('PATCH', `/lists/${id}`, { name });
  },

  async listListMembers(listId: string): Promise<ListMemberInfo[]> {
    return request<ListMemberInfo[]>('GET', `/lists/${listId}/members`);
  },

  async addListMember(listId: string, email: string): Promise<{ user_id: string; email: string }> {
    return request<{ user_id: string; email: string }>('POST', `/lists/${listId}/members`, { email });
  },

  async removeListMember(listId: string, userId: string): Promise<void> {
    await request('DELETE', `/lists/${listId}/members/${userId}`);
  },

  async deleteList(id: string): Promise<void> {
    await request('DELETE', `/lists/${id}`);
  },

  async listTasks(listId: string, archived = false): Promise<Task[]> {
    const params = new URLSearchParams({ list_id: listId });
    if (archived) params.set('archived', 'true');
    return request<Task[]>('GET', `/tasks?${params}`);
  },

  async getTask(id: string): Promise<Task> {
    return request<Task>('GET', `/tasks/${id}`);
  },

  async createTask(listId: string, body: { title: string; due_date?: string | null }): Promise<Task> {
    return request<Task>('POST', '/tasks', { list_id: listId, ...body });
  },

  async updateTask(id: string, body: Partial<Pick<Task, 'title' | 'description' | 'status' | 'due_date' | 'sort_order' | 'parent_id'>>): Promise<Task> {
    return request<Task>('PATCH', `/tasks/${id}`, body);
  },

  async reorder(items: { id: string; sort_order: number; parent_id?: string | null }[]): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>('PATCH', '/tasks/reorder', items);
  },

  async archiveTask(id: string): Promise<Task> {
    return request<Task>('POST', `/tasks/${id}/archive`);
  },

  async unarchiveTask(id: string): Promise<Task> {
    return request<Task>('POST', `/tasks/${id}/unarchive`);
  },

  async deleteTask(id: string): Promise<void> {
    await request('DELETE', `/tasks/${id}`);
  },
};
