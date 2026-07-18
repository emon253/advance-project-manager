/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAppState } from "../../../app/providers";
import { useMockQuery } from "../../../hooks/useMockQuery";
import { ListSkeleton } from "../../../components/common/Skeleton";
import { ErrorState } from "../../../components/common/ErrorState";

// Modular imports
import { useNotificationFilters } from "../hooks/useNotificationFilters";
import { InboxHeader } from "../components/InboxHeader";
import { InboxTabs } from "../components/InboxTabs";
import { InboxFilters } from "../components/InboxFilters";
import { NotificationList } from "../components/NotificationList";
import { NotificationDetailsDrawer } from "../components/NotificationDetailsDrawer";
import { NotificationSettingsPanel } from "../components/NotificationSettingsPanel";

import "../style/notifications.css";

const PAGE_SIZE = 8;

export function InboxPage() {
  const {
    notifications,
    setNotificationRead,
    markAllNotificationsRead,
    clearReadNotifications,
    deleteNotification,
    notificationSettings,
    setNotificationSettings,
    projects,
    tasks,
    setActiveTaskId
  } = useAppState();

  const navigate = useNavigate();

  // Custom filters hook
  const {
    activeTab,
    setActiveTab,
    selectedType,
    setSelectedType,
    searchQuery,
    setSearchQuery,
    selectedNotif,
    setSelectedNotif,
    filteredNotifications,
  } = useNotificationFilters(notifications);

  // Simulated fetch lifecycle for the inbox feed (loading / error / retry)
  const { isLoading, isError, retry } = useMockQuery();

  // Pagination over the FILTERED notification list
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Reset pagination whenever the tab or any filter changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeTab, selectedType, searchQuery]);

  const visibleNotifications = filteredNotifications.slice(0, visibleCount);
  const remainingCount = filteredNotifications.length - visibleNotifications.length;

  const handleLoadMore = () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((count) => count + PAGE_SIZE);
      setIsLoadingMore(false);
    }, 400);
  };

  // Action: Mark single read/unread toggle (provider persists via the API)
  const handleToggleRead = (id, forceRead = null) => {
    const current = notifications.find((n) => n.id === id);
    const nextRead = forceRead !== null ? forceRead : !(current?.read);
    setNotificationRead(id, nextRead);
    if (selectedNotif && selectedNotif.id === id) {
      setSelectedNotif((prev) => ({ ...prev, read: nextRead }));
    }
  };

  // Action: Mark single read only
  const handleMarkRead = (id) => {
    const current = notifications.find((n) => n.id === id);
    if (current && !current.read) setNotificationRead(id, true);
    if (selectedNotif && selectedNotif.id === id) {
      setSelectedNotif((prev) => ({ ...prev, read: true }));
    }
  };

  // Action: Mark all read
  const handleMarkAllRead = () => {
    markAllNotificationsRead();
    if (selectedNotif) {
      setSelectedNotif((prev) => ({ ...prev, read: true }));
    }
  };

  // Action: Clear all read notifications
  const handleClearRead = () => {
    clearReadNotifications();
    if (selectedNotif && selectedNotif.read) {
      setSelectedNotif(null);
    }
  };

  // Action: Delete notification
  const handleDeleteNotification = (id) => {
    deleteNotification(id);
    if (selectedNotif && selectedNotif.id === id) {
      setSelectedNotif(null);
    }
  };

  const handleNotificationClick = (item) => {
    handleMarkRead(item.id);
    setSelectedNotif(item);
  };

  const handleTogglePreference = (key) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Helper: Retrieve Task details dynamically
  const getTaskInfo = (taskId) => {
    if (!taskId) return null;
    return tasks.find((t) => t.id === taskId);
  };

  // Helper: Retrieve Project details dynamically
  const getProjectInfo = (projectId) => {
    if (!projectId) return null;
    return projects.find((p) => p.id === projectId);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-2.5 sm:space-y-5 text-left" id="inbox-page-root">
      
      {/* 1. Page Header with compact, balanced bulk actions */}
      <InboxHeader
        activeTab={activeTab}
        notifications={notifications}
        handleMarkAllRead={handleMarkAllRead}
        handleClearRead={handleClearRead}
      />

      {/* 2. Responsive Tabs */}
      <InboxTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalCount={notifications.length}
        unreadCount={unreadCount}
      />

      {activeTab === "preferences" ? (
        /* ======================== PREFERENCES PANEL ======================== */
        <NotificationSettingsPanel
          notificationSettings={notificationSettings}
          handleTogglePreference={handleTogglePreference}
        />
      ) : (
        /* ======================== FEED LIST LAYOUT ======================== */
        <div className="flex flex-col lg:flex-row gap-2.5 sm:gap-5 items-start animate-in fade-in duration-200" id="inbox-alert-body">

          {/* Main List Column */}
          <div className="flex-1 w-full space-y-2.5 sm:space-y-3.5">
            
            {/* 3. Sleek compact filters and search queries */}
            <InboxFilters
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedType={selectedType}
              setSelectedType={setSelectedType}
            />

            {/* Notification items container (loading / error / paginated list) */}
            {isLoading ? (
              <ListSkeleton rows={5} />
            ) : isError ? (
              <ErrorState onRetry={retry} title="Couldn't load your inbox" />
            ) : (
              <>
                <div
                  id="inbox-alert-cards-container"
                  className="sm:bg-white sm:dark:bg-zinc-900 sm:border sm:border-zinc-200/80 sm:dark:border-zinc-800 sm:rounded-xl sm:shadow-soft sm:p-2"
                >
                  <NotificationList
                    notifications={visibleNotifications}
                    selectedNotif={selectedNotif}
                    getTaskInfo={getTaskInfo}
                    getProjectInfo={getProjectInfo}
                    handleNotificationClick={handleNotificationClick}
                    handleToggleRead={handleToggleRead}
                    handleDeleteNotification={handleDeleteNotification}
                    setActiveTaskId={setActiveTaskId}
                    navigate={navigate}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    setSelectedType={setSelectedType}
                    activeTab={activeTab}
                  />
                </div>

                {remainingCount > 0 && (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="btn btn-secondary btn-sm"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Loading…</span>
                        </>
                      ) : (
                        <span>Load more ({remainingCount} remaining)</span>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 4. Elegant responsive Slide drawer detail side panel */}
          <NotificationDetailsDrawer
            selectedNotif={selectedNotif}
            setSelectedNotif={setSelectedNotif}
            getTaskInfo={getTaskInfo}
            getProjectInfo={getProjectInfo}
            setActiveTaskId={setActiveTaskId}
            navigate={navigate}
            handleToggleRead={handleToggleRead}
            handleDeleteNotification={handleDeleteNotification}
          />

        </div>
      )}

    </div>
  );
}
