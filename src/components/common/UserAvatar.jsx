/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

export function UserAvatar({ user, size = "md", showRing = false, showPresence = false }) {
  if (!user) return null;
  const initials = user.avatar || user.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";

  const sizeClasses = {
    xs: "h-6 w-6 text-[9px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-lg",
  };

  return (
    <div className="relative shrink-0 select-none">
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.name || "User avatar"}
          title={user.name}
          referrerPolicy="no-referrer"
          className={`rounded-full object-cover ${sizeClasses[size]} ${showRing ? "ring-2 ring-primary/30" : ""}`}
        />
      ) : (
      <div
        className={`flex items-center justify-center font-display font-semibold rounded-full ${sizeClasses[size]} ${user.color || "bg-primary text-white"} ${showRing ? "ring-2 ring-primary/30" : ""}`}
        title={user.name}
      >
        {initials}
      </div>
      )}

      {showPresence && (
        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-950" />
      )}
    </div>
  );
}
