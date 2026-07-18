/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAppState } from "../../app/providers";
import { LogoTile } from "./Logo";
import {
  Search,
  Sun,
  Moon,
  Bot,
  ArrowLeft,
  Menu,
  Inbox
} from "lucide-react";
import { UserAvatar } from "./UserAvatar";

export function TopBar({ onOpenQuickAdd, onOpenAISuggest, onMobileMenuToggle }) {
  const { theme, setTheme, currentUser, notifications } = useAppState();

  const navigate = useNavigate();
  const location = useLocation();
  const [searchValue, setSearchValue] = useState("");
  const searchRef = useRef(null);

  const isDark = theme === "dark";
  const unreadCount = notifications.filter(n => !n.read).length;

  // "/" focuses the global search from anywhere
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  // Mobile detail subpages get a back affordance instead of the menu button
  const showBackButton = location.pathname.startsWith("/projects/") && location.pathname !== "/projects";

  return (
    <header className="fixed top-0 left-0 right-0 z-30 pt-[env(safe-area-inset-top)] border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md">
      <div className="h-14 flex items-center justify-between gap-2 px-3 sm:px-4">
        {/* Left: menu / back + brand */}
        <div className="flex items-center gap-1.5 min-w-0">
          {showBackButton ? (
            <button
              onClick={() => navigate(-1)}
              className="btn-icon lg:hidden"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onMobileMenuToggle}
              className="btn-icon lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link to="/dashboard" className="flex items-center gap-2 min-w-0 rounded-lg">
            <LogoTile size="h-7 w-7" rounded="rounded-lg" className="bg-primary text-white" markClassName="w-[60%] h-[60%]" />
            <span className="font-display font-extrabold text-sm tracking-wider text-zinc-900 dark:text-white uppercase truncate">
              Junction
            </span>
          </Link>
        </div>

        {/* Center: global search (desktop) */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-4 relative" role="search">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
          <input
            ref={searchRef}
            type="search"
            placeholder="Search tasks, projects, people…"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full h-9 text-sm bg-zinc-100 dark:bg-zinc-900 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 focus:bg-white dark:focus:bg-zinc-950 focus:border-primary text-zinc-800 dark:text-zinc-100 rounded-lg pl-9 pr-10 outline-none transition-colors placeholder:text-zinc-400 font-medium"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center h-5 px-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[10px] font-mono text-zinc-400 pointer-events-none">
            /
          </kbd>
        </form>

        {/* Right: quick actions */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* Mobile search entry */}
          <Link to="/search" className="btn-icon md:hidden" aria-label="Search">
            <Search className="w-[18px] h-[18px]" />
          </Link>

          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="btn-icon"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Light mode" : "Dark mode"}
          >
            {isDark ? <Sun className="w-[18px] h-[18px] text-amber-400" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>

          <button
            onClick={onOpenAISuggest}
            className="btn-icon text-primary hover:bg-primary/10 hover:text-primary"
            aria-label="AI task planner"
            title="AI Task Planner"
          >
            <Bot className="w-[18px] h-[18px]" />
          </button>

          <Link
            to="/inbox"
            className="btn-icon relative hidden md:inline-flex"
            aria-label={unreadCount > 0 ? `Inbox, ${unreadCount} unread` : "Inbox"}
            title="Inbox"
          >
            <Inbox className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-4 px-0.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white ring-2 ring-white dark:ring-zinc-950 font-tnum">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          <Link to="/profile" className="md:hidden ml-1 rounded-full" aria-label="My profile">
            <UserAvatar user={currentUser} size="xs" />
          </Link>
        </div>
      </div>
    </header>
  );
}
