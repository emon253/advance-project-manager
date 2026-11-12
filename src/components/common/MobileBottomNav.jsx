/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppState } from "../../app/providers";
import { Sun, CheckSquare, Folder, Inbox, Plus } from "lucide-react";

const TABS = [
  { label: "Today", icon: Sun, path: "/today" },
  { label: "Tasks", icon: CheckSquare, path: "/my-tasks", match: ["/my-tasks", "/t/"] },
  { label: "Projects", icon: Folder, path: "/projects", match: ["/projects"] },
  { label: "Inbox", icon: Inbox, path: "/inbox", badgeKey: "unread" },
];

/**
 * Phone nav: Today · Tasks · [New task] · Projects · Inbox. Frosted bar; the
 * centre action is raised and opens quick add (pre-filled with the current
 * project when on a project page). Active tab gets a tinted pill behind its icon.
 */
export function MobileBottomNav({ onOpenQuickAdd }) {
  const { notifications, can } = useAppState();
  const location = useLocation();
  const unread = notifications.filter((n) => !n.read).length;

  const renderTab = (tab) => {
    const active = tab.match ? tab.match.some((m) => location.pathname.startsWith(m)) : location.pathname === tab.path;
    const Icon = tab.icon;
    const badge = tab.badgeKey === "unread" ? unread : 0;
    return (
      <Link
        key={tab.path}
        to={tab.path}
        aria-current={active ? "page" : undefined}
        aria-label={badge ? `${tab.label}, ${badge} unread` : tab.label}
        className="flex flex-col items-center justify-center gap-1 h-full select-none"
      >
        <span className={`relative flex items-center justify-center h-7 w-12 rounded-full transition-colors duration-200 ${active ? "bg-primary/10 text-primary" : "text-zinc-500 dark:text-zinc-400"}`}>
          <Icon className="w-[21px] h-[21px]" strokeWidth={active ? 2.3 : 1.8} />
          {badge > 0 && (
            <span className="absolute -top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold leading-4 text-center font-tnum ring-2 ring-white dark:ring-zinc-950">
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </span>
        <span className={`text-[10.5px] leading-none font-semibold transition-colors ${active ? "text-primary" : "text-zinc-500 dark:text-zinc-400"}`}>{tab.label}</span>
      </Link>
    );
  };

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 pb-safe bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl backdrop-saturate-150 border-t border-zinc-200 dark:border-zinc-800"
      aria-label="Primary"
    >
      <div className="grid grid-cols-5 items-center h-16 px-1">
        {TABS.slice(0, 2).map(renderTab)}
        <div className="flex justify-center">
          {can("editTasks") && (
            <button
              type="button"
              onClick={onOpenQuickAdd}
              aria-label="New task"
              className="-mt-8 flex h-14 w-14 items-center justify-center rounded-full text-white bg-primary shadow-elevated ring-[5px] ring-zinc-50 dark:ring-zinc-950 active:scale-95 transition-transform cursor-pointer"
            >
              <Plus className="w-6 h-6" strokeWidth={2.6} />
            </button>
          )}
        </div>
        {TABS.slice(2).map(renderTab)}
      </div>
    </nav>
  );
}
