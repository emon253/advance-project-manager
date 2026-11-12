/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";

const SIZES = {
  "2xs": "h-[18px] w-[18px] text-[8px]",
  xs: "h-6 w-6 text-[9px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

/** Avatar image with an initials fallback — also when the stored picture 404s. */
export function UserAvatar({ user, size = "md", showRing = false, showPresence = false }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [user?.avatarUrl]);
  if (!user) return null;
  const initials = user.avatar || user.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
  const ring = showRing ? "ring-2 ring-primary/30" : "";

  return (
    <span className="relative inline-block shrink-0 select-none align-middle">
      {user.avatarUrl && !broken ? (
        <img
          src={user.avatarUrl}
          alt={user.name || "User avatar"}
          title={user.name}
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
          className={`block rounded-full object-cover ${SIZES[size]} ${ring}`}
        />
      ) : (
        <span
          className={`flex items-center justify-center font-bold rounded-full ${SIZES[size]} ${user.color || "bg-primary text-white"} ${ring}`}
          title={user.name}
        >
          {initials}
        </span>
      )}
      {showPresence && (
        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-950" />
      )}
    </span>
  );
}
