/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Bell, ToggleRight, ToggleLeft, Settings } from "lucide-react";

function PreferenceRow({ title, description, enabled, onToggle }) {
  return (
    <div className="flex justify-between items-center w-full px-0.5 py-2.5 sm:p-3 sm:rounded-lg sm:border sm:border-zinc-100 sm:dark:border-zinc-800 sm:bg-zinc-50 sm:dark:bg-zinc-800/50">
      <div className="min-w-0 pr-2">
        <span className="block font-semibold text-sm text-zinc-800 dark:text-zinc-200 truncate">{title}</span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400 block mt-0.5 leading-normal">{description}</span>
      </div>
      <button
        onClick={onToggle}
        className="cursor-pointer shrink-0 p-1.5 -m-1 rounded-lg"
        role="switch"
        aria-checked={enabled}
        aria-label={`Toggle ${title}`}
      >
        {enabled ? (
          <ToggleRight className="w-7 h-7 text-primary" />
        ) : (
          <ToggleLeft className="w-7 h-7 text-zinc-300 dark:text-zinc-600" />
        )}
      </button>
    </div>
  );
}

export function NotificationSettingsPanel({ notificationSettings, handleTogglePreference }) {
  const [browserPermission, setBrowserPermission] = React.useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );

  // Enabling browser push asks the browser for permission on the same click
  // (permission prompts must ride a user gesture). Denied stays toggleable —
  // the preference is server-side — but we surface that alerts are blocked.
  const handleToggleBrowserPush = async () => {
    const enabling = !notificationSettings.pushMock;
    if (enabling && typeof Notification !== "undefined" && Notification.permission === "default") {
      const result = await Notification.requestPermission();
      setBrowserPermission(result);
    }
    handleTogglePreference("pushMock");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-4 animate-in fade-in duration-200" id="inbox-settings-panel">
      {/* Box 1: Alert delivery channels */}
      <div className="card p-3 sm:p-5 text-left space-y-3 sm:space-y-4">
        <div>
          <h3 className="font-display font-semibold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            Delivery Channels
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Choose where workspace notifications are delivered.
          </p>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800 sm:divide-y-0 sm:space-y-2.5 pt-1">
          <PreferenceRow
            title="In-app inbox"
            description="Keep alerts in the workspace inbox feed"
            enabled={notificationSettings.inApp}
            onToggle={() => handleTogglePreference("inApp")}
          />
          <PreferenceRow
            title="Browser push"
            description={
              browserPermission === "denied"
                ? "Blocked in your browser settings — allow notifications for this site to receive them"
                : "Desktop alerts when Junction is in the background"
            }
            enabled={notificationSettings.pushMock}
            onToggle={handleToggleBrowserPush}
          />
          <PreferenceRow
            title="Email copies"
            description="Send a notification digest to your profile email"
            enabled={notificationSettings.emailMock}
            onToggle={() => handleTogglePreference("emailMock")}
          />
        </div>
      </div>

      {/* Box 2: Trigger rules */}
      <div className="card p-3 sm:p-5 text-left space-y-3 sm:space-y-4">
        <div>
          <h3 className="font-display font-semibold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            Trigger Preferences
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Configure when team notifications are sent.
          </p>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800 sm:divide-y-0 sm:space-y-2.5 pt-1">
          <PreferenceRow
            title="Daily summary digest"
            description="Receive a morning recap of remaining tasks"
            enabled={notificationSettings.dailySummary}
            onToggle={() => handleTogglePreference("dailySummary")}
          />
          <PreferenceRow
            title="Weekly metrics report"
            description="Team metrics report sent Friday afternoons"
            enabled={notificationSettings.weeklySummary}
            onToggle={() => handleTogglePreference("weeklySummary")}
          />
          <PreferenceRow
            title="Overdue warnings"
            description="Warn when tasks approach deadlines or SLA limits"
            enabled={notificationSettings.dueReminders}
            onToggle={() => handleTogglePreference("dueReminders")}
          />
          <PreferenceRow
            title="Mentions & assignments"
            description="Notify immediately when teammates assign or update tasks"
            enabled={notificationSettings.mentions}
            onToggle={() => handleTogglePreference("mentions")}
          />
        </div>
      </div>
    </div>
  );
}
