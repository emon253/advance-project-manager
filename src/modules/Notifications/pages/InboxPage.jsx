/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../../../app/providers";

// Modular imports
import { useNotificationFilters } from "../hooks/useNotificationFilters";
import { InboxHeader } from "../components/InboxHeader";
import { InboxTabs } from "../components/InboxTabs";
import { InboxFilters } from "../components/InboxFilters";
import { NotificationList } from "../components/NotificationList";
import { NotificationDetailsDrawer } from "../components/NotificationDetailsDrawer";
import { NotificationSettingsPanel } from "../components/NotificationSettingsPanel";

import "../style/notifications.css";

export function InboxPage() {
  const {
    notifications,
    setNotifications,
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

  // Action: Mark single read/unread toggle
  const handleToggleRead = (id, forceRead = null) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: forceRead !== null ? forceRead : !n.read } : n))
    );
    if (selectedNotif && selectedNotif.id === id) {
      setSelectedNotif((prev) => ({
        ...prev,
        read: forceRead !== null ? forceRead : !prev.read
      }));
    }
  };

  // Action: Mark single read only
  const handleMarkRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    if (selectedNotif && selectedNotif.id === id) {
      setSelectedNotif((prev) => ({ ...prev, read: true }));
    }
  };

  // Action: Mark all read
  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (selectedNotif) {
      setSelectedNotif((prev) => ({ ...prev, read: true }));
    }
  };

  // Action: Clear all read notifications
  const handleClearRead = () => {
    setNotifications((prev) => prev.filter((n) => !n.read));
    if (selectedNotif && selectedNotif.read) {
      setSelectedNotif(null);
    }
  };

  // Action: Delete notification
  const handleDeleteNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
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

            {/* Notification items container */}
            <div
              id="inbox-alert-cards-container"
              className="sm:bg-white sm:dark:bg-zinc-900 sm:border sm:border-zinc-200/80 sm:dark:border-zinc-800 sm:rounded-xl sm:shadow-soft sm:p-2"
            >
              <NotificationList
                notifications={filteredNotifications}
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
