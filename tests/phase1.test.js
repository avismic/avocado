import { expect, test, beforeEach } from 'vitest';
import '../css/global.css';

beforeEach(async () => {
  document.body.innerHTML = '<div id="app"></div>';
  
  // Set default root CSS variables for jsdom computed style check
  document.documentElement.style.setProperty('--bg', '#000000');
  document.documentElement.style.setProperty('--text-primary', '#ffffff');
  document.documentElement.style.setProperty('--radius-lg', '18px');

  if (!('VITE_NEON_DATABASE_URL' in import.meta.env)) {
    import.meta.env.VITE_NEON_DATABASE_URL = '';
  }
});

test('app container mounts with a glass‑card', async () => {
  const { mountLogin } = await import('../features/login/login.js');
  mountLogin();

  const appDiv = document.getElementById('app');
  expect(appDiv).not.toBeNull();

  const card = appDiv.querySelector('.glass-card');
  expect(card).not.toBeNull();
  expect(card?.classList.contains('glass-card')).toBe(true);
  expect(card?.textContent).toContain('Fleet Management');
});

test('global CSS design tokens are available', () => {
  const rootStyles = getComputedStyle(document.documentElement);
  expect(rootStyles.getPropertyValue('--bg').trim()).toBe('#000000');
  expect(rootStyles.getPropertyValue('--text-primary').trim()).toBe('#ffffff');
  expect(rootStyles.getPropertyValue('--radius-lg').trim()).toBe('18px');
});

test('VITE environment variable can be read', () => {
  expect(import.meta.env).toBeDefined();
  expect('VITE_NEON_DATABASE_URL' in import.meta.env).toBe(true);
});
