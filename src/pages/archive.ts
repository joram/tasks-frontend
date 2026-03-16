import { api, ApiError } from '../api.js';
import { navigateTo } from '../router.js';
import type { Task } from '../types.js';
import { formatArchivedAt } from '../types.js';

let tasks: Task[] = [];
let loading = true;
let error: string | null = null;

function escapeHtml(s: string): string {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

async function load(container: HTMLElement): Promise<void> {
  loading = true;
  error = null;
  renderArchive(container);
  try {
    const lists = await api.listLists();
    const listId = lists.length > 0
      ? (sessionStorage.getItem('task_tracker_current_list_id') || lists[0].id)
      : null;
    if (listId && lists.some((l) => l.id === listId)) {
      tasks = await api.listTasks(listId, true);
    } else {
      tasks = [];
    }
  } catch (e) {
    if (e instanceof ApiError && e.isUnauthorized) {
      navigateTo({ name: 'login' });
      return;
    }
    tasks = [];
    error = e instanceof ApiError ? 'Failed to load archive' : 'Connection failed';
  } finally {
    loading = false;
    renderArchive(container);
  }
}

async function handleUnarchive(task: Task, container: HTMLElement): Promise<void> {
  try {
    await api.unarchiveTask(task.id);
    tasks = tasks.filter((t) => t.id !== task.id);
    renderArchive(container);
  } catch (e) {
    if (e instanceof ApiError && e.isUnauthorized) navigateTo({ name: 'login' });
  }
}

export function renderArchive(container: HTMLElement): void {
  if (!loading && tasks.length === 0 && !error) load(container);

  container.innerHTML = `
    <h1 class="page-title">Archive</h1>
    <p style="color:var(--text-secondary);margin:0 0 20px 0;font-size:13px;">Archived tasks. Restore to move back to the main list.</p>
    <div id="archive-content"></div>
  `;

  const content = container.querySelector('#archive-content')!;

  if (loading) {
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    return;
  }
  if (error) {
    content.innerHTML = `
      <div class="error-state">
        <p>${error}</p>
        <button type="button" class="btn btn-secondary" id="archive-retry">Retry</button>
      </div>
    `;
    content.querySelector('#archive-retry')!.addEventListener('click', () => load(container));
    return;
  }
  if (tasks.length === 0) {
    content.innerHTML = `
      <div class="empty-state">
        <p>No archived tasks.</p>
      </div>
    `;
    return;
  }

  content.innerHTML = `<ul class="task-list" id="archive-list"></ul>`;
  const list = content.querySelector('#archive-list')!;
  tasks.forEach((task) => {
    const li = document.createElement('li');
    li.className = 'task-row';
    li.innerHTML = `
      <div class="task-body">
        <p class="task-title">${escapeHtml(task.title)}</p>
      </div>
      <span class="task-archived-at">Archived ${formatArchivedAt(task.archived_at)}</span>
      <div class="task-actions">
        <button type="button" class="restore-btn" title="Restore">Restore</button>
      </div>
    `;
    li.querySelector('.task-body')!.addEventListener('click', () => navigateTo({ name: 'task-detail', id: task.id }));
    li.querySelector('.restore-btn')!.addEventListener('click', (e) => {
      e.stopPropagation();
      handleUnarchive(task, container);
    });
    list.appendChild(li);
  });
}
