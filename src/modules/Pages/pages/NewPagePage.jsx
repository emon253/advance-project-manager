/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronDown, Check, Plus, X, Sparkles, Loader2 } from "lucide-react";
import { useAppState } from "../../../app/providers";
import { pagesApi } from "../../../api/endpoints";
import { TEMPLATES, templateOf, COLUMNS } from "../pagesMeta";

const label = "text-[11px] font-bold tracking-[0.06em] uppercase text-zinc-500 dark:text-zinc-400";
const section = "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[10px] p-5 flex flex-col";

function Step({ n, children }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-[22px] h-[22px] rounded-full bg-primary text-white text-[11px] font-bold inline-flex items-center justify-center">{n}</span>
      <h2 className="text-[15px] font-bold text-zinc-900 dark:text-white">{children}</h2>
    </div>
  );
}

/** Dropdown with checkboxes; an empty selection means "no restriction". */
function MultiPick({ id, items, selected, onChange, allText, countText }) {
  const [open, setOpen] = useState(false);
  const toggle = (value) => onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  return (
    <div className="relative">
      <button type="button" aria-labelledby={id} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((v) => !v)}
        className="w-full h-[34px] flex items-center justify-between px-2.5 border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-[13px] font-semibold text-zinc-900 dark:text-white cursor-pointer">
        <span className="truncate">{selected.length === 0 ? allText : countText(selected.length)}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden="true" />
          <ul role="listbox" aria-multiselectable="true" className="menu-panel absolute left-0 right-0 top-[38px] z-40 max-h-64 overflow-y-auto p-1">
            <li>
              <button type="button" role="option" aria-selected={selected.length === 0} onClick={() => onChange([])}
                className="w-full flex items-center gap-2 h-8 px-2 rounded-md text-left text-[13px] font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                <span className="flex-1">{allText}</span>{selected.length === 0 && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>
            </li>
            {items.map((item) => (
              <li key={item.id}>
                <button type="button" role="option" aria-selected={selected.includes(item.id)} onClick={() => toggle(item.id)}
                  className="w-full flex items-center gap-2 h-8 px-2 rounded-md text-left text-[13px] font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                  {item.color && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />}
                  <span className="flex-1 truncate">{item.name}</span>{selected.includes(item.id) && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/**
 * New page: template, which tasks, what the page shows. The same screen
 * edits an existing page's data at /pages/:pageId/data (template and brief
 * are fixed there).
 */
export function NewPagePage() {
  const { pageId } = useParams();
  const editing = !!pageId;
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { activeWorkspaceId, activeWorkspaceProjects, users, taskStatuses, tags } = useAppState();

  const projects = useMemo(() => activeWorkspaceProjects.filter((p) => p.status !== "Archived"), [activeWorkspaceProjects]);
  const [template, setTemplate] = useState(() => templateOf(params.get("template")).key);
  const [title, setTitle] = useState(() => templateOf(params.get("template")).defaultTitle);
  const [titleTouched, setTitleTouched] = useState(false);
  const [projectIds, setProjectIds] = useState([]);
  const [assigneeIds, setAssigneeIds] = useState([]);
  const [statusIds, setStatusIds] = useState(null); // null = not chosen yet (defaults to every status but cancelled)
  const [tabs, setTabs] = useState([]);
  const [allTab, setAllTab] = useState(true); // the tab that lists every task; can be dropped once other tabs exist
  const [columns, setColumns] = useState(COLUMNS.map(([key]) => key));
  const [theme, setTheme] = useState("dark");
  const [sort, setSort] = useState("due");
  const [brief, setBrief] = useState("");
  const [summary, setSummary] = useState(null);
  const [tabMenu, setTabMenu] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(!editing);

  // Edit mode: start from the page's saved config.
  useEffect(() => {
    if (!editing) return;
    pagesApi.get(pageId).then((page) => {
      setTemplate(page.template);
      setTitle(page.title);
      setTitleTouched(true);
      setProjectIds(page.config.projectIds || []);
      setAssigneeIds(page.config.assigneeIds || []);
      setStatusIds(page.config.statusIds?.length ? page.config.statusIds : null);
      setTabs((page.config.tabs || []).filter((t) => t.type !== "all"));
      setAllTab(!(page.config.tabs || []).length || page.config.tabs.some((t) => t.type === "all"));
      setColumns(page.config.columns || COLUMNS.map(([key]) => key));
      setTheme(page.config.theme || "dark");
      setSort(page.config.sort || "due");
      setLoaded(true);
    }).catch(() => navigate("/pages", { replace: true }));
  }, [editing, pageId, navigate]);

  const defaultStatusIds = useMemo(() => taskStatuses.filter((s) => !s.isCancelled).map((s) => s.id), [taskStatuses]);
  const chosenStatusIds = statusIds ?? defaultStatusIds;

  const config = useMemo(() => ({
    projectIds,
    assigneeIds,
    statusIds: statusIds ?? [],
    tabs: [...(allTab || tabs.length === 0 ? [{ type: "all", refId: null, label: title.trim() || "All tasks" }] : []), ...tabs],
    columns: COLUMNS.map(([key]) => key).filter((key) => columns.includes(key)),
    theme,
    sort,
  }), [projectIds, assigneeIds, statusIds, tabs, allTab, columns, theme, sort, title]);

  // "17 tasks from 7 projects and 6 people": asked from the server so it matches the page exactly.
  const filterKey = JSON.stringify([projectIds, assigneeIds, statusIds]);
  const latest = useRef(config);
  latest.current = config;
  useEffect(() => {
    if (!activeWorkspaceId || !loaded) return undefined;
    let current = true; // a slower, older answer must not overwrite a newer one
    const timer = setTimeout(() => {
      pagesApi.summary(activeWorkspaceId, latest.current)
        .then((next) => { if (current) setSummary(next); })
        .catch(() => { if (current) setSummary(null); });
    }, 250);
    return () => { current = false; clearTimeout(timer); };
  }, [activeWorkspaceId, filterKey, loaded]);

  const pickTemplate = (key) => {
    setTemplate(key);
    if (!titleTouched) setTitle(templateOf(key).defaultTitle);
  };
  const toggleStatus = (id) => {
    const next = chosenStatusIds.includes(id) ? chosenStatusIds.filter((v) => v !== id) : [...chosenStatusIds, id];
    setStatusIds(next.length ? next : null);
  };
  const toggleColumn = (key) => setColumns((c) => (c.includes(key) ? (c.length > 1 ? c.filter((k) => k !== key) : c) : [...c, key]));
  const addTab = (type, item) => {
    setTabMenu(false);
    if (tabs.some((t) => t.type === type && t.refId === item.id)) return;
    setTabs((t) => [...t, { type, refId: item.id, label: type === "person" ? `${item.name.split(" ")[0]} work` : item.name }]);
  };
  const removeTab = (index) => {
    const next = tabs.filter((_, j) => j !== index);
    setTabs(next);
    if (next.length === 0) setAllTab(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await pagesApi.update(pageId, { title: title.trim(), config });
        navigate(`/pages/${pageId}`);
      } else {
        const page = await pagesApi.create(activeWorkspaceId, { title: title.trim(), template, config, brief: brief.trim() || null });
        navigate(`/pages/${page.id}`, { replace: true });
      }
    } catch (err) {
      setError(err.message || "Couldn't save the page. Try again.");
      setSaving(false);
    }
  };

  const tabCount = tabs.length + (allTab || tabs.length === 0 ? 1 : 0);
  const s = summary;

  return (
    <div className="min-h-dvh flex flex-col text-[13px] text-left" id="new-page-root">
      <header className="h-[52px] shrink-0 flex items-center gap-3 px-5 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 pt-[env(safe-area-inset-top)] box-content">
        <Link to={editing ? `/pages/${pageId}` : "/pages"} className="inline-flex items-center gap-1.5 h-8 pl-1.5 pr-2.5 rounded-md text-zinc-700 dark:text-zinc-300 font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800">
          <ChevronLeft className="w-4 h-4" />{editing ? "Editor" : "Pages"}
        </Link>
        <span className="w-px h-5 bg-zinc-200 dark:bg-zinc-800" />
        <h1 className="text-[15px] font-bold text-zinc-900 dark:text-white">{editing ? "Edit data" : "New page"}</h1>
        <Link to={editing ? `/pages/${pageId}` : "/pages"} className="ml-auto h-8 inline-flex items-center px-3 rounded-md text-zinc-700 dark:text-zinc-300 font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800">Cancel</Link>
      </header>

      <form onSubmit={submit} className="flex-1 w-full max-w-[1180px] mx-auto px-3 sm:px-6 pt-5 sm:pt-7 pb-12 flex flex-wrap gap-6 items-start">
        <div className="flex-[999_1_560px] min-w-0 flex flex-col gap-5">

          {!editing && (
            <section className={`${section} gap-3.5`}>
              <Step n={1}>Template</Step>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5" role="radiogroup" aria-label="Template">
                {TEMPLATES.map((t) => {
                  const on = template === t.key;
                  return (
                    <label key={t.key} className={`flex flex-col gap-1.5 p-2.5 rounded-lg cursor-pointer ${on ? "border-2 border-primary bg-primary/[0.04]" : "border border-zinc-200 dark:border-zinc-700 m-px"}`}>
                      <input type="radio" name="template" checked={on} onChange={() => pickTemplate(t.key)} className="sr-only" />
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-bold text-zinc-900 dark:text-white">{t.name}</span>
                        {on && <Check className="w-4 h-4 text-primary shrink-0" strokeWidth={2.4} />}
                      </span>
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">{t.short}</span>
                    </label>
                  );
                })}
              </div>
            </section>
          )}

          <section className={`${section} gap-4`}>
            <Step n={editing ? 1 : 2}>Which tasks</Step>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5">
              <div className="flex flex-col gap-1.5">
                <span id="np-projects" className={label}>Projects</span>
                <MultiPick id="np-projects" items={projects} selected={projectIds} onChange={setProjectIds}
                  allText={`All projects (${projects.length})`} countText={(n) => `${n} ${n === 1 ? "project" : "projects"}`} />
              </div>
              <div className="flex flex-col gap-1.5">
                <span id="np-people" className={label}>People</span>
                <MultiPick id="np-people" items={users} selected={assigneeIds} onChange={setAssigneeIds}
                  allText="Everyone" countText={(n) => `${n} ${n === 1 ? "person" : "people"}`} />
              </div>
            </div>
            <fieldset className="flex flex-col">
              <legend className={`${label} mb-2`}>Statuses</legend>
              <div className="flex flex-wrap gap-2">
                {taskStatuses.map((status) => {
                  const on = chosenStatusIds.includes(status.id);
                  return (
                    <label key={status.id} className={`h-[30px] inline-flex items-center gap-2 px-2.5 rounded-full border font-semibold cursor-pointer ${on ? "border-primary/35 bg-primary/[0.06] text-zinc-900 dark:text-white" : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"}`}>
                      <input type="checkbox" checked={on} onChange={() => toggleStatus(status.id)} className="accent-primary m-0" />
                      {status.name}{status.isCompleted ? " this week" : ""}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </section>

          <section className={`${section} gap-4`}>
            <Step n={editing ? 2 : 3}>What the page shows</Step>
            <label className="flex flex-col gap-1.5">
              <span className={label}>Title</span>
              <input type="text" value={title} maxLength={200} required onChange={(e) => { setTitle(e.target.value); setTitleTouched(true); }}
                className="h-[34px] px-2.5 border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-[13px] font-semibold text-zinc-900 dark:text-white outline-none focus:border-primary" />
            </label>

            <fieldset className="flex flex-col">
              <legend className={`${label} mb-2`}>Tabs</legend>
              <div className="flex flex-wrap items-center gap-2 relative">
                {(allTab || tabs.length === 0) && (
                  <span className={`h-[30px] inline-flex items-center gap-2 rounded-md bg-zinc-100 dark:bg-zinc-800 font-semibold text-zinc-900 dark:text-white max-w-full ${tabs.length ? "pl-2.5 pr-1.5" : "px-2.5"}`}>
                    <span className="truncate">{title.trim() || "All tasks"}</span>
                    <span className="text-zinc-500 dark:text-zinc-400 font-tnum">all{s ? ` ${s.tasks}` : ""}</span>
                    {tabs.length > 0 && (
                      <button type="button" aria-label="Remove the tab that lists every task" onClick={() => setAllTab(false)}
                        className="w-[22px] h-[22px] inline-flex items-center justify-center rounded text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"><X className="w-3 h-3" strokeWidth={2.4} /></button>
                    )}
                  </span>
                )}
                {tabs.map((tab, i) => (
                  <span key={`${tab.type}-${tab.refId}`} className="h-[30px] inline-flex items-center gap-1 pl-2.5 pr-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 font-semibold text-zinc-900 dark:text-white">
                    <span className="truncate max-w-[180px]">{tab.label}</span>
                    <button type="button" aria-label={`Remove the ${tab.label} tab`} onClick={() => removeTab(i)}
                      className="w-[22px] h-[22px] inline-flex items-center justify-center rounded text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"><X className="w-3 h-3" strokeWidth={2.4} /></button>
                  </span>
                ))}
                <button type="button" aria-haspopup="menu" aria-expanded={tabMenu} onClick={() => setTabMenu((v) => !v)}
                  className="h-[30px] inline-flex items-center gap-1.5 px-2.5 border border-dashed border-zinc-400 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-900 text-[13px] font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                  <Plus className="w-[13px] h-[13px]" strokeWidth={2.2} />Tab per person, project or label
                </button>
                {tabMenu && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setTabMenu(false)} aria-hidden="true" />
                    <div role="menu" className="menu-panel absolute left-0 top-[34px] z-40 w-64 max-h-72 overflow-y-auto p-1">
                      <p className="px-2 pt-1 pb-1 text-[10.5px] font-bold uppercase tracking-wider text-zinc-400">People</p>
                      {users.map((u) => (
                        <button key={`u${u.id}`} type="button" role="menuitem" onClick={() => addTab("person", u)} className="w-full flex items-center h-8 px-2 rounded-md text-left text-[13px] font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"><span className="truncate">{u.name}</span></button>
                      ))}
                      {(tags || []).length > 0 && <p className="px-2 pt-2.5 pb-1 text-[10.5px] font-bold uppercase tracking-wider text-zinc-400">Labels</p>}
                      {(tags || []).map((t) => (
                        <button key={`t${t.id}`} type="button" role="menuitem" onClick={() => addTab("tag", t)} className="w-full flex items-center h-8 px-2 rounded-md text-left text-[13px] font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"><span className="truncate">{t.name}</span></button>
                      ))}
                      <p className="px-2 pt-2.5 pb-1 text-[10.5px] font-bold uppercase tracking-wider text-zinc-400">Projects</p>
                      {projects.map((p) => (
                        <button key={`p${p.id}`} type="button" role="menuitem" onClick={() => addTab("project", p)} className="w-full flex items-center gap-2 h-8 px-2 rounded-md text-left text-[13px] font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} /><span className="truncate">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </fieldset>

            <fieldset>
              <legend className={`${label} mb-2`}>Columns</legend>
              <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                {COLUMNS.map(([key, name, hint]) => (
                  <label key={key} className="flex items-center gap-2.5 min-h-[44px] px-3 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0 cursor-pointer">
                    <input type="checkbox" checked={columns.includes(key)} onChange={() => toggleColumn(key)} className="accent-primary m-0" />
                    <span className="font-semibold w-[130px] shrink-0 text-zinc-900 dark:text-white">{name}</span>
                    <span className="text-zinc-600 dark:text-zinc-400">{hint}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="flex flex-wrap gap-x-8 gap-y-4">
              <fieldset className="flex flex-col">
                <legend className={`${label} mb-2`}>Theme</legend>
                <div className="seg self-start" role="group" aria-label="Theme">
                  <button type="button" aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}>Dark</button>
                  <button type="button" aria-pressed={theme === "light"} onClick={() => setTheme("light")}>Light</button>
                </div>
              </fieldset>
              <fieldset className="flex flex-col">
                <legend className={`${label} mb-2`}>Row order</legend>
                <div className="seg self-start" role="group" aria-label="Row order">
                  <button type="button" aria-pressed={sort === "due"} onClick={() => setSort("due")}>Earliest finish first</button>
                  <button type="button" aria-pressed={sort === "created"} onClick={() => setSort("created")}>Order added</button>
                </div>
              </fieldset>
            </div>
          </section>
        </div>

        <aside className="flex-[1_1_320px] sm:max-w-[380px] flex flex-col gap-3.5">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[10px] p-4 flex flex-col gap-3.5">
            <div className={`h-[150px] rounded-lg p-3.5 flex flex-col gap-2 ${theme === "dark" ? "bg-[#0f141c]" : "bg-slate-50 border border-slate-200"}`} aria-hidden="true">
              <span className={`text-[9px] font-extrabold tracking-[0.12em] ${theme === "dark" ? "text-[#4d9fff]" : "text-[#0060c7]"}`}>CARBARN</span>
              <span className={`text-[15px] font-extrabold tracking-[-0.01em] truncate ${theme === "dark" ? "text-slate-100" : "text-slate-900"}`}>{title.trim() || "Untitled"}</span>
              <span className="flex gap-1">{[0, 1, 2, 3, 4].map((i) => <span key={i} className={`w-[26px] h-3 rounded-[3px] border ${theme === "dark" ? "border-[#263041]" : "border-slate-200"}`} />)}</span>
              <span className={`h-px mt-1 ${theme === "dark" ? "bg-[#263041]" : "bg-slate-200"}`} />
              {[["40%", "#22c55e"], ["34%", "#14b8a6"]].map(([w, c]) => (
                <span key={c} className="flex gap-1.5">
                  <span style={{ width: w, height: 5, borderRadius: 3, background: theme === "dark" ? "#cbd5e1" : "#334155" }} />
                  <span style={{ width: "16%", height: 5, borderRadius: 3, background: theme === "dark" ? "#475569" : "#94a3b8" }} />
                  <span style={{ width: "12%", height: 5, borderRadius: 3, background: c }} />
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[22px] font-extrabold tracking-[-0.02em] text-zinc-900 dark:text-white font-tnum">{s ? `${s.tasks} ${s.tasks === 1 ? "task" : "tasks"}` : "…"}</span>
              <span className="text-zinc-600 dark:text-zinc-400">
                {s ? `from ${s.projects} ${s.projects === 1 ? "project" : "projects"} and ${s.people} ${s.people === 1 ? "person" : "people"} · ` : ""}
                {tabCount} {tabCount === 1 ? "tab" : "tabs"} · {columns.length} {columns.length === 1 ? "column" : "columns"}
              </span>
            </div>
            {!editing && (
              <div className="flex flex-col gap-2 p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <label htmlFor="np-brief" className="flex items-center gap-2 font-bold text-zinc-900 dark:text-white"><Sparkles className="w-4 h-4 text-primary" />Anything extra for Cortex?</label>
                <textarea id="np-brief" rows={3} value={brief} maxLength={2000} onChange={(e) => setBrief(e.target.value)}
                  placeholder="e.g. show who owns each area, keep it simple for the boss"
                  className="w-full resize-none px-2.5 py-2 border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-[13px] leading-normal text-zinc-900 dark:text-white outline-none focus:border-primary" />
              </div>
            )}
            {error && <p className="text-xs font-semibold text-rose-700 dark:text-rose-400" role="alert">{error}</p>}
            <button type="submit" disabled={saving || !title.trim()} className="h-10 flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-bold disabled:opacity-60 cursor-pointer">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {editing ? "Save changes" : "Build the page"}
            </button>
            <p className="text-xs leading-normal text-zinc-600 dark:text-zinc-400">
              {editing
                ? "The page keeps its design. It will show these tasks from now on."
                : "The page starts from the template with these tasks. Then you change anything by chatting with Cortex. Nothing is shared until you publish."}
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
