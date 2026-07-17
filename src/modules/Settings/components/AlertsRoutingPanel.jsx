/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Radio } from "lucide-react";

function Switch({ checked, onToggle, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!checked}
      aria-label={label}
      onClick={onToggle}
      className="flex items-center justify-center h-10 w-12 -my-2 -mx-1.5 cursor-pointer shrink-0"
    >
      <span className={`relative w-9 h-5 rounded-full transition-colors ${checked ? "bg-primary" : "bg-zinc-300 dark:bg-zinc-600"}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-soft transition-transform ${checked ? "translate-x-4" : ""}`} />
      </span>
    </button>
  );
}

export function AlertsRoutingPanel({ notificationSettings, setNotificationSettings }) {
  const rows = [
    {
      key: "inApp",
      title: "In-app notifications",
      description: "Updates delivered to the sidebar inbox"
    },
    {
      key: "emailMock",
      title: "Email delivery",
      description: "Deliver a daily updates checklist by email"
    },
    {
      key: "weeklySummary",
      title: "Weekly performance digest",
      description: "Summary report sent every Friday"
    }
  ];

  return (
    <div className="card p-3 sm:p-4 text-left space-y-2.5 sm:space-y-4">
      <h3 className="font-display font-semibold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
        <Radio className="w-4 h-4 text-primary" /> Alerts routing
      </h3>

      <div className="space-y-2 sm:space-y-2.5">
        {rows.map((row) => (
          <div key={row.key} className="flex justify-between items-center gap-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 px-3 py-2.5 sm:py-3 rounded-lg">
            <div className="min-w-0">
              <span className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200">{row.title}</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{row.description}</span>
            </div>
            <Switch
              checked={notificationSettings?.[row.key]}
              label={row.title}
              onToggle={() => setNotificationSettings(prev => ({ ...prev, [row.key]: !prev[row.key] }))}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
