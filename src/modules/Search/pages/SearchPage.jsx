/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useDeferredValue, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SearchX, ArrowUpDown } from "lucide-react";
import { useAppState } from "../../../app/providers";
import { TaskRow } from "../../Tasks/components/TaskRow";
import { EmptyState } from "../../../components/common/EmptyState";
import { ChipSelect } from "../../Tasks/components/TaskToolbar";
import { filterTasksBySearch, sortSearchedTasks } from "../util/searchUtils";

/** Workspace search: the same task rows as everywhere else. */
export function SearchPage() {
  const { activeWorkspaceTasks, activeWorkspaceProjects, users } = useAppState();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const [term, setTerm] = useState(q);
  const [sort, setSort] = useState("dueDate");
  useEffect(() => setTerm(q), [q]);

  const liveTerm = useDeferredValue(term.trim());
  const results = useMemo(() => sortSearchedTasks(filterTasksBySearch(activeWorkspaceTasks, liveTerm), sort), [activeWorkspaceTasks, liveTerm, sort]);

  return (
    <div className="text-left" id="search-root">
      <h1 className="page-title mb-3">Search</h1>
      <form onSubmit={(e) => { e.preventDefault(); setParams(term.trim() ? { q: term.trim() } : {}); }} className="flex gap-2 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input type="search" autoFocus value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search tasks by title or description" aria-label="Search" className="field pl-8" />
        </div>
        <button type="submit" className="btn btn-primary">Search</button>
      </form>
      {q && (
        <div className="flex items-center gap-2 mb-1">
          <ChipSelect label="Sort" icon={ArrowUpDown} clearable={false} align="right" value={sort} onChange={(v) => setSort(v || "dueDate")} options={[{ value: "dueDate", label: "Due date" }, { value: "priority", label: "Priority" }, { value: "title", label: "Title" }]} allLabel="Due date" />
          <span className="ml-auto text-xs text-zinc-500 font-tnum">{results.length} {results.length === 1 ? "match" : "matches"}</span>
        </div>
      )}
      {!q ? (
        <EmptyState icon={<Search className="w-6 h-6" />} title="Search your workspace" description="Find tasks by title or description." />
      ) : results.length === 0 ? (
        <EmptyState icon={<SearchX className="w-6 h-6" />} title="No matches" description="Try a shorter or different keyword." />
      ) : (
        <div className="card overflow-hidden">
          {results.map((t) => (
            <TaskRow key={t.id} task={t} project={activeWorkspaceProjects.find((p) => p.id === t.projectId)} assignee={users.find((u) => u.id === t.assigneeId)} />
          ))}
        </div>
      )}
    </div>
  );
}
