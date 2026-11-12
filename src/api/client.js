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

export const BASE_URL = import.meta.env.VITE_API_URL || "http://32.236.69.148:8095/carbarn-sandbox/api/v1";

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

/**
 * Sends a dead session to the login screen — except on a share link
 * (/p/:token), which is open to visitors: there the page just carries on
 * signed out.
 */
export function goToLogin() {
  if (!window.location.pathname.startsWith("/p/")) window.location.assign("/login?expired=1");
}

/** Called by the client when the session is irrecoverably gone (refresh failed). */
let onSessionExpired = goToLogin;
export function setSessionExpiredHandler(handler) {
  onSessionExpired = handler;
}

/** Turns jakarta-validation boilerplate into a sentence a user can act on. */
function friendlyMessage(body) {
  const first = body?.fieldErrors?.[0];
  if (first?.message) {
    const label = (first.field || "")
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (c) => c.toUpperCase())
      .trim();
    let msg = first.message
      .replace(/^size must be between (\d+) and (\d+)$/i, "must be between $1 and $2 characters")
      .replace(/^must not be (blank|null|empty)$/i, "is required");
    // Backend messages already written as full sentences pass through untouched.
    return /^[A-Z]/.test(first.message) ? first.message : `${label} ${msg}`.trim();
  }
  return body?.message;
}

async function parseError(response) {
  let body = null;
  try {
    body = await response.json();
  } catch {
    /* non-JSON error body */
  }
  return new ApiError(response.status, body?.code, friendlyMessage(body), {
    fieldErrors: body?.fieldErrors,
    limit: body?.limit,
    current: body?.current,
  });
}

// Single-flight refresh: concurrent 401s share one refresh round-trip.
let refreshInFlight = null;

export async function refreshTokens() {
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
    // One refresh + one retry. The session is dead only when the refresh
    // endpoint itself says so (401/403); a network error or a 5xx there
    // leaves the tokens alone and just fails this request.
    try {
      await refreshTokens();
    } catch (err) {
      if (!(err instanceof ApiError) || (err.status !== 401 && err.status !== 403)) throw err;
      tokenStore.clear();
      onSessionExpired();
      throw new ApiError(401, "TOKEN_EXPIRED", "Session expired");
    }
    return request(path, { method, body, auth, blob, _retried: true });
  }

  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return null;
  if (blob) return response.blob();
  // Some success responses are intentionally bodyless (e.g. 200 from
  // /auth/verify-email) — an empty body is success, not a parse failure.
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

/**
 * For endpoints a visitor with no account may call (shared pages). The
 * session is sent when there is one, so a member is recognised; if that
 * session turns out to be dead or not allowed (401 even after the refresh
 * attempt), the request is made once more as a visitor before giving up.
 * A 401 from here therefore always means "this needs signing in".
 */
export async function publicRequest(path, options = {}) {
  if (!tokenStore.access && !tokenStore.refresh) return request(path, { ...options, auth: false });
  try {
    return await request(path, options);
  } catch (err) {
    if (err.status !== 401) throw err;
    return request(path, { ...options, auth: false });
  }
}

export const http = {
  get: (path, opts) => request(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => request(path, { ...opts, method: "POST", body }),
  put: (path, body, opts) => request(path, { ...opts, method: "PUT", body }),
  patch: (path, body, opts) => request(path, { ...opts, method: "PATCH", body }),
  delete: (path, opts) => request(path, { ...opts, method: "DELETE" }),
};
