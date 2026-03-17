export type Route =
  | { name: 'login' }
  | { name: 'tasks' }
  | { name: 'task-detail'; id: string }
  | { name: 'archive' }
  | { name: 'settings' }
  | { name: 'envvars' };

function getHash(): string {
  const h = window.location.hash.slice(1) || '/';
  return h.startsWith('/') ? h : `/${h}`;
}

export function getRoute(): Route {
  const hash = getHash();
  const parts = hash.split('/').filter(Boolean);
  if (parts[0] === 'tasks' && parts[1]) return { name: 'task-detail', id: parts[1] };
  if (parts[0] === 'tasks') return { name: 'tasks' };
  if (parts[0] === 'archive') return { name: 'archive' };
  if (parts[0] === 'settings') return { name: 'settings' };
  if (parts[0] === 'envvars') return { name: 'envvars' };
  if (parts[0] === 'login' || hash === '/' || hash === '') return { name: 'login' };
  return { name: 'tasks' };
}

export function navigateTo(route: Route): void {
  let path = '/';
  switch (route.name) {
    case 'login': path = '/login'; break;
    case 'tasks': path = '/tasks'; break;
    case 'task-detail': path = `/tasks/${route.id}`; break;
    case 'archive': path = '/archive'; break;
    case 'settings': path = '/settings'; break;
    case 'envvars': path = '/envvars'; break;
  }
  window.location.hash = path;
}

export function isActive(route: Route, current: Route): boolean {
  if (route.name !== current.name) return false;
  if (route.name === 'task-detail' && current.name === 'task-detail') return route.id === current.id;
  return true;
}

export function initRouter(onChange: () => void): void {
  window.addEventListener('hashchange', onChange);
  onChange();
}
