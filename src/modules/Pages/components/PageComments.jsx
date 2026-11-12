/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { useAppState } from "../../../app/providers";
import { pagesApi } from "../../../api/endpoints";
import { toAvatarUrl } from "../../../api/adapters";
import { UserAvatar } from "../../../components/common/UserAvatar";
import { CommentComposer } from "../../Tasks/components/CommentComposer";
import { formatRelative } from "../../Tasks/util/tasksUtils";

const POLL_MS = 20000;
const NAME_KEY = "hub_guest_name";
const BODY_MAX = 2000;
const NAME_MAX = 60;

// Storage can be blocked (private mode, embedded views): a visitor then just types their name again next time.
const savedName = () => { try { return (localStorage.getItem(NAME_KEY) || "").slice(0, NAME_MAX); } catch { return ""; } };
const saveName = (name) => { try { localStorage.setItem(NAME_KEY, name); } catch { /* not remembered */ } };

const GUEST_TONE = "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";

/**
 * A task's comment thread on a shared page, shown by Hub beside the page
 * (never inside the design's frame): a 400px panel on the right on desktop,
 * the full screen on a phone. A signed-in member comments as themselves; a
 * visitor gives a name once, which is remembered on this device. Bodies are
 * plain text and rendered as text. The open thread is re-read every 20s.
 */
export function PageComments({ token, taskId, title, onClose, onPosted }) {
  const { isAuthenticated, currentUser } = useAppState();
  const [comments, setComments] = useState(null); // null while loading
  const [loadError, setLoadError] = useState("");
  const [postError, setPostError] = useState("");
  const [name, setName] = useState(savedName);
  const [nameDraft, setNameDraft] = useState(name);
  const [askName, setAskName] = useState(false);
  const endRef = useRef(null);
  const guest = !isAuthenticated;
  const needName = guest && (!name || askName);

  const load = useCallback(async () => {
    try {
      const list = await pagesApi.taskComments(token, taskId);
      setComments(Array.isArray(list) ? list : []);
      setLoadError("");
    } catch (err) {
      // Keep whatever is on screen through a blip; only an empty panel shows the problem.
      setLoadError(err.message || "Could not load the comments.");
    }
  }, [token, taskId]);

  useEffect(() => {
    load();
    const timer = setInterval(() => { if (document.visibilityState === "visible") load(); }, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const count = comments?.length || 0;
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [count]);

  const submitName = (e) => {
    e.preventDefault();
    const value = nameDraft.replace(/\s+/g, " ").trim().slice(0, NAME_MAX);
    if (!value) return;
    setName(value);
    saveName(value);
    setAskName(false);
  };

  const submit = async ({ text }) => {
    setPostError("");
    try {
      const created = await pagesApi.addTaskComment(token, taskId, text.slice(0, BODY_MAX), guest ? name : undefined);
      if (created) setComments((prev) => ((prev || []).some((c) => c.id === created.id) ? prev : [...(prev || []), created]));
      onPosted?.();
      return true;
    } catch (err) {
      // 429 and validation answers carry the server's own sentence.
      setPostError(err.message || "Could not post the comment. Try again.");
      return false;
    }
  };

  return (
    <aside
      role="dialog"
      aria-label={`Comments on ${title || "this task"}`}
      className="fixed inset-0 z-50 md:static md:z-auto md:w-[400px] md:shrink-0 md:border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col pt-safe md:pt-0 animate-in slide-in-from-right duration-200"
    >
      <header className="flex items-start gap-2 pl-3 md:pl-5 pr-1 md:pr-3 py-2.5 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex-1 min-w-0 py-1">
          <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Comments{count > 0 && <span className="font-tnum"> · {count}</span>}</p>
          <h2 className="mt-0.5 text-[15px] font-bold tracking-[-0.01em] leading-snug break-words line-clamp-3">{title || "Task"}</h2>
        </div>
        <button type="button" onClick={onClose} className="btn-icon h-11 w-11 md:h-8 md:w-8" aria-label="Close comments"><X className="w-[18px] h-[18px] md:w-4 md:h-4" strokeWidth={2.2} /></button>
      </header>

      <div className="flex-1 overflow-y-auto px-3 md:px-5 py-4 flex flex-col gap-4" aria-live="polite">
        {comments === null && !loadError && <p className="flex items-center gap-2 text-[13px] text-zinc-600 dark:text-zinc-400"><Loader2 className="w-4 h-4 animate-spin" /> Loading comments…</p>}
        {comments === null && loadError && (
          <div className="text-[13px] text-zinc-600 dark:text-zinc-400">
            <p>{loadError}</p>
            <button type="button" onClick={load} className="btn btn-secondary btn-sm mt-2">Try again</button>
          </div>
        )}
        {comments?.length === 0 && <p className="text-[13px] leading-normal text-zinc-600 dark:text-zinc-400">No comments yet. Be the first to say something.</p>}
        {(comments || []).map((c) => (
          <div key={c.id} className="flex items-start gap-2.5">
            <UserAvatar size="xs" user={{ name: c.authorName || "Guest", avatarUrl: toAvatarUrl(c.authorAvatarUrl), color: c.guest ? GUEST_TONE : undefined }} />
            <div className="flex-1 min-w-0 flex flex-col gap-[3px]">
              <div className="flex flex-wrap items-center gap-x-1.5 text-[13px] md:text-[12.5px]">
                <span className="font-bold truncate">{c.authorName || "Guest"}</span>
                {c.guest && <span className="inline-flex items-center h-[18px] px-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10.5px] font-bold text-zinc-600 dark:text-zinc-300">guest</span>}
                <span className="text-zinc-500 font-tnum" title={c.createdAt ? new Date(c.createdAt).toLocaleString() : undefined}>{formatRelative(c.createdAt)}</span>
              </div>
              {/* Plain text from anyone with the link: rendered as text, never as HTML. */}
              <p className="text-[14.5px] md:text-[13.5px] leading-normal text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap break-words">{c.body}</p>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <footer className="shrink-0 px-2 pt-2 md:px-4 md:pt-3 border-t border-zinc-200 dark:border-zinc-800 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-4 flex flex-col gap-2">
        {postError && <p role="alert" className="px-1 text-[13px] font-semibold text-rose-700 dark:text-rose-400">{postError}</p>}
        {needName ? (
          <form onSubmit={submitName} className="flex flex-col gap-1.5 px-1 md:px-0">
            <label htmlFor="pc-name" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Your name, so the team knows who is commenting</label>
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
              <input id="pc-name" type="text" autoFocus required maxLength={NAME_MAX} value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} placeholder="e.g. Jim" autoComplete="name" className="field h-11 text-base md:text-sm rounded-lg" />
              <button type="submit" disabled={!nameDraft.trim()} className="btn btn-primary h-11 px-4 rounded-lg">Continue</button>
            </div>
          </form>
        ) : (
          <>
            <p className="px-1 text-xs text-zinc-600 dark:text-zinc-400">
              Commenting as <b className="font-bold text-zinc-900 dark:text-zinc-100">{guest ? name : (currentUser?.name || "yourself")}</b>
              {guest && <> · <button type="button" onClick={() => { setNameDraft(name); setAskName(true); }} className="font-semibold text-primary dark:text-sky-300 hover:underline cursor-pointer">change</button></>}
            </p>
            <CommentComposer onSubmit={submit} maxLength={BODY_MAX} />
          </>
        )}
      </footer>
    </aside>
  );
}
