/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const searchApi = {
  logSearchQuery: async (q) => {
    return { logged: true, query: q };
  }
};
