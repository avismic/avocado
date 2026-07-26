//path: js/app.js
import { mountLogin } from "../features/login/login.js";
import { registerRoute, navigate } from "./router.js";
import { mountDriverDashboard } from "../features/driver-dashboard/driver-dashboard.js";
import { mountAttendanceHistory } from "../features/attendance/attendance-view.js";
import { mountFuelPage } from "../features/fuel/fuel-page.js";
import { mountOwnerDashboard } from "../features/owner-dashboard/owner-dashboard.js";
import { mountOwnerAttendance } from "../features/owner-dashboard/owner-attendance.js";
import { mountOwnerFuel } from "../features/owner-dashboard/owner-fuel.js";
import { isAuthenticated, getUser } from "./auth.js";
import { mountAddDriver } from "../features/owner-dashboard/add-driver.js";
import { mountSeeDrivers } from "../features/owner-dashboard/see-drivers.js";
import { mountAdminDashboard } from "../features/admin/admin-dashboard.js";
import { mountAddOwner } from "../features/admin/add-owner.js";
import { mountSeeOwners } from "../features/admin/see-owners.js";

registerRoute("admin-dashboard", mountAdminDashboard);
registerRoute("admin-add-owner", mountAddOwner);
registerRoute("admin-see-owners", mountSeeOwners);

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
registerRoute("owner-add-driver", mountAddDriver);
registerRoute("owner-see-drivers", mountSeeDrivers);

// Initial navigation based on current URL hash or fallback to auth state & role
if (!isAuthenticated()) {
  navigate("#login");
} else {
  const currentHash = window.location.hash;
  if (currentHash) {
    navigate(currentHash);
  } else {
    const user = getUser();
    if (user?.role === "driver") {
      navigate("#driver-dashboard");
    } else if (user?.role === "owner") {
      navigate("#owner-dashboard");
    } else if (user?.role === "admin") {
      navigate("#admin-dashboard");
    } else {
      navigate("#login");
    }
  }
}

// ---- Service Worker registration (if supported) ----
if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => console.log("ServiceWorker registered", reg.scope))
      .catch((err) => console.error("ServiceWorker registration failed:", err));
  });
}

// ---- Online event: flush any queued offline requests ----
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    console.log("Network restored – flushing offline queue");
    import("./utils/sync.js")
      .then(({ flushOfflineQueue }) => {
        flushOfflineQueue()
          .then(() => console.log("Offline queue flushed"))
          .catch((err) => console.error("Error flushing offline queue", err));
      })
      .catch((err) => console.error("Error importing sync utils:", err));
  });
}
