import './style.css';
import { isLoggedIn } from './auth.js';
import { getRoute, navigateTo, initRouter } from './router.js';
import { renderLogin } from './pages/login.js';
import { renderApp } from './app.js';

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

  if (!isLoggedIn()) {
    navigateTo({ name: 'login' });
    render();
    return;
  }

  renderApp(document.getElementById('app')!, route);
}

initRouter(render);
render();

