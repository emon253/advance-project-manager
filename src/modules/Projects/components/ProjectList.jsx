/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Archive } from "lucide-react";
import { EmptyState } from "../../../components/common/EmptyState";
import { ProjectCard } from "./ProjectCard";

export function ProjectList({ displayedProjects, tasks }) {
  if (displayedProjects.length === 0) {
    return (
      <EmptyState
        icon={<Archive className="w-7 h-7" />}
        title="No projects match this filter"
        description="Nothing here yet. Create a new project to start tracking tasks and milestones."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-4">
      {displayedProjects.map((project) => {
        const projectTasks = tasks.filter((t) => t.projectId === project.id);
        return (
          <ProjectCard
            key={project.id}
            project={project}
            projectTasks={projectTasks}
          />
        );
      })}
    </div>
  );
}
