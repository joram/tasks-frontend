import type { Route } from './router.js';
import { getRoute, navigateTo } from './router.js';
import { renderTasks, getListsState, switchList, createList, updateListInState, toggleSharePanel, escapeHtml, showToast } from './pages/tasks.js';
import { renderTaskDetail } from './pages/task-detail.js';
import { renderArchive } from './pages/archive.js';
import { renderSettings } from './pages/settings.js';
import { api } from './api.js';

const navIconTasks = '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
const navIconArchive = '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>';
const navIconSettings = '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';

function buildSidebarListsHtml(): string {
  const { lists, currentListId } = getListsState();
  const currentRole = currentListId ? lists.find((l) => l.id === currentListId)?.role : null;
  const listItems = lists
    .map(
      (l) =>
        `<button type="button" class="sidebar-list-item ${l.id === currentListId ? 'active' : ''}" data-list-id="${l.id}">${escapeHtml(l.name)}${l.role === 'member' ? ' (Shared)' : ''}</button>`
    )
    .join('');
  const shareBtn =
    currentListId && currentRole === 'owner'
      ? '<button type="button" class="sidebar-list-item" id="sidebar-share-btn">Share</button>'
      : '';
  return `
    <div class="sidebar-lists">
      <div class="sidebar-lists-title">Lists</div>
      <div class="sidebar-lists-items">${listItems}</div>
      <button type="button" class="sidebar-list-item sidebar-list-new" id="sidebar-new-list-btn">+ List</button>
      ${shareBtn}
    </div>`;
}

export function renderApp(container: HTMLElement, route: Route): void {
  const current = getRoute();
  const tasksActive = current.name === 'tasks' || current.name === 'task-detail';
  const archiveActive = current.name === 'archive';
  const settingsActive = current.name === 'settings';

  container.innerHTML = `
    <div class="app-shell">
      <aside class="app-sidebar">
        <nav>
          <a href="#/tasks" class="${tasksActive ? 'active' : ''}" data-route="tasks">${navIconTasks} Tasks</a>
          <a href="#/archive" class="${archiveActive ? 'active' : ''}" data-route="archive">${navIconArchive} Archive</a>
          <a href="#/settings" class="${settingsActive ? 'active' : ''}" data-route="settings">${navIconSettings} Settings</a>
        </nav>
        ${buildSidebarListsHtml()}
      </aside>
      <main class="app-main" id="app-main"></main>
    </div>
  `;

  const main = container.querySelector<HTMLElement>('#app-main')!;

  const refreshApp = (): void => renderApp(container, getRoute());

  container.querySelectorAll('a[data-route]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const r = (e.currentTarget as HTMLElement).getAttribute('data-route');
      if (r === 'tasks') navigateTo({ name: 'tasks' });
      else if (r === 'archive') navigateTo({ name: 'archive' });
      else if (r === 'settings') navigateTo({ name: 'settings' });
    });
  });

  container.querySelectorAll('.sidebar-list-item[data-list-id]').forEach((btn) => {
    const id = (btn as HTMLElement).dataset.listId!;
    let clickTimeout: number | null = null;
    (btn as HTMLElement).addEventListener('click', () => {
      if (clickTimeout != null) return;
      clickTimeout = window.setTimeout(async () => {
        clickTimeout = null;
        await switchList(id);
        refreshApp();
      }, 250);
    });
    (btn as HTMLElement).addEventListener('dblclick', (e) => {
      e.preventDefault();
      if (clickTimeout != null) {
        window.clearTimeout(clickTimeout);
        clickTimeout = null;
      }
      const { lists } = getListsState();
      const list = lists.find((l) => l.id === id);
      if (!list) return;
      const label = list.role === 'member' ? ' (Shared)' : '';
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'list-chip-edit';
      input.value = list.name;
      input.style.cssText = 'width:100%;min-width:4em;padding:2px 6px;font:inherit;border:1px solid;border-radius:4px;background:var(--bg-elevated, #333);color:inherit;';
      (btn as HTMLElement).replaceChildren(input);
      input.focus();
      input.select();
      const save = async (): Promise<void> => {
        const name = input.value.trim();
        if (!name || name === list.name) {
          (btn as HTMLElement).textContent = list.name + label;
          return;
        }
        try {
          await api.updateList(id, name);
          updateListInState(id, name);
          refreshApp();
        } catch {
          showToast('Failed to rename list');
          (btn as HTMLElement).textContent = list.name + label;
        }
      };
      input.addEventListener('blur', save);
      input.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          input.blur();
        }
      });
    });
  });

  const newListBtn = container.querySelector('#sidebar-new-list-btn');
  if (newListBtn) {
    newListBtn.addEventListener('click', async () => {
      const name = window.prompt('New list name', 'My list');
      if (!name?.trim()) return;
      try {
        await createList(name.trim());
        refreshApp();
      } catch {
        showToast('Failed to create list');
      }
    });
  }

  const shareBtn = container.querySelector('#sidebar-share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => toggleSharePanel());
  }

  switch (route.name) {
    case 'tasks':
      renderTasks(main, { onListsChange: refreshApp });
      break;
    case 'task-detail':
      renderTaskDetail(main, route.id);
      break;
    case 'archive':
      renderArchive(main);
      break;
    case 'settings':
      renderSettings(main);
      break;
    default:
      renderTasks(main, { onListsChange: refreshApp });
  }
}
