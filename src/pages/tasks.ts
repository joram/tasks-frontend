import { api, ApiError } from '../api.js';
import { navigateTo } from '../router.js';
import type { Task, TaskList } from '../types.js';
import { formatDueDate, isOverdue } from '../types.js';

const CURRENT_LIST_KEY = 'task_tracker_current_list_id';

const TASK_COLORS = [
  '#7C3AED', '#2563EB', '#0891B2', '#059669',
  '#D97706', '#DB2777', '#DC2626', '#EA580C',
];

function hexToRgb(hex: string): string {
  return `${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)}`;
}

let lists: TaskList[] = [];
let currentListId: string | null = null;
let tasks: Task[] = [];
let loading = false;
let initialized = false;
let error: string | null = null;
let toastTimeout: number | null = null;
const collapsedParentIds = new Set<string>();
/** When creating a new task, insert it below this task (last created or moved). */
let lastCreatedOrMovedTaskId: string | null = null;
let _onListsChange: (() => void) | null = null;

export function getListsState(): { lists: TaskList[]; currentListId: string | null } {
  return { lists, currentListId };
}

export function updateListInState(id: string, name: string): void {
  const idx = lists.findIndex((l) => l.id === id);
  if (idx >= 0) lists[idx] = { ...lists[idx], name };
}

export async function switchList(id: string): Promise<void> {
  if (id === currentListId) return;
  currentListId = id;
  try {
    sessionStorage.setItem(CURRENT_LIST_KEY, id);
  } catch (_) {}
  try {
    tasks = await api.listTasks(id, false);
  } catch (e) {
    if (e instanceof ApiError && e.isUnauthorized) {
      navigateTo({ name: 'login' });
      return;
    }
    tasks = [];
  }
  _onListsChange?.();
}

export async function createList(name: string): Promise<void> {
  try {
    const list = await api.createList(name.trim());
    lists = [...lists, list];
    currentListId = list.id;
    try {
      sessionStorage.setItem(CURRENT_LIST_KEY, list.id);
    } catch (_) {}
    tasks = await api.listTasks(list.id, false);
    _onListsChange?.();
  } catch (e) {
    if (e instanceof ApiError && e.isUnauthorized) {
      navigateTo({ name: 'login' });
      return;
    }
    throw new Error('Failed to create list');
  }
}

function getFilteredTasks(): Task[] {
  return tasks;
}

/** Depth-first order with indent depth (0 = root). */
function getOrderedWithDepth(taskList: Task[]): { task: Task; depth: number }[] {
  const byParent = new Map<string | null, Task[]>();
  for (const t of taskList) {
    const pid = t.parent_id ?? null;
    if (!byParent.has(pid)) byParent.set(pid, []);
    byParent.get(pid)!.push(t);
  }
  for (const arr of byParent.values()) {
    arr.sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at));
  }
  const out: { task: Task; depth: number }[] = [];
  function walk(pid: string | null, depth: number): void {
    const children = byParent.get(pid) ?? [];
    for (const t of children) {
      out.push({ task: t, depth });
      walk(t.id, depth + 1);
    }
  }
  walk(null, 0);
  return out;
}

function getByParent(taskList: Task[]): Map<string | null, Task[]> {
  const byParent = new Map<string | null, Task[]>();
  for (const t of taskList) {
    const pid = t.parent_id ?? null;
    if (!byParent.has(pid)) byParent.set(pid, []);
    byParent.get(pid)!.push(t);
  }
  return byParent;
}

function countDescendants(byParent: Map<string | null, Task[]>, taskId: string): number {
  const children = byParent.get(taskId) ?? [];
  let n = children.length;
  for (const c of children) n += countDescendants(byParent, c.id);
  return n;
}

/** Visible rows (hide children of collapsed parents) with full-order index for reorder. */
function getVisibleOrderedWithDepth(
  taskList: Task[],
  collapsed: Set<string>
): { task: Task; depth: number; fullIndex: number }[] {
  const ordered = getOrderedWithDepth(taskList);
  const out: { task: Task; depth: number; fullIndex: number }[] = [];
  for (let i = 0; i < ordered.length; i++) {
    const { task } = ordered[i];
    let hidden = false;
    let pid: string | null = task.parent_id;
    while (pid != null) {
      if (collapsed.has(pid)) {
        hidden = true;
        break;
      }
      const parent = taskList.find((t) => t.id === pid);
      pid = parent?.parent_id ?? null;
    }
    if (!hidden) out.push({ ...ordered[i], fullIndex: i });
  }
  return out;
}

