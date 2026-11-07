/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppState } from "../../app/providers";
import { Sun, CheckSquare, Folder, Inbox, Plus } from "lucide-react";

/** 64px bottom nav: Today · Tasks · Projects · Inbox, with a 52px FAB. */
export function MobileBottomNav({ onOpenQuickAdd }) {
  const { notifications, can } = useAppState();
  const location = useLocation();
  const unread = notifications.filter((n) => !n.read).length;

  const tabs = [
    { label: "Today", icon: Sun, path: "/today" },
    { label: "Tasks", icon: CheckSquare, path: "/my-tasks", match: ["/my-tasks", "/t/"] },
    { label: "Projects", icon: Folder, path: "/projects", match: ["/projects"] },
    { label: "Inbox", icon: Inbox, path: "/inbox", badge: unread },
  ];

  return (
    <>
      {can("editTasks") && (
        <button
          type="button"
          onClick={onOpenQuickAdd}
          aria-label="Add task"
          className="lg:hidden fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 w-[52px] h-[52px] rounded-2xl bg-primary hover:bg-primary-hover active:scale-95 text-white shadow-lg shadow-primary/30 flex items-center justify-center transition-all cursor-pointer"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 pb-safe"
        aria-label="Primary"
      >
        <div className="flex items-stretch h-16 px-2">
          {tabs.map((tab) => {
            const active = tab.match
              ? tab.match.some((m) => location.pathname.startsWith(m))
              : location.pathname === tab.path;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col flex-1 items-center justify-center gap-0.5 ${
                  active ? "text-primary" : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                <span className="relative">
                  <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2.4 : 1.9} />
                  {tab.badge > 0 && (
                    <span className="absolute -top-1 -right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-zinc-950" />
                  )}
                </span>
                <span className="text-[11px] font-semibold">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
