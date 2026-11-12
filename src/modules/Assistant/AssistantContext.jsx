/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { ApiError } from "../../api/client";
import { assistantApi } from "../../api/endpoints";
import { useAppState } from "../../app/providers";
import { hasFeature } from "../../app/permissions";

const OPEN_KEY = "apm_assistant_open";
const POLL_MS = 2000;
export const MAX_MESSAGE_LENGTH = 4000;
/** The top-bar button that opens the panel; focus returns to it when Escape closes the panel. */
export const ASSISTANT_TOGGLE_ID = "assistant-toggle";

/** The open panel is remembered on desktop only: a phone should not start on a full-screen sheet. */
function readOpen() {
  try {
    return localStorage.getItem(OPEN_KEY) === "1" && window.innerWidth >= 1024;
  } catch {
    return false;
  }
}

const isLocal = (message) => String(message.id).startsWith("local-");

const AssistantContext = createContext(null);

/**
 * The signed-in user's private conversation with the assistant in the current
 * workspace, plus whether its panel is open. REST only: a reply is written in
 * the background, so while `busy` the conversation is polled every 2 seconds
 * (not while the tab is hidden or the panel is closed).
 */
export function AssistantProvider({ children }) {
  const {
    isAuthenticated, currentUser, activeWorkspaceId, activeTaskId,
    refreshTasks, refreshProjects, loadTaskDetail, refreshCurrentUser,
  } = useAppState();
  const available = isAuthenticated && !!currentUser && hasFeature(currentUser, "ASSISTANT");

  const [open, setOpenState] = useState(readOpen);
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Each request takes a number; only the newest one may write state, so a
  // slow answer never overwrites a newer one (or another workspace's).
  const seq = useRef(0);
  const busyRef = useRef(false);
  const sendingRef = useRef(false);
  // The app's refetch functions follow the active workspace: always call the latest.
  const app = useRef(null);
  app.current = { activeWorkspaceId, activeTaskId, refreshTasks, refreshProjects, loadTaskDetail, refreshCurrentUser };

  const setOpen = useCallback((next) => {
    setOpenState(next);
    try { localStorage.setItem(OPEN_KEY, next ? "1" : "0"); } catch { /* private mode: not remembered */ }
  }, []);

  const apply = useCallback((data) => {
    const finished = busyRef.current && !data.busy;
    busyRef.current = data.busy;
    setMessages(data.messages);
    setBusy(data.busy);
    setError("");
    // A finished reply that changed something: lists, tables and an open task drawer must show it.
    if (finished && data.messages.at(-1)?.actions?.length) {
      const { activeTaskId: taskId, refreshTasks: tasks, refreshProjects: projects, loadTaskDetail: detail } = app.current;
      projects();
      tasks().then(() => { if (taskId) detail(taskId); });
    }
  }, []);

  const fail = useCallback((err, fallback) => {
    // Switched off while the app was open: the fresh user object hides the button and the panel.
    if (err?.code === "FEATURE_DISABLED") app.current.refreshCurrentUser();
    else setError(err instanceof ApiError ? err.message : fallback);
  }, []);

  const load = useCallback(async () => {
    const wsId = app.current.activeWorkspaceId;
    if (!wsId || sendingRef.current) return;
    const mine = ++seq.current;
    try {
      const data = await assistantApi.conversation(wsId);
      if (mine === seq.current) apply(data);
    } catch (err) {
      if (mine === seq.current) fail(err, "Could not load the conversation. Check your connection.");
    }
  }, [apply, fail]);

  // The conversation belongs to the workspace: switching swaps it.
  useEffect(() => {
    seq.current += 1;
    busyRef.current = false;
    setMessages([]);
    setBusy(false);
    setError("");
  }, [activeWorkspaceId]);

  // Opening (or switching workspace while open) fetches once.
  useEffect(() => {
    if (!available || !open || !activeWorkspaceId) return;
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [available, open, activeWorkspaceId, load]);

  // Poll while a reply is pending and the panel is open; skip hidden tabs and catch up when shown again.
  useEffect(() => {
    if (!available || !open || !busy) return undefined;
    const tick = () => { if (!document.hidden) load(); };
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [available, open, busy, load]);

  /** Optimistic: the message and the thinking indicator show at once. */
  const send = useCallback(async (text) => {
    const body = (text || "").trim().slice(0, MAX_MESSAGE_LENGTH);
    const wsId = app.current.activeWorkspaceId;
    if (!body || !wsId || busyRef.current) return;
    const mine = ++seq.current;
    sendingRef.current = true;
    busyRef.current = true;
    setBusy(true);
    setError("");
    const createdAt = new Date().toISOString();
    const replyId = `local-reply-${mine}`;
    setMessages((prev) => [
      ...prev.filter((m) => !isLocal(m)),
      { id: `local-user-${mine}`, role: "USER", body, state: "DONE", actions: [], createdAt },
      { id: replyId, role: "ASSISTANT", body: "", state: "PENDING", actions: [], createdAt },
    ]);
    try {
      const data = await assistantApi.send(wsId, body);
      if (mine === seq.current) apply(data);
    } catch (err) {
      if (mine !== seq.current) return;
      if (err?.code === "ASSISTANT_BUSY") {
        // A reply is already being written (another tab): show the real conversation.
        sendingRef.current = false;
        await load();
        return;
      }
      busyRef.current = false;
      setBusy(false);
      if (err?.code === "FEATURE_DISABLED") { fail(err); return; }
      const reason = err instanceof ApiError ? err.message : "Could not reach the assistant. Check your connection.";
      setMessages((prev) => prev.map((m) => (m.id === replyId ? { ...m, state: "FAILED", body: reason } : m)));
    } finally {
      sendingRef.current = false;
    }
  }, [apply, fail, load]);

  /** Resends the last thing the user asked. */
  const retry = useCallback(() => {
    const last = [...messages].reverse().find((m) => m.role === "USER");
    if (last) send(last.body);
  }, [messages, send]);

  const clear = useCallback(async () => {
    const wsId = app.current.activeWorkspaceId;
    if (!wsId) return;
    const mine = ++seq.current;
    try {
      await assistantApi.clear(wsId);
      if (mine !== seq.current) return;
      busyRef.current = false;
      setMessages([]);
      setBusy(false);
      setError("");
    } catch (err) {
      if (mine === seq.current) fail(err, "Could not clear the conversation.");
    }
  }, [fail]);

  const value = { available, open, setOpen, messages, busy, loading, error, send, retry, clear };
  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant() {
  const context = useContext(AssistantContext);
  if (!context) throw new Error("useAssistant must be used inside an AssistantProvider");
  return context;
}
