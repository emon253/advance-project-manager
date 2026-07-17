/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const notificationApi = {
  // Simple module APIs
  fetchInboxLogs: async () => {
    // Return mock promise containing initial data wrapper
    return { success: true, timestamp: new Date().toISOString() };
  }
};
