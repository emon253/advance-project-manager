/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { PageHeader } from "../../../components/common/PageHeader";
import { Plus } from "lucide-react";

export function ProjectHeader({ showAddForm, setShowAddForm }) {
  return (
    <PageHeader
      title="Corporate Projects Portfolio"
      description="Launch, archive, or audit active projects and key milestones across your workspace."
    >
      <button
        onClick={() => setShowAddForm(!showAddForm)}
        type="button"
        className="btn btn-primary"
      >
        <Plus className="w-4 h-4" />
        <span>New Project</span>
      </button>
    </PageHeader>
  );
}