export function showToast(message: string, undo?: () => void): void {
  const container = document.querySelector('.toast-container') || (() => {
    const el = document.createElement('div');
    el.className = 'toast-container';
    document.body.appendChild(el);
    return el;
  })();
  if (toastTimeout != null) window.clearTimeout(toastTimeout);
  const id = 't' + Date.now();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.id = id;
  toast.innerHTML = undo
    ? `<span>${message}</span><button type="button" class="toast-undo">Undo</button>`
    : `<span>${message}</span>`;
  container.appendChild(toast);
  if (undo) {
    toast.querySelector('.toast-undo')!.addEventListener('click', () => {
      undo();
      toast.remove();
    });
  }
  toastTimeout = window.setTimeout(() => {
    toast.remove();
    toastTimeout = null;
  }, 4000);
}

async function load(container: HTMLElement): Promise<void> {
  if (loading) return;
  loading = true;
  error = null;
  try {
    const listList = await api.listLists();
    lists = Array.isArray(listList) ? listList : [];
    if (lists.length === 0) {
      const defaultList = await api.createList('Default');
      lists = [defaultList];
    }
    currentListId = currentListId && lists.some((l) => l.id === currentListId)
      ? currentListId
      : (lists[0]?.id ?? null);
    if (currentListId) {
      try {
        sessionStorage.setItem(CURRENT_LIST_KEY, currentListId);
      } catch (_) {}
      tasks = await api.listTasks(currentListId, false);
    } else {
      tasks = [];
    }
  } catch (e) {
    if (e instanceof ApiError && e.isUnauthorized) {
      loading = false;
      navigateTo({ name: 'login' });
      return;
    }
    error = e instanceof ApiError ? 'Failed to load tasks' : 'Connection failed';
  } finally {
    loading = false;
    initialized = true;
    _onListsChange?.();
    const main = document.getElementById('app-main');
    if (main) {
      renderTasks(main);
    } else {
      renderTasks(container);
    }
  }
}

async function handleArchive(task: Task): Promise<void> {
  const hasChildren = tasks.some((t) => t.parent_id === task.id);
  if (hasChildren) {
    showToast('Archive all subtasks first');
    return;
  }
  const id = task.id;
  try {
    await api.archiveTask(id);
    tasks = tasks.filter((t) => t.id !== id);
    showToast('Archived', () => handleUndoUnarchive(id));
  } catch {
    showToast('Failed to archive');
  }
  const el = document.getElementById('app-main');
  if (el) renderTasks(el);
}

async function handleUndoUnarchive(id: string): Promise<void> {
  try {
    const t = await api.unarchiveTask(id);
    tasks = [t, ...tasks];
    const el = document.getElementById('app-main');
    if (el) renderTasks(el);
  } catch {
    showToast('Failed to restore');
  }
}

async function handleAddTask(title: string): Promise<void> {
  if (!title.trim() || !currentListId) return;
  try {
    const due = new Date();
    due.setDate(due.getDate() + 7);
    const task = await api.createTask(currentListId, {
      title: title.trim(),
      due_date: due.toISOString(),
    });
    tasks = [...tasks, task];

    if (lastCreatedOrMovedTaskId != null) {
      const ordered = getOrderedWithDepth(tasks);
      const insertAfterIdx = ordered.findIndex(({ task: t }) => t.id === lastCreatedOrMovedTaskId);
      const newTaskIdx = ordered.findIndex(({ task: t }) => t.id === task.id);
      if (insertAfterIdx >= 0 && newTaskIdx >= 0 && newTaskIdx !== insertAfterIdx + 1) {
        const newOrder = ordered.map((x) => ({ ...x }));
        const [moved] = newOrder.splice(newTaskIdx, 1);
        const toIndex = insertAfterIdx + 1;
        const insertAt = newTaskIdx < toIndex ? toIndex - 1 : toIndex;
        newOrder.splice(insertAt, 0, moved);
        const taskAbove = insertAt > 0 ? newOrder[insertAt - 1].task : null;
        const newParentId = taskAbove?.parent_id ?? null;
        const inTasks = tasks.find((t) => t.id === task.id);
        if (inTasks) inTasks.parent_id = newParentId;
        newOrder.forEach(({ task: t }, i) => {
          t.sort_order = i;
        });
        const updates = newOrder.map(({ task: t }, i) => ({
          id: t.id,
          sort_order: i,
          ...(t.id === task.id ? { parent_id: newParentId } : {}),
        }));
        try {
          await api.reorder(updates);
        } catch {
          showToast('Failed to reorder new task');
        }
      }
    }
    lastCreatedOrMovedTaskId = task.id;

    renderTasks(document.getElementById('app-main')!);
  } catch (e) {
    if (e instanceof ApiError && e.isUnauthorized) {
      navigateTo({ name: 'login' });
      return;
    }
    showToast('Failed to add task');
  }
}

