import { getToken } from "../auth.js";

export async function apiFetch(endpoint, options = {}) {
  const baseUrl = import.meta.env?.VITE_NEON_DATABASE_URL || '';
  
  let targetUrl = endpoint;
  if (baseUrl && !baseUrl.startsWith('postgres')) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    targetUrl = `${baseUrl.replace(/\/$/, '')}${cleanEndpoint}`;
  } else {
    targetUrl = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  }

  console.log("Executing API Fetch to:", targetUrl);

  const headers = { ...options.headers };

  if (options.body && !headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getToken();
  if (token && !headers['Authorization'] && !headers['authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  let response;
  try {
    response = await fetch(targetUrl, config);
  } catch (err) {
    console.error("Fetch Exception Caught:", err);
    const error = new Error(err?.message || 'Network fetch failed');
    error.isNetworkError = true;
    throw error;
  }

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData && (errorData.message || errorData.error)) {
        errorMessage = errorData.message || errorData.error;
      }
    } catch {
    }
    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers?.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return await response.json();
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}