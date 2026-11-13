/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthPages, afterLogin } from "../modules/Auth/pages/AuthPages";
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
import { hasFeature } from "./permissions";
import { Bell, FileText, X } from "lucide-react";
import { EmptyState } from "../components/common/EmptyState";
import { useAssistant } from "../modules/Assistant/AssistantContext";
import { AssistantPanel } from "../modules/Assistant/AssistantPanel";

import { DesktopSidebar } from "../components/common/DesktopSidebar";
import { MobileBottomNav } from "../components/common/MobileBottomNav";
import { TopBar } from "../components/common/TopBar";
import { TaskPanel } from "../modules/Tasks/components/TaskPanel";
import { QuickAddTask } from "../components/common/QuickAddTask";
import { PagesListPage } from "../modules/Pages/pages/PagesListPage";
import { NewPagePage } from "../modules/Pages/pages/NewPagePage";
import { PageEditorPage } from "../modules/Pages/pages/PageEditorPage";
import { PublicPageView } from "../modules/Pages/pages/PublicPageView";
import { useIsMobile } from "../hooks/useIsMobile";

/** Opening screen while the workspace loads. */
function BootSplash() {
  return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-8 text-center bg-zinc-50 dark:bg-zinc-950">
        <Wordmark className="text-3xl" />
        <p className="mt-2 text-[13px] font-bold uppercase tracking-[0.3em] text-zinc-400">Hub</p>
        <p className="mt-6 max-w-[280px] text-[15px] leading-relaxed font-medium text-zinc-600 dark:text-zinc-300">Plan, track and deliver every Carbarn project together.</p>
        <span className="mt-8 h-1 w-24 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden" role="progressbar" aria-label="Loading">
          <span className="block h-full w-1/3 rounded-full bg-primary animate-[splash_1.1s_ease-in-out_infinite]" />
        </span>
      </div>
  );
}

/** Signed-in screens that take the whole window (page editor, new page): no sidebar or top bar. */
function FullScreen({ children }) {
  const { isAuthenticated, bootLoading, theme } = useAppState();
  if (bootLoading) return <BootSplash />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <div className={`min-h-dvh font-sans antialiased text-zinc-900 bg-[#f3f6fb] dark:bg-zinc-950 dark:text-zinc-100 ${theme === "dark" ? "dark" : ""}`}>
      {children}
    </div>
  );
}

/**
 * App shell: 48px top bar, 200px sidebar (desktop), bottom nav + FAB (phone).
 * Desktop side panels shrink the page instead of covering it: the assistant
 * (420px) sits at the far right and the task drawer (600px) beside it. With
 * both open the page shrinks for both only on very wide windows; below that
 * the task drawer floats over the page and the assistant stays docked.
 */
function AppLayout({ children }) {
  const {
    isAuthenticated, bootLoading, theme, quickAddTaskOpen, setQuickAddTaskOpen, activeToast, setActiveToast, activeTaskId,
  } = useAppState();
  const assistant = useAssistant();
  const isMobile = useIsMobile();
  const location = useLocation();
  const projectMatch = location.pathname.match(/^\/projects\/(\d+)/);
  const assistantOpen = assistant.available && assistant.open;
  const sidePadding = assistantOpen && activeTaskId ? "lg:pr-[420px] min-[102.5rem]:pr-[1020px]"
    : assistantOpen ? "lg:pr-[420px]"
    : activeTaskId ? "lg:pr-[600px]" : "";

  if (bootLoading) return <BootSplash />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className={`min-h-screen font-sans antialiased text-zinc-900 bg-[#f3f6fb] dark:bg-zinc-950 dark:text-zinc-100 ${theme === "dark" ? "dark" : ""}`}>
      <TopBar onOpenQuickAdd={() => setQuickAddTaskOpen(true)} />

      <div className="flex pt-[calc(3rem+env(safe-area-inset-top))] min-h-screen">
        {!isMobile && <DesktopSidebar />}
        <main className={`flex-1 min-w-0 flex flex-col ${isMobile ? "pb-nav" : ""} ${isMobile ? "" : sidePadding} transition-[padding] duration-200`}>
          <VerifyEmailBanner />
          <div className={`flex-1 min-w-0 w-full ${isMobile ? "px-1 pt-3" : "px-7 py-6 2xl:px-10 mr-3 mb-3 rounded-[20px] bg-[#e9eef6] dark:bg-zinc-900/40"}`}>
            <div className="w-full h-full">{children}</div>
          </div>
        </main>
      </div>

      {/* Before the task drawer: on a phone a task opened from the chat lies on top of it. */}
      {assistantOpen && <AssistantPanel />}
      <TaskPanel />
      <QuickAddTask isOpen={quickAddTaskOpen} onClose={() => setQuickAddTaskOpen(false)} defaultProjectId={projectMatch ? Number(projectMatch[1]) : undefined} />
      {isMobile && !activeTaskId && !assistantOpen && <MobileBottomNav onOpenQuickAdd={() => setQuickAddTaskOpen(true)} />}

      {activeToast && (
        <div
          onClick={() => setActiveToast(null)}
          role="status"
          aria-live="polite"
          className={`fixed z-50 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-elevated flex gap-2.5 cursor-pointer animate-in slide-in-from-bottom-4 fade-in duration-250 text-left left-4 right-4 sm:left-auto sm:right-5 sm:w-[340px] ${assistantOpen ? "lg:right-[440px]" : ""} ${
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

/** Pages can be switched off per account (Owner Console). Share links (/p/:token) are not behind this. */
function PagesGate({ children }) {
  const { currentUser } = useAppState();
  if (!currentUser || hasFeature(currentUser, "PAGES")) return children;
  return (
    <EmptyState
      icon={<FileText className="w-7 h-7" />}
      title="Pages are not available on your account"
      description="Your administrator has switched this feature off for you. Pages shared with you by link still open."
    />
  );
}

/** The full-window Pages screens; with Pages switched off they fall back to the normal shell. */
function PagesFullScreen({ children }) {
  const { currentUser } = useAppState();
  if (currentUser && !hasFeature(currentUser, "PAGES")) return page(<PagesGate />);
  return <FullScreen>{children}</FullScreen>;
}

export function AppRoutes() {
  const { isAuthenticated } = useAppState();
  const location = useLocation();
  // /t/:id renders the task panel over the page it was opened from.
  const background = location.state?.from;

  return (
    <Routes location={background ? { ...location, pathname: background.pathname, search: background.search || "", state: null } : location}>
      <Route path="/login" element={!isAuthenticated ? <AuthPages mode="login" /> : <Navigate to={afterLogin(location.search)} replace />} />
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

      <Route path="/pages" element={page(<PagesGate><PagesListPage /></PagesGate>)} />
      <Route path="/pages/new" element={<PagesFullScreen><NewPagePage /></PagesFullScreen>} />
      <Route path="/pages/:pageId" element={<PagesFullScreen><PageEditorPage /></PagesFullScreen>} />
      <Route path="/pages/:pageId/data" element={<PagesFullScreen><NewPagePage /></PagesFullScreen>} />
      {/* The share link: opens signed out for "anyone with the link" pages */}
      <Route path="/p/:token" element={<PublicPageView />} />

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
