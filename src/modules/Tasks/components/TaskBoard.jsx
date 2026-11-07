/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Flag, MessageSquare, Paperclip, Plus, ChevronRight, GripVertical } from "lucide-react";
import { useAppState } from "../../../app/providers";
import { UserAvatar } from "../../../components/common/UserAvatar";
import { dueState, formatDue, statusDot } from "../util/tasksUtils";

/**
 * Kanban: one column per status group. Cards animate between columns (motion
 * `layout`), the dragged card lifts, the column under the pointer highlights,
 * drops are optimistic, and each open column has an inline add-task row.
 * Done/cancelled columns start collapsed to a narrow rail.
 */
export function TaskBoard({ groups, showProject = true, onAddTask }) {
  const { activeWorkspaceProjects, users, taskStatuses, setActiveTaskId, updateTask, can } = useAppState();
  const [dragging, setDragging] = useState(null); // task id
  const [over, setOver] = useState(null); // column key
  const [expanded, setExpanded] = useState({});
  const [adding, setAdding] = useState(null); // column key
  const [draft, setDraft] = useState("");
  const editable = can("editTasks");

  const onDrop = (e, statusName) => {
    e.preventDefault();
    const id = Number(e.dataTransfer.getData("text/task-id"));
    setOver(null); setDragging(null);
    if (!id || !editable) return;
    const task = groups.flatMap((g) => g.tasks).find((t) => t.id === id);
    if (task && task.status !== statusName) updateTask(id, { status: statusName });
  };

  const submitAdd = async (e, statusName) => {
    e.preventDefault();
    if (!draft.trim()) return;
    await onAddTask(draft.trim(), statusName);
    setDraft("");
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1 snap-x" style={{ minHeight: "calc(100vh - 320px)" }}>
      {groups.map((group) => {
        const collapsible = group.kind !== "open";
        const open = expanded[group.key] ?? !collapsible;
        const isOver = over === group.key && dragging != null;
        if (!open) {
          return (
            <button
              key={group.key}
              type="button"
              onClick={() => setExpanded((x) => ({ ...x, [group.key]: true }))}
              onDragOver={(e) => { e.preventDefault(); setOver(group.key); }}
              onDragLeave={() => setOver(null)}
              onDrop={(e) => onDrop(e, group.key)}
              className={`shrink-0 w-10 rounded-lg border border-dashed flex flex-col items-center gap-2 py-3 cursor-pointer transition-colors ${isOver ? "border-primary bg-primary/5" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"}`}
              aria-label={`Expand ${group.label}`}
              title={`${group.label} · ${group.tasks.length}`}
            >
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusDot(group.key, taskStatuses) }} />
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 [writing-mode:vertical-rl] rotate-180">{group.label} · {group.tasks.length}</span>
            </button>
          );
        }
        return (
          <section
            key={group.key}
            className={`flex-1 min-w-[260px] max-w-[340px] shrink-0 snap-start flex flex-col rounded-lg transition-colors ${isOver ? "bg-primary/[0.06] ring-1 ring-primary/40" : "bg-zinc-100/70 dark:bg-zinc-900/60"}`}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (over !== group.key) setOver(group.key); }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOver(null); }}
            onDrop={(e) => onDrop(e, group.key)}
          >
            <header className="sticky top-0 z-10 flex items-center gap-2 h-9 px-3 rounded-t-lg bg-inherit">
              {collapsible && (
                <button type="button" onClick={() => setExpanded((x) => ({ ...x, [group.key]: false }))} className="btn-icon h-5 w-5 -ml-1" aria-label={`Collapse ${group.label}`}>
                  <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                </button>
              )}
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color || statusDot(group.key, taskStatuses) }} />
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">{group.label}</span>
              <span className="text-[11px] font-semibold text-zinc-400 font-tnum">{group.tasks.length}</span>
              {editable && onAddTask && group.kind === "open" && (
                <button type="button" onClick={() => { setAdding(group.key); setDraft(""); }} className="btn-icon h-6 w-6 ml-auto" aria-label={`Add task to ${group.label}`}>
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </header>

            <div className="flex flex-col gap-1.5 px-1.5 pb-1.5 flex-1 min-h-[80px]">
              <AnimatePresence initial={false}>
                {group.tasks.map((task) => {
                  const project = activeWorkspaceProjects.find((p) => p.id === task.projectId);
                  const assignee = users.find((u) => u.id === task.assigneeId);
                  const due = dueState(task, taskStatuses);
                  const hot = task.priority === "Urgent" || task.priority === "High";
                  const comments = task.comments?.length || task.commentCount || 0;
                  const files = task.attachments?.length || task.attachmentCount || 0;
                  const isDragging = dragging === task.id;
                  return (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: isDragging ? 0.35 : 1, y: 0, scale: isDragging ? 0.98 : 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.6 }}
                      role="button"
                      tabIndex={0}
                      draggable={editable}
                      onDragStart={(e) => { e.dataTransfer.setData("text/task-id", String(task.id)); e.dataTransfer.effectAllowed = "move"; setDragging(task.id); }}
                      onDragEnd={() => { setDragging(null); setOver(null); }}
                      onClick={() => setActiveTaskId(task.id)}
                      onKeyDown={(e) => { if (e.key === "Enter") setActiveTaskId(task.id); }}
                      className={`group/card relative bg-white dark:bg-zinc-800 rounded-md border border-zinc-200/80 dark:border-zinc-700 shadow-soft p-2.5 pl-3 cursor-grab active:cursor-grabbing hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-elevated transition-[box-shadow,border-color] ${group.kind === "done" ? "opacity-75" : ""}`}
                    >
                      {editable && <GripVertical className="absolute left-0.5 top-2.5 w-3.5 h-3.5 text-zinc-300 opacity-0 group-hover/card:opacity-100 transition-opacity" />}
                      <p className={`text-[13px] font-medium leading-snug line-clamp-3 ${group.kind === "done" ? "line-through text-zinc-500" : "text-zinc-900 dark:text-white"}`}>{task.title}</p>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 min-h-[24px]">
                        {hot && (
                          <span className={`inline-flex items-center gap-0.5 font-bold ${task.priority === "Urgent" ? "text-rose-700 dark:text-rose-400" : "text-amber-700 dark:text-amber-400"}`}>
                            <Flag className="w-3 h-3" />{task.priority}
                          </span>
                        )}
                        {task.dueDate && <span className={`font-tnum ${due === "late" ? "text-rose-700 dark:text-rose-400 font-bold" : due === "today" ? "font-semibold text-zinc-800 dark:text-zinc-100" : ""}`}>{formatDue(task.dueDate)}</span>}
                        {comments > 0 && <span className="inline-flex items-center gap-0.5 font-tnum"><MessageSquare className="w-3 h-3" />{comments}</span>}
                        {files > 0 && <span className="inline-flex items-center gap-0.5 font-tnum"><Paperclip className="w-3 h-3" />{files}</span>}
                        <span className="ml-auto flex items-center gap-1.5">
                          {showProject && project && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} title={project.name} />}
                          {assignee ? <span className="inline-flex items-center gap-1.5" title={assignee.name}><span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 truncate max-w-[64px]">{assignee.name.split(" ")[0]}</span><UserAvatar user={assignee} size="xs" /></span> : <span className="h-6 w-6 rounded-full border border-dashed border-zinc-300 dark:border-zinc-600" />}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {adding === group.key ? (
                <form onSubmit={(e) => submitAdd(e, group.key)} className="bg-white dark:bg-zinc-800 rounded-md border border-primary p-2 shadow-soft">
                  <textarea
                    autoFocus
                    rows={2}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitAdd(e, group.key); }
                      if (e.key === "Escape") { setAdding(null); setDraft(""); }
                    }}
                    placeholder="Task title… Enter to add"
                    aria-label={`New task in ${group.label}`}
                    className="w-full text-[13px] font-medium bg-transparent outline-none resize-none placeholder:text-zinc-400"
                  />
                  <div className="flex items-center gap-1.5 mt-1">
                    <button type="submit" disabled={!draft.trim()} className="btn btn-sm btn-primary">Add</button>
                    <button type="button" onClick={() => { setAdding(null); setDraft(""); }} className="btn btn-sm btn-ghost">Cancel</button>
                  </div>
                </form>
              ) : (
                editable && onAddTask && group.kind === "open" && (
                  <button type="button" onClick={() => { setAdding(group.key); setDraft(""); }} className="flex items-center gap-1.5 h-8 px-2 rounded-md text-xs font-semibold text-zinc-500 hover:text-zinc-800 hover:bg-white/70 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-100 transition-colors cursor-pointer">
                    <Plus className="w-3.5 h-3.5" /> Add task
                  </button>
                )
              )}
              {group.tasks.length === 0 && !adding && (
                <p className="text-[11px] text-zinc-400 text-center py-4">{isOver ? "Drop here" : "Empty"}</p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
