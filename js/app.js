// js/app.js – Application bootstrap for Phase 8
import { mountLogin } from "../features/login/login.js";
import { registerRoute, navigate } from "./router.js";
import { mountDriverDashboard } from "../features/driver-dashboard/driver-dashboard.js";
import { mountAttendanceHistory } from "../features/attendance/attendance-view.js";
import { mountFuelPage } from "../features/fuel/fuel.js";
import {
  mountOwnerDashboard,
  mountOwnerAttendance,
  mountOwnerFuel,
} from "../features/owner-dashboard/owner-dashboard.js";
import { isAuthenticated, getUser } from "./auth.js";

// Register driver routes
// Register auth route
registerRoute("login", mountLogin);
registerRoute("driver-dashboard", mountDriverDashboard);
registerRoute("driver-attendance-history", mountAttendanceHistory);
registerRoute("driver-fuel", mountFuelPage);

// Register owner routes
registerRoute("owner-dashboard", mountOwnerDashboard);
registerRoute("owner-attendance", mountOwnerAttendance);
registerRoute("owner-fuel", mountOwnerFuel);

// Initial navigation based on auth state & role
if (!isAuthenticated()) {
  navigate("#login");
} else {
  const user = getUser();
  if (user?.role === "driver") {
    navigate("#driver-dashboard");
  } else if (user?.role === "owner") {
    navigate("#owner-dashboard");
  } else {
    navigate("#login");
  }
}

// ---- Service Worker registration (if supported) ----
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('ServiceWorker registered', reg.scope))
      .catch(err => console.error('ServiceWorker registration failed:', err));
  });
}

// ---- Online event: flush any queued offline requests ----
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Network restored – flushing offline queue');
    import('./utils/sync.js')
      .then(({ flushOfflineQueue }) => {
        flushOfflineQueue()
          .then(() => console.log('Offline queue flushed'))
          .catch(err => console.error('Error flushing offline queue', err));
      })
      .catch(err => console.error('Error importing sync utils:', err));
  });
}
