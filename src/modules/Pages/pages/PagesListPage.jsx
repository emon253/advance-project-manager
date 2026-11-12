/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Link2, Globe, Lock, MoreHorizontal, Check, FileDown, EyeOff, Trash2, ExternalLink } from "lucide-react";
import { useAppState } from "../../../app/providers";
import { pagesApi } from "../../../api/endpoints";
import { ListSkeleton } from "../../../components/common/Skeleton";
import { ErrorState } from "../../../components/common/ErrorState";
import { formatRelative } from "../../Tasks/util/tasksUtils";
import { TEMPLATES, templateOf, TemplateThumb, PageThumb, shareUrl } from "../pagesMeta";

const FILTERS = [["all", "All"], ["published", "Published"], ["drafts", "Drafts"]];
const th = "px-3 py-2.5 text-[11px] font-bold tracking-[0.06em] uppercase text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800";
const td = "px-3 py-3 border-b border-zinc-100 dark:border-zinc-800/80 align-middle";

function StatusPill({ page }) {
  if (!page.published) {
    return <span className="inline-flex items-center h-[22px] px-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-bold">Draft</span>;
  }
  if (page.dataMode === "SNAPSHOT") {
    return <span className="inline-flex items-center h-[22px] px-2 rounded-full bg-sky-100 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 text-xs font-bold">Snapshot</span>;
  }
  return (
    <span className="inline-flex items-center gap-1.5 h-[22px] px-2 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />Live
    </span>
  );
}

