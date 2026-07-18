/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthPages } from "../modules/Auth/pages/AuthPages";
import { InvitePage } from "../modules/Auth/pages/InvitePage";
import { VerifyEmailPage } from "../modules/Auth/pages/VerifyEmailPage";
import { OnboardingPage } from "../modules/Auth/pages/OnboardingPage";
import { VerifyEmailBanner } from "../components/common/VerifyEmailBanner";
import { LogoTile } from "../components/common/Logo";
import { DashboardPage } from "../modules/Dashboard/pages/DashboardPage";
import { TasksPage } from "../modules/Tasks/pages/TasksPage";
import { ProjectsPage } from "../modules/Projects/pages/ProjectsPage";
import { ProjectDetailsPage } from "../modules/Projects/pages/ProjectDetailsPage";
import { InboxPage } from "../modules/Notifications/pages/InboxPage";
import { SearchPage } from "../modules/Search/pages/SearchPage";
import { TeamPage } from "../modules/Team/pages/TeamPage";
import { SettingsPage } from "../modules/Settings/pages/SettingsPage";
import { OwnerConsolePage } from "../modules/Owner/pages/OwnerConsolePage";
import { ProfilePage } from "../modules/Profile/pages/ProfilePage";
import { WorkspaceSettingsPage } from "../modules/Workspace/pages/WorkspaceSettingsPage";
import { WorkspacesPage } from "../modules/Workspace/pages/WorkspacesPage";
import { BillingPage } from "../modules/Billing/pages/BillingPage";
import { useAppState } from "./providers";
import { Bell, X } from "lucide-react";

// Layout Imports
import { DesktopSidebar } from "../components/common/DesktopSidebar";
import { MobileBottomNav } from "../components/common/MobileBottomNav";
import { TopBar } from "../components/common/TopBar";
import { TaskDetailsDrawer } from "../modules/Tasks/components/TaskDetailsDrawer";
import { QuickAddTask } from "../components/common/QuickAddTask";
import { AISuggestModal } from "../components/common/AISuggestModal";
import { useIsMobile } from "../hooks/useIsMobile";

