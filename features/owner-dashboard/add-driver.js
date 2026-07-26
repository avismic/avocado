import '../../css/global.css';
import './add-driver.css';
import { logout, getUser } from '../../js/auth.js';
import { navigate } from '../../js/router.js';
import { apiFetch } from '../../js/utils/api.js';
import { showModal } from '../shared/modal.js';

export function mountAddDriver() {
  const app = document.getElementById('app');
  if (!app) throw new Error('Missing #app element');

  app.innerHTML = `
    <section class="owner-page">
      <header class="owner-header">
        <button class="btn-secondary back-btn" id="back-btn">← Back</button>
        <div>
          <p class="subtitle">Management</p>
          <h2>Add New Driver</h2>
        </div>
        <button class="btn-secondary logout-btn" id="logout-btn">Logout</button>
      </header>

      <div class="add-driver-card apple-card">
        <form id="add-driver-form" novalidate>
          <div class="form-group">
            <label for="driver-name">Full Name</label>
            <input type="text" id="driver-name" name="fullName" placeholder="e.g. John Doe" required />
          </div>

          <div class="form-group">
            <label for="driver-username">Username</label>
            <input type="text" id="driver-username" name="username" placeholder="e.g. driver_john" required />
          </div>

          <div class="form-group">
            <label for="driver-password">Password</label>
            <input type="password" id="driver-password" name="password" placeholder="Assign a password" required />
          </div>

          <button type="submit" class="btn-primary submit-btn">Create Driver Account</button>
        </form>
      </div>
    </section>
  `;

  document.getElementById('back-btn').addEventListener('click', () => navigate('#owner-dashboard'));
  document.getElementById('logout-btn').addEventListener('click', () => logout());

  const form = document.getElementById('add-driver-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = form.fullName.value.trim();
    const username = form.username.value.trim();
    const password = form.password.value.trim();

    if (!fullName || !username || !password) {
      showModal({ title: 'Validation Error', message: 'All fields are required.', primaryBtnText: 'OK' });
      return;
    }

    try {
      const owner = getUser();
      await apiFetch('/api/drivers', {
        method: 'POST',
        body: JSON.stringify({
          full_name: fullName,
          username: username,
          password: password,
          owner_id: owner?.id
        })
      });

      showModal({
        title: 'Driver Created',
        message: `Driver account for ${fullName} has been successfully created.`,
        primaryBtnText: 'Back to Dashboard',
        primaryBtnCallback: () => navigate('#owner-dashboard')
      });
    } catch (err) {
      showModal({ title: 'Error', message: err.message, primaryBtnText: 'OK' });
    }
  });
}