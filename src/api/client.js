/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * HTTP client for the APM backend (BACKEND_PLAN.md §7/§9).
 *
 * Responsibilities kept deliberately small:
 *  - attach the access token to every request
 *  - on 401 TOKEN_EXPIRED, run ONE refresh (single-flight) and retry once
 *  - normalize error envelopes into ApiError {status, code, message, fieldErrors, limit, current}
 *  - JSON by default, multipart when given FormData, blob downloads on request
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";

const ACCESS_KEY = "apm_access_token";
const REFRESH_KEY = "apm_refresh_token";

export class ApiError extends Error {
  constructor(status, code, message, extras = {}) {
    super(message || code || `Request failed (${status})`);
    this.name = "ApiError";
    this.status = status;
    this.code = code || "UNKNOWN";
    this.fieldErrors = extras.fieldErrors || null;
    this.limit = extras.limit ?? null;
    this.current = extras.current ?? null;
  }
}

export const tokenStore = {
  get access() {
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    return localStorage.getItem(REFRESH_KEY);
  },
  set({ accessToken, refreshToken }) {
    if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
  get hasSession() {
    return !!localStorage.getItem(REFRESH_KEY);
  },
};

/** Called by the client when the session is irrecoverably gone (refresh failed). */
let onSessionExpired = () => {
  window.location.assign("/login?expired=1");
};
export function setSessionExpiredHandler(handler) {
  onSessionExpired = handler;
}

async function parseError(response) {
  let body = null;
  try {
    body = await response.json();
  } catch {
    /* non-JSON error body */
  }
  return new ApiError(response.status, body?.code, body?.message, {
    fieldErrors: body?.fieldErrors,
    limit: body?.limit,
    current: body?.current,
  });
}

// Single-flight refresh: concurrent 401s share one refresh round-trip.
let refreshInFlight = null;

async function refreshTokens() {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshToken = tokenStore.refresh;
      if (!refreshToken) throw new ApiError(401, "UNAUTHORIZED", "No session");
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) throw await parseError(res);
      const data = await res.json();
      tokenStore.set(data);
      return data;
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/**
 * Core request. `options`:
 *  - method, body (object → JSON, FormData → multipart), auth (default true)
 *  - blob: true → resolves to a Blob (downloads)
 */
export async function request(path, { method = "GET", body, auth = true, blob = false, _retried = false } = {}) {
  const headers = {};
  if (auth && tokenStore.access) headers.Authorization = `Bearer ${tokenStore.access}`;

  let payload;
  if (body instanceof FormData) {
    payload = body; // browser sets the multipart boundary
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, { method, headers, body: payload });

  if (response.status === 401 && auth && !_retried) {
    // One refresh + one retry; anything beyond that is a dead session.
    try {
      await refreshTokens();
    } catch {
      tokenStore.clear();
      onSessionExpired();
      throw new ApiError(401, "TOKEN_EXPIRED", "Session expired");
    }
    return request(path, { method, body, auth, blob, _retried: true });
  }

  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return null;
  return blob ? response.blob() : response.json();
}

export const http = {
  get: (path, opts) => request(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => request(path, { ...opts, method: "POST", body }),
  put: (path, body, opts) => request(path, { ...opts, method: "PUT", body }),
  patch: (path, body, opts) => request(path, { ...opts, method: "PATCH", body }),
  delete: (path, opts) => request(path, { ...opts, method: "DELETE" }),
};
