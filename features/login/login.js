// features/login/login.js – Renders login UI & handles auth flow
import '../../css/global.css'; // ensure global vars are loaded
import './login.css';
import { login } from '../../js/auth.js';
import { navigate } from '../../js/router.js';

export function mountLogin() {
  const app = document.getElementById('app');
  if (!app) throw new Error('Missing #app element');

  app.innerHTML = `
    <div class="login-wrapper">
      <div class="login-card glass-card">
        <h2>Fleet Management Login</h2>
        <form id="login-form" novalidate>
          <label for="username">Username</label>
          <input type="text" id="username" name="username" autocomplete="username" required />
          <label for="password">Password</label>
          <input type="password" id="password" name="password" autocomplete="current-password" required />
          <button type="submit">Sign In</button>
          <div class="error-message" id="login-error" hidden></div>
        </form>
      </div>
    </div>
  `;

  const form = document.getElementById('login-form');
  const errDiv = document.getElementById('login-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errDiv.hidden = true;
    const username = form.username.value.trim();
    const password = form.password.value.trim();

    try {
      await login(username, password);
      // After successful login, router will push the appropriate dashboard
      navigate('#'); // let router resolve redirection based on role
    } catch (err) {
      errDiv.textContent = err.message;
      errDiv.hidden = false;
    }
  });
}
