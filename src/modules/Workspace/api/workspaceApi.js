/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const workspaceApi = {
  createWorkspaceServerSync: async (w) => {
    return { success: true, workspace: w };
  }
};
