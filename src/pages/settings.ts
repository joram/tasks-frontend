import { API_BASE, api, ApiError } from '../api.js';
import { clearToken } from '../auth.js';
import { navigateTo } from '../router.js';
import { APP_VERSION } from '../version.generated.js';

export function renderSettings(container: HTMLElement): void {
  container.innerHTML = `
    <h1 class="page-title">Settings</h1>
    <div class="settings-section">
      <h2>About</h2>
      <p>Task Tracker web — version ${APP_VERSION}</p>
      <p><a href="${API_BASE}/apk/latest" download class="link-download-apk" id="apk-download-link">Download Android app (APK)</a></p>
    </div>
    <div class="settings-section">
      <h2>Account</h2>
      <p>Signed in. Sign out to use a different account.</p>
      <button type="button" class="btn btn-secondary" id="sign-out-btn">Sign out</button>
    </div>
    <div class="settings-section">
      <h2>Change password</h2>
      <form class="login-form" id="change-password-form">
        <label for="current-password">Current password</label>
        <input type="password" id="current-password" name="current_password" required autocomplete="current-password" placeholder="Current password">
        <label for="new-password">New password</label>
        <input type="password" id="new-password" name="new_password" required minlength="8" autocomplete="new-password" placeholder="At least 8 characters">
        <label for="confirm-password">Confirm new password</label>
        <input type="password" id="confirm-password" name="confirm_password" required minlength="8" autocomplete="new-password" placeholder="Confirm new password">
        <div class="login-error" id="change-password-error" style="display:none;"></div>
        <button type="submit" class="btn btn-primary" id="change-password-btn">Update password</button>
      </form>
    </div>
  `;

  api.getApkVersions().then((v) => {
    if (v.latest) {
      const link = container.querySelector<HTMLAnchorElement>('#apk-download-link');
      if (link) link.href = `${API_BASE}/apk/v/${v.latest}`;
    }
  }).catch(() => {});

  container.querySelector('#sign-out-btn')!.addEventListener('click', () => {
    clearToken();
    navigateTo({ name: 'login' });
    window.location.reload();
  });

  const changeForm = container.querySelector<HTMLFormElement>('#change-password-form')!;
  const errorEl = container.querySelector<HTMLElement>('#change-password-error')!;
  const btn = container.querySelector<HTMLButtonElement>('#change-password-btn')!;
  changeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const current = (changeForm.querySelector('#current-password') as HTMLInputElement).value;
    const newPw = (changeForm.querySelector('#new-password') as HTMLInputElement).value;
    const confirm = (changeForm.querySelector('#confirm-password') as HTMLInputElement).value;
    errorEl.style.display = 'none';
    errorEl.textContent = '';
    if (newPw !== confirm) {
      errorEl.textContent = 'New password and confirmation do not match.';
      errorEl.style.display = 'block';
      return;
    }
    if (newPw.length < 8) {
      errorEl.textContent = 'New password must be at least 8 characters.';
      errorEl.style.display = 'block';
      return;
    }
    btn.disabled = true;
    try {
      await api.changePassword(current, newPw);
      (changeForm.querySelector('#current-password') as HTMLInputElement).value = '';
      (changeForm.querySelector('#new-password') as HTMLInputElement).value = '';
      (changeForm.querySelector('#confirm-password') as HTMLInputElement).value = '';
      errorEl.textContent = '';
      errorEl.style.display = 'none';
      const ok = document.createElement('p');
      ok.className = 'login-error';
      ok.style.color = 'var(--color-success, green)';
      ok.textContent = 'Password updated.';
      changeForm.appendChild(ok);
      setTimeout(() => ok.remove(), 3000);
    } catch (err: unknown) {
      let msg = (err as Error).message;
      if (err instanceof ApiError && err.body) {
        try {
          const o = JSON.parse(err.body) as { error?: string };
          if (o.error) msg = o.error;
        } catch {}
      }
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
    } finally {
      btn.disabled = false;
    }
  });
}
