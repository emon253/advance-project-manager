/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChevronLeft, CheckSquare, Folder, FolderPlus, MessageSquare, MoreHorizontal, Pencil, RotateCcw, Sparkles, Trash2, X,
} from "lucide-react";
import { useAppState } from "../../app/providers";
import { useIsMobile } from "../../hooks/useIsMobile";
import { CommentComposer } from "../Tasks/components/CommentComposer";
import { ASSISTANT_TOGGLE_ID, MAX_MESSAGE_LENGTH, useAssistant } from "./AssistantContext";

const ACTION_ICONS = {
  TASK_CREATED: CheckSquare,
  TASK_UPDATED: Pencil,
  TASK_DELETED: Trash2,
  COMMENT_ADDED: MessageSquare,
  PROJECT_CREATED: FolderPlus,
  PROJECT_UPDATED: Folder,
};

const CHIP = "inline-flex items-center gap-1.5 max-w-full min-h-11 lg:min-h-8 px-2.5 py-1.5 rounded-lg text-left text-[13px] lg:text-xs font-semibold leading-snug";

/** One change the assistant made: opens the task (drawer) or the project it touched. */
function ActionChip({ action, onOpenProject, canConfirm }) {
  const { setActiveTaskId } = useAppState();
  const { send } = useAssistant();
  // A drastic step waits for the person: this button sends the one-time code back.
  if (action.type === "CONFIRM_REQUIRED") {
    return (
      <span className="inline-flex flex-wrap items-center gap-2 max-w-full rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1.5 text-[13px] lg:text-xs font-semibold text-amber-900 dark:text-amber-200">
        <span className="min-w-0 break-words">Needs your OK: {action.label}</span>
        {canConfirm && action.code && (
          <button type="button" onClick={() => send(`Confirm ${action.code}`)} className="btn btn-sm btn-primary min-h-9 lg:min-h-7">Confirm</button>
        )}
      </span>
    );
  }
  const Icon = ACTION_ICONS[action.type] || Sparkles;
  const content = (
    <>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="min-w-0 break-words">{action.label}</span>
    </>
  );
  const target = action.type === "TASK_DELETED" ? null : action.taskId ? "task" : action.projectId ? "project" : null;
  if (!target) {
    return <span className={`${CHIP} bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300`}>{content}</span>;
  }
  return (
    <button
      type="button"
      onClick={() => (target === "task" ? setActiveTaskId(action.taskId) : onOpenProject(action.projectId))}
      className={`${CHIP} bg-primary/8 text-primary hover:bg-primary/15 dark:bg-primary/15 dark:text-sky-300 dark:hover:bg-primary/25 cursor-pointer transition-colors`}
    >
      {content}
    </button>
  );
}

function Thinking() {
  return (
    <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400" role="status">
      <span className="flex items-center gap-1" aria-hidden="true">
        {[0, 160, 320].map((delay) => (
          <span key={delay} className="h-1.5 w-1.5 rounded-full bg-primary animate-[thinking_1.2s_ease-in-out_infinite]" style={{ animationDelay: `${delay}ms` }} />
        ))}
      </span>
      Thinking…
    </div>
  );
}

