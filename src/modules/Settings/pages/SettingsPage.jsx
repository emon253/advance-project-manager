/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useAppState } from "../../../app/providers";
import { PageHeader } from "../../../components/common/PageHeader";

// Modular Imports
import { DatabaseRestorePanel } from "../components/DatabaseRestorePanel";
import { StatusSettingsPanel } from "../components/StatusSettingsPanel";

import "../style/settings.css";

export function SettingsPage() {
  const {
    resetToDefaultData
  } = useAppState();

  const [systemAlertMessage, setSystemAlertMessage] = useState("");

  return (
    <div className="text-left max-w-4xl" id="settings-page-root">
      <PageHeader
        title="Administrative Settings"
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

        {/* Demo Data Rehydration card */}
        <DatabaseRestorePanel
          resetToDefaultData={resetToDefaultData}
          setSystemAlertMessage={setSystemAlertMessage}
        />
      </div>

    </div>
  );
}
