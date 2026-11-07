/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthPages } from "../modules/Auth/pages/AuthPages";
import { InvitePage } from "../modules/Auth/pages/InvitePage";
import { VerifyEmailPage } from "../modules/Auth/pages/VerifyEmailPage";
import { OnboardingPage } from "../modules/Auth/pages/OnboardingPage";
import { VerifyEmailBanner } from "../components/common/VerifyEmailBanner";
import { Wordmark } from "../components/common/Logo";
import { TodayPage } from "../modules/Tasks/pages/TodayPage";
import { TasksPage } from "../modules/Tasks/pages/TasksPage";
import { ProjectsPage } from "../modules/Projects/pages/ProjectsPage";
import { ProjectDetailsPage } from "../modules/Projects/pages/ProjectDetailsPage";
import { InboxPage } from "../modules/Notifications/pages/InboxPage";
import { SearchPage } from "../modules/Search/pages/SearchPage";
import { TeamPage } from "../modules/Team/pages/TeamPage";
import { SettingsPage } from "../modules/Settings/pages/SettingsPage";
import { OwnerConsolePage } from "../modules/Owner/pages/OwnerConsolePage";
import { useAppState } from "./providers";
import { Bell, X } from "lucide-react";

import { DesktopSidebar } from "../components/common/DesktopSidebar";
import { MobileBottomNav } from "../components/common/MobileBottomNav";
import { TopBar } from "../components/common/TopBar";
import { TaskPanel } from "../modules/Tasks/components/TaskPanel";
import { QuickAddTask } from "../components/common/QuickAddTask";
import { useIsMobile } from "../hooks/useIsMobile";

/** App shell: 48px top bar, 220px sidebar (desktop), bottom nav + FAB (phone). */
function AppLayout({ children }) {
  const {
    isAuthenticated, bootLoading, theme, quickAddTaskOpen, setQuickAddTaskOpen, activeToast, setActiveToast, activeTaskId,
  } = useAppState();
  const isMobile = useIsMobile();
  const location = useLocation();
  const projectMatch = location.pathname.match(/^\/projects\/(\d+)/);

  if (bootLoading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-3 bg-zinc-50 dark:bg-zinc-950">
        <Wordmark className="text-2xl" />
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Loading your workspace…</p>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className={`min-h-screen font-sans antialiased text-zinc-900 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 ${theme === "dark" ? "dark" : ""}`}>
      <TopBar onOpenQuickAdd={() => setQuickAddTaskOpen(true)} />

      <div className="flex pt-[calc(3rem+env(safe-area-inset-top))] min-h-screen">
        {!isMobile && <DesktopSidebar />}
        <main className={`flex-1 min-w-0 flex flex-col ${isMobile ? "pb-nav" : ""} ${!isMobile && activeTaskId ? "lg:pr-[520px]" : ""} transition-[padding] duration-200`}>
          <VerifyEmailBanner />
          <div className={`flex-1 min-w-0 w-full ${isMobile ? "px-4 pt-3.5" : "px-7 py-5"}`}>
            <div className="max-w-[1140px] w-full h-full">{children}</div>
          </div>
        </main>
      </div>

      <TaskPanel />
      <QuickAddTask isOpen={quickAddTaskOpen} onClose={() => setQuickAddTaskOpen(false)} defaultProjectId={projectMatch ? Number(projectMatch[1]) : undefined} />
      {isMobile && !activeTaskId && <MobileBottomNav onOpenQuickAdd={() => setQuickAddTaskOpen(true)} />}

      {activeToast && (
        <div
          onClick={() => setActiveToast(null)}
          role="status"
          aria-live="polite"
          className={`fixed z-50 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-elevated flex gap-2.5 cursor-pointer animate-in slide-in-from-bottom-4 fade-in duration-250 text-left left-4 right-4 sm:left-auto sm:right-5 sm:w-[340px] ${
            isMobile ? "bottom-[calc(5rem+env(safe-area-inset-bottom))]" : "bottom-5"
          }`}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/8 dark:bg-primary/15 text-primary shrink-0">
            <Bell className="w-3.5 h-3.5" />
          </span>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-[13px] text-zinc-900 dark:text-white leading-tight">{activeToast.title || "Workspace update"}</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-snug mt-0.5 line-clamp-2">{activeToast.message || activeToast.text}</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setActiveToast(null); }} className="btn-icon h-6 w-6 -m-1" aria-label="Dismiss notification">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

const page = (el) => <AppLayout>{el}</AppLayout>;

export function AppRoutes() {
  const { isAuthenticated } = useAppState();
  const location = useLocation();
  // /t/:id renders the task panel over the page it was opened from.
  const background = location.state?.from;

  return (
    <Routes location={background ? { ...location, pathname: background.pathname, search: background.search || "", state: null } : location}>
      <Route path="/login" element={!isAuthenticated ? <AuthPages mode="login" /> : <Navigate to="/today" replace />} />
      <Route path="/register" element={!isAuthenticated ? <AuthPages mode="register" /> : <Navigate to="/today" replace />} />
      <Route path="/forgot-password" element={<AuthPages mode="forgot" />} />
      <Route path="/reset-password" element={<AuthPages mode="reset" />} />
      <Route path="/invite/:token" element={<InvitePage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/welcome" element={<OnboardingPage />} />

      <Route path="/" element={<Navigate to="/today" replace />} />
      <Route path="/dashboard" element={<Navigate to="/today" replace />} />
      <Route path="/today" element={page(<TodayPage />)} />
      <Route path="/my-tasks" element={page(<TasksPage />)} />
      <Route path="/tasks" element={<Navigate to="/my-tasks" replace />} />
      <Route path="/upcoming" element={<Navigate to="/my-tasks?due=week" replace />} />
      <Route path="/completed" element={<Navigate to="/my-tasks?done=1" replace />} />
      {/* Direct link to a task: My Tasks behind, panel on top */}
      <Route path="/t/:taskId" element={page(<TasksPage />)} />

      <Route path="/projects" element={page(<ProjectsPage />)} />
      <Route path="/projects/:projectId" element={page(<ProjectDetailsPage />)} />
      <Route path="/projects/:projectId/:tab" element={page(<ProjectDetailsPage />)} />

      <Route path="/inbox" element={page(<InboxPage />)} />
      <Route path="/notifications" element={<Navigate to="/inbox" replace />} />
      <Route path="/search" element={page(<SearchPage />)} />
      <Route path="/team" element={page(<TeamPage />)} />

      <Route path="/settings" element={page(<SettingsPage />)} />
      <Route path="/settings/:section" element={page(<SettingsPage />)} />
      <Route path="/profile" element={<Navigate to="/settings/profile" replace />} />
      <Route path="/billing" element={<Navigate to="/settings/billing" replace />} />
      <Route path="/workspace-settings" element={<Navigate to="/settings/general" replace />} />
      <Route path="/workspace/settings" element={<Navigate to="/settings/general" replace />} />
      <Route path="/workspaces" element={<Navigate to="/settings/general" replace />} />

      <Route path="/owner" element={page(<OwnerConsolePage tab="dashboard" />)} />
      <Route path="/owner/users" element={page(<OwnerConsolePage tab="users" />)} />
      <Route path="/owner/plans" element={page(<OwnerConsolePage tab="plans" />)} />
      <Route path="/owner/subscriptions" element={page(<OwnerConsolePage tab="subscriptions" />)} />
      <Route path="/owner/audit" element={page(<OwnerConsolePage tab="audit" />)} />

      <Route path="*" element={<Navigate to="/today" replace />} />
    </Routes>
  );
}
