/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  Briefcase,
  Home,
  FlaskConical,
  BarChart3,
  Smartphone,
  Settings,
  Globe,
  Lightbulb,
  Rocket,
  Folder,
  CarFront,
  Palette,
  FileText,
  Wrench,
  Target,
  TrendingUp,
} from "lucide-react";

/**
 * Emoji strings are kept as *stored keys* in workspace/project data for
 * backwards compatibility, but the UI always renders them as monochrome
 * Lucide icons. Icons inherit `currentColor` — set the tone on the parent
 * (e.g. `text-zinc-600 dark:text-zinc-300`).
 */
const EMOJI_ICON_MAP = [
  { key: "💼", match: ["💼", "briefcase", "work"], Icon: Briefcase, label: "Briefcase" },
  { key: "🚀", match: ["🚀", "release", "Release", "deployment", "rocket"], Icon: Rocket, label: "Rocket" },
  { key: "💡", match: ["💡", "idea", "Idea"], Icon: Lightbulb, label: "Idea" },
  { key: "🏎️", match: ["🏎", "racer", "Racer", "car"], Icon: CarFront, label: "Automotive" },
  { key: "🏡", match: ["🏡", "home", "Home", "personal", "Personal"], Icon: Home, label: "Home" },
  { key: "🧪", match: ["🧪", "r&d", "rnd", "R&D", "Beaker", "lab"], Icon: FlaskConical, label: "Lab" },
  { key: "📊", match: ["📊", "matrix", "Matrix", "chart", "analytics"], Icon: BarChart3, label: "Analytics" },
  { key: "🎨", match: ["🎨", "design", "Design", "creative"], Icon: Palette, label: "Design" },
  { key: "📱", match: ["📱", "tech", "Tech", "mobile", "Mobile"], Icon: Smartphone, label: "Mobile" },
  { key: "⚙️", match: ["⚙", "service", "Service", "settings", "gear"], Icon: Settings, label: "Engineering" },
  { key: "🌐", match: ["🕸", "🌐", "web", "Web", "network", "globe"], Icon: Globe, label: "Web" },
  { key: "📝", match: ["📝", "docs", "notes"], Icon: FileText, label: "Docs" },
  { key: "🔧", match: ["🔧", "tools", "maintenance"], Icon: Wrench, label: "Tooling" },
  { key: "🎯", match: ["🎯", "goal", "target"], Icon: Target, label: "Goals" },
  { key: "📈", match: ["📈", "growth", "finance"], Icon: TrendingUp, label: "Growth" },
];

/**
 * Curated options for icon pickers: store `key` in data, render `Icon` in UI.
 */
export const ICON_OPTIONS = EMOJI_ICON_MAP.map(({ key, Icon, label }) => ({ key, Icon, label }));

/**
 * Resolve a stored icon identifier (emoji or keyword) to a monochrome
 * Lucide component. Falls back to a folder icon.
 */
export function getIconComponent(iconStr, className = "w-4 h-4") {
  const s = String(iconStr || "").trim();
  const entry = EMOJI_ICON_MAP.find((e) => e.match.some((m) => s.includes(m)));
  const Icon = entry ? entry.Icon : Folder;
  return <Icon className={className} />;
}
