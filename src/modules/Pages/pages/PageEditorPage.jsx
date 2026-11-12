/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Monitor, Smartphone, History, Eye, Globe, Lock, Sparkles, ArrowUp, Table2, RefreshCw, X, Copy, Check, FileDown, Loader2 } from "lucide-react";
import { useAppState } from "../../../app/providers";
import { pagesApi } from "../../../api/endpoints";
import { PageFrame } from "../components/PageFrame";
import { shareUrl } from "../pagesMeta";
import { formatRelative } from "../../Tasks/util/tasksUtils";

const SUGGESTIONS = ["Add a Done tab", "Sort by finish date", "Light theme", "Hide descriptions"];
const POLL_MS = 2500;
const LIVE_MS = 60000;

const chip = "h-[22px] inline-flex items-center px-2 rounded-full text-xs font-bold";
const headBtn = "h-8 inline-flex items-center gap-1.5 px-3 border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-[13px] font-semibold text-zinc-700 dark:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-600 cursor-pointer";

/** Publish and share: who can view, live or snapshot, and the link. */
function PublishDialog({ page, onClose, onSaved }) {
  const [visibility, setVisibility] = useState(page.published ? page.visibility : "LINK");
  const [dataMode, setDataMode] = useState(page.dataMode || "LIVE");
  const [snapshotEvery, setSnapshotEvery] = useState(page.snapshotEvery || "NEVER");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const link = shareUrl(page.token);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const run = async (action) => {
    setBusy(true);
    try { onSaved(await action()); onClose(); } finally { setBusy(false); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* select the field instead */ }
  };

  const option = (value, Icon, name, hint) => {
    const on = visibility === value;
    return (
      <label className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer ${on ? "border-2 border-primary bg-primary/[0.04]" : "border border-zinc-200 dark:border-zinc-700 m-px"}`}>
        <input type="radio" name="visibility" checked={on} onChange={() => setVisibility(value)} className="mt-[3px] accent-primary" />
        <span className="flex flex-col gap-0.5">
          <span className="font-bold inline-flex items-center gap-1.5 text-zinc-900 dark:text-white"><Icon className="w-3.5 h-3.5" />{name}</span>
          <span className="text-zinc-600 dark:text-zinc-400">{hint}</span>
        </span>
      </label>
    );
  };

  return (
    <div className="fixed inset-0 z-50 p-4 sm:p-6 bg-zinc-900/45 flex items-center justify-center text-[13px] text-left" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="pub-title" className="w-full max-w-[512px] max-h-full overflow-y-auto bg-white dark:bg-zinc-900 rounded-xl shadow-[0_24px_60px_-20px_rgba(0,0,0,0.45)] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-2.5 px-5 pt-[18px] pb-1.5">
          <h2 id="pub-title" className="text-[17px] font-bold text-zinc-900 dark:text-white truncate">{page.published ? "Share" : "Publish"} “{page.title}”</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="ml-auto w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"><X className="w-4 h-4" strokeWidth={2.2} /></button>
        </div>
        <div className="px-5 pt-2.5 pb-[18px] flex flex-col gap-[18px]">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-[11px] font-bold tracking-[0.06em] uppercase text-zinc-500 dark:text-zinc-400">Who can view</legend>
            {option("TEAM", Lock, "Team only", "People in this workspace, after signing in")}
            {option("LINK", Globe, "Anyone with the link", "No sign-in. Good for the boss or people outside Hub")}
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-[11px] font-bold tracking-[0.06em] uppercase text-zinc-500 dark:text-zinc-400">Data</legend>
            <div className="flex h-9 border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
              {[["LIVE", "Live"], ["SNAPSHOT", "Snapshot of today"]].map(([value, name], i) => (
                <label key={value} className={`flex-1 inline-flex items-center justify-center gap-2 cursor-pointer ${i ? "border-l border-zinc-200 dark:border-zinc-700" : ""} ${dataMode === value ? "bg-zinc-100 dark:bg-zinc-800 font-bold text-zinc-900 dark:text-white" : "font-semibold text-zinc-600 dark:text-zinc-400"}`}>
                  <input type="radio" name="data" checked={dataMode === value} onChange={() => setDataMode(value)} className="m-0 accent-primary" />{name}
                </label>
              ))}
            </div>
            {dataMode === "SNAPSHOT" ? (
              <label className="flex flex-wrap items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                Take a fresh snapshot
                <select value={snapshotEvery} onChange={(e) => setSnapshotEvery(e.target.value)} className="h-7 px-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-900 dark:text-white">
                  <option value="NEVER">only when I ask</option>
                  <option value="DAILY">every day</option>
                  <option value="WEEKLY">every week</option>
                </select>
              </label>
            ) : (
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Live pages always show the current tasks. A snapshot stays as it is today.</p>
            )}
          </fieldset>

          <div className="flex flex-col gap-2">
            <label htmlFor="pub-link" className="text-[11px] font-bold tracking-[0.06em] uppercase text-zinc-500 dark:text-zinc-400">Link</label>
            <div className="flex gap-2">
              <input id="pub-link" type="text" readOnly value={link.replace(/^https?:\/\//, "")} onFocus={(e) => e.target.select()}
                className="flex-1 min-w-0 h-9 px-2.5 border border-zinc-200 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-800 text-[13px] text-zinc-700 dark:text-zinc-200 outline-none" />
              <button type="button" onClick={copy} className="h-9 inline-flex items-center gap-1.5 px-3 border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-[13px] font-semibold text-zinc-700 dark:text-zinc-200 cursor-pointer">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}{copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 px-5 py-3.5 border-t border-zinc-200 dark:border-zinc-800">
          {page.published ? (
            <button type="button" disabled={busy} onClick={() => run(() => pagesApi.unpublish(page.id))} className="text-xs font-bold text-rose-700 dark:text-rose-400 hover:underline cursor-pointer">Unpublish</button>
          ) : (
            <span className="text-xs text-zinc-600 dark:text-zinc-400">You can unpublish any time.</span>
          )}
          <button type="button" onClick={onClose} className="ml-auto h-9 inline-flex items-center px-3.5 border border-zinc-200 dark:border-zinc-700 rounded-md text-[13px] font-semibold text-zinc-700 dark:text-zinc-200 cursor-pointer">Cancel</button>
          <button type="button" disabled={busy} onClick={() => run(() => pagesApi.publish(page.id, { visibility, dataMode, snapshotEvery: dataMode === "SNAPSHOT" ? snapshotEvery : "NEVER" }))}
            className="h-9 inline-flex items-center gap-2 px-4 rounded-md bg-primary hover:bg-primary-hover text-white text-[13px] font-bold disabled:opacity-60 cursor-pointer">
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}{page.published ? "Save" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Page editor: the live preview on the left, the design chat with Cortex on
 * the right. Every Cortex reply is a new version; Versions restores any of
 * them. Click a part of the preview to point Cortex at it.
 */
export function PageEditorPage() {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const { can } = useAppState();
  const manage = can("manageProjects");

  const [page, setPage] = useState(null);
  const [view, setView] = useState(null);
  const [chat, setChat] = useState([]);
  const [versions, setVersions] = useState(null);
  const [device, setDevice] = useState("desktop");
  const [part, setPart] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const [publishOpen, setPublishOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const frame = useRef(null);
  const chatEnd = useRef(null);
  const composer = useRef(null);

  const working = chat.length > 0 && chat[chat.length - 1].state === "WORKING";

  const loadView = useCallback(async () => {
    try { setView(await pagesApi.view(pageId)); } catch { /* keep the last preview */ }
  }, [pageId]);
  const loadPage = useCallback(async () => setPage(await pagesApi.get(pageId)), [pageId]);

  useEffect(() => {
    Promise.all([pagesApi.get(pageId), pagesApi.view(pageId), pagesApi.messages(pageId)])
      .then(([p, v, m]) => { setPage(p); setView(v); setChat(m); })
      .catch(() => navigate("/pages", { replace: true }));
  }, [pageId, navigate]);

  // Live preview: re-read the data every minute while the tab is visible, like the published page does.
  useEffect(() => {
    const tick = () => { if (document.visibilityState === "visible") loadView(); };
    const timer = setInterval(tick, LIVE_MS);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", tick); };
  }, [loadView]);

  // While Cortex works, watch the chat; when the reply lands, show the new design.
  useEffect(() => {
    if (!working) return undefined;
    const timer = setInterval(async () => {
      try {
        const next = await pagesApi.messages(pageId);
        setChat(next);
        if (next[next.length - 1]?.state !== "WORKING") { loadView(); loadPage(); setVersions(null); }
      } catch { /* try again on the next tick */ }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [working, pageId, loadView, loadPage]);

  useEffect(() => { chatEnd.current?.scrollIntoView({ block: "end" }); }, [chat.length, working]);

  const send = async (e) => {
    e?.preventDefault();
    const body = text.trim();
    if (!body || sending || working) return;
    setSending(true);
    setChatError("");
    try {
      setChat(await pagesApi.sendMessage(pageId, body, part));
      setText("");
      setPart(null);
      frame.current?.clearSelection();
    } catch (err) {
      setChatError(err.message || "Couldn't send that. Try again.");
    } finally {
      setSending(false);
    }
  };
  const stop = async () => { try { setChat(await pagesApi.stopMessage(pageId)); } catch { /* the poll will catch up */ } };

  const openVersions = async () => {
    setVersionsOpen((v) => !v);
    if (!versions) { try { setVersions(await pagesApi.versions(pageId)); } catch { setVersions([]); } }
  };
  const restore = async (versionNo) => {
    setVersionsOpen(false);
    setChatError("");
    try {
      setPage(await pagesApi.restoreVersion(pageId, versionNo));
      setVersions(null);
      loadView();
    } catch (err) {
      setChatError(err.message || "Couldn't restore that version.");
    }
  };
  const rename = async (e) => {
    e.preventDefault();
    const title = new FormData(e.target).get("title")?.toString().trim();
    setRenaming(false);
    if (!title || title === page.title) return;
    try {
      setPage(await pagesApi.update(pageId, { title }));
      loadView();
    } catch (err) {
      setChatError(err.message || "Couldn't rename the page.");
    }
  };

  if (!page || !view) {
    return <div className="min-h-dvh flex items-center justify-center text-sm font-medium text-zinc-500 dark:text-zinc-400">Opening the page…</div>;
  }

  const s = page.summary || {};
  const tabsLine = (page.config.tabs || []).some((t) => t.type === "person") ? "tabs by person"
    : (page.config.tabs || []).some((t) => t.type === "project") ? "tabs by project" : "one tab";

  return (
    <div className="min-h-dvh lg:h-dvh flex flex-col bg-zinc-100 dark:bg-zinc-950 text-[13px] text-left" id="page-editor-root">
      <header className="min-h-[52px] shrink-0 flex flex-wrap items-center gap-2.5 px-4 py-2 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <Link to="/pages" className="inline-flex items-center gap-1.5 h-8 pl-1.5 pr-2.5 rounded-md text-zinc-700 dark:text-zinc-300 font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800"><ChevronLeft className="w-4 h-4" />Pages</Link>
        <span className="w-px h-5 bg-zinc-200 dark:bg-zinc-800" />
        {renaming ? (
          <form onSubmit={rename} className="min-w-0">
            <label htmlFor="page-title" className="sr-only">Page title</label>
            <input id="page-title" name="title" defaultValue={page.title} autoFocus maxLength={200} onBlur={(e) => e.target.form.requestSubmit()}
              className="h-8 w-[260px] max-w-full px-2 rounded-md border border-primary text-[15px] font-bold bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white outline-none" />
          </form>
        ) : (
          <h1 className="text-[15px] font-bold text-zinc-900 dark:text-white truncate max-w-[40vw]">
            {manage ? <button type="button" onClick={() => setRenaming(true)} title="Rename" className="hover:text-primary cursor-text truncate max-w-full">{page.title}</button> : page.title}
          </h1>
        )}
        <span className={`${chip} bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300`}>{page.published ? "Published" : "Draft"} · version {page.versionNo}</span>
        {page.dataMode === "SNAPSHOT" && page.published ? (
          <span className={`${chip} bg-sky-100 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300`}>Snapshot</span>
        ) : (
          <span className={`${chip} gap-1.5 bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300`}><span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />Live data</span>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-2 relative">
          <div role="group" aria-label="Preview size" className="hidden md:inline-flex h-8 border border-zinc-200 dark:border-zinc-700 rounded-md overflow-hidden bg-white dark:bg-zinc-900">
            {[["desktop", Monitor, "Desktop preview"], ["phone", Smartphone, "Phone preview"]].map(([value, Icon, name]) => (
              <button key={value} type="button" aria-pressed={device === value} aria-label={name} onClick={() => setDevice(value)}
                className={`w-[38px] inline-flex items-center justify-center cursor-pointer ${device === value ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white" : "text-zinc-500"}`}><Icon className="w-4 h-4" /></button>
            ))}
          </div>
          <button type="button" onClick={openVersions} aria-haspopup="menu" aria-expanded={versionsOpen} className={headBtn}><History className="w-[15px] h-[15px]" /><span className="hidden sm:inline">Versions</span></button>
          {versionsOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setVersionsOpen(false)} aria-hidden="true" />
              <div role="menu" className="menu-panel absolute right-0 top-10 z-40 w-[300px] max-h-[360px] overflow-y-auto p-1">
                {versions === null ? <p className="px-2.5 py-3 text-zinc-500">Loading…</p> : versions.map((v) => (
                  <div key={v.versionNo} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md ${v.current ? "bg-primary/[0.06]" : ""}`}>
                    <span className="flex-1 min-w-0 flex flex-col">
                      <span className="font-bold text-zinc-900 dark:text-white">Version {v.versionNo}{v.current ? " · showing" : ""}</span>
                      <span className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">{v.note}</span>
                      <span className="text-[11px] text-zinc-400">{formatRelative(v.createdAt)}</span>
                    </span>
                    {!v.current && manage && <button type="button" role="menuitem" disabled={working} onClick={() => restore(v.versionNo)} className="btn btn-sm btn-secondary shrink-0">Restore</button>}
                  </div>
                ))}
              </div>
            </>
          )}
          <button type="button" onClick={() => frame.current?.print()} className={headBtn} aria-label="Save as PDF" title="Save as PDF"><FileDown className="w-[15px] h-[15px]" /></button>
          <a href={`/p/${page.token}`} target="_blank" rel="noopener noreferrer" className={headBtn}><Eye className="w-[15px] h-[15px]" /><span className="hidden sm:inline">Preview</span></a>
          {manage && (
            <button type="button" onClick={() => setPublishOpen(true)} className="h-8 inline-flex items-center gap-1.5 px-3.5 rounded-md bg-primary hover:bg-primary-hover text-white text-[13px] font-bold cursor-pointer">
              <Globe className="w-[15px] h-[15px]" />{page.published ? "Share" : "Publish"}
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        <section aria-label="Page preview" className="lg:flex-[999_1_0] min-w-0 h-[68dvh] lg:h-auto lg:min-h-0 p-2 sm:p-6 flex flex-col gap-2.5">
          <div className={`flex-1 min-h-0 mx-auto w-full rounded-[10px] border border-zinc-300 dark:border-zinc-700 bg-[#0f141c] overflow-hidden flex flex-col shadow-[0_8px_28px_-12px_rgba(0,0,0,0.25)] transition-[max-width] duration-200 ${device === "phone" ? "max-w-[390px]" : "max-w-none"}`}>
            <div className="h-[30px] shrink-0 flex items-center gap-1.5 px-3 bg-[#1b2230] border-b border-[#263041]" aria-hidden="true">
              <span className="w-[9px] h-[9px] rounded-full bg-[#3a4456]" /><span className="w-[9px] h-[9px] rounded-full bg-[#3a4456]" /><span className="w-[9px] h-[9px] rounded-full bg-[#3a4456]" />
              <span className="ml-3 h-[18px] inline-flex items-center px-2.5 rounded bg-[#0f141c] text-[#9aa5b4] text-[11px] truncate">{shareUrl(page.token).replace(/^https?:\/\//, "")}</span>
            </div>
            <div className="flex-1 min-h-0">
              <PageFrame ref={frame} html={view.html} data={view.data} editable={manage} onSelectPart={setPart} title={`Preview of ${page.title}`} />
            </div>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 shrink-0" />
            {manage ? "Showing real tasks. Click any part of the page to point Cortex at it." : "Showing real tasks."}
          </p>
        </section>

        {manage && (
          <aside aria-label="Design chat with Cortex" className="lg:flex-[0_0_400px] min-w-0 lg:min-h-0 bg-white dark:bg-zinc-900 border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-zinc-800 flex flex-col">
            <div className="px-4 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary inline-flex items-center justify-center"><Sparkles className="w-4 h-4" /></span>
                <span className="flex flex-col"><span className="font-bold text-sm text-zinc-900 dark:text-white">Cortex</span><span className="text-xs text-zinc-600 dark:text-zinc-400">Designs this page with you</span></span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300">
                <Table2 className="w-3.5 h-3.5 shrink-0" />
                <span className="flex-1 min-w-0 truncate font-tnum">{s.tasks ?? 0} {s.tasks === 1 ? "task" : "tasks"} · {s.projects ?? 0} {s.projects === 1 ? "project" : "projects"} · {tabsLine}</span>
                <Link to={`/pages/${page.id}/data`} className="font-bold text-primary hover:underline shrink-0">Edit data</Link>
              </div>
            </div>

            <div className="flex-1 min-h-[160px] lg:min-h-0 max-h-[50dvh] lg:max-h-none overflow-y-auto p-4 flex flex-col gap-3.5" aria-live="polite">
              {chat.length === 0 && (
                <p className="m-auto max-w-[260px] text-center text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Tell Cortex what to change. For example: “add a tab for each person” or “make overdue dates red”.
                </p>
              )}
              {chat.map((m) => (m.role === "USER" ? (
                <div key={m.id} className="self-end max-w-[86%] flex flex-col items-end gap-1.5">
                  {m.part && <span className="h-[22px] inline-flex items-center px-2 rounded-full bg-primary/[0.08] text-primary text-[11px] font-bold">Pointing at: {m.part}</span>}
                  <div className="px-3 py-[9px] rounded-[12px_12px_4px_12px] bg-primary text-white leading-normal whitespace-pre-wrap break-words">{m.body}</div>
                </div>
              ) : m.state === "WORKING" ? (
                <div key={m.id} className="self-start max-w-[92%] flex flex-col gap-1.5">
                  <div className="px-3 py-[9px] rounded-[12px_12px_12px_4px] bg-zinc-100 dark:bg-zinc-800 flex flex-col gap-1.5">
                    <span className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-white"><span className="w-2 h-2 rounded-full bg-primary animate-pulse" />Working on the next version…</span>
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">Reading your tasks and rewriting the design. This usually takes a minute or two.</span>
                  </div>
                  <button type="button" onClick={stop} className="self-start h-[26px] px-2.5 border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-200 cursor-pointer">Stop</button>
                </div>
              ) : (
                <div key={m.id} className="self-start max-w-[92%] flex flex-col gap-2">
                  <div className={`px-3 py-[9px] rounded-[12px_12px_12px_4px] leading-normal whitespace-pre-wrap break-words ${m.state === "FAILED" ? "bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-300" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"}`}>{m.body}</div>
                  {m.versionNo && (
                    <span className="inline-flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                      <span className="h-5 inline-flex items-center px-[7px] rounded-full bg-zinc-100 dark:bg-zinc-800 font-bold text-zinc-700 dark:text-zinc-300">Version {m.versionNo}</span>
                      {m.versionNo !== page.versionNo && <button type="button" disabled={working} onClick={() => restore(m.versionNo)} className="font-bold text-primary hover:underline cursor-pointer">Restore</button>}
                    </span>
                  )}
                </div>
              )))}
              <div ref={chatEnd} />
            </div>

            <form onSubmit={send} className="px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-2.5">
              {chatError && <p role="alert" className="text-xs font-semibold text-rose-700 dark:text-rose-400">{chatError}</p>}
              {part && (
                <span className="self-start h-[22px] inline-flex items-center gap-1.5 pl-2 pr-1 rounded-full bg-primary/[0.08] text-primary text-[11px] font-bold">
                  Pointing at: {part}
                  <button type="button" aria-label="Stop pointing" onClick={() => { setPart(null); frame.current?.clearSelection(); }} className="w-4 h-4 inline-flex items-center justify-center rounded-full hover:bg-primary/15 cursor-pointer"><X className="w-3 h-3" /></button>
                </span>
              )}
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((suggestion) => (
                  <button key={suggestion} type="button" onClick={() => { setText(suggestion); composer.current?.focus(); }}
                    className="h-7 px-2.5 border border-zinc-200 dark:border-zinc-700 rounded-full bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:border-primary/50 cursor-pointer">{suggestion}</button>
                ))}
              </div>
              <div className="flex items-end gap-2">
                <label htmlFor="cortex-msg" className="sr-only">Message Cortex</label>
                <textarea id="cortex-msg" ref={composer} rows={2} value={text} maxLength={2000} onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) send(e); }}
                  placeholder={working ? "Cortex is working…" : "Ask Cortex to change the design…"}
                  className="flex-1 resize-none px-3 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-[10px] bg-white dark:bg-zinc-900 text-[13px] leading-normal text-zinc-900 dark:text-white outline-none focus:border-primary" />
                <button type="submit" disabled={!text.trim() || sending || working} aria-label="Send to Cortex"
                  className="w-11 h-11 shrink-0 rounded-full bg-primary hover:bg-primary-hover text-white inline-flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                  {sending ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <ArrowUp className="w-[18px] h-[18px]" strokeWidth={2.4} />}
                </button>
              </div>
            </form>
          </aside>
        )}
      </div>

      {publishOpen && <PublishDialog page={page} onClose={() => setPublishOpen(false)} onSaved={setPage} />}
    </div>
  );
}
