// js/utils/sync.js
// Offline queue for Attendance & Fuel submissions using remote API sync
import { apiFetch } from './api.js';

const QUEUE_KEY = 'fleet_offline_queue';

/** Load the queue array from localStorage */
function _loadQueue() {
  const raw = localStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

/** Persist the queue array back to localStorage */
function _saveQueue(queue) {
  if (queue.length === 0) {
    localStorage.removeItem(QUEUE_KEY);
  } else {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }
}

/**
 * Queue a request while offline.
 * @param {('attendance'|'fuel')} type
 * @param {Object} payload - the full record object
 */
export function queueOfflineRequest(type, payload) {
  const queue = _loadQueue();
  queue.push({ type, payload, status: 'pending_sync' });
  _saveQueue(queue);
}

/**
 * Flush all pending requests to backend API endpoints when network is restored.
 */
export async function flushOfflineQueue() {
  const queue = _loadQueue();
  if (queue.length === 0) return;

  const remainingQueue = [];

  for (const entry of queue) {
    try {
      if (entry.type === 'attendance') {
        await apiFetch('/api/attendance', {
          method: 'POST',
          body: JSON.stringify(entry.payload)
        });

        // Mirror synced record to local storage
        const existing = localStorage.getItem('fleet_attendance_logs');
        const logs = existing ? JSON.parse(existing) : [];
        if (!logs.some(l => l.id === entry.payload.id)) {
          logs.push(entry.payload);
          localStorage.setItem('fleet_attendance_logs', JSON.stringify(logs));
        }
      } else if (entry.type === 'fuel') {
        await apiFetch('/api/fuel', {
          method: 'POST',
          body: JSON.stringify(entry.payload)
        });

        // Mirror synced record to local storage
        const existing = localStorage.getItem('fleet_fuel_logs');
        const logs = existing ? JSON.parse(existing) : [];
        if (!logs.some(l => l.id === entry.payload.id)) {
          logs.push(entry.payload);
          localStorage.setItem('fleet_fuel_logs', JSON.stringify(logs));
        }
      }
    } catch (err) {
      console.error('Failed to sync offline entry to remote API:', entry, err);
      // Keep entry in queue if sync attempt failed
      remainingQueue.push(entry);
    }
  }

  _saveQueue(remainingQueue);
}
