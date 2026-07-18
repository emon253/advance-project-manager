/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { FlaskConical } from "lucide-react";
import { useAppState } from "../../../app/providers";
import { PageHeader } from "../../../components/common/PageHeader";

// Modular Imports
import { DatabaseRestorePanel } from "../components/DatabaseRestorePanel";
import { StatusSettingsPanel } from "../components/StatusSettingsPanel";
import { RulesEngine } from "../components/RulesEngine";
import { UpgradeModal } from "../../../components/common/UpgradeModal";

import "../style/settings.css";

export function SettingsPage() {
  const {
    resetToDefaultData,
    simulateErrors,
    setSimulateErrors,
    automationRules,
    toggleAutomationRule
  } = useAppState();

  const [systemAlertMessage, setSystemAlertMessage] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);

  const handleToggleRule = async (ruleId) => {
    const rule = automationRules.find((r) => r.id === ruleId);
    if (!rule) return;
    const res = await toggleAutomationRule(ruleId, !rule.active);
    if (res?.error === "plan") setShowUpgrade(true);
  };

  return (
    <div className="text-left max-w-4xl" id="settings-page-root">
      <PageHeader
        title="Settings"
        description="Configure task workflows, state parameters, or restore the default demo database."
      />

      <div className="space-y-2.5 sm:space-y-5">
        {systemAlertMessage && (
          <div className="p-3 bg-primary/8 dark:bg-primary/15 border border-primary/20 text-primary text-xs font-semibold rounded-xl animate-in fade-in slide-in-from-top-1" role="status">
            {systemAlertMessage}
          </div>
        )}

        {/* Task workflow status configuration controller */}
        <StatusSettingsPanel />

        {/* Automation rules (Pro feature — activation is plan-gated server-side) */}
        <RulesEngine automationRules={automationRules} handleToggleRule={handleToggleRule} />

        {/* Demo Data Rehydration card */}
        <DatabaseRestorePanel
          resetToDefaultData={resetToDefaultData}
          setSystemAlertMessage={setSystemAlertMessage}
        />

        {/* Developer demo toggles */}
        <div className="card p-3 sm:p-4 text-left space-y-2.5 sm:space-y-4">
          <h3 className="font-display font-semibold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-primary" /> Developer demo
          </h3>

          <div className="flex justify-between items-center gap-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 px-3 py-2.5 sm:py-3 rounded-lg">
            <div className="min-w-0">
              <span className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200">Simulate network errors</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Show the error/retry states that real API failures will trigger.</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!!simulateErrors}
              aria-label="Simulate network errors"
              onClick={() => setSimulateErrors((prev) => !prev)}
              className="flex items-center justify-center h-10 w-12 -my-2 -mx-1.5 cursor-pointer shrink-0"
            >
              <span className={`relative w-9 h-5 rounded-full transition-colors ${simulateErrors ? "bg-primary" : "bg-zinc-300 dark:bg-zinc-600"}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-soft transition-transform ${simulateErrors ? "translate-x-4" : ""}`} />
              </span>
            </button>
          </div>
        </div>
      </div>

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        title="Automation is a Pro feature"
        limitText="Automation rules run on the Pro and Business plans."
      />
    </div>
  );
}
