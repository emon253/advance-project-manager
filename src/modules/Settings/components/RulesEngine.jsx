/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Layers } from "lucide-react";

export function RulesEngine({ automationRules, handleToggleRule }) {
  return (
    <div className="card p-3 sm:p-4 text-left space-y-2.5 sm:space-y-4">
      <h3 className="font-display font-semibold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
        <Layers className="w-4 h-4 text-primary" />
        Automation rules
      </h3>
      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
        Define automated action rules. Trigger conditions automatically update subtasks or notifications.
      </p>

      <div className="space-y-2 sm:space-y-2.5">
        {automationRules.map((rule) => (
          <div key={rule.id} className="flex items-center justify-between gap-3 px-3 py-2.5 sm:py-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg border border-zinc-100 dark:border-zinc-800">
            <div className="min-w-0">
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 block">{rule.trigger}</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5 block">{rule.action}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[11px] font-semibold hidden sm:block ${rule.active ? "text-primary" : "text-zinc-400 dark:text-zinc-500"}`}>
                {rule.active ? "Active" : "Inactive"}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={!!rule.active}
                aria-label={`Toggle rule: ${rule.trigger}`}
                onClick={() => handleToggleRule(rule.id)}
                className="flex items-center justify-center h-10 w-12 -my-2 -mx-1.5 cursor-pointer shrink-0"
              >
                <span className={`relative w-9 h-5 rounded-full transition-colors ${rule.active ? "bg-primary" : "bg-zinc-300 dark:bg-zinc-600"}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-soft transition-transform ${rule.active ? "translate-x-4" : ""}`} />
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