type IndentOutdent = 'indent' | 'outdent' | null;

async function handleReorder(fromIndex: number, toIndex: number, indentOutdent: IndentOutdent = null): Promise<void> {
  const filtered = getFilteredTasks();
  const ordered = getOrderedWithDepth(filtered);
  if (toIndex < 0 || toIndex > ordered.length) return;
  if (fromIndex === toIndex && indentOutdent == null) return;

  const newOrder = ordered.map((x) => ({ ...x }));
  const [moved] = newOrder.splice(fromIndex, 1);
  const insertAt = fromIndex < toIndex ? toIndex - 1 : toIndex;
  newOrder.splice(insertAt, 0, moved);

  const movedTask = moved.task;
  const taskAbove = insertAt > 0 ? newOrder[insertAt - 1].task : null;
  const canIndent = taskAbove !== null && (taskAbove.parent_id == null);
  const newParentId: string | null =
    insertAt === 0
      ? null
      : indentOutdent === 'indent' && canIndent
        ? taskAbove!.id
        : (taskAbove?.parent_id ?? null);

  const inTasks = tasks.find((t) => t.id === movedTask.id);
  if (inTasks) inTasks.parent_id = newParentId;

  const newOrdered = getOrderedWithDepth(getFilteredTasks());
  newOrdered.forEach(({ task }, i) => {
    task.sort_order = i;
  });
  const updates = newOrdered.map(({ task }, i) => ({
    id: task.id,
    sort_order: i,
    ...(task.id === movedTask.id ? { parent_id: newParentId } : {}),
  }));

  const container = document.getElementById('app-main');
  if (container) renderTasks(container);

  try {
    await api.reorder(updates);
    lastCreatedOrMovedTaskId = movedTask.id;
  } catch {
    showToast('Failed to save order');
    if (container) load(container);
  }
}

function getStoredListId(): string | null {
  try {
    return sessionStorage.getItem(CURRENT_LIST_KEY);
  } catch {
    return null;
  }
}

async function loadShareMembers(): Promise<void> {
  const list = document.getElementById('share-members-list');
  if (!currentListId || !list) return;
  try {
    const members = await api.listListMembers(currentListId);
    list.innerHTML = members.map((m) => `<li><span>${escapeHtml(m.email)}</span> <button type="button" class="btn btn-sm link-btn share-remove-btn" data-user-id="${m.user_id}">Remove</button></li>`).join('');
    list.querySelectorAll('.share-remove-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const uid = (btn as HTMLElement).dataset.userId!;
        try {
          await api.removeListMember(currentListId!, uid);
          loadShareMembers();
        } catch {
          showToast('Failed to remove member');
        }
      });
    });
  } catch {
    list.innerHTML = '<li>Failed to load members</li>';
  }
}

export function toggleSharePanel(): void {
  const panel = document.getElementById('list-share-panel');
  if (!panel) return;
  const visible = (panel as HTMLElement).style.display !== 'none';
  (panel as HTMLElement).style.display = visible ? 'none' : 'block';
  if (!visible) {
    const err = document.getElementById('share-error');
    if (err) (err as HTMLElement).style.display = 'none';
    loadShareMembers();
  }
}

export interface RenderTasksOptions {
  onListsChange?: () => void;
}

