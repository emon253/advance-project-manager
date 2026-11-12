import React, { useEffect, useState } from "react";
import { disablePush, enablePush, pushStatus } from "../util/push";

const HINT = {
  unsupported: "This browser does not support push notifications",
  install: "On iPhone or iPad, add Carbarn Hub to your Home Screen first",
  blocked: "Blocked for this site in your browser settings",
  on: "This device gets a notification even when Carbarn Hub is closed",
  off: "Get a notification on this device even when Carbarn Hub is closed",
};

/**
 * One row: push notifications on or off for THIS device. `promptOnly` shows
 * it only while push is still off (the nudge on the Notifications page).
 */
export function PushToggle({ promptOnly = false }) {
  const [status, setStatus] = useState(promptOnly ? "on" : "off");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { pushStatus().then(setStatus); }, []);

  const toggle = async () => {
    setBusy(true);
    setError("");
    try {
      if (status === "on") await disablePush(); else await enablePush();
    } catch (e) {
      setError(e?.message || "Could not change push notifications. Try again.");
    }
    setStatus(await pushStatus());
    setBusy(false);
  };

  if (promptOnly && status !== "off" && !error) return null;
  const locked = status === "unsupported" || status === "install" || status === "blocked";
  return (
    <div className={`flex items-center gap-4 py-3 min-h-[60px] ${promptOnly ? "card px-3 mb-2" : "border-t border-zinc-100 dark:border-zinc-800"}`}>
      <span className="flex-1 min-w-0">
        <span id="push-toggle-label" className="block text-[13px] font-semibold">Push notifications on this device</span>
        <span className={`block mt-0.5 text-xs ${error ? "text-rose-600 dark:text-rose-400" : "text-zinc-500 dark:text-zinc-400"}`} role={error ? "alert" : undefined}>{error || HINT[status]}</span>
      </span>
      <button type="button" role="switch" aria-checked={status === "on"} aria-labelledby="push-toggle-label" disabled={busy || locked} onClick={toggle} className="switch disabled:opacity-60 disabled:cursor-not-allowed"><span /></button>
    </div>
  );
}
