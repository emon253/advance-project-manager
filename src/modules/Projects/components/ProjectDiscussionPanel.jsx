/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { useAppState } from "../../../app/providers";
import { UserAvatar } from "../../../components/common/UserAvatar";
import { AIEnhanceButton } from "../../../components/common/AIEnhanceButton";
import { formatDateTime } from "../../Tasks/util/tasksUtils";

/**
 * Project-level "Comments and activity" thread (Trello card modal inspired):
 * newest first, avatar + name + timestamp per entry. Separate from a task's
 * own "Reviews & Threads" comments — this one is scoped to the project as a
 * whole, for discussion that doesn't belong to any single task.
 */
export function ProjectDiscussionPanel({ projectId }) {
  const { projectComments, loadProjectComments, addProjectComment, currentUser, can } = useAppState();
  const [input, setInput] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (projectId) loadProjectComments(projectId);
  }, [projectId, loadProjectComments]);

  const comments = projectComments[projectId] || [];
  const newestFirst = [...comments].reverse();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || posting) return;
    setPosting(true);
    const ok = await addProjectComment(projectId, input);
    setPosting(false);
    if (ok) setInput("");
  };

  return (
    <div className="card p-3 sm:p-4">
      <p className="text-[10px] sm:text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
        <MessageSquare className="w-3.5 h-3.5" />
        Comments and activity
      </p>

      {can("editTasks") && (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-3">
          <UserAvatar user={currentUser} size="xs" />
          <input
            type="text"
            placeholder="Write a comment…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="New project comment"
            disabled={posting}
            className="field flex-1"
          />
          <AIEnhanceButton value={input} onEnhance={setInput} type="comment" />
          <button
            type="submit"
            disabled={posting || !input.trim()}
            className="btn btn-primary btn-sm shrink-0"
            aria-label="Post comment"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      )}

      <div className="space-y-3 max-h-[420px] overflow-y-auto no-scrollbar pr-1">
        {newestFirst.length === 0 ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 py-6 text-center">
            No stakeholders have left comments on this project yet.
          </p>
        ) : (
          newestFirst.map((comment) => (
            <div key={comment.id} className="flex gap-2.5 text-xs">
              <UserAvatar user={comment.author} size="xs" />
              <div className="flex-1 min-w-0 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                    {comment.author?.name || "Deleted user"}
                  </span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium shrink-0">
                    {formatDateTime(comment.timestamp)}
                  </span>
                </div>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium whitespace-pre-wrap">
                  {comment.text}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
