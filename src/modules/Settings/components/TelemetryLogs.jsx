/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Terminal } from "lucide-react";
import { staticSysTelemetryLogs } from "../util/settingsUtils";

export function TelemetryLogs() {
  return (
    <div className="p-3 sm:p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-left space-y-2.5 sm:space-y-3 shadow-soft">
      <h3 className="font-display font-semibold text-sm text-white flex items-center gap-2">
        <Terminal className="w-4 h-4 text-primary" />
        Telemetry logs
      </h3>
      <p className="text-xs text-zinc-400 font-medium">Client transaction logging, server hooks, and websocket heartbeat frames.</p>

      <div className="font-mono text-[11px] text-zinc-300 space-y-2 max-h-[220px] overflow-y-auto no-scrollbar">
        {staticSysTelemetryLogs.map((log) => (
          <div key={log.id} className="flex gap-2.5 border-b border-zinc-800/60 pb-2">
            <span className="text-primary shrink-0">[{log.source}]</span>
            <span className="flex-1 text-zinc-300 min-w-0 break-words">{log.event}</span>
            <span className="text-zinc-500 text-[10px] font-tnum shrink-0">{log.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
