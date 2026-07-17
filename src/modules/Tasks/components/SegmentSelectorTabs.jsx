/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export function SegmentSelectorTabs({ activeSegment, setActiveSegment, quickFilter }) {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: "mine", label: "Assigned To Me" },
    { id: "today", label: "Schedules Today" },
    { id: "upcoming", label: "Future Horizons" },
    { id: "completed", label: "Archived & Done" }
  ];

  return (
    <div
      role="tablist"
      className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto no-scrollbar snap-x -mx-3 px-3 md:mx-0 md:px-0 shrink-0 select-none"
    >
      {tabs.map((tab) => {
        const isActive = activeSegment === tab.id && !quickFilter;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => {
              setActiveSegment(tab.id);
              if (quickFilter) {
                navigate(location.pathname, { replace: true });
              }
            }}
            className={`px-3 sm:px-3.5 py-2.5 text-sm font-semibold border-b-2 bg-transparent whitespace-nowrap snap-start transition-colors cursor-pointer ${
              isActive
                ? "text-primary border-primary"
                : "text-zinc-500 dark:text-zinc-400 border-transparent hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
