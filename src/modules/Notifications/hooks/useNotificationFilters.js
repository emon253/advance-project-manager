/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from "react";
import { parseNotifications } from "../util/notificationUtils";

export function useNotificationFilters(notifications) {
  const [activeTab, setActiveTab] = useState("all"); // "all", "unread", "preferences"
  const [selectedType, setSelectedType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNotif, setSelectedNotif] = useState(null);

  const parsedNotifications = useMemo(() => {
    return parseNotifications(notifications);
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    return parsedNotifications.filter((item) => {
      // 1. Tab check
      if (activeTab === "unread" && item.read) return false;
      
      // 2. Type filter
      if (selectedType !== "all") {
        if (selectedType === "assigned" && item.type !== "assigned") return false;
        if (selectedType === "due_soon" && item.type !== "due_soon") return false;
        if (selectedType === "overdue" && item.type !== "overdue") return false;
        if (selectedType === "mention" && item.type !== "mention") return false;
        if (selectedType === "project_update" && !["project_update", "update"].includes(item.type)) return false;
        if (selectedType === "reminder" && item.type !== "reminder") return false;
        if (selectedType === "file_attached" && !["file_attached", "file"].includes(item.type)) return false;
        if (selectedType === "status_changed" && !["status_changed", "status_change"].includes(item.type)) return false;
        if (selectedType === "milestone_rescheduled" && !["milestone_rescheduled", "rescheduled"].includes(item.type)) return false;
      }

      // 3. Search text
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const titleMatch = item.title?.toLowerCase().includes(query);
        const msgMatch = item.message?.toLowerCase().includes(query);
        return titleMatch || msgMatch;
      }

      return true;
    });
  }, [parsedNotifications, activeTab, selectedType, searchQuery]);

  return {
    activeTab,
    setActiveTab,
    selectedType,
    setSelectedType,
    searchQuery,
    setSearchQuery,
    selectedNotif,
    setSelectedNotif,
    filteredNotifications,
  };
}
