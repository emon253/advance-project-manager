/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Role-based permission matrix — the single source of truth for what each
 * workspace role may do. Mirror this server-side when the backend is built.
 *
 * Role hierarchy: Owner > Admin > Manager > Member > Viewer
 */
export const ROLES = ["Owner", "Admin", "Manager", "Member", "Viewer"];

export const PERMISSIONS = {
  // Billing
  manageBilling: ["Owner", "Admin"],
  // Workspace administration
  manageWorkspace: ["Owner", "Admin"],       // edit name/logo/description
  archiveWorkspace: ["Owner", "Admin"],
  deleteWorkspace: ["Owner"],
  transferOwnership: ["Owner"],
  // Members
  manageMembers: ["Owner", "Admin"],         // invite, remove, change roles
  // Projects
  manageProjects: ["Owner", "Admin", "Manager"], // create/edit/archive/delete projects
  // Tasks & day-to-day work
  editTasks: ["Owner", "Admin", "Manager", "Member"], // create/edit/complete tasks, comment, upload
};

/** True if `role` is allowed to perform `permission`. Unknown roles get Viewer rights. */
export function hasPermission(role, permission) {
  const allowed = PERMISSIONS[permission];
  if (!allowed) return false;
  return allowed.includes(role);
}

/** Resolve the current user's role inside a workspace. */
export function resolveRole(workspace, userId) {
  if (!workspace || !userId) return "Viewer";
  if (workspace.ownerId === userId) return "Owner";
  const member = workspace.members?.find((m) => m.id === userId);
  return member?.role || "Viewer";
}
