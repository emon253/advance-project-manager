/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function filterActiveAutomationRules(rules) {
  return rules.filter((r) => r.active);
}

export const staticSysTelemetryLogs = [
  { id: "log-1", source: "AUTOMATION", event: "Task state changed to 'In Review' on commit hook code", time: "12 mins ago" },
  { id: "log-2", source: "METRICS_ENGINE", event: "Project velocity calculation recalculated. Done index: 65%", time: "35 mins ago" },
  { id: "log-3", source: "AUTHENTICATOR", event: "Workspace authorization signature refreshed", time: "2 hours ago" },
  { id: "log-4", source: "CHRONOS_SERVICE", event: "Chronos timecard saved for u1 on task t1", time: "4 hours ago" }
];
