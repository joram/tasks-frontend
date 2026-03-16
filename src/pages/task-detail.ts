import { api, ApiError } from '../api.js';
import { navigateTo } from '../router.js';
import type { Task } from '../types.js';

let task: Task | null = null;
let loading = false;
let error: string | null = null;

async function load(container: HTMLElement, id: string): Promise<void> {
  loading = true;
  error = null;
  renderTaskDetail(container, id);
  try {
    task = await api.getTask(id);
  } catch (e) {
    if (e instanceof ApiError && e.isUnauthorized) {
      navigateTo({ name: 'login' });
      return;
    }
    task = null;
    error = e instanceof ApiError && e.statusCode === 404 ? 'Task not found' : 'Failed to load task';
  } finally {
    loading = false;
    renderTaskDetail(container, id);
  }
}

function escapeHtml(s: string): string {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

export function renderTaskDetail(container: HTMLElement, id: string): void {
  if (task?.id !== id) task = null;
  if (!task) {
    if (id && !loading) load(container, id);
    container.innerHTML = `
    <div class="task-detail-page">
      <a href="#/tasks" id="back-link" style="display:inline-flex;align-items:center;gap:6px;color:var(--text-secondary);text-decoration:none;margin-bottom:16px;font-size:13px;">← Back to tasks</a>
      <div id="task-detail-content"></div>
    </div>
  `;
    container.querySelector('#back-link')!.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo({ name: 'tasks' });
    });
    const content = container.querySelector('#task-detail-content')!;
    if (loading) content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    else content.innerHTML = `<div class="error-state"><p>${error ?? 'Not found'}</p><button type="button" class="btn btn-secondary" onclick="location.hash='#/tasks'">Back to list</button></div>`;
    return;
  }

  container.innerHTML = `
    <div class="task-detail-page">
      <a href="#/tasks" id="back-link" style="display:inline-flex;align-items:center;gap:6px;color:var(--text-secondary);text-decoration:none;margin-bottom:16px;font-size:13px;">← Back to tasks</a>
      <div id="task-detail-content"></div>
    </div>
  `;

  container.querySelector('#back-link')!.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo({ name: 'tasks' });
  });

  const content = container.querySelector('#task-detail-content')!;

  if (loading) {
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    return;
  }
  if (error || !task) {
    content.innerHTML = `
      <div class="error-state">
        <p>${error ?? 'Not found'}</p>
        <button type="button" class="btn btn-secondary" onclick="location.hash='#/tasks'">Back to list</button>
      </div>
    `;
    return;
  }

  const dueValue = task.due_date ? task.due_date.slice(0, 10) : '';

  content.innerHTML = `
    <div class="task-detail-card">
      <div class="field">
        <div class="field-label">Title</div>
        <input type="text" id="detail-title" value="${escapeHtml(task.title)}" />
      </div>
      <div class="field">
        <div class="field-label">Status</div>
        <div class="status-group">
          <label><input type="radio" name="status" value="pending" ${task.status === 'pending' ? 'checked' : ''} /><span>Pending</span></label>
          <label><input type="radio" name="status" value="in_progress" ${task.status === 'in_progress' ? 'checked' : ''} /><span>In progress</span></label>
          <label><input type="radio" name="status" value="done" ${task.status === 'done' ? 'checked' : ''} /><span>Done</span></label>
        </div>
      </div>
      <div class="field">
        <div class="field-label">Due date</div>
        <input type="date" id="detail-due" value="${dueValue}" />
      </div>
      <div class="field">
        <div class="field-label">Description</div>
        <textarea id="detail-desc" placeholder="Optional">${escapeHtml(task.description || '')}</textarea>
      </div>
      <div class="detail-actions">
        <button type="button" class="btn btn-outline-archive" id="detail-archive">Archive task</button>
      </div>
    </div>
  `;

  const titleEl = content.querySelector<HTMLInputElement>('#detail-title')!;
  const statusEls = content.querySelectorAll<HTMLInputElement>('input[name="status"]');
  const dueEl = content.querySelector<HTMLInputElement>('#detail-due')!;
  const descEl = content.querySelector<HTMLTextAreaElement>('#detail-desc')!;

  const save = async (): Promise<void> => {
    const status = (content.querySelector<HTMLInputElement>('input[name="status"]:checked')!)?.value as Task['status'];
    try {
      task = await api.updateTask(id, {
        title: titleEl.value.trim() || task!.title,
        description: descEl.value.trim() || undefined,
        status,
        due_date: dueEl.value ? new Date(dueEl.value).toISOString() : null,
      });
    } catch (e) {
      if (e instanceof ApiError && e.isUnauthorized) navigateTo({ name: 'login' });
    }
  };

  titleEl.addEventListener('blur', save);
  statusEls.forEach((el) => el.addEventListener('change', save));
  dueEl.addEventListener('change', save);
  descEl.addEventListener('blur', save);

  content.querySelector('#detail-archive')!.addEventListener('click', async () => {
    try {
      await api.archiveTask(id);
      navigateTo({ name: 'tasks' });
    } catch (e) {
      if (e instanceof ApiError && e.isUnauthorized) navigateTo({ name: 'login' });
    }
  });
}