// Shell Layout to wrap our main content
function AppLayout({ children }) {
  const { 
    isAuthenticated, 
    bootLoading,
    theme, 
    quickAddTaskOpen, 
    setQuickAddTaskOpen, 
    aiPlannerOpen, 
    setAiPlannerOpen,
    activeToast,
    setActiveToast
  } = useAppState();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Session restore in flight — hold rendering instead of flashing /login.
  if (bootLoading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-3 bg-zinc-50 dark:bg-zinc-950">
        <LogoTile size="h-12 w-12" rounded="rounded-xl" className="bg-primary text-white shadow-soft" />
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Loading your workspace…</p>
      </div>
    );
  }

  // Guard routes
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className={`min-h-screen font-sans antialiased text-zinc-900 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 ${theme === "dark" ? "dark" : ""}`}>
      
      {/* Top Bar Navigation */}
      <TopBar 
        onOpenQuickAdd={() => setQuickAddTaskOpen(true)}
        onOpenAISuggest={() => setAiPlannerOpen(true)}
        onMobileMenuToggle={() => setMobileMenuOpen(true)}
      />

      <div className="flex pt-[calc(3.5rem+env(safe-area-inset-top))] min-h-screen">
        {/* Desktop Sidebar menu */}
        {!isMobile && (
          <DesktopSidebar
            onOpenQuickAdd={() => setQuickAddTaskOpen(true)}
            onOpenAISuggest={() => setAiPlannerOpen(true)}
          />
        )}

        {/* Content canvas container */}
        <main className={`flex-1 min-w-0 overflow-x-hidden flex flex-col ${isMobile ? "pb-nav" : ""}`}>
          <VerifyEmailBanner />
          <div className={`flex-1 min-w-0 w-full ${isMobile ? "px-[max(0.75rem,env(safe-area-inset-left))] pt-3" : "p-5 lg:px-8 lg:py-5"}`}>
            <div className="max-w-[1440px] mx-auto w-full h-full">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobile && mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-[45] bg-zinc-950/50 backdrop-blur-[2px] animate-in fade-in duration-200"
            aria-hidden="true"
          />
          {/* Drawer content container */}
          <div className="fixed inset-y-0 left-0 z-50 w-[80vw] max-w-72 h-full bg-white dark:bg-zinc-950 shadow-elevated pt-[env(safe-area-inset-top)] animate-in slide-in-from-left duration-250" role="dialog" aria-modal="true" aria-label="Navigation menu">
            <DesktopSidebar
              onOpenQuickAdd={() => { setMobileMenuOpen(false); setQuickAddTaskOpen(true); }}
              onOpenAISuggest={() => { setMobileMenuOpen(false); setAiPlannerOpen(true); }}
              isMobileDrawer={true}
              onClose={() => setMobileMenuOpen(false)}
            />
          </div>
        </>
      )}

      {/* Task detail editor side panel overlay */}
      <TaskDetailsDrawer />

      {/* Common modals */}
      <QuickAddTask isOpen={quickAddTaskOpen} onClose={() => setQuickAddTaskOpen(false)} />
      <AISuggestModal isOpen={aiPlannerOpen} onClose={() => setAiPlannerOpen(false)} />

      {/* Mobile Bottom navbar menu */}
      {isMobile && (
        <MobileBottomNav 
          onOpenQuickAdd={() => setQuickAddTaskOpen(true)}
          onOpenAISuggest={() => setAiPlannerOpen(true)}
        />
      )}

      {/* Real-time Toast alert overlay */}
      {activeToast && (
        <div
          onClick={() => setActiveToast(null)}
          role="status"
          aria-live="polite"
          className={`fixed z-50 p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-elevated flex gap-3 cursor-pointer group animate-in slide-in-from-bottom-4 fade-in duration-250 text-left left-4 right-4 sm:left-auto sm:right-6 sm:w-[340px] ${
            isMobile ? "bottom-[calc(5rem+env(safe-area-inset-bottom))]" : "bottom-6"
          }`}
          id="toast-notification-banner"
        >
          <div className="p-2 bg-primary/8 dark:bg-primary/15 text-primary h-fit rounded-lg shrink-0 mt-0.5">
            <Bell className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-zinc-900 dark:text-white leading-tight">
              {activeToast.title || "Workspace Update"}
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-normal mt-0.5 line-clamp-2">
              {activeToast.message || activeToast.text}
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setActiveToast(null); }}
            className="p-1.5 -m-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 self-start cursor-pointer transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export function AppRoutes() {
  const { isAuthenticated } = useAppState();

  return (
    <Routes>
      {/* Standalone Authentication screens */}
      <Route path="/login" element={!isAuthenticated ? <AuthPages mode="login" /> : <Navigate to="/dashboard" replace />} />
      <Route path="/register" element={!isAuthenticated ? <AuthPages mode="register" /> : <Navigate to="/dashboard" replace />} />
      <Route path="/forgot-password" element={<AuthPages mode="forgot" />} />
      <Route path="/reset-password" element={<AuthPages mode="reset" />} />
      <Route path="/invite/:token" element={<InvitePage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/welcome" element={<OnboardingPage />} />

      {/* Authenticated Application routes */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<AppLayout><DashboardPage /></AppLayout>} />

      {/* Tasks queues views */}
      <Route path="/tasks" element={<Navigate to="/my-tasks" replace />} />
      <Route path="/my-tasks" element={<AppLayout><TasksPage /></AppLayout>} />
      <Route path="/today" element={<AppLayout><TasksPage /></AppLayout>} />
      <Route path="/upcoming" element={<AppLayout><TasksPage /></AppLayout>} />
      <Route path="/completed" element={<AppLayout><TasksPage /></AppLayout>} />

      {/* Projects views */}
      <Route path="/projects" element={<AppLayout><ProjectsPage /></AppLayout>} />
      <Route path="/projects/:projectId" element={<AppLayout><ProjectDetailsPage /></AppLayout>} />

      {/* Extra tools */}
      <Route path="/inbox" element={<AppLayout><InboxPage /></AppLayout>} />
      <Route path="/notifications" element={<Navigate to="/inbox" replace />} />
      <Route path="/search" element={<AppLayout><SearchPage /></AppLayout>} />
      <Route path="/team" element={<AppLayout><TeamPage /></AppLayout>} />

      {/* Personal & admin preferences settings */}
      <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />

      <Route path="/owner" element={<AppLayout><OwnerConsolePage tab="dashboard" /></AppLayout>} />
      <Route path="/owner/users" element={<AppLayout><OwnerConsolePage tab="users" /></AppLayout>} />
      <Route path="/owner/plans" element={<AppLayout><OwnerConsolePage tab="plans" /></AppLayout>} />
      <Route path="/owner/subscriptions" element={<AppLayout><OwnerConsolePage tab="subscriptions" /></AppLayout>} />
      <Route path="/owner/audit" element={<AppLayout><OwnerConsolePage tab="audit" /></AppLayout>} />
      <Route path="/profile" element={<AppLayout><ProfilePage /></AppLayout>} />
      <Route path="/workspace/settings" element={<Navigate to="/workspace-settings" replace />} />
      <Route path="/workspace-settings" element={<AppLayout><WorkspaceSettingsPage /></AppLayout>} />
      <Route path="/workspaces" element={<AppLayout><WorkspacesPage /></AppLayout>} />
      <Route path="/billing" element={<AppLayout><BillingPage /></AppLayout>} />

      {/* Fallback routes */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