function dataLine(page) {
  const s = page.summary || {};
  const tasks = `${s.tasks ?? 0} ${s.tasks === 1 ? "task" : "tasks"}`;
  if (page.dataMode === "SNAPSHOT" && page.snapshotAt) {
    return `${tasks} · snapshot ${new Date(page.snapshotAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;
  }
  const projects = page.config?.projectIds?.length;
  return `${tasks} · ${projects ? `${projects} ${projects === 1 ? "project" : "projects"}` : "all projects"}`;
}

/** Pages: shareable pages built from the workspace's tasks. Templates on top, your pages below. */
export function PagesListPage() {
  const { activeWorkspaceId, can } = useAppState();
  const manage = can("manageProjects");
  const [pages, setPages] = useState(null);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState("all");
  const [menuFor, setMenuFor] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [copied, setCopied] = useState(null);

  const load = useCallback(async () => {
    if (!activeWorkspaceId) return;
    try { setPages(await pagesApi.list(activeWorkspaceId)); setFailed(false); } catch { setFailed(true); }
  }, [activeWorkspaceId]);
  useEffect(() => { setPages(null); load(); }, [load]);

  const copy = async (page) => {
    try { await navigator.clipboard.writeText(shareUrl(page.token)); } catch { /* clipboard blocked: the link is still in the editor */ }
    setCopied(page.id);
    setTimeout(() => setCopied(null), 1600);
  };
  const closeMenu = () => { setMenuFor(null); setConfirmDelete(null); };
  const unpublish = async (page) => { closeMenu(); await pagesApi.unpublish(page.id); load(); };
  const remove = async (page) => { closeMenu(); await pagesApi.remove(page.id); load(); };

  const shown = (pages || []).filter((p) => (filter === "published" ? p.published : filter === "drafts" ? !p.published : true));

  return (
    <div className="text-left flex flex-col gap-7" id="pages-root">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="page-title">Pages</h1>
          <p className="text-[13px] font-medium text-zinc-600 dark:text-zinc-400">Shareable pages built from your tasks. They stay up to date on their own.</p>
        </div>
        {manage && (
          <Link to="/pages/new" className="btn btn-primary ml-auto px-3.5"><Plus className="w-[15px] h-[15px]" strokeWidth={2.2} />New page</Link>
        )}
      </div>

      {manage && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] font-bold tracking-[0.08em] uppercase text-zinc-500 dark:text-zinc-400">Start from a template</h2>
          <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-2 sm:gap-3">
            {TEMPLATES.map((t) => (
              <Link
                key={t.key}
                to={`/pages/new?template=${t.key}`}
                className={`flex flex-col gap-2.5 p-2.5 rounded-[10px] bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border transition-colors hover:border-primary/50 ${
                  t.key === "BLANK" ? "border-dashed border-zinc-400 dark:border-zinc-600" : "border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <TemplateThumb template={t.key} />
                <span className="flex flex-col gap-0.5 px-0.5 pb-0.5">
                  <span className="text-[13px] font-bold">{t.name}</span>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">{t.blurb}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-[11px] font-bold tracking-[0.08em] uppercase text-zinc-500 dark:text-zinc-400">
            Your pages <span className="text-zinc-400 font-tnum">{pages ? pages.length : ""}</span>
          </h2>
          <div className="seg ml-auto" role="group" aria-label="Filter pages">
            {FILTERS.map(([v, l]) => <button key={v} type="button" aria-pressed={filter === v} onClick={() => setFilter(v)}>{l}</button>)}
          </div>
        </div>

        {failed ? <ErrorState onRetry={load} title="Couldn't load your pages" /> : pages === null ? <ListSkeleton rows={3} /> : shown.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-zinc-300 dark:border-zinc-700 px-6 py-10 text-center">
            <p className="text-sm font-bold text-zinc-900 dark:text-white">{pages.length === 0 ? "No pages yet" : "Nothing here"}</p>
            <p className="mt-1 text-[13px] text-zinc-600 dark:text-zinc-400">
              {pages.length === 0 ? (manage ? "Pick a template above to make your first page." : "Pages your team publishes will show up here.") : "No pages match this filter."}
            </p>
          </div>
        ) : (
          <div className="rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-x-auto">
            <table className="w-full md:min-w-[760px] border-collapse text-[13px]">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-left">
                  <th className={`${th} pl-4`}>Page</th>
                  <th className={`${th} hidden md:table-cell`}>Data</th>
                  <th className={th}>Status</th>
                  <th className={`${th} hidden md:table-cell`}>Who can view</th>
                  <th className={`${th} hidden md:table-cell`}>Updated</th>
                  <th className={`${th} pr-4`}><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {shown.map((page) => (
                  <tr key={page.id} className="last:[&>td]:border-b-0">
                    <td className={`${td} pl-4`}>
                      <Link to={manage ? `/pages/${page.id}` : `/p/${page.token}`} className="flex items-center gap-3 text-zinc-900 dark:text-white hover:text-primary min-w-0">
                        <PageThumb template={page.template} />
                        <span className="flex flex-col gap-0.5 min-w-0">
                          <span className="font-bold truncate max-w-[calc(100vw-13rem)] md:max-w-[340px]">{page.title}</span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                            {templateOf(page.template).name}{page.summary?.tabs > 1 ? ` · ${page.summary.tabs} tabs` : ""}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className={`${td} hidden md:table-cell text-zinc-700 dark:text-zinc-300 whitespace-nowrap font-tnum`}>{dataLine(page)}</td>
                    <td className={td}><StatusPill page={page} /></td>
                    <td className={`${td} hidden md:table-cell text-zinc-700 dark:text-zinc-300 whitespace-nowrap`}>
                      <span className="inline-flex items-center gap-1.5">
                        {page.published && page.visibility === "LINK" ? <><Globe className="w-3.5 h-3.5" />Anyone with the link</> : <><Lock className="w-3.5 h-3.5" />Team only</>}
                      </span>
                    </td>
                    <td className={`${td} hidden md:table-cell text-zinc-600 dark:text-zinc-400 whitespace-nowrap`}>
                      {formatRelative(page.updatedAt)}{page.updatedByName ? ` · ${page.updatedByName.split(" ")[0]}` : ""}
                    </td>
                    <td className={`${td} pr-4 text-right whitespace-nowrap`}>
                      <span className="inline-flex items-center gap-1 relative">
                        {page.published ? (
                          <button type="button" onClick={() => copy(page)} aria-label={`Copy link to ${page.title}`} className="btn btn-sm btn-secondary">
                            {copied === page.id ? <Check className="w-[13px] h-[13px] text-emerald-600" /> : <Link2 className="w-[13px] h-[13px]" />}
                            <span className="hidden sm:inline">{copied === page.id ? "Copied" : "Copy link"}</span>
                          </button>
                        ) : manage ? (
                          <Link to={`/pages/${page.id}`} className="btn btn-sm btn-secondary">Continue</Link>
                        ) : null}
                        <button type="button" onClick={() => setMenuFor(menuFor === page.id ? null : page.id)} className="btn-icon h-7 w-7" aria-haspopup="menu" aria-expanded={menuFor === page.id} aria-label={`More actions for ${page.title}`}>
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {menuFor === page.id && (
                          <>
                            <span className="fixed inset-0 z-30" onClick={closeMenu} aria-hidden="true" />
                            <span role="menu" className="menu-panel absolute right-0 top-8 z-40 w-48 p-1 flex flex-col text-left animate-in fade-in slide-in-from-top-1 duration-150">
                              <a role="menuitem" href={`/p/${page.token}`} target="_blank" rel="noopener noreferrer" onClick={closeMenu} className="flex items-center gap-2 h-8 px-2 rounded-md text-[13px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"><ExternalLink className="w-4 h-4" />Open page</a>
                              <a role="menuitem" href={`/p/${page.token}?print=1`} target="_blank" rel="noopener noreferrer" onClick={closeMenu} className="flex items-center gap-2 h-8 px-2 rounded-md text-[13px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"><FileDown className="w-4 h-4" />Save as PDF</a>
                              {manage && page.published && (
                                <button type="button" role="menuitem" onClick={() => unpublish(page)} className="flex items-center gap-2 h-8 px-2 rounded-md text-[13px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"><EyeOff className="w-4 h-4" />Unpublish</button>
                              )}
                              {manage && (confirmDelete === page.id ? (
                                <span className="p-2 mt-1 rounded-md bg-rose-50 dark:bg-rose-500/10 flex flex-col gap-1.5 whitespace-normal">
                                  <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">Delete this page and its link?</span>
                                  <span className="flex gap-1.5">
                                    <button type="button" onClick={closeMenu} className="btn btn-sm btn-secondary flex-1">Cancel</button>
                                    <button type="button" onClick={() => remove(page)} className="btn btn-sm btn-danger flex-1">Delete</button>
                                  </span>
                                </span>
                              ) : (
                                <button type="button" role="menuitem" onClick={() => setConfirmDelete(page.id)} className="flex items-center gap-2 h-8 px-2 rounded-md text-[13px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"><Trash2 className="w-4 h-4" />Delete page…</button>
                              ))}
                            </span>
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
