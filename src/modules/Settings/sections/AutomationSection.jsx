/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useAppState } from "../../../app/providers";
import { UpgradeModal } from "../../../components/common/UpgradeModal";

/** Automation rules (Pro-gated server-side). */
export function AutomationSection() {
  const { automationRules, toggleAutomationRule, ensureAutomationRules } = useAppState();
  const [showUpgrade, setShowUpgrade] = useState(false);
  React.useEffect(() => { ensureAutomationRules(); }, [ensureAutomationRules]);

  const toggle = async (rule) => {
    const res = await toggleAutomationRule(rule.id, !rule.active);
    if (res?.error === "plan") setShowUpgrade(true);
  };

  return (
    <div className="card p-3">
      <h2 className="text-[15px] font-bold text-zinc-900 dark:text-white">Automation</h2>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 mb-2">Rules that run when tasks change. Available on Pro and Business.</p>
      {automationRules.length === 0 ? <p className="text-xs text-zinc-400">No rules available.</p> : automationRules.map((rule) => (
        <div key={rule.id} className="flex items-center gap-4 py-3 min-h-[60px] border-t border-zinc-100 dark:border-zinc-800 first:border-t-0">
          <span className="flex-1 min-w-0">
            <span className="block text-[13px] font-semibold truncate">{rule.trigger}</span>
            <span className="block mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{rule.action}</span>
          </span>
          <button type="button" role="switch" aria-checked={!!rule.active} aria-label={`Toggle ${rule.trigger}`} onClick={() => toggle(rule)} className="switch"><span /></button>
        </div>
      ))}
      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} title="Automation is a Pro feature" limitText="Automation rules run on the Pro and Business plans." />
    </div>
  );
}
