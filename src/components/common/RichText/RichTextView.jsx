/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { sanitizeHtml, isRichTextEmpty } from "./sanitizeHtml";
import { RICHTEXT_CONTENT_CLASS } from "./RichTextEditor";

/**
 * Renders stored rich-text HTML for reading. The markup is always re-sanitized
 * here — never trust data on render — and styled to match the editor so a
 * description looks identical whether you're writing or reading it.
 */
export function RichTextView({ html, className = "", emptyText = "No description yet." }) {
  const clean = useMemo(() => sanitizeHtml(html), [html]);

  if (isRichTextEmpty(clean)) {
    return <p className={"text-sm text-zinc-400 dark:text-zinc-500 italic " + className}>{emptyText}</p>;
  }

  return (
    <div
      className={"text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed " + RICHTEXT_CONTENT_CLASS + " " + className}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
