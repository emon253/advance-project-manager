/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Flag, MessageSquare, Paperclip } from "lucide-react";
import { useAppState } from "../../../app/providers";
import { UserAvatar } from "../../../components/common/UserAvatar";
import { dueState, formatDue, statusDot } from "../util/tasksUtils";

/**
 * Board view: one column per status group, compact cards. Same data as the
 * list (the groups), so filters and grouping apply identically.
 */
export function TaskBoard({ groups, showProject = true }) {
  const { activeWorkspaceProjects, users, taskStatuses, setActiveTaskId, updateTask, can } = useAppState();

  const onDrop = (e, statusName) => {
    e.preventDefault();
    const id = Number(e.dataTransfer.getData("text/task-id"));
    if (id && can("editTasks")) updateTask(id, { status: statusName });
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
      {groups.map((group) => (
        <section
          key={group.key}
          className="w-[260px] shrink-0 flex flex-col"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => onDrop(e, group.key)}
        >
          <h2 className="section-label mt-0 mb-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color || statusDot(group.key, taskStatuses) }} />
            {group.label}
            <span className="count">{group.tasks.length}</span>
          </h2>
          <div className="flex flex-col gap-1.5 min-h-[60px] rounded-lg bg-zinc-100/60 dark:bg-zinc-900/60 p-1.5">
            {group.tasks.map((task) => {
              const project = activeWorkspaceProjects.find((p) => p.id === task.projectId);
              const assignee = users.find((u) => u.id === task.assigneeId);
              const due = dueState(task, taskStatuses);
              const hot = task.priority === "Urgent" || task.priority === "High";
              return (
                <div
                  key={task.id}
                  role="button"
                  tabIndex={0}
                  draggable={can("editTasks")}
                  onDragStart={(e) => e.dataTransfer.setData("text/task-id", String(task.id))}
                  onClick={() => setActiveTaskId(task.id)}
                  onKeyDown={(e) => { if (e.key === "Enter") setActiveTaskId(task.id); }}
                  className="card p-2.5 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                >
                  <p className="text-[13px] font-medium text-zinc-900 dark:text-white leading-snug line-clamp-2">{task.title}</p>
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                    {hot && (
                      <span className={`inline-flex items-center gap-0.5 font-bold ${task.priority === "Urgent" ? "text-rose-700 dark:text-rose-400" : "text-amber-700 dark:text-amber-400"}`}>
                        <Flag className="w-3 h-3" />{task.priority}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className={`font-tnum ${due === "late" ? "text-rose-700 dark:text-rose-400 font-bold" : ""}`}>{formatDue(task.dueDate)}</span>
                    )}
                    {(task.commentCount || task.comments?.length) > 0 && (
                      <span className="inline-flex items-center gap-0.5 font-tnum"><MessageSquare className="w-3 h-3" />{task.comments?.length || task.commentCount}</span>
                    )}
                    {(task.attachmentCount || task.attachments?.length) > 0 && (
                      <span className="inline-flex items-center gap-0.5 font-tnum"><Paperclip className="w-3 h-3" />{task.attachments?.length || task.attachmentCount}</span>
                    )}
                    <span className="ml-auto flex items-center gap-1.5">
                      {showProject && project && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} title={project.name} />}
                      {assignee && <UserAvatar user={assignee} size="xs" />}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
