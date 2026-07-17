/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function calculateResourceWorkloadRating(taskCount) {
  if (taskCount > 3) return "Critically Overloaded";
  if (taskCount > 1) return "Nominal Load";
  return "Eligible for Assignments";
}
