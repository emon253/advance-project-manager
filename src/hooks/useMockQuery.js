/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useAppState } from "../app/providers";

/**
 * Async lifecycle for list surfaces. Formerly a simulation; now reflects the
 * REAL workspace-data fetch from the provider, keeping the same
 * `{ isLoading, isError, retry }` contract the pages were built against.
 * The Settings "Simulate network errors" toggle still forces the error state
 * so failure UI stays demonstrable.
 */
export function useMockQuery() {
  const { dataLoading, dataError, simulateErrors, refreshWorkspaceData } = useAppState();

  return {
    isLoading: dataLoading,
    isError: dataError || simulateErrors,
    retry: refreshWorkspaceData,
  };
}
