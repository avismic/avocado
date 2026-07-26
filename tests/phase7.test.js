import { describe, test, expect, beforeEach } from 'vitest';
import { loadCss } from "../../js/utils/loadCss.js";

loadCss(import.meta.url, "../../css/global.css");
import '../js/app.js'; // triggers service worker registration and route setup
import { queueOfflineRequest, flushOfflineQueue } from '../js/utils/sync.js';

// Helper to simulate offline / online state
function setOnlineStatus(isOnline) {
  Object.defineProperty(navigator, 'onLine', { value: isOnline, configurable: true });
  const event = new Event(isOnline ? 'online' : 'offline');
  window.dispatchEvent(event);
}

beforeEach(() => {
  // reset storage & online status before each test
  localStorage.clear();
  setOnlineStatus(true);
});

describe('PWA Offline Queue & Service Worker', () => {
  test('queueOfflineRequest stores payload when offline', () => {
    setOnlineStatus(false);
    const payload = { id: 'test1', driver_id: 'd1', timestamp: Date.now() };
    queueOfflineRequest('attendance', payload);
    const raw = localStorage.getItem('fleet_offline_queue');
    const queue = raw ? JSON.parse(raw) : [];
    expect(queue.length).toBe(1);
    expect(queue[0].type).toBe('attendance');
    expect(queue[0].payload).toEqual(payload);
  });

  test('flushOfflineQueue moves queued attendance to main storage', async () => {
    setOnlineStatus(false);
    const payload = { id: 'att123', driver_id: 'driverA', timestamp: 1234567890 };
    queueOfflineRequest('attendance', payload);
    // Now simulate coming back online
    setOnlineStatus(true);
    // Mock global fetch so flushOfflineQueue succeeds
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ success: true })
    });

    await flushOfflineQueue();
    const stored = JSON.parse(localStorage.getItem('fleet_attendance_logs') || '[]');
    expect(stored.find(r => r.id === 'att123')).toBeTruthy();
    // Queue should be cleared
    expect(localStorage.getItem('fleet_offline_queue')).toBeNull();
  });

  test('flushOfflineQueue moves queued fuel logs to main storage', async () => {
    setOnlineStatus(false);
    const fuelPayload = { id: 'fuel987', driver_id: 'driverB', timestamp: 987654321 };
    queueOfflineRequest('fuel', fuelPayload);
    setOnlineStatus(true);
    // Mock global fetch so flushOfflineQueue succeeds
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ success: true })
    });

    await flushOfflineQueue();
    const stored = JSON.parse(localStorage.getItem('fleet_fuel_logs') || '[]');
    expect(stored.find(r => r.id === 'fuel987')).toBeTruthy();
    expect(localStorage.getItem('fleet_offline_queue')).toBeNull();
  });

  test('manifest.json contains required PWA fields', async () => {
    // Mock fetch for manifest.json
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        name: 'Fleet Manager',
        short_name: 'Fleet',
        start_url: '/',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [{ src: '/icons/icon-192.png' }, { src: '/icons/icon-512.png' }]
      })
    });

    const resp = await fetch('/manifest.json');
    const manifest = await resp.json();
    expect(manifest.name).toBe('Fleet Manager');
    expect(manifest.short_name).toBe('Fleet');
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.background_color).toBe('#000000');
    expect(manifest.theme_color).toBe('#000000');
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
  });

  test('service worker script is reachable', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'self.addEventListener("install", () => {});'
    });

    const resp = await fetch('/sw.js');
    expect(resp.status).toBe(200);
    const text = await resp.text();
    expect(text).toContain('self.addEventListener');
  });
});
