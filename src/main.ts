import './style.css';
import { isLoggedIn } from './auth.js';
import { getRoute, navigateTo, initRouter } from './router.js';
import { renderLogin } from './pages/login.js';
import { renderEnvVars } from './pages/envvars.js';
import { renderApp } from './app.js';

const sunIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
const moonIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

function initTheme(): void {
  const saved = localStorage.getItem('theme') as 'dark' | 'light' | null;
  document.documentElement.dataset.theme = saved ?? 'dark';

  const btn = document.createElement('button');
  btn.className = 'theme-toggle';
  btn.setAttribute('aria-label', 'Toggle light/dark mode');
  btn.innerHTML = document.documentElement.dataset.theme === 'dark' ? sunIcon : moonIcon;
  document.body.appendChild(btn);

  btn.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
    btn.innerHTML = next === 'dark' ? sunIcon : moonIcon;
  });
}

initTheme();

function render(): void {
  const route = getRoute();

  if (route.name === 'login') {
    if (isLoggedIn()) {
      navigateTo({ name: 'tasks' });
      return;
    }
    renderLogin(document.getElementById('app')!, () => {
      navigateTo({ name: 'tasks' });
      render();
    });
    return;
  }

  if (route.name === 'envvars') {
    renderEnvVars(document.getElementById('app')!);
    return;
  }

  if (!isLoggedIn()) {
    navigateTo({ name: 'login' });
    render();
    return;
  }

  renderApp(document.getElementById('app')!, route);
}

initRouter(render);
render();

