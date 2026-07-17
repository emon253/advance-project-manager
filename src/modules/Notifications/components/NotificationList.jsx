/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { NotificationItem } from "./NotificationItem";
import { NotificationEmptyState } from "./NotificationEmptyState";

export function NotificationList({
  notifications,
  selectedNotif,
  getTaskInfo,
  getProjectInfo,
  handleNotificationClick,
  handleToggleRead,
  handleDeleteNotification,
  setActiveTaskId,
  navigate,
  searchQuery,
  setSearchQuery,
  setSelectedType,
  activeTab
}) {
  if (notifications.length === 0) {
    return (
      <NotificationEmptyState
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setSelectedType={setSelectedType}
        activeTab={activeTab}
      />
    );
  }

  return (
    <div className="space-y-1.5 sm:space-y-2 max-h-[75vh] overflow-y-auto sm:pr-1" id="inbox-logs-scroller">
      {notifications.map((item) => (
        <NotificationItem
          key={item.id}
          item={item}
          isSelected={selectedNotif?.id === item.id}
          relatedTask={getTaskInfo(item.taskId)}
          relatedProject={getProjectInfo(item.projectId)}
          handleNotificationClick={handleNotificationClick}
          handleToggleRead={handleToggleRead}
          handleDeleteNotification={handleDeleteNotification}
          setActiveTaskId={setActiveTaskId}
          navigate={navigate}
        />
      ))}
    </div>
  );
}
