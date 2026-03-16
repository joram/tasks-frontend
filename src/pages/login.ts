import { setToken } from '../auth.js';
import { api, ApiError } from '../api.js';

type Mode = 'login' | 'register';

export function renderLogin(container: HTMLElement, onSuccess: () => void): void {
  let mode: Mode = 'login';

  function render(): void {
    const isRegister = mode === 'register';
    container.innerHTML = `
    <div class="app-login">
      <div class="login-card">
        <div class="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h1>Task Tracker</h1>
        <p style="text-align:center;color:var(--text-secondary);margin:0 0 24px 0;font-size:13px;">
          ${isRegister ? 'Create an account to get started' : 'Sign in to continue'}
        </p>
        <form class="login-form" id="auth-form">
          <div>
            <label for="email">Email</label>
            <input type="email" id="email" name="email" placeholder="you@example.com" autocomplete="email" required />
          </div>
          <div>
            <label for="password">Password</label>
            <input type="password" id="password" name="password" placeholder="••••••••" autocomplete="${isRegister ? 'new-password' : 'current-password'}" required minlength="${isRegister ? '8' : '0'}" />
            ${isRegister ? '<p style="font-size:12px;color:var(--text-secondary);margin:4px 0 0 0;">At least 8 characters</p>' : ''}
          </div>
          <div class="login-error" id="login-error" style="display:none;"></div>
          <button type="submit" class="btn btn-primary btn-block" id="auth-btn">${isRegister ? 'Create account' : 'Sign in'}</button>
        </form>
        <p style="text-align:center;margin:16px 0 0 0;font-size:13px;">
          <button type="button" class="link-btn" id="toggle-mode">${isRegister ? 'Already have an account? Sign in' : "Don't have an account? Create one"}</button>
        </p>
      </div>
    </div>
  `;

    const form = container.querySelector<HTMLFormElement>('#auth-form')!;
    const email = container.querySelector<HTMLInputElement>('#email')!;
    const password = container.querySelector<HTMLInputElement>('#password')!;
    const errorEl = container.querySelector<HTMLElement>('#login-error')!;
    const btn = container.querySelector<HTMLButtonElement>('#auth-btn')!;
    const toggleBtn = container.querySelector<HTMLButtonElement>('#toggle-mode')!;

    toggleBtn.addEventListener('click', () => {
      mode = mode === 'login' ? 'register' : 'login';
      render();
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.style.display = 'none';
      errorEl.textContent = '';
      btn.disabled = true;
      btn.textContent = isRegister ? 'Creating…' : 'Signing in…';

      try {
        const res = isRegister
          ? await api.register(email.value.trim(), password.value)
          : await api.login(email.value.trim(), password.value);
        setToken(res.token);
        onSuccess();
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.statusCode === 401) {
            errorEl.textContent = 'Invalid email or password';
          } else if (err.statusCode === 409) {
            errorEl.textContent = 'That email is already registered';
          } else {
            errorEl.textContent = err.body || 'Something went wrong';
          }
        } else {
          errorEl.textContent = 'Connection failed';
        }
        errorEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = isRegister ? 'Create account' : 'Sign in';
      }
    });
  }

  render();
}
