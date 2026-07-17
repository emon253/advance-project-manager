/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const teamApi = {
  sendInvitationEmail: async (email, name, role) => {
    return { success: true, email, name, role, sentAt: new Date().toISOString() };
  }
};
