/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const settingsApi = {
  persistRuleChange: async (id, active) => {
    return { success: true, ruleId: id, activeStatus: active };
  }
};
