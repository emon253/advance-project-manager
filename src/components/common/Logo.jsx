/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

/**
 * Junction brand mark: three routes meeting at a central node — a junction.
 * Monochrome and stroke-based (inherits `currentColor`), so it renders white
 * on a primary tile, primary on a light tile, and stays crisp from 20px
 * (favicon) up to hero sizes. Keep this in sync with the favicon in
 * index.html and the inline SVG in the backend MailTemplates.
 */
export function JunctionMark({ className = "w-full h-full" }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <line x1="16" y1="16" x2="16" y2="6.5" />
      <line x1="16" y1="16" x2="7.8" y2="21.7" />
      <line x1="16" y1="16" x2="24.2" y2="21.7" />
      <circle cx="16" cy="16" r="3.4" fill="currentColor" stroke="none" />
      <circle cx="16" cy="6.5" r="2.2" fill="currentColor" stroke="none" />
      <circle cx="7.8" cy="21.7" r="2.2" fill="currentColor" stroke="none" />
      <circle cx="24.2" cy="21.7" r="2.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * The brand mark on its rounded primary tile. `size` is a Tailwind size pair
 * for the tile; the mark sits at 58% of it. Kept for compact icon contexts
 * (favicon parity, PWA); the in-app logo is the {@link Wordmark}.
 */
export function LogoTile({
  size = "h-9 w-9",
  rounded = "rounded-xl",
  className = "bg-primary text-white shadow-soft",
  markClassName = "w-[58%] h-[58%]",
}) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center ${size} ${rounded} ${className}`}>
      <JunctionMark className={markClassName} />
    </span>
  );
}

/**
 * Junction wordmark — the primary logo. Plus Jakarta Sans ExtraBold, tight
 * tracking, with the leading "J" in the brand primary and the rest in the
 * foreground tone. Pass `inverted` on a primary/dark background (e.g. the auth
 * brand panel), where the whole word goes white so the "J" doesn't disappear.
 * Size is controlled by the caller via `className` (font-size).
 */
export function Wordmark({ className = "text-xl", inverted = false }) {
  const base = `font-display font-extrabold tracking-[-0.022em] leading-none select-none whitespace-nowrap ${className}`;
  if (inverted) {
    return <span className={`${base} text-white`}>Junction</span>;
  }
  return (
    <span className={base}>
      <span className="text-primary">J</span>
      <span className="text-zinc-900 dark:text-white">unction</span>
    </span>
  );
}
