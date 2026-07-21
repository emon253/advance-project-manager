/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

export function AppCard({ children, className = "", onClick, hover = false }) {
  return (
    <div
      onClick={onClick}
      className={`card p-3 sm:p-4 transition-colors duration-200 ${
        hover ? "hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
