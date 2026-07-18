/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { PageHeader } from "../../../components/common/PageHeader";
import { useAppState } from "../../../app/providers";
import { Plus } from "lucide-react";

export function ProjectHeader({ showAddForm, setShowAddForm }) {
  const { can } = useAppState();

  return (
    <PageHeader
      title="Corporate Projects Portfolio"
      description="Launch, archive, or audit active projects and key milestones across your workspace."
    >
      {can("manageProjects") && (
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          type="button"
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      )}
    </PageHeader>
  );
}