export function renderTasks(container: HTMLElement, options?: RenderTasksOptions): void {
  _onListsChange = options?.onListsChange ?? null;
  if (currentListId == null && lists.length === 0) {
    const stored = getStoredListId();
    if (stored) currentListId = stored;
  }
  if (!initialized) {
    load(container);
    const main = document.getElementById('app-main');
    if (main) {
      main.innerHTML = `
        <h1 class="page-title">Tasks</h1>
        <div id="tasks-content"><div class="loading"><div class="spinner"></div></div></div>
      `;
    }
    return;
  }

  const filtered = getFilteredTasks();

  container.innerHTML = `
    <h1 class="page-title">Tasks</h1>
    <div class="list-share-panel" id="list-share-panel" style="display:none;">
      <p class="list-share-title">Share this list</p>
      <div class="list-share-add">
        <input type="email" id="share-email-input" placeholder="Email address" />
        <button type="button" class="btn btn-primary btn-sm" id="share-add-btn">Add</button>
      </div>
      <p class="list-share-error" id="share-error" style="display:none;"></p>
      <ul class="list-share-members" id="share-members-list"></ul>
    </div>
    <div class="add-task-bar">
      <input type="text" id="new-task-title" placeholder="Add a task…" />
      <button type="button" class="btn btn-primary" id="add-task-btn">Add</button>
    </div>
    <div id="tasks-content"></div>
    <div class="toast-container" id="toast-container"></div>
  `;

  const content = container.querySelector('#tasks-content')!;
  const newTitleInput = container.querySelector<HTMLInputElement>('#new-task-title')!;
  const addBtn = container.querySelector<HTMLButtonElement>('#add-task-btn')!;

  if (loading) {
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    return;
  }
  if (error) {
    content.innerHTML = `
      <div class="error-state">
        <p>${error}</p>
        <button type="button" class="btn btn-secondary" id="retry-btn">Retry</button>
      </div>
    `;
    content.querySelector('#retry-btn')!.addEventListener('click', () => {
      const main = document.getElementById('app-main');
      load(main ?? container);
    });
    return;
  }
  if (filtered.length === 0) {
    content.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:64px;height:64px;">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <p>No tasks. Add one above.</p>
      </div>
    `;
  } else {
    const byParent = getByParent(filtered);
    const orderedWithDepth = getOrderedWithDepth(filtered);
    const visibleOrdered = getVisibleOrderedWithDepth(filtered, collapsedParentIds);
    const rootColorMap = new Map<string, string>();
    let colorIdx = 0;
    orderedWithDepth.forEach(({ task }) => {
      if (task.parent_id == null && !rootColorMap.has(task.id)) {
        rootColorMap.set(task.id, TASK_COLORS[colorIdx++ % TASK_COLORS.length]);
      }
    });
    const indentPx = 24;
    content.innerHTML = `
      <ul class="task-list" id="task-list"></ul>
    `;
    const list = content.querySelector('#task-list')!;
    visibleOrdered.forEach(({ task, depth, fullIndex }, visibleIndex) => {
      const children = byParent.get(task.id) ?? [];
      const childCount = countDescendants(byParent, task.id);
      const isCollapsed = collapsedParentIds.has(task.id);
      const hex = task.parent_id == null
        ? rootColorMap.get(task.id)!
        : rootColorMap.get(task.parent_id) ?? TASK_COLORS[0];
      const rgb = hexToRgb(hex);
      const isChild = task.parent_id != null;
      const li = document.createElement('li');
      li.className = 'task-row';
      li.dataset.taskId = task.id;
      li.dataset.index = String(visibleIndex);
      li.dataset.fullIndex = String(fullIndex);
      li.style.marginLeft = `${indentPx * depth}px`;
      li.style.paddingLeft = '16px';
      li.style.background = `rgba(${rgb}, ${isChild ? 0.06 : 0.12})`;
      li.style.borderLeftColor = isChild ? `rgba(${rgb}, 0.5)` : hex;
      li.style.borderLeftWidth = '3px';
      const collapseHtml =
        children.length > 0
          ? `<button type="button" class="task-collapse" title="${isCollapsed ? 'Expand' : 'Collapse'}" aria-label="${isCollapsed ? 'Expand' : 'Collapse'}">${isCollapsed ? '▶' : '▼'}</button>${isCollapsed ? `<span class="task-collapse-count">${childCount}</span>` : ''}`
          : '';
      const hasParent = task.parent_id != null;
      const taskAbove = fullIndex > 0 ? orderedWithDepth[fullIndex - 1].task : null;
      const canIndent = taskAbove !== null && taskAbove.parent_id == null;
      const indentOutdentHtml = hasParent
        ? `<span class="task-indent-outdent"><button type="button" class="task-outdent-btn" title="Outdent" aria-label="Outdent">‹</button></span>`
        : `<span class="task-indent-outdent"><button type="button" class="task-indent-btn" title="Indent" aria-label="Indent" ${canIndent ? '' : 'disabled'}>›</button></span>`;
      li.innerHTML = `
        ${indentOutdentHtml}
        <span class="drag-handle" data-index="${visibleIndex}" data-full-index="${fullIndex}" title="Drag to reorder; drag right to indent, left to outdent">⋮⋮</span>
        ${collapseHtml}
        <div class="task-body">
          <p class="task-title">${escapeHtml(task.title)}</p>
        </div>
        <span class="task-due ${isOverdue(task) ? 'overdue' : ''}">${formatDueDate(task.due_date)}</span>
        <div class="task-actions">
          <button type="button" class="archive-btn" title="Archive">Archive</button>
        </div>
      `;
      li.querySelector('.task-body')!.addEventListener('click', () => navigateTo({ name: 'task-detail', id: task.id }));
      li.querySelector('.archive-btn')!.addEventListener('click', (e) => {
        e.stopPropagation();
        handleArchive(task);
      });
      const collapseBtn = li.querySelector('.task-collapse');
      if (collapseBtn) {
        collapseBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (collapsedParentIds.has(task.id)) collapsedParentIds.delete(task.id);
          else collapsedParentIds.add(task.id);
          renderTasks(container);
        });
      }
      const outdentBtn = li.querySelector('.task-outdent-btn');
      if (outdentBtn) {
        outdentBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          handleReorder(fullIndex, fullIndex, 'outdent');
        });
      }
      const indentBtn = li.querySelector('.task-indent-btn');
      if (indentBtn && canIndent) {
        indentBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          handleReorder(fullIndex, fullIndex, 'indent');
        });
      }
      list.appendChild(li);
    });

    const sentinel = document.createElement('li');
    sentinel.className = 'task-list-drop-sentinel';
    sentinel.id = 'task-list-bottom-drop';
    list.appendChild(sentinel);
    const getTaskHasChildren = (taskId: string): boolean => (byParent.get(taskId)?.length ?? 0) > 0;
    makeSortable(list, (fromFull, toFull, indentOutdent) => handleReorder(fromFull, toFull, indentOutdent), visibleOrdered, orderedWithDepth.length, indentPx, getTaskHasChildren);
  }

  const sharePanel = container.querySelector('#list-share-panel');
  if (sharePanel) {
    const shareEmailInput = container.querySelector<HTMLInputElement>('#share-email-input');
    const shareAddBtn = container.querySelector('#share-add-btn');
    const shareError = container.querySelector<HTMLElement>('#share-error');
    if (shareAddBtn && shareEmailInput && shareError) {
      shareAddBtn.addEventListener('click', async () => {
        const email = shareEmailInput.value.trim();
        if (!email || !currentListId) return;
        shareError.style.display = 'none';
        try {
          await api.addListMember(currentListId, email);
          shareEmailInput.value = '';
          loadShareMembers();
        } catch (e) {
          const msg = e instanceof ApiError && e.body ? (() => { try { const o = JSON.parse(e.body) as { error?: string }; return o.error ?? e.message; } catch { return e.message; } })() : (e as Error).message;
          shareError.textContent = msg;
          shareError.style.display = 'block';
        }
      });
    }
  }

  addBtn.addEventListener('click', () => {
    const title = newTitleInput.value.trim();
    if (title) handleAddTask(title).then(() => { newTitleInput.value = ''; });
  });
  newTitleInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const title = newTitleInput.value.trim();
      if (title) handleAddTask(title).then(() => { newTitleInput.value = ''; });
    }
  });
}

export function escapeHtml(s: string): string {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

const INDENT_THRESHOLD_PX = 24;

interface VisibleItem {
  task: Task;
  depth: number;
  fullIndex: number;
}

function makeSortable(
  list: Element,
  onReorder: (fromFull: number, toFull: number, indentOutdent: IndentOutdent) => void,
  visibleOrdered: VisibleItem[],
  fullLength: number,
  indentPx: number,
  getTaskHasChildren: (taskId: string) => boolean
): void {
  let draggedVisibleIndex: number | null = null;
  let dropTargetIndex: number | null = null;
  let dragStartX = 0;
  const rowCount = () => list.querySelectorAll('.task-row').length;
  const sentinel = () => list.querySelector('.task-list-drop-sentinel');
  let dropIndicator: HTMLElement | null = null;

  function clearDropTarget(): void {
    if (dropIndicator && dropIndicator.parentNode) {
      dropIndicator.remove();
    }
    dropTargetIndex = null;
  }

  function setDropTarget(index: number): void {
    if (dropTargetIndex === index) return;
    clearDropTarget();
    dropTargetIndex = index;
    const depth = index < visibleOrdered.length ? visibleOrdered[index].depth : 0;
    if (!dropIndicator) {
      dropIndicator = document.createElement('li');
      dropIndicator.className = 'drop-indicator';
      dropIndicator.setAttribute('aria-hidden', 'true');
    }
    dropIndicator.style.marginLeft = `${indentPx * depth}px`;
    const rows = list.querySelectorAll('.task-row');
    const ref = index < rows.length ? rows[index] : sentinel();
    if (ref) list.insertBefore(dropIndicator, ref);
  }

  const items = list.querySelectorAll('.task-row');
  items.forEach((item, i) => {
    const handle = item.querySelector('.drag-handle');
    if (!handle) return;
    (handle as HTMLElement).setAttribute('draggable', 'true');
    handle.addEventListener('dragstart', (e) => {
      draggedVisibleIndex = i;
      dragStartX = (e as DragEvent).clientX;
      (e as DragEvent).dataTransfer!.effectAllowed = 'move';
      (e as DragEvent).dataTransfer!.setData('text/plain', String(i));
      item.classList.add('drag-source-placeholder');
    });
    handle.addEventListener('dragend', () => {
      item.classList.remove('drag-source-placeholder');
      draggedVisibleIndex = null;
      clearDropTarget();
    });
  });

  list.addEventListener('dragover', (e) => {
    e.preventDefault();
    (e as DragEvent).dataTransfer!.dropEffect = 'move';
    if (draggedVisibleIndex == null) {
      clearDropTarget();
      return;
    }
    const bottomZone = (e.target as HTMLElement).closest('.task-list-drop-sentinel');
    if (bottomZone) {
      const endIndex = rowCount();
      if (endIndex !== draggedVisibleIndex) setDropTarget(endIndex);
      return;
    }
    const row = (e.target as HTMLElement).closest('.task-row');
    if (!row) {
      clearDropTarget();
      return;
    }
    const toIndex = parseInt((row as HTMLElement).getAttribute('data-index') ?? '-1', 10);
    if (toIndex === -1) return;
    const rect = row.getBoundingClientRect();
    const mid = rect.top + rect.height / 2;
    const dropIndex = (e as DragEvent).clientY < mid ? toIndex : toIndex + 1;
    const clamped = Math.max(0, Math.min(dropIndex, rowCount()));
    if (clamped !== draggedVisibleIndex) setDropTarget(clamped);
  });

  list.addEventListener('dragleave', (e) => {
    if (!list.contains((e as DragEvent).relatedTarget as Node)) clearDropTarget();
  });

  list.addEventListener('drop', (e) => {
    e.preventDefault();
    if (draggedVisibleIndex == null) return;
    const useDrop = dropTargetIndex ?? draggedVisibleIndex;
    const fromFull = visibleOrdered[draggedVisibleIndex]?.fullIndex ?? draggedVisibleIndex;
    const toFull =
      useDrop >= visibleOrdered.length ? fullLength : visibleOrdered[useDrop]?.fullIndex ?? useDrop;
    const draggedTask = visibleOrdered[draggedVisibleIndex]?.task;
    let indentOutdent: IndentOutdent =
      (e as DragEvent).clientX - dragStartX > INDENT_THRESHOLD_PX
        ? 'indent'
        : (e as DragEvent).clientX - dragStartX < -INDENT_THRESHOLD_PX
          ? 'outdent'
          : null;
    if (draggedTask && getTaskHasChildren(draggedTask.id) && indentOutdent === 'indent') {
      indentOutdent = null;
    }
    clearDropTarget();
    if (fromFull !== toFull || indentOutdent !== null) {
      onReorder(fromFull, toFull, indentOutdent);
    }
  });
}