/** Bodies are always rendered as text: line breaks kept, never HTML. */
function Message({ message, canRetry, onRetry, onOpenProject }) {
  // canRetry is true only for the newest message while nothing is running: the same rule fits Confirm.
  if (message.role === "USER") {
    return (
      <div className="self-end max-w-[85%] rounded-2xl rounded-br-md px-3.5 py-2 bg-primary/10 dark:bg-primary/20 text-sm leading-relaxed text-zinc-900 dark:text-zinc-50 whitespace-pre-wrap break-words">
        {message.body}
      </div>
    );
  }
  if (message.state === "PENDING") return <Thinking />;
  if (message.state === "FAILED") {
    return (
      <div className="self-start max-w-full">
        <p className="rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 px-3 py-2 text-sm leading-relaxed text-rose-700 dark:text-rose-300 whitespace-pre-wrap break-words">
          {message.body || "Something went wrong while answering."}
        </p>
        {canRetry && (
          <button type="button" onClick={onRetry} className="btn btn-ghost mt-1.5 h-11 lg:h-8 -ml-1 text-primary dark:text-sky-300">
            <RotateCcw className="w-3.5 h-3.5" /> Try again
          </button>
        )}
      </div>
    );
  }
  return (
    <div className="self-start max-w-full min-w-0">
      <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap break-words">{message.body}</p>
      {message.actions?.length > 0 && (
        <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Changes made">
          {message.actions.map((action, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <li key={i} className="max-w-full"><ActionChip action={action} onOpenProject={onOpenProject} canConfirm={canRetry} /></li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * The assistant conversation. Desktop: a 420px panel docked on the right under
 * the top bar (the page shrinks beside it, see AppLayout). Phone: a full-screen
 * sheet sized to the visible viewport, so the composer sits on the keyboard.
 */
export function AssistantPanel() {
  const { currentUser, activeWorkspaceProjects, can } = useAppState();
  const { setOpen, messages, busy, loading, error, send, retry, clear } = useAssistant();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [viewport, setViewport] = useState(null); // phone: the area left above the keyboard
  const composerRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => { composerRef.current?.focus(); }, []);
  useEffect(() => { const el = listRef.current; if (el) el.scrollTop = el.scrollHeight; }, [messages]);

  // iOS keeps a fixed sheet behind the keyboard; follow the visual viewport instead.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!isMobile || !vv) { setViewport(null); return undefined; }
    const sync = () => setViewport({ top: vv.offsetTop, height: vv.height });
    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
    };
  }, [isMobile]);

  const close = () => setOpen(false);
  const closeMenu = () => { setMenuOpen(false); setConfirmClear(false); };

  const onKeyDown = (e) => {
    if (e.key !== "Escape") return;
    if (menuOpen) { e.stopPropagation(); closeMenu(); return; }
    if (isMobile) return;
    e.stopPropagation(); // the task drawer also listens for Escape
    close();
    document.getElementById(ASSISTANT_TOGGLE_ID)?.focus();
  };

  const openProject = (projectId) => {
    navigate(`/projects/${projectId}`);
    if (isMobile) close(); // the sheet would cover the project page
  };

  const firstName = (currentUser?.name || "").trim().split(/\s+/)[0];
  const routeProjectId = Number(location.pathname.match(/^\/projects\/(\d+)/)?.[1]);
  const project = activeWorkspaceProjects.find((p) => p.id === routeProjectId)
    || activeWorkspaceProjects.find((p) => !p.isArchived)
    || activeWorkspaceProjects[0];
  const suggestions = [
    { label: "What is due today?" },
    { label: "Show my overdue tasks" },
    can("editTasks") ? { label: "Create a task…", prefill: "Create a task: " } : { label: "What changed this week?" },
    { label: project ? `Summarise the ${project.name} project` : "Summarise my open tasks" },
  ];
  const lastId = messages.at(-1)?.id;

  return (
    <section
      id="assistant-panel"
      aria-label="Assistant"
      onKeyDown={onKeyDown}
      style={viewport ? { top: viewport.top, height: viewport.height, bottom: "auto" } : undefined}
      className="fixed z-40 lg:z-20 inset-0 lg:inset-auto lg:top-[calc(3rem+env(safe-area-inset-top))] lg:right-0 lg:bottom-0 lg:w-[420px] bg-white dark:bg-zinc-950 lg:border-l border-zinc-200 dark:border-zinc-800 flex flex-col pt-safe lg:pt-0 animate-in slide-in-from-right duration-200"
    >
      <header className="relative shrink-0 flex items-center gap-2 h-14 lg:h-12 pl-1 pr-1 lg:pl-4 lg:pr-2 border-b border-zinc-200 dark:border-zinc-800">
        <button type="button" onClick={close} className="btn-icon h-11 w-11 lg:hidden" aria-label="Back">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-sky-300" aria-hidden="true">
          <Sparkles className="w-4 h-4" />
        </span>
        <h2 className="flex-1 min-w-0 truncate text-[15px] font-bold text-zinc-900 dark:text-white">Assistant</h2>
        <button type="button" onClick={() => (menuOpen ? closeMenu() : setMenuOpen(true))} className="btn-icon h-11 w-11 lg:h-8 lg:w-8" aria-haspopup="menu" aria-expanded={menuOpen} aria-label="Conversation options">
          <MoreHorizontal className="w-[18px] h-[18px] lg:w-4 lg:h-4" />
        </button>
        <button type="button" onClick={close} className="btn-icon hidden lg:inline-flex" aria-label="Close assistant">
          <X className="w-4 h-4" strokeWidth={2.2} />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={closeMenu} aria-hidden="true" />
            <div role="menu" className="menu-panel absolute right-2 top-full -mt-1 z-50 w-60 p-1 animate-in fade-in slide-in-from-top-1 duration-150">
              {!confirmClear ? (
                <button
                  type="button"
                  role="menuitem"
                  disabled={messages.length === 0}
                  onClick={() => setConfirmClear(true)}
                  className="w-full flex items-center gap-2 h-11 lg:h-8 px-2 rounded-md text-left text-[13px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Trash2 className="w-4 h-4" /> Clear conversation…
                </button>
              ) : (
                <div className="p-2 rounded-md bg-rose-50 dark:bg-rose-500/10">
                  <p className="text-xs font-semibold leading-snug text-rose-700 dark:text-rose-300 mb-2">Clear this conversation? Changes already made to tasks stay.</p>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={closeMenu} className="btn btn-sm btn-secondary flex-1 h-10 lg:h-7">Cancel</button>
                    <button type="button" onClick={() => { closeMenu(); clear(); composerRef.current?.focus(); }} className="btn btn-sm btn-danger flex-1 h-10 lg:h-7">Clear</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </header>

      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 lg:px-4 py-5" aria-live="polite">
        {messages.length === 0 ? (
          loading ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading your conversation…</p>
          ) : (
            <div className="pt-2 lg:pt-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/20 text-primary dark:text-sky-300" aria-hidden="true">
                <Sparkles className="w-5 h-5" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">{firstName ? `Hi ${firstName}, how can I help?` : "How can I help?"}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Ask about your work, or tell me to create and update tasks and projects for you.
              </p>
              <ul className="mt-6 flex flex-col gap-2" aria-label="Suggestions">
                {suggestions.map((s) => (
                  <li key={s.label}>
                    <button
                      type="button"
                      onClick={() => (s.prefill ? composerRef.current?.prefill(s.prefill) : send(s.label))}
                      className="w-full min-h-11 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-left text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:border-primary/40 hover:bg-primary/5 dark:hover:bg-primary/10 cursor-pointer transition-colors break-words"
                    >
                      {s.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )
        ) : (
          <div className="flex flex-col gap-5">
            {messages.map((m) => (
              <Message key={m.id} message={m} canRetry={!busy && m.id === lastId} onRetry={retry} onOpenProject={openProject} />
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 px-2 pt-2 lg:px-4 lg:pt-3 border-t border-zinc-200 dark:border-zinc-800 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:pb-4">
        {error && <p className="mb-2 px-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400" role="alert">{error}</p>}
        <CommentComposer
          ref={composerRef}
          label="Message the assistant"
          placeholder="Ask or tell the assistant…"
          maxLength={MAX_MESSAGE_LENGTH}
          disabled={busy}
          onSubmit={({ text }) => { send(text); return true; }}
        />
      </div>
    </section>
  );
}
