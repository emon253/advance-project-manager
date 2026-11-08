/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

/** Page title + one-line description, same scale as the other pages. No divider: the tabs below draw the line. */
export function PageHeader({ title, description, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 mb-3">
      <div className="min-w-0 flex-1">
        <h1 className="page-title truncate">{title}</h1>
        {description && <p className="page-sub hidden sm:block">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">{children}</div>}
    </div>
  );
}
