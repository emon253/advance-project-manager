/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client } from "@stomp/stompjs";
import { BASE_URL, tokenStore, refreshTokens } from "./client";
import { notificationToUi } from "./adapters";

/**
 * Realtime channel: STOMP over a native WebSocket at the backend's /ws.
 * The JWT rides in the CONNECT frame (browsers can't set headers on the
 * handshake); the only subscription is the caller's own notification queue.
 * stompjs handles reconnection (5s backoff) and 10s heartbeats — matching
 * the broker — so dropped mobile/PWA connections resurface quickly.
 */

const WS_URL = BASE_URL.replace(/^http/, "ws").replace(/\/api\/v1\/?$/, "") + "/ws";

/** True when the JWT is expired or within 30s of it (avoids a doomed CONNECT). */
function isStale(token) {
  try {
    const { exp } = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return !exp || exp * 1000 - Date.now() < 30_000;
  } catch {
    return true;
  }
}

/**
 * Connects and keeps reconnecting until `.deactivate()` is called.
 * `onEvent` receives `{ type, notification }` with the notification already
 * adapter-mapped to the UI shape.
 */
export function createRealtimeClient({ onEvent, onStateChange }) {
  const client = new Client({
    brokerURL: WS_URL,
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,

    beforeConnect: async () => {
      let token = tokenStore.access;
      if (token && isStale(token) && tokenStore.hasSession) {
        // Refresh proactively so the CONNECT doesn't burn a round trip on
        // TOKEN_EXPIRED; a failed refresh falls through and the retry loop
        // (or the REST layer's session-expiry path) takes over.
        try {
          await refreshTokens();
          token = tokenStore.access;
        } catch { /* handled by the reconnect loop */ }
      }
      if (!token) {
        client.deactivate();
        return;
      }
      client.connectHeaders = { Authorization: `Bearer ${token}` };
    },

    onConnect: () => {
      onStateChange?.(true);
      client.subscribe("/user/queue/notifications", (message) => {
        try {
          const event = JSON.parse(message.body);
          if (event.type === "notification" && event.data) {
            onEvent({ type: event.type, notification: notificationToUi(event.data) });
          }
        } catch { /* malformed frame: ignore */ }
      });
    },

    onStompError: (frame) => {
      // Expired-token CONNECT rejection: refresh now so the auto-reconnect
      // attempt (5s later) carries a live token.
      if ((frame.headers?.message || "").includes("TOKEN_EXPIRED") && tokenStore.hasSession) {
        refreshTokens().catch(() => {});
      }
    },

    onWebSocketClose: () => onStateChange?.(false),
  });

  client.activate();
  return client;
}
