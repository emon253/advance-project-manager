/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppState } from "../../app/providers";
import { CheckSquare, Folder, Inbox, Plus, Layers } from "lucide-react";

export function MobileBottomNav({ onOpenQuickAdd }) {
  const { notifications, can } = useAppState();
  const location = useLocation();

  const unreadCount = notifications.filter(n => !n.read).length;

  const tabs = [
    { label: "Overview", icon: Layers, path: "/dashboard" },
    { label: "Tasks", icon: CheckSquare, path: "/my-tasks", match: ["/my-tasks", "/tasks", "/today", "/upcoming", "/completed"] },
    { label: "Add", isFab: true, action: onOpenQuickAdd },
    { label: "Projects", icon: Folder, path: "/projects", match: ["/projects"] },
    { label: "Inbox", icon: Inbox, path: "/inbox", badge: unreadCount > 0 ? unreadCount : null },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 pb-safe"
      aria-label="Primary"
    >
      <div className="flex items-stretch justify-around h-16 max-w-md mx-auto px-2">
        {tabs.map((tab) => {
          if (tab.isFab) {
            if (!can("editTasks")) {
              // Viewers can't add tasks — keep the tab layout balanced with an empty spacer
              return <div key={tab.label} className="w-16" aria-hidden="true" />;
            }
            return (
              <div key={tab.label} className="relative flex items-center justify-center w-16">
                <button
                  onClick={tab.action}
                  className="absolute -top-4 flex items-center justify-center w-13 h-13 bg-primary hover:bg-primary-hover active:scale-95 text-white rounded-full shadow-lg shadow-primary/25 transition-all cursor-pointer"
                  aria-label="Add new task"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            );
          }

          const isActive = tab.match
            ? tab.match.some(p => location.pathname.startsWith(p))
            : location.pathname === tab.path;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.path}
              to={tab.path}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col flex-1 items-center justify-center gap-0.5 transition-colors relative ${
                isActive
                  ? "text-primary font-semibold"
                  : "text-zinc-500 dark:text-zinc-400 active:text-zinc-800 dark:active:text-zinc-200"
              }`}
            >
              <div className="relative">
                <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.4 : 2} />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 px-0.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-zinc-950 font-tnum">
                    {tab.badge > 9 ? "9+" : tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium tracking-tight">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
