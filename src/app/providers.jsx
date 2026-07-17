/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  mockUsers,
  mockWorkspaces,
  mockProjects,
  mockTasks,
  mockNotifications,
  mockActivities,
  mockTags,
  mockTemplates,
  mockAutomationRules,
} from "../data/mockData";
import { getPlan, getPlanLimits, effectivePlanId, calcPrice, TRIAL_DAYS } from "../modules/Billing/util/billingUtils";

// Default demo subscriptions, keyed by workspace id.
const defaultSubscriptions = {
  ws1: {
    plan: "pro",
    interval: "yearly",
    seats: 5,
    status: "active",
    renewsAt: (() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toISOString(); })(),
    trialEndsAt: null,
    paymentMethod: { brand: "Visa", last4: "4242" },
    invoices: [
      { id: "inv_1001", date: new Date().toISOString(), description: "Pro plan — yearly, 5 seats", amount: 400, status: "Paid" },
    ],
  },
  ws2: { plan: "free", interval: "monthly", seats: 1, status: "active", renewsAt: null, trialEndsAt: null, paymentMethod: null, invoices: [] },
  ws3: {
    plan: "pro",
    interval: "monthly",
    seats: 3,
    status: "trialing",
    renewsAt: null,
    trialEndsAt: (() => { const d = new Date(); d.setDate(d.getDate() + 9); return d.toISOString(); })(),
    paymentMethod: null,
    invoices: [],
  },
};

const formatDate = (offsetDays = 0, hourOffset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(d.getHours() + hourOffset);
  return d.toISOString();
};

