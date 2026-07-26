// js/router.js – Minimal hash‑based router with role guards
import { isAuthenticated, getUser } from "./auth.js";

// Registry of route callbacks – each callback receives the hash (without "#")
const routes = new Map();

/** Register a route handler */
export function registerRoute(routeHash, handler) {
  routes.set(routeHash, handler);
}

/** Internal – resolve destination based on auth state and role */
function resolveTarget(hash = "") {
  const cleanHash = (hash || "").replace(/^#/, "");

  // Public routes
  if (cleanHash === "login") return { hash: "#login" };

  // Protected routes – must be authenticated
  if (!isAuthenticated()) {
    return { hash: "#login" };
  }

  const user = getUser();
  if (!user) return { hash: "#login" };

  // Role‑specific dashboard mapping
  const roleDash = {
    driver: "#driver-dashboard",
    owner: "#owner-dashboard",
  };

  // Driver‑only pages list
  const driverOnly = [
    "driver-dashboard",
    "driver-attendance-history",
    "driver-fuel",
  ];

  // Owner‑only pages list
  const ownerOnly = ["owner-dashboard", "owner-attendance", "owner-fuel", "owner-add-driver"];

  // Guard against accessing driver‑only page when not driver
  if (driverOnly.includes(cleanHash) && user.role !== "driver") {
    return { hash: "#driver-dashboard" };
  }

  // Guard against accessing owner‑only page when not owner
  if (ownerOnly.includes(cleanHash) && user.role !== "owner") {
    return { hash: "#owner-dashboard" };
  }

  // If valid hash for user's role, keep it
  if (
    (driverOnly.includes(cleanHash) && user.role === "driver") ||
    (ownerOnly.includes(cleanHash) && user.role === "owner")
  ) {
    return { hash: `#${cleanHash}` };
  }

  // Default fallback – send to appropriate dashboard based on role
  return { hash: roleDash[user.role] || "#login" };
}

let isNavigating = false;

/** Navigate to a hash (updates URL & triggers rendering) */
export function navigate(targetHash) {
  const currentHash = (typeof window !== "undefined" && window.location && window.location.hash) || "";
  const resolved = resolveTarget(targetHash || currentHash);
  if (typeof window !== "undefined" && window.location && resolved.hash !== window.location.hash) {
    window.location.replace(resolved.hash);
  } else {
    handleHashChange();
  }
}

/** Core hash change handler – calls the registered route callback */
function handleHashChange() {
  if (isNavigating) return;
  isNavigating = true;
  try {
    const currentHash = (typeof window !== "undefined" && window.location && window.location.hash) || "";
    const resolved = resolveTarget(currentHash);
    const clean = resolved.hash.replace(/^#/, "");

    const handler = routes.get(clean);
    if (handler) {
      handler();
    }
  } finally {
    isNavigating = false;
  }
}

// Listen to native hash changes in browser environments
if (typeof window !== "undefined") {
  window.addEventListener("hashchange", handleHashChange);
}
