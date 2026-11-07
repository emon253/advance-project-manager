/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useAppState } from "../../../app/providers";

const ROWS = [
  { group: "Delivery", items: [
    ["inApp", "In-app inbox", "Keep alerts in the inbox"],
    ["pushMock", "Browser push", "Desktop alerts when Carbarn is in the background"],
    ["emailMock", "Email copies", "Send a digest to your email"],
  ] },
  { group: "What to send", items: [
    ["mentions", "Mentions & assignments", "When someone mentions you or assigns you a task"],
    ["projectUpdates", "Comments & status changes", "Comments and status changes on tasks you watch"],
    ["dueReminders", "Due reminders", "Overdue and due-soon warnings"],
    ["dailySummary", "Daily summary", "A morning recap of what's open"],
    ["weeklySummary", "Weekly report", "Team summary every Friday"],
  ] },
];

/** Notification preferences, one toggle per row. */
export function NotificationsSection() {
  const { notificationSettings, setNotificationSettings } = useAppState();
  const [permission, setPermission] = React.useState(typeof Notification !== "undefined" ? Notification.permission : "unsupported");

  const toggle = async (key) => {
    if (key === "pushMock" && !notificationSettings.pushMock && typeof Notification !== "undefined" && Notification.permission === "default") {
      setPermission(await Notification.requestPermission());
    }
    setNotificationSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      {ROWS.map((g) => (
        <div key={g.group} className="card p-3">
          <h2 className="text-[15px] font-bold text-zinc-900 dark:text-white mb-1">{g.group}</h2>
          {g.items.map(([key, title, desc]) => (
            <div key={key} className="flex items-center gap-3 h-12 border-t border-zinc-100 dark:border-zinc-800 first:border-t-0">
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-semibold">{title}</span>
                <span className="block text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{key === "pushMock" && permission === "denied" ? "Blocked in your browser settings" : desc}</span>
              </span>
              <button type="button" role="switch" aria-checked={!!notificationSettings?.[key]} aria-label={title} onClick={() => toggle(key)} className="switch"><span /></button>
            </div>
          ))}
        </div>
      ))}
    </>
  );
}