export const defaultTaskStatuses = [
  { id: "s1", name: "To Do", bg: "bg-zinc-100", text: "text-zinc-700", border: "border-zinc-200", darkBg: "dark:bg-zinc-800", darkText: "dark:text-zinc-300", darkBorder: "dark:border-zinc-700", icon: "FileEdit", isDefault: true, system: true },
  { id: "s2", name: "In Progress", bg: "bg-[#533afd]/5", text: "text-[#533afd]", border: "border-[#533afd]/20", darkBg: "dark:bg-[#533afd]/10", darkText: "dark:text-[#533afd]", darkBorder: "dark:border-[#533afd]/20", icon: "Play", isStarted: true, system: true },
  { id: "s3", name: "In Review", bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200", darkBg: "dark:bg-amber-500/10", darkText: "dark:text-amber-400", darkBorder: "dark:border-amber-500/20", icon: "Clock", system: true },
  { id: "s4", name: "Blocked", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", darkBg: "dark:bg-rose-500/10", darkText: "dark:text-rose-400", darkBorder: "dark:border-rose-500/20", icon: "AlertOctagon", system: true },
  { id: "s5", name: "Completed", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", darkBg: "dark:bg-emerald-500/10", darkText: "dark:text-emerald-400", darkBorder: "dark:border-emerald-500/20", icon: "CheckCircle2", isCompleted: true, system: true },
  { id: "s6", name: "Cancelled", bg: "bg-zinc-200", text: "text-zinc-500", border: "border-zinc-300", darkBg: "dark:bg-zinc-800", darkText: "dark:text-zinc-500", darkBorder: "dark:border-zinc-800", icon: "XCircle", isCancelled: true, system: true },
];

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  // 1. Core Persistent Databases
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem("atm_users");
      return saved ? JSON.parse(saved) : mockUsers;
    } catch (e) {
      console.error("Failed to parse atm_users", e);
      return mockUsers;
    }
  });

  const [workspaces, setWorkspaces] = useState(() => {
    try {
      const saved = localStorage.getItem("atm_workspaces");
      let list = saved ? JSON.parse(saved) : mockWorkspaces;
      // Guarantee each workspace has essential workspace settings
      return list.map((ws, index) => {
        const defaultMembers = [
          { id: "u1", name: "Yasin Chowdhury", email: "yasin@company.com", avatar: "YC", color: "bg-[#533afd] text-white", role: ws.ownerId === "u1" ? "Owner" : "Admin" },
          { id: "u2", name: "Rakib Hasan", email: "rakib@company.com", avatar: "RH", color: "bg-emerald-600 text-white", role: ws.ownerId === "u2" ? "Owner" : "Admin" },
          { id: "u3", name: "Nadia Islam", email: "nadia@company.com", avatar: "NI", color: "bg-amber-600 text-white", role: "Manager" },
          { id: "u4", name: "Mehnaz Taj", email: "mehnaz@company.com", avatar: "MT", color: "bg-rose-600 text-white", role: "Member" },
          { id: "u5", name: "Sohan Ahmed", email: "sohan@company.com", avatar: "SA", color: "bg-sky-600 text-white", role: "Viewer" }
        ];

        return {
          logo: "💼",
          description: ws.id === "ws1" ? "All design & development for custom automotive bidding solutions." : ws.id === "ws2" ? "Individual database metrics tracking, learning, and private task boards." : "R&D workspace for greenfield experimental features.",
          isArchived: false,
          members: defaultMembers,
          type: ws.id === "ws2" ? "personal" : "company",
          ...ws
        };
      });
    } catch (e) {
      console.error("Failed to parse atm_workspaces", e);
      return mockWorkspaces.map(ws => ({
        logo: "💼",
        description: "",
        isArchived: false,
        members: [
          { id: "u1", name: "Yasin Chowdhury", email: "yasin@company.com", avatar: "YC", color: "bg-[#533afd] text-white", role: ws.ownerId === "u1" ? "Owner" : "Admin" },
          { id: "u2", name: "Rakib Hasan", email: "rakib@company.com", avatar: "RH", color: "bg-emerald-600 text-white", role: ws.ownerId === "u2" ? "Owner" : "Admin" }
        ],
        ...ws
      }));
    }
  });

  const [activeWorkspaceId, setActiveWorkspaceId] = useState(() => {
    const saved = localStorage.getItem("atm_active_ws");
    return saved ? saved : "ws1";
  });

  const [projects, setProjects] = useState(() => {
    try {
      const saved = localStorage.getItem("atm_projects");
      return saved ? JSON.parse(saved) : mockProjects;
    } catch (e) {
      console.error("Failed to parse atm_projects", e);
      return mockProjects;
    }
  });

  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem("atm_tasks");
      return saved ? JSON.parse(saved) : mockTasks;
    } catch (e) {
      console.error("Failed to parse atm_tasks", e);
      return mockTasks;
    }
  });

  const [tags, setTags] = useState(() => {
    try {
      const saved = localStorage.getItem("atm_tags");
      return saved ? JSON.parse(saved) : mockTags;
    } catch (e) {
      console.error("Failed to parse atm_tags", e);
      return mockTags;
    }
  });

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem("atm_notifications");
      return saved ? JSON.parse(saved) : mockNotifications;
    } catch (e) {
      console.error("Failed to parse atm_notifications", e);
      return mockNotifications;
    }
  });

  const [activities, setActivities] = useState(() => {
    try {
      const saved = localStorage.getItem("atm_activities");
      return saved ? JSON.parse(saved) : mockActivities;
    } catch (e) {
      console.error("Failed to parse atm_activities", e);
      return mockActivities;
    }
  });

  const [templates, setTemplates] = useState(() => {
    try {
      const saved = localStorage.getItem("atm_templates");
      return saved ? JSON.parse(saved) : mockTemplates;
    } catch (e) {
      console.error("Failed to parse atm_templates", e);
      return mockTemplates;
    }
  });

  const [automationRules, setAutomationRules] = useState(() => {
    try {
      const saved = localStorage.getItem("atm_automation");
      return saved ? JSON.parse(saved) : mockAutomationRules;
    } catch (e) {
      console.error("Failed to parse atm_automation", e);
      return mockAutomationRules;
    }
  });

  const [taskStatuses, setTaskStatuses] = useState(() => {
    try {
      const saved = localStorage.getItem("atm_task_statuses");
      return saved ? JSON.parse(saved) : defaultTaskStatuses;
    } catch (e) {
      console.error("Failed to parse atm_task_statuses", e);
      return defaultTaskStatuses;
    }
  });

  // Per-workspace subscriptions (mock billing state)
  const [subscriptions, setSubscriptions] = useState(() => {
    try {
      const saved = localStorage.getItem("atm_subscriptions");
      return saved ? { ...defaultSubscriptions, ...JSON.parse(saved) } : defaultSubscriptions;
    } catch (e) {
      console.error("Failed to parse atm_subscriptions", e);
      return defaultSubscriptions;
    }
  });

  // 2. Active User Sessions (Mock Auth State)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("atm_current_user");
      return saved ? JSON.parse(saved) : mockUsers[0]; // Default to Yasin Chowdhury
    } catch (e) {
      console.error("Failed to parse atm_current_user", e);
      return mockUsers[0];
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const saved = localStorage.getItem("atm_is_auth");
    return saved === null ? true : saved === "true"; // Default as logged-in for instant UX
  });

  // 3. App settings & UI State
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("atm_theme");
    return saved ? saved : "light";
  });

  const [quickAddTaskOpen, setQuickAddTaskOpen] = useState(false);
  const [aiPlannerOpen, setAiPlannerOpen] = useState(false);

  const [notificationSettings, setNotificationSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("atm_notification_settings");
      const defaultSettings = {
        inApp: true,
        pushMock: true,
        emailMock: true,
        dailySummary: true,
        weeklySummary: false,
        dueReminders: true,
        mentions: true,
        projectUpdates: true,
      };
      return saved ? JSON.parse(saved) : defaultSettings;
    } catch (e) {
      console.error("Failed to parse atm_notification_settings", e);
      return {
        inApp: true,
        pushMock: true,
        emailMock: true,
        dailySummary: true,
        weeklySummary: false,
        dueReminders: true,
        mentions: true,
        projectUpdates: true,
      };
    }
  });

  const [activeToast, setActiveToast] = useState(null);

  // Active timers
  const [activeTimerTaskId, setActiveTimerTaskId] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [activeTaskId, setActiveTaskId] = useState(null);

  // Sync to LocalStorage on changes
  useEffect(() => {
    localStorage.setItem("atm_notification_settings", JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  useEffect(() => {
    localStorage.setItem("atm_users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("atm_workspaces", JSON.stringify(workspaces));
  }, [workspaces]);

  useEffect(() => {
    localStorage.setItem("atm_active_ws", activeWorkspaceId);
  }, [activeWorkspaceId]);

  useEffect(() => {
    localStorage.setItem("atm_projects", JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem("atm_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("atm_tags", JSON.stringify(tags));
  }, [tags]);

  useEffect(() => {
    localStorage.setItem("atm_notifications", JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem("atm_activities", JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem("atm_templates", JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem("atm_automation", JSON.stringify(automationRules));
  }, [automationRules]);

  useEffect(() => {
    localStorage.setItem("atm_task_statuses", JSON.stringify(taskStatuses));
  }, [taskStatuses]);

  useEffect(() => {
    localStorage.setItem("atm_subscriptions", JSON.stringify(subscriptions));
  }, [subscriptions]);

  useEffect(() => {
    localStorage.setItem("atm_current_user", JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem("atm_is_auth", isAuthenticated);
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem("atm_theme", theme);
    // Apply styling class to body
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Live Timer engine
  useEffect(() => {
    let interval = null;
    if (activeTimerTaskId) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setTimerSeconds(0);
    }
    return () => clearInterval(interval);
  }, [activeTimerTaskId]);

  // Dynamic values helper
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces.find(w => !w.isArchived) || workspaces[0];
  const activeWorkspaceProjects = projects.filter((p) => p.workspaceId === activeWorkspaceId);
  const activeWorkspaceProjectIds = activeWorkspaceProjects.map((p) => p.id);
  const activeWorkspaceTasks = tasks.filter((t) => activeWorkspaceProjectIds.includes(t.projectId));

  // --- BILLING / SUBSCRIPTION HELPERS ---

  const freeSubscription = { plan: "free", interval: "monthly", seats: 1, status: "active", renewsAt: null, trialEndsAt: null, paymentMethod: null, invoices: [] };

  const getSubscription = (wsId = activeWorkspaceId) => subscriptions[wsId] || freeSubscription;

  const activeSubscription = getSubscription(activeWorkspaceId);
  const activePlanId = effectivePlanId(activeSubscription);
  const activePlanLimits = getPlanLimits(activePlanId);

  // Gating helpers for the active workspace
  const canAddProject = () => activeWorkspaceProjects.length < activePlanLimits.projects;
  const canAddMember = () => (activeWorkspace?.members?.length || 0) < activePlanLimits.members;

  // --- ACTIONS ---

  // Auth operations
  const login = (email, password) => {
    const foundUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (foundUser) {
      setCurrentUser(foundUser);
      setIsAuthenticated(true);
      return { success: true };
    }
    // Auto-create new user if not found to prevent blocking user testing
    const nickname = email.split("@")[0];
    const nameStr = nickname.charAt(0).toUpperCase() + nickname.slice(1) + " (Guest)";
    const newUser = {
      id: `u_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: nameStr,
      email: email,
      avatar: nickname.slice(0, 2).toUpperCase(),
      color: "bg-[#533afd] text-white",
      role: "Member",
    };
    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    setIsAuthenticated(true);
    logActivity(`authenticated as ${nameStr}`);
    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setActiveTimerTaskId(null);
  };

  // Activity Log helper
  const logActivity = (text, userId = currentUser.id) => {
    const user = users.find((u) => u.id === userId) || currentUser;
    const newLog = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      userId: user.id,
      text: `${user.name} ${text}`,
      time: "Just now",
      timestamp: new Date().toISOString()
    };
    setActivities((prev) => [newLog, ...prev.slice(0, 49)]);
  };

  // Notification helper
  const pushNotification = (text, type = "update", taskId = null, projectId = null, customTitle = null, customMessage = null) => {
    // Map type to notificationSettings fields:
    let isFilteredBySetting = true;
    
    if (type === "mention" && !notificationSettings.mentions) isFilteredBySetting = false;
    if (type === "assigned" && !notificationSettings.mentions) isFilteredBySetting = false; 
    if ((type === "reminder" || type === "due_soon" || type === "overdue") && !notificationSettings.dueReminders) isFilteredBySetting = false;
    if ((type === "update" || type === "project_update" || type === "milestone_rescheduled" || type === "status_changed") && !notificationSettings.projectUpdates) isFilteredBySetting = false;

    if (!isFilteredBySetting) return;

    let title = customTitle;
    let message = customMessage || text;

    if (!title) {
      switch (type) {
        case "assigned":
          title = "Task Assigned";
          break;
        case "due_soon":
          title = "Due Soon Warning";
          break;
        case "overdue":
          title = "Overdue Task Alert";
          break;
        case "mention":
          title = "New Mention";
          break;
        case "update":
        case "project_update":
          title = "Project Update";
          break;
        case "reminder":
          title = "Reminder Alert";
          break;
        case "file":
        case "file_attached":
          title = "File Attached";
          break;
        case "status_change":
        case "status_changed":
          title = "Status Changed";
          break;
        case "rescheduled":
        case "milestone_rescheduled":
          title = "Milestone Rescheduled";
          break;
        default:
          title = "Workspace Alert";
          break;
      }
    }

    const newNotif = {
      id: `n_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type,
      title,
      message,
      text: title + ": " + message,
      read: false,
      time: "Just now",
      timestamp: new Date().toISOString(),
      taskId,
      projectId,
    };

    if (notificationSettings.inApp) {
      setNotifications((prev) => [newNotif, ...prev]);
    }

    if (notificationSettings.pushMock) {
      setActiveToast(newNotif);
      setTimeout(() => {
        setActiveToast((current) => current && current.id === newNotif.id ? null : current);
      }, 4000);
    }
    
    if (notificationSettings.emailMock) {
      console.log(`[MOCK EMAIL DELIVERED] To ${currentUser?.email}: ${title} - ${message}`);
    }
  };

  // --- BILLING ACTIONS (mock — backend contract: these become API endpoints) ---

  // Upgrade/downgrade a workspace plan. Generates a mock invoice for paid plans.
  const changePlan = (wsId, planId, interval = "monthly", seats = 1) => {
    const plan = getPlan(planId);
    const amount = calcPrice(planId, interval, seats);
    const now = new Date();
    const renews = new Date(now);
    if (interval === "yearly") renews.setFullYear(renews.getFullYear() + 1);
    else renews.setMonth(renews.getMonth() + 1);

    setSubscriptions((prev) => {
      const existing = prev[wsId] || freeSubscription;
      const newInvoices = amount > 0
        ? [
            {
              id: `inv_${Date.now()}`,
              date: now.toISOString(),
              description: `${plan.name} plan — ${interval}, ${seats} seat${seats > 1 ? "s" : ""}`,
              amount,
              status: "Paid",
            },
            ...(existing.invoices || []),
          ]
        : existing.invoices || [];

      return {
        ...prev,
        [wsId]: {
          ...existing,
          plan: planId,
          interval,
          seats,
          status: "active",
          renewsAt: planId === "free" ? null : renews.toISOString(),
          trialEndsAt: null,
          paymentMethod: amount > 0 ? (existing.paymentMethod || { brand: "Visa", last4: "4242" }) : existing.paymentMethod,
          invoices: newInvoices,
        },
      };
    });

    logActivity(`changed workspace plan to ${plan.name} (${interval})`);
    pushNotification(
      planId === "free" ? "Workspace moved to the Free plan." : `Workspace upgraded to ${plan.name}.`,
      "update",
      null,
      null,
      "Plan Updated",
      planId === "free"
        ? "Your workspace is now on the Free plan."
        : `Your workspace is now on the ${plan.name} plan (${interval}, ${seats} seat${seats > 1 ? "s" : ""}).`
    );
  };

  // Cancel: keeps data, drops to Free at period end (mock: immediately marks canceled).
  const cancelSubscription = (wsId) => {
    setSubscriptions((prev) => {
      const existing = prev[wsId];
      if (!existing) return prev;
      return { ...prev, [wsId]: { ...existing, status: "canceled", renewsAt: null, trialEndsAt: null } };
    });
    logActivity("canceled workspace subscription");
    pushNotification("Subscription canceled. The workspace is now on the Free plan.", "update", null, null, "Subscription Canceled");
  };

  // Start a free trial of a paid plan (no card required).
  const startTrial = (wsId, planId = "pro") => {
    const ends = new Date();
    ends.setDate(ends.getDate() + TRIAL_DAYS);
    setSubscriptions((prev) => ({
      ...prev,
      [wsId]: {
        ...(prev[wsId] || freeSubscription),
        plan: planId,
        status: "trialing",
        trialEndsAt: ends.toISOString(),
        renewsAt: null,
      },
    }));
    logActivity(`started a ${getPlan(planId).name} trial`);
    pushNotification(`Your ${TRIAL_DAYS}-day ${getPlan(planId).name} trial has started.`, "update", null, null, "Trial Started");
  };

  // Workspace actions
  const addWorkspace = (name, logo = "💼", description = "", type = "company") => {
    const newId = `ws_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const initialMembers = [
      { id: currentUser?.id || "u1", name: currentUser?.name || "Yasin Chowdhury", email: currentUser?.email || "yasin@company.com", avatar: currentUser?.avatar || "YC", color: currentUser?.color || "bg-[#533afd] text-white", role: "Owner" },
      { id: "u2", name: "Rakib Hasan", email: "rakib@company.com", avatar: "RH", color: "bg-emerald-600 text-white", role: "Admin" },
      { id: "u3", name: "Nadia Islam", email: "nadia@company.com", avatar: "NI", color: "bg-amber-600 text-white", role: "Manager" }
    ];
    const newWs = {
      id: newId,
      name,
      logo,
      ownerId: currentUser?.id || "u1",
      description: description || "Custom team workspace.",
      isArchived: false,
      members: type === "personal" ? initialMembers.slice(0, 1) : initialMembers,
      type,
      createdAt: new Date().toISOString()
    };
    setWorkspaces((prev) => [...prev, newWs]);
    // New workspaces start on the Free plan
    setSubscriptions((prev) => ({ ...prev, [newId]: { ...freeSubscription } }));
    setActiveWorkspaceId(newId);
    logActivity(`created workspace '${name}'`);
    pushNotification(`New workspace '${name}' was provisioned.`, "update");
    return newWs;
  };

  const updateWorkspace = (id, fields) => {
    setWorkspaces((prev) => prev.map((w) => (w.id === id ? { ...w, ...fields } : w)));
    logActivity(`modified settings for workspace '${fields.name || id}'`);
  };

  const deleteWorkspace = (id) => {
    if (workspaces.length <= 1) return { error: "Cannot delete the last remaining workspace." };
    setWorkspaces((prev) => prev.filter((w) => w.id !== id));
    setActiveWorkspaceId(workspaces.find((w) => w.id !== id).id);
    logActivity(`removed workspace ${id}`);
    return { success: true };
  };

  // Project actions
  const addProject = ({ name, description, icon, color, status, deadline }) => {
    const newId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newProj = {
      id: newId,
      workspaceId: activeWorkspaceId,
      name,
      description: description || "No description provided.",
      icon: icon || "📁",
      color: color || "#4f46e5",
      status: status || "Planning",
      startDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      deadline: deadline || formatDate(14),
      members: [currentUser.id],
      progress: 0,
    };
    setProjects((prev) => [...prev, newProj]);
    logActivity(`created project '${name}'`);
    pushNotification(`Project '${name}' was initialized.`, "update", null, newId);
    return newProj;
  };

  const updateProject = (id, fields) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...fields } : p)));
    if (fields.name) {
      logActivity(`renamed project to '${fields.name}'`);
    } else if (fields.status) {
      logActivity(`flagged project stage to '${fields.status}'`);
    }
  };

  const deleteProject = (id) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setTasks((prev) => prev.filter((t) => t.projectId !== id));
    logActivity(`deleted project '${id}'`);
  };

  // Task actions
  const addTask = (taskFields) => {
    const newId = `t_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newTask = {
      id: newId,
      projectId: taskFields.projectId || activeWorkspaceProjects[0]?.id || "p1",
      title: taskFields.title || "Untitled Task",
      description: taskFields.description || "",
      status: taskFields.status || (taskStatuses && taskStatuses.find(s => s.isDefault)?.name) || (taskStatuses && taskStatuses[0]?.name) || "To Do",
      priority: taskFields.priority || "Medium",
      assigneeId: taskFields.assigneeId || currentUser.id,
      startDate: taskFields.startDate || new Date().toISOString(),
      createdAt: taskFields.createdAt || new Date().toISOString(),
      dueDate: taskFields.dueDate || formatDate(3),
      estimatedTime: taskFields.estimatedTime || 0,
      actualTime: 0,
      tags: taskFields.tags || [],
      checklist: taskFields.checklist || [],
      comments: [],
      watchers: [currentUser.id],
      dependencies: taskFields.dependencies || [],
      recurring: taskFields.recurring || { isRecurring: false },
      attachments: [],
      activities: [{ id: `act_init_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, text: `Task created by ${currentUser.name}`, timestamp: new Date().toISOString() }],
    };

    setTasks((prev) => [newTask, ...prev]);
    logActivity(`created task '${newTask.title}'`);
    
    // Trigger assignment notification
    pushNotification(
      `You were assigned a new task: ${newTask.title}.`,
      "assigned",
      newId,
      newTask.projectId,
      "Task Assigned",
      `You have been assigned to design or coordinate '${newTask.title}'.`
    );

    // Evaluate automation trigger on creation
    triggerAutomationOnTaskChange(newTask);
    
    return newTask;
  };

  const updateTask = (id, fields) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updated = { ...t, ...fields };
          
          // Log specific transitions
          if (fields.status && fields.status !== t.status) {
            updated.activities = [
              { id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, text: `${currentUser.name} changed status from '${t.status}' to '${fields.status}'`, timestamp: new Date().toISOString() },
              ...(t.activities || []),
            ];
            logActivity(`updated '${t.title}' status to '${fields.status}'`);
            
            // Push notification for status change
            pushNotification(
              `Task status updated to ${fields.status}`,
              "status_changed",
              t.id,
              t.projectId,
              "Status Changed",
              `Task '${t.title}' status was updated to '${fields.status}' by ${currentUser.name}.`
            );
          }
          
          if (fields.priority && fields.priority !== t.priority) {
            logActivity(`updated '${t.title}' priority to '${fields.priority}'`);
          }

          if (fields.assigneeId && fields.assigneeId !== t.assigneeId) {
            const asm = users.find((u) => u.id === fields.assigneeId);
            if (asm) {
              logActivity(`assigned '${t.title}' to ${asm.name}`);
              pushNotification(`You have been assigned to: '${t.title}'`, "assigned", t.id);
            }
          }

          if (fields.dueDate && fields.dueDate !== t.dueDate) {
            const isMilestone = t.tags?.includes("Milestone") || t.tags?.includes("milestone") || fields.tags?.includes("Milestone");
            if (isMilestone) {
              pushNotification(
                `Milestone '${t.title}' rescheduled to ${new Date(fields.dueDate).toLocaleDateString()}`,
                "milestone_rescheduled",
                t.id,
                t.projectId,
                "Milestone Rescheduled",
                `Milestone '${t.title}' has been moved from ${new Date(t.dueDate).toLocaleDateString()} to ${new Date(fields.dueDate).toLocaleDateString()}.`
              );
            }
          }

          // Evaluate automation rules
          setTimeout(() => triggerAutomationOnTaskChange(updated), 50);

          return updated;
        }
        return t;
      })
    );
  };

  const deleteTask = (id) => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    logActivity(`deleted task '${target.title}'`);
    if (activeTimerTaskId === id) {
      setActiveTimerTaskId(null);
    }
  };

  const addTaskStatus = (statusObj) => {
    const newId = `s_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newStatus = {
      id: newId,
      name: statusObj.name,
      bg: statusObj.bg || "bg-zinc-100",
      text: statusObj.text || "text-zinc-700",
      border: statusObj.border || "border-zinc-200",
      darkBg: statusObj.darkBg || "dark:bg-zinc-800",
      darkText: statusObj.darkText || "dark:text-zinc-300",
      darkBorder: statusObj.darkBorder || "dark:border-zinc-700",
      icon: statusObj.icon || "FileEdit",
      isDefault: false,
      system: false
    };
    setTaskStatuses((prev) => [...prev, newStatus]);
    logActivity(`added task status '${statusObj.name}'`);
    return newStatus;
  };

  const updateTaskStatus = (id, fields) => {
    const originalStatus = taskStatuses.find(s => s.id === id);
    if (!originalStatus) return;

    setTaskStatuses((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, ...fields } : s));
      if (fields.isDefault) {
        return updated.map((s) => (s.id === id ? { ...s, isDefault: true } : { ...s, isDefault: false }));
      }
      return updated;
    });

    // If the name is changed, rename the status in all tasks
    if (fields.name && fields.name !== originalStatus.name) {
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.status === originalStatus.name ? { ...t, status: fields.name } : t
        )
      );
      logActivity(`renamed task status '${originalStatus.name}' to '${fields.name}'`);
    } else {
      logActivity(`updated task status '${originalStatus.name}' parameters`);
    }
  };

  const deleteTaskStatus = (id) => {
    const statusToDelete = taskStatuses.find(s => s.id === id);
    if (!statusToDelete) return;

    // Filter out deleted status
    const remaining = taskStatuses.filter((s) => s.id !== id);
    setTaskStatuses(remaining);

    // Find default status or first status to fall back to
    const defaultStatus = remaining.find((s) => s.isDefault) || remaining[0] || defaultTaskStatuses[0];

    // Reassign tasks with deleted status to default status
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.status === statusToDelete.name ? { ...t, status: defaultStatus.name } : t
      )
    );

    logActivity(`deleted task status '${statusToDelete.name}', reassigning pending items to '${defaultStatus.name}'`);
  };

  // Automation triggering
  const triggerAutomationOnTaskChange = (task) => {
    automationRules.forEach((rule) => {
      if (!rule.active) return;
      
      // Automation: Completed -> Clear tags & unassign
      if (rule.id === "ar1" && task.status === "Completed") {
        const hasTagsOrAssignee = task.tags.length > 0 || task.assigneeId;
        if (hasTagsOrAssignee) {
          setTasks((prev) =>
            prev.map((t) => (t.id === task.id ? { ...t, tags: [], assigneeId: null } : t))
          );
          logActivity(`executed automation rule: [Clear tags & unassign task] for completed task.`);
        }
      }

      // Automation: Urgent priority -> alerts
      if (rule.id === "ar2" && task.priority === "Urgent") {
        // Trigger simulation
        pushNotification(`[Automation Alert] Urgent task detected! Team alerted on external channels.`, "reminder", task.id);
      }
    });
  };

  // Checklist manipulation
  const addChecklistItem = (taskId, title) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const newItem = { 
            id: `cl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, 
            title, 
            completed: false,
            createdAt: new Date().toISOString()
          };
          return {
            ...t,
            checklist: [...(t.checklist || []), newItem],
          };
        }
        return t;
      })
    );
  };

  const toggleChecklistItem = (taskId, itemId) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updatedChecklist = t.checklist.map((item) =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
          );
          return { ...t, checklist: updatedChecklist };
        }
        return t;
      })
    );
  };

  const deleteChecklistItem = (taskId, itemId) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            checklist: t.checklist.filter((item) => item.id !== itemId),
          };
        }
        return t;
      })
    );
  };

  // Tag Manager
  const createTag = (name, colorStyle) => {
    const newTag = { id: `t_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, name, color: colorStyle || "bg-[#533afd]/5 text-[#533afd] border-[#533afd]/20" };
    setTags((prev) => [...prev, newTag]);
    return newTag;
  };

  // Add Comment on Task
  const addComment = (taskId, text) => {
    if (!text.trim()) return;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const newComment = {
            id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            userId: currentUser.id,
            text,
            timestamp: new Date().toISOString(),
          };
          
          // Trigger mention/comment notification
          setTimeout(() => {
            pushNotification(
              `Nadia Islam and team mentioned you in a comment on task '${t.title}'.`,
              "mention",
              taskId,
              t.projectId,
              "New Comment & Mention",
              `${currentUser.name} commented: "${text}" on task '${t.title}'`
            );
          }, 50);

          return {
            ...t,
            comments: [...(t.comments || []), newComment],
            activities: [
              { id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, text: `${currentUser.name} added a comment`, timestamp: new Date().toISOString() },
              ...(t.activities || []),
            ],
          };
        }
        return t;
      })
    );
    logActivity(`commented on task`);
  };

  // Attach File on Task (with Base64 Support)
  const attachFile = (taskId, name, size, type, base64 = null) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const newAttachment = { 
            id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, 
            name, 
            size, 
            type, 
            base64, 
            timestamp: new Date().toISOString(), 
            createdAt: new Date().toISOString(),
            author: currentUser.name 
          };
          
          // Trigger file attached notification
          setTimeout(() => {
            pushNotification(
              `New file deliverable attached: '${name}' to task '${t.title}'.`,
              "file_attached",
              taskId,
              t.projectId,
              "File Attached",
              `A new deliverable '${name}' (${size}) has been uploaded to task '${t.title}'.`
            );
          }, 50);

          return {
            ...t,
            attachments: [...(t.attachments || []), newAttachment],
          };
        }
        return t;
      })
    );
    logActivity(`attached file '${name}' to task`);
  };

  const removeAttachment = (taskId, attId) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            attachments: (t.attachments || []).filter((a) => a.id !== attId),
          };
        }
        return t;
      })
    );
  };

  // Attach File on Project
  const attachFileToProject = (projectId, name, size, type, base64 = null) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const newAttachment = { 
            id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, 
            name, 
            size, 
            type, 
            base64, 
            timestamp: new Date().toISOString(), 
            createdAt: new Date().toISOString(),
            author: currentUser.name 
          };
          return {
            ...p,
            attachments: [...(p.attachments || []), newAttachment],
          };
        }
        return p;
      })
    );
    logActivity(`attached file '${name}' to project`);
  };

  const removeAttachmentFromProject = (projectId, attId) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            attachments: (p.attachments || []).filter((a) => a.id !== attId),
          };
        }
        return p;
      })
    );
    logActivity(`removed file attachment from project`);
  };

  // Duplicate Task
  const duplicateTask = (taskId) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return null;
    const newId = `t_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newTask = {
      ...target,
      id: newId,
      title: `${target.title} (Copy)`,
      checklist: (target.checklist || []).map((c) => ({ ...c, id: `cl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}` })),
      comments: [],
      attachments: (target.attachments || []).map((a) => ({ ...a, id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 9)}` })),
      activities: [{ id: `act_init_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, text: `Task duplicated from '${target.title}' by ${currentUser.name}`, timestamp: new Date().toISOString() }],
    };
    setTasks((prev) => [newTask, ...prev]);
    logActivity(`duplicated task '${target.title}'`);
    pushNotification(`Task duplicated: '${newTask.title}' was created.`, "update", newId);
    return newTask;
  };

  // Time-tracker Actions
  const toggleTaskTimer = (taskId) => {
    if (activeTimerTaskId === taskId) {
      // STOP TIMER - save actual time
      const hoursAdded = timerSeconds / 3600 || 0.1; // fallback minor fraction
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === taskId) {
            return { ...t, actualTime: Number((t.actualTime + hoursAdded).toFixed(2)) };
          }
          return t;
        })
      );
      setActiveTimerTaskId(null);
      logActivity(`tracked and stopped timer for task`);
    } else {
      // START TIMER
      if (activeTimerTaskId) {
        // stop previous first
        const prevId = activeTimerTaskId;
        const hoursAdded = timerSeconds / 3600 || 0.1;
        setTasks((prev) =>
          prev.map((t) => (t.id === prevId ? { ...t, actualTime: Number((t.actualTime + hoursAdded).toFixed(2)) } : t))
        );
      }
      setActiveTimerTaskId(taskId);
      setTimerSeconds(0);
      logActivity(`started timer for task`);
    }
  };

  const addManualTime = (taskId, hours) => {
    const h = parseFloat(hours) || 0;
    if (h <= 0) return;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return { ...t, actualTime: Number((t.actualTime + h).toFixed(2)) };
        }
        return t;
      })
    );
    logActivity(`logged ${h}h manual labor spent`);
  };

  // Trigger Template hydration
  const instantiateTemplate = (templateId, targetProjectId) => {
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;
    tpl.tasks.forEach((taskTitle) => {
      addTask({
        title: taskTitle,
        projectId: targetProjectId,
        description: "Hydrated from system checklist template.",
        status: "To Do",
        priority: "Medium",
        assigneeId: currentUser.id,
      });
    });
    logActivity(`instantiated workflow template '${tpl.name}'`);
    pushNotification(`Completed instantiating workflow template '${tpl.name}'.`, "update");
  };

  const resetToDefaultData = () => {
    localStorage.removeItem("atm_users");
    localStorage.removeItem("atm_workspaces");
    localStorage.removeItem("atm_active_ws");
    localStorage.removeItem("atm_projects");
    localStorage.removeItem("atm_tasks");
    localStorage.removeItem("atm_tags");
    localStorage.removeItem("atm_notifications");
    localStorage.removeItem("atm_activities");
    localStorage.removeItem("atm_templates");
    localStorage.removeItem("atm_automation");
    localStorage.removeItem("atm_current_user");
    localStorage.removeItem("atm_is_auth");
    localStorage.removeItem("atm_task_statuses");
    localStorage.removeItem("atm_subscriptions");

    setUsers(mockUsers);
    setWorkspaces(mockWorkspaces);
    setActiveWorkspaceId("ws1");
    setProjects(mockProjects);
    setTasks(mockTasks);
    setTags(mockTags);
    setNotifications(mockNotifications);
    setActivities(mockActivities);
    setTemplates(mockTemplates);
    setAutomationRules(mockAutomationRules);
    setTaskStatuses(defaultTaskStatuses);
    setSubscriptions(defaultSubscriptions);
    setCurrentUser(mockUsers[0]);
    setIsAuthenticated(true);
    
    logActivity("restored original workspace and task data metrics core package");
  };

  const value = {
    users,
    setUsers,
    workspaces,
    setWorkspaces,
    activeWorkspaceId,
    setActiveWorkspaceId,
    activeWorkspace,
    projects,
    setProjects,
    activeWorkspaceProjects,
    tasks,
    setTasks,
    activeWorkspaceTasks,
    tags,
    setTags,
    notifications,
    setNotifications,
    notificationSettings,
    setNotificationSettings,
    activeToast,
    setActiveToast,
    pushNotification,
    activities,
    setActivities,
    templates,
    setTemplates,
    automationRules,
    setAutomationRules,
    taskStatuses,
    setTaskStatuses,
    // Billing / subscriptions
    subscriptions,
    getSubscription,
    activeSubscription,
    activePlanId,
    activePlanLimits,
    canAddProject,
    canAddMember,
    changePlan,
    cancelSubscription,
    startTrial,
    currentUser,
    setCurrentUser,
    isAuthenticated,
    setIsAuthenticated,
    theme,
    setTheme,
    quickAddTaskOpen,
    setQuickAddTaskOpen,
    aiPlannerOpen,
    setAiPlannerOpen,
    activeTaskId,
    setActiveTaskId,
    // Timer
    activeTimerTaskId,
    timerSeconds,
    toggleTaskTimer,
    addManualTime,
    // Core Cruds
    login,
    logout,
    addWorkspace,
    updateWorkspace,
    deleteWorkspace,
    addProject,
    updateProject,
    deleteProject,
    addTask,
    updateTask,
    deleteTask,
    addTaskStatus,
    updateTaskStatus,
    deleteTaskStatus,
    addChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
    createTag,
    addComment,
    attachFile,
    removeAttachment,
    attachFileToProject,
    removeAttachmentFromProject,
    duplicateTask,
    instantiateTemplate,
    logActivity,
    resetToDefaultData,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used inside an AppStateProvider");
  }
  return context;
}
