/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const projectApi = {
  fetchProjects: async () => {
    return { success: true, timestamp: new Date().toISOString() };
  }
};
