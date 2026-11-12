/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppState } from "../../app/providers";
import { Sun, CheckSquare, Folder, FileText, Settings } from "lucide-react";
import { hasFeature } from "../../app/permissions";

/**
 * 200px sidebar: Today · My Tasks · Projects · Pages · Settings. Inbox is the
 * bell in the top bar; Team and the workspace switcher live in the account menu.
 */
export function DesktopSidebar() {
  const { tasks, taskStatuses, currentUser } = useAppState();
  const location = useLocation();

  const openStatuses = new Set(
    taskStatuses.filter((s) => !s.isCompleted && !s.isCancelled).map((s) => s.name)
  );
  const todayCount = tasks.filter((t) => {
    if (t.assigneeId !== currentUser?.id) return false;
    if (!openStatuses.has(t.status) && taskStatuses.length) return false;
    if (!t.dueDate) return false;
    const end = new Date(); end.setHours(23, 59, 59, 999);
    return new Date(t.dueDate) <= end;
  }).length;

  const items = [
    { label: "Today", icon: Sun, path: "/today", badge: todayCount },
    { label: "My Tasks", icon: CheckSquare, path: "/my-tasks", match: ["/my-tasks", "/t/"] },
    { label: "Projects", icon: Folder, path: "/projects", match: ["/projects"] },
    hasFeature(currentUser, "PAGES") && { label: "Pages", icon: FileText, path: "/pages", match: ["/pages"], tag: "New" },
  ].filter(Boolean);

  const isActive = (item) =>
    location.pathname === item.path || (item.match || []).some((m) => location.pathname.startsWith(m));

  const navLink = (item) => {
    const active = isActive(item);
    const Icon = item.icon;
    return (
      <Link
        key={item.path}
        to={item.path}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-2.5 h-9 px-3 rounded-lg text-[13.5px] transition-colors ${
          active
            ? "bg-primary/10 text-primary font-bold dark:bg-primary/15"
            : "font-medium text-zinc-700 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-white"
        }`}
      >
        <Icon className={`w-4 h-4 shrink-0 ${active ? "text-primary" : "text-zinc-400"}`} />
        <span className="truncate">{item.label}</span>
        {item.tag && (
          <span className="ml-auto inline-flex h-[18px] px-1.5 items-center rounded-full bg-primary text-[10px] font-bold text-white">{item.tag}</span>
        )}
        {item.badge > 0 && (
          <span className="ml-auto inline-flex h-[18px] min-w-[18px] px-1 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white font-tnum">
            {item.badge > 99 ? "99+" : item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside className="w-[200px] shrink-0 h-[calc(100vh-3rem-env(safe-area-inset-top))] sticky top-[calc(3rem+env(safe-area-inset-top))] border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col">
      <nav className="flex-1 overflow-y-auto no-scrollbar px-2 py-3 flex flex-col gap-0.5" aria-label="Primary">
        {items.map(navLink)}
        <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-2 mx-1.5" />
        {navLink({ label: "Settings", icon: Settings, path: "/settings", match: ["/settings"] })}
      </nav>
    </aside>
  );
}
