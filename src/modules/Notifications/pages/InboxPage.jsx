/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PushToggle } from "../components/PushToggle";
import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCheck, Trash2, Search, X, Settings } from "lucide-react";
import { useAppState } from "../../../app/providers";
import { useMockQuery } from "../../../hooks/useMockQuery";
import { ListSkeleton } from "../../../components/common/Skeleton";
import { ErrorState } from "../../../components/common/ErrorState";
import { NotificationItem } from "../components/NotificationItem";
import { NotificationEmptyState } from "../components/NotificationEmptyState";
import { ChipSelect } from "../../Tasks/components/TaskToolbar";
import { parseNotifications } from "../util/notificationUtils";

const TYPES = [
  ["assigned", "Assigned"], ["mention", "Mentions"], ["comment", "Comments"], ["status_changed", "Status changes"],
  ["file_attached", "Files"], ["due_soon", "Due soon"], ["overdue", "Overdue"], ["milestone_rescheduled", "Rescheduled"],
  ["project_update", "Project updates"], ["reminder", "Reminders"],
];

/**
 * Inbox: every row opens what it's about — the task panel for task
 * notifications, the project page otherwise. Preferences live in Settings.
 */
export function InboxPage() {
  const { notifications, setNotificationRead, markAllNotificationsRead, clearReadNotifications, deleteNotification, projects, setActiveTaskId } = useAppState();
  const { isLoading, isError, retry } = useMockQuery();
  const navigate = useNavigate();
  const [tab, setTab] = useState("all");
  const [type, setType] = useState("");
  const [query, setQuery] = useState("");

  const items = useMemo(() => parseNotifications(notifications).filter((n) => {
    if (tab === "unread" && n.read) return false;
    if (type && !(n.type === type || (type === "project_update" && n.type === "update") || (type === "file_attached" && n.type === "file"))) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return n.title?.toLowerCase().includes(q) || n.message?.toLowerCase().includes(q);
    }
    return true;
  }), [notifications, tab, type, query]);

  const unread = notifications.filter((n) => !n.read).length;

  const open = (n) => {
    if (!n.read) setNotificationRead(n.id, true);
    if (n.taskId) setActiveTaskId(n.taskId, { commentId: n.commentId });
    else if (n.projectId) navigate(`/projects/${n.projectId}`);
  };

  return (
    <div className="text-left" id="inbox-root">
      <div className="flex items-center gap-3 mb-3">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-sub font-tnum">{unread > 0 ? `${unread} unread` : "All caught up"}</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          {unread > 0 && <button type="button" onClick={markAllNotificationsRead} className="btn btn-sm btn-secondary"><CheckCheck className="w-3.5 h-3.5" /><span className="hidden sm:inline">Mark all read</span></button>}
          {notifications.some((n) => n.read) && <button type="button" onClick={clearReadNotifications} className="btn btn-sm btn-secondary"><Trash2 className="w-3.5 h-3.5" /><span className="hidden sm:inline">Clear read</span></button>}
          <Link to="/settings/notifications" className="btn-icon" aria-label="Notification settings" title="Notification settings"><Settings className="w-4 h-4" /></Link>
        </div>
      </div>

      <PushToggle promptOnly />

      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        <div className="seg" role="group" aria-label="Filter">
          <button type="button" aria-pressed={tab === "all"} onClick={() => setTab("all")}>All <span className="text-zinc-400 font-tnum">{notifications.length}</span></button>
          <button type="button" aria-pressed={tab === "unread"} onClick={() => setTab("unread")}>Unread <span className="text-zinc-400 font-tnum">{unread}</span></button>
        </div>
        <ChipSelect label="Type" value={type} onChange={setType} options={TYPES.map(([v, l]) => ({ value: v, label: l }))} allLabel="All types" />
        <div className="relative ml-auto w-full sm:w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
          <input type="text" placeholder="Search inbox" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search notifications" className="field h-7 pl-8 pr-7 text-xs" />
          {query && <button type="button" onClick={() => setQuery("")} className="absolute right-1 top-1/2 -translate-y-1/2 btn-icon h-5 w-5" aria-label="Clear search"><X className="w-3 h-3" /></button>}
        </div>
      </div>

      {isLoading ? <ListSkeleton rows={6} /> : isError ? <ErrorState onRetry={retry} title="Couldn't load your inbox" /> : items.length === 0 ? (
        <NotificationEmptyState searchQuery={query} setSearchQuery={setQuery} setSelectedType={() => setType("")} activeTab={tab} />
      ) : (
        <div className="card overflow-hidden">
          {items.map((n) => (
            <NotificationItem
              key={n.id}
              item={n}
              relatedProject={projects.find((p) => p.id === n.projectId)}
              onOpen={() => open(n)}
              onToggleRead={() => setNotificationRead(n.id, !n.read)}
              onDelete={() => deleteNotification(n.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
