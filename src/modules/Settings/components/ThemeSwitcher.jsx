/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Palette, Sun, Moon } from "lucide-react";

export function ThemeSwitcher({ theme, setTheme }) {
  const options = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon }
  ];

  return (
    <div className="card p-3 sm:p-4 text-left space-y-2.5 sm:space-y-3">
      <h3 className="font-display font-semibold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
        <Palette className="w-4 h-4 text-primary" />
        <span>Appearance</span>
      </h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Choose a light or dark interface theme.</p>

      {/* Segmented control */}
      <div className="inline-flex bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg" role="group" aria-label="Theme">
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = theme === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setTheme(option.id)}
              aria-pressed={isSelected}
              className={`inline-flex items-center gap-1.5 px-4 h-8 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                isSelected
                  ? "bg-white dark:bg-zinc-900 text-primary shadow-soft"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
