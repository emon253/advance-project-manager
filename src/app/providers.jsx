/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { ApiError, setSessionExpiredHandler, tokenStore } from "../api/client";
import {
  authApi,
  billingApi,
  dashboardApi,
  inviteApi,
  meApi,
  notificationApi,
  projectApi,
  searchApi,
  tagApi,
  taskApi,
  taskStatusApi,
  templateApi,
  automationApi,
  workspaceApi,
  planApi,
} from "../api/endpoints";
import { createRealtimeClient } from "../api/realtime";
import { hasPermission, resolveRole } from "./permissions";
import { effectivePlanId, getPlanLimits, PLANS, setPlans } from "../modules/Billing/util/billingUtils";

/**
 * API-backed application state. The `useAppState()` contract is unchanged from
 * the mock era — same names, same shapes (adapters normalize the wire format) —
 * but every action now talks to the Spring backend and state is hydrated per
 * workspace. Client-only state (theme, toast, timer, UI flags) stays local.
 */

// Kept for StatusBadge's out-of-provider fallback rendering.
export const defaultTaskStatuses = [
  { id: "s1", name: "To Do", bg: "bg-zinc-100", text: "text-zinc-700", border: "border-zinc-200", darkBg: "dark:bg-zinc-800", darkText: "dark:text-zinc-300", darkBorder: "dark:border-zinc-700", icon: "FileEdit", isDefault: true, system: true },
  { id: "s2", name: "In Progress", bg: "bg-primary/8", text: "text-primary", border: "border-primary/20", darkBg: "dark:bg-primary/15", darkText: "dark:text-primary", darkBorder: "dark:border-primary/20", icon: "Play", isStarted: true, system: true },
  { id: "s3", name: "In Review", bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200", darkBg: "dark:bg-amber-500/10", darkText: "dark:text-amber-400", darkBorder: "dark:border-amber-500/20", icon: "Clock", system: true },
  { id: "s4", name: "Blocked", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", darkBg: "dark:bg-rose-500/10", darkText: "dark:text-rose-400", darkBorder: "dark:border-rose-500/20", icon: "AlertOctagon", system: true },
  { id: "s5", name: "Completed", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", darkBg: "dark:bg-emerald-500/10", darkText: "dark:text-emerald-400", darkBorder: "dark:border-emerald-500/20", icon: "CheckCircle2", isCompleted: true, system: true },
  { id: "s6", name: "Cancelled", bg: "bg-zinc-200", text: "text-zinc-500", border: "border-zinc-300", darkBg: "dark:bg-zinc-800", darkText: "dark:text-zinc-500", darkBorder: "dark:border-zinc-800", icon: "XCircle", isCancelled: true, system: true },
];

// Backend seeds these two templates via Flyway; no list endpoint yet (§9 gap).
const SEEDED_TEMPLATES = [
  { id: 1, name: "Sprint kickoff", tasks: ["Define sprint goal", "Groom the backlog", "Plan capacity"] },
  { id: 2, name: "Website launch", tasks: ["Configure DNS & SSL", "Run visual regression", "Publish sitemap", "Smoke-test checkout"] },
];

const ACTIVE_WS_KEY = "apm_active_workspace";
const THEME_KEY = "apm_theme";
const SIM_ERRORS_KEY = "apm_sim_errors";

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  // --- session ---------------------------------------------------------------
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(tokenStore.hasSession);
  const [bootLoading, setBootLoading] = useState(tokenStore.hasSession);

  // --- workspace-scoped data -------------------------------------------------
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceIdRaw] = useState(() => {
    const saved = localStorage.getItem(ACTIVE_WS_KEY);
    return saved ? Number(saved) : null;
  });
  const [users, setUsers] = useState([]); // active workspace members (user shape)
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [taskStatuses, setTaskStatuses] = useState([]);
  const [tags, setTags] = useState([]);
  const [invites, setInvites] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activeSubscription, setActiveSubscription] = useState(null);

  // --- user-scoped data ------------------------------------------------------
  const [notifications, setNotifications] = useState([]);
  const [plans, setPlansState] = useState(() => [...PLANS]);
  const [notificationSettings, setNotificationSettingsState] = useState({
    inApp: true, pushMock: false, emailMock: true,
    dailySummary: false, weeklySummary: true,
    dueReminders: true, mentions: true, projectUpdates: true,
  });

  // --- client-only state -----------------------------------------------------
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "light");
  const [quickAddTaskOpen, setQuickAddTaskOpen] = useState(false);
  const [aiPlannerOpen, setAiPlannerOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [activeToast, setActiveToast] = useState(null);
  const [simulateErrors, setSimulateErrorsState] = useState(() => localStorage.getItem(SIM_ERRORS_KEY) === "true");
  const [activeTimerTaskId, setActiveTimerTaskId] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);

  const [templates, setTemplates] = useState(SEEDED_TEMPLATES); // replaced by GET /templates on boot
  const [automationRules, setAutomationRules] = useState([]);
  const [projectFiles, setProjectFiles] = useState({}); // per-project attachment lists (API-backed)

  // --- async data lifecycle (useMockQuery contract) --------------------------
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState(false);
  const loadSeq = useRef(0);

  const setSimulateErrors = (v) => {
    localStorage.setItem(SIM_ERRORS_KEY, String(v));
    setSimulateErrorsState(v);
  };

  // --- toast helper (client-side; the server persists the real notification) --
  const pushNotification = useCallback((text, type = "update", taskId = null, projectId = null, customTitle = null, customMessage = null) => {
    const toast = {
      id: `toast_${Date.now()}`,
      type,
      title: customTitle || null,
      message: customMessage || text,
      text,
      taskId,
      projectId,
    };
    setActiveToast(toast);
    setTimeout(() => {
      setActiveToast((cur) => (cur && cur.id === toast.id ? null : cur));
    }, 4000);
  }, []);

  const toastError = useCallback((err, fallback = "Something went wrong.") => {
    const message = err instanceof ApiError ? err.message : fallback;
    pushNotification(message, "update", null, null, "Request failed", message);
  }, [pushNotification]);

  // --- loaders ---------------------------------------------------------------

  const refreshNotifications = useCallback(async () => {
    try {
      const page = await notificationApi.list({ size: 100 });
      setNotifications(page.content);
    } catch {
      /* inbox refresh is best-effort */
    }
  }, []);

  const loadWorkspaceData = useCallback(async (wsId) => {
    if (!wsId) return;
    const seq = ++loadSeq.current;
    setDataLoading(true);
    setDataError(false);
    try {
      const [members, projectList, taskPage, statuses, tagList, activityPage] = await Promise.all([
        workspaceApi.members(wsId),
        projectApi.list(wsId, true),
        taskApi.list(wsId, { size: 200 }),
        taskStatusApi.list(wsId),
        tagApi.list(wsId),
        workspaceApi.activity(wsId, 0, 30),
      ]);
      if (seq !== loadSeq.current) return; // a newer load superseded this one
      setUsers(members);
      setProjects(projectList);
      setTasks(taskPage.content);
      setTaskStatuses(statuses);
      setTags(tagList);
      setActivities(activityPage.content);
      setWorkspaces((prev) => prev.map((w) => (w.id === wsId ? { ...w, members } : w)));

      // Admin-only extras — non-admins simply do without (server is authoritative).
      inviteApi.listPending(wsId).then(setInvites).catch(() => setInvites([]));
      billingApi.subscription(wsId).then(setActiveSubscription).catch(() => setActiveSubscription(null));
      automationApi.list(wsId).then(setAutomationRules).catch(() => setAutomationRules([]));
    } catch {
      if (seq === loadSeq.current) setDataError(true);
    } finally {
      if (seq === loadSeq.current) setDataLoading(false);
    }
  }, []);

  const refreshWorkspaces = useCallback(async () => {
    const list = await workspaceApi.list();
    setWorkspaces(list);
    return list;
  }, []);

  const refreshProjects = useCallback(async () => {
    if (!activeWorkspaceId) return;
    try { setProjects(await projectApi.list(activeWorkspaceId, true)); } catch { /* keep last */ }
  }, [activeWorkspaceId]);

  const refreshTasks = useCallback(async () => {
    if (!activeWorkspaceId) return;
    try { setTasks((await taskApi.list(activeWorkspaceId, { size: 200 })).content); } catch { /* keep last */ }
  }, [activeWorkspaceId]);

  const refreshActivities = useCallback(async () => {
    if (!activeWorkspaceId) return;
    try { setActivities((await workspaceApi.activity(activeWorkspaceId, 0, 30)).content); } catch { /* keep last */ }
  }, [activeWorkspaceId]);

  const refreshSubscription = useCallback(async () => {
    if (!activeWorkspaceId) return;
    try { setActiveSubscription(await billingApi.subscription(activeWorkspaceId)); } catch { /* non-admin */ }
  }, [activeWorkspaceId]);

  const refreshInvites = useCallback(async () => {
    if (!activeWorkspaceId) return;
    try { setInvites(await inviteApi.listPending(activeWorkspaceId)); } catch { setInvites([]); }
  }, [activeWorkspaceId]);

  const refreshWorkspaceData = useCallback(() => loadWorkspaceData(activeWorkspaceId), [loadWorkspaceData, activeWorkspaceId]);

  // --- boot ------------------------------------------------------------------

  const bootSession = useCallback(async () => {
    setBootLoading(true);
    try {
      const [user, wsList, prefs] = await Promise.all([
        meApi.get(),
        workspaceApi.list(),
        notificationApi.getPreferences().catch(() => null),
      ]);
      setCurrentUser(user);
      setWorkspaces(wsList);
      if (prefs) setNotificationSettingsState(prefs);
      setIsAuthenticated(true);

      const saved = Number(localStorage.getItem(ACTIVE_WS_KEY));
      const target = wsList.find((w) => w.id === saved && !w.isArchived)
        || wsList.find((w) => !w.isArchived)
        || wsList[0];
      if (target) {
        setActiveWorkspaceIdRaw(target.id);
        localStorage.setItem(ACTIVE_WS_KEY, String(target.id));
        await loadWorkspaceData(target.id);
      }
      refreshNotifications();
      templateApi.list().then(setTemplates).catch(() => {});
      return { success: true };
    } catch {
      tokenStore.clear();
      setIsAuthenticated(false);
      setCurrentUser(null);
      return { success: false };
    } finally {
      setBootLoading(false);
    }
  }, [loadWorkspaceData, refreshNotifications]);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setIsAuthenticated(false);
      setCurrentUser(null);
      window.location.assign("/login?expired=1");
    });
    if (tokenStore.hasSession) {
      bootSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- owner-managed plan catalog ------------------------------------------
  const refreshPlans = useCallback(async () => {
    try {
      const catalog = await planApi.list();
      if (catalog.length > 0) {
        setPlans(catalog);          // swap the live billingUtils catalog in place
        setPlansState(catalog);     // re-render consumers
      }
    } catch { /* keep the seeded defaults */ }
  }, []);

  useEffect(() => {
    if (isAuthenticated) refreshPlans();
  }, [isAuthenticated, refreshPlans]);

  // ---- realtime channel (STOMP): live notification pushes -----------------
  // Preference lives in a ref so an edit doesn't tear down the socket.
  const notificationSettingsRef = useRef(notificationSettings);
  useEffect(() => {
    notificationSettingsRef.current = notificationSettings;
  }, [notificationSettings]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const client = createRealtimeClient({
      onEvent: ({ type, notification }) => {
        if (type !== "notification") return;
        setNotifications((prev) =>
          prev.some((n) => String(n.id) === String(notification.id)) ? prev : [notification, ...prev]);
        pushNotification(
          notification.message, "update", notification.taskId, notification.projectId,
          notification.title, notification.message);
        // OS-level notification only when the tab is hidden, the user's
        // "Browser push" preference is on, and the browser permission is granted.
        if (document.hidden
            && notificationSettingsRef.current?.pushMock
            && typeof Notification !== "undefined"
            && Notification.permission === "granted") {
          try {
            new Notification(notification.title || "Carbarn", {
              body: notification.message,
              tag: `apm-notification-${notification.id}`,
            });
          } catch { /* notification constructor unsupported (e.g. Android): fine */ }
        }
      },
    });
    return () => client.deactivate();
  }, [isAuthenticated, pushNotification]);

  // PWA app-icon badge mirrors the unread count where the API exists.
  useEffect(() => {
    if (!("setAppBadge" in navigator)) return;
    const unread = notifications.filter((n) => !n.read).length;
    if (unread > 0) navigator.setAppBadge(unread).catch(() => {});
    else navigator.clearAppBadge?.().catch(() => {});
  }, [notifications]);

  // Theme side-effect (unchanged behavior).
  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    const root = window.document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  // Timer engine (client-side; hours land via taskApi.logTime on stop).
  useEffect(() => {
    let interval = null;
    if (activeTimerTaskId) {
      interval = setInterval(() => setTimerSeconds((prev) => prev + 1), 1000);
    } else {
      setTimerSeconds(0);
    }
    return () => clearInterval(interval);
  }, [activeTimerTaskId]);

  // Light polling keeps the inbox badge honest without websockets (§9.10).
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const t = setInterval(refreshNotifications, 60_000);
    return () => clearInterval(t);
  }, [isAuthenticated, refreshNotifications]);

  // --- derived ---------------------------------------------------------------

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId)
    || workspaces.find((w) => !w.isArchived)
    || workspaces[0]
    || null;
  const activeWorkspaceProjects = projects;
  const activeWorkspaceTasks = tasks;

  const currentRole = activeWorkspace?.currentUserRole
    || resolveRole(activeWorkspace, currentUser?.id);
  const can = (permission) => hasPermission(currentRole, permission);

  const activePlanId = activeSubscription ? effectivePlanId(activeSubscription) : "free";
  const activePlanLimits = getPlanLimits(activePlanId);
  const usage = activeSubscription?.usage;
  // Optimistic client gates; the server answers 402 authoritatively either way.
  const canAddProject = () => (usage ? usage.projects < usage.projectLimit
    : projects.filter((p) => p.status !== "Archived").length < activePlanLimits.projects);
  const canAddMember = () => (usage ? (usage.members + usage.pendingInvites) < usage.memberLimit
    : (activeWorkspace?.members?.length || 0) < activePlanLimits.members);

  // --- workspace actions -----------------------------------------------------

  const setActiveWorkspaceId = (id) => {
    const numeric = Number(id);
    setActiveWorkspaceIdRaw(numeric);
    localStorage.setItem(ACTIVE_WS_KEY, String(numeric));
    loadWorkspaceData(numeric);
  };

  const addWorkspace = async (name, logo = "💼", description = "", type = "company") => {
    try {
      const ws = await workspaceApi.create({ name, logo, description, type });
      await refreshWorkspaces();
      setActiveWorkspaceId(ws.id);
      pushNotification(`Workspace '${name}' created.`, "update", null, null, "Workspace Created");
      return ws;
    } catch (err) {
      toastError(err, "Could not create the workspace.");
      return null;
    }
  };

  const updateWorkspace = async (id, fields) => {
    try {
      if (fields.isArchived === true) await workspaceApi.archive(id);
      else if (fields.isArchived === false) await workspaceApi.restore(id);
      if (fields.name !== undefined || fields.logo !== undefined || fields.description !== undefined) {
        await workspaceApi.update(id, fields);
      }
      await refreshWorkspaces();
      if (id === activeWorkspaceId) refreshActivities();
    } catch (err) {
      toastError(err, "Could not update the workspace.");
    }
  };

  const deleteWorkspace = async (id) => {
    try {
      await workspaceApi.remove(id);
      const list = await refreshWorkspaces();
      if (id === activeWorkspaceId) {
        const next = list.find((w) => !w.isArchived) || list[0];
        if (next) setActiveWorkspaceId(next.id);
      }
      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  };

  const transferOwnership = async (wsId, newOwnerId) => {
    try {
      await workspaceApi.transferOwnership(wsId, newOwnerId);
      await refreshWorkspaces();
      await loadWorkspaceData(wsId);
      pushNotification("Ownership transferred.", "update", null, null, "Ownership Transferred");
    } catch (err) {
      toastError(err, "Could not transfer ownership.");
    }
  };

  const leaveWorkspace = async (wsId) => {
    try {
      await workspaceApi.leave(wsId);
      const list = await refreshWorkspaces();
      if (wsId === activeWorkspaceId) {
        const next = list.find((w) => !w.isArchived && w.id !== wsId) || list.find((w) => w.id !== wsId);
        if (next) setActiveWorkspaceId(next.id);
      }
      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  };

  const changeMemberRole = async (wsId, userId, role) => {
    try {
      await workspaceApi.changeMemberRole(wsId, userId, role);
      await loadWorkspaceData(wsId);
    } catch (err) {
      toastError(err, "Could not change the member's role.");
    }
  };

  const removeMember = async (wsId, userId) => {
    try {
      await workspaceApi.removeMember(wsId, userId);
      await loadWorkspaceData(wsId);
    } catch (err) {
      toastError(err, "Could not remove the member.");
    }
  };

  // --- invites ---------------------------------------------------------------

  const createInvite = async (wsId, { name, email, role = "Member" }) => {
    try {
      const invite = await inviteApi.create(wsId, { name, email, role });
      refreshInvites();
      refreshSubscription();
      pushNotification(`Invitation sent to ${email}.`, "update", null, null, "Invitation Sent");
      return { success: true, invite };
    } catch (err) {
      return { error: err.message };
    }
  };

  const revokeInvite = async (inviteId) => {
    try {
      await inviteApi.revoke(inviteId);
      refreshInvites();
      refreshSubscription();
    } catch (err) {
      toastError(err, "Could not revoke the invitation.");
    }
  };

  const resendInvite = async (inviteId) => {
    try {
      await inviteApi.resend(inviteId);
      pushNotification("Invitation re-sent.", "update", null, null, "Invitation Re-sent");
    } catch (err) {
      toastError(err, "Could not resend the invitation.");
    }
  };

  const acceptInvite = async (token, credentials) => {
    try {
      const { user, workspaceId } = await inviteApi.accept(token, credentials);
      setCurrentUser(user);
      setIsAuthenticated(true);
      const list = await refreshWorkspaces();
      const target = list.find((w) => w.id === workspaceId) || list[0];
      if (target) setActiveWorkspaceId(target.id);
      refreshNotifications();
      templateApi.list().then(setTemplates).catch(() => {});
      return { success: true };
    } catch (err) {
      const code = err instanceof ApiError ? err.code : "invalid";
      if (code === "INVITE_ACCEPTED") return { error: "accepted" };
      if (code === "INVITE_REVOKED") return { error: "revoked" };
      if (code === "INVITE_EXPIRED") return { error: "expired" };
      if (err.status === 401 || err.status === 400) return { error: "credentials", message: err.message };
      return { error: "invalid" };
    }
  };

  // --- auth ------------------------------------------------------------------

  const login = async (email, password) => {
    try {
      const { user } = await authApi.login(email, password);
      setCurrentUser(user);
      await bootSession();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const register = async ({ name, email, password, accountType, companyName }) => {
    try {
      const { user } = await authApi.register({ name, email, password, accountType, companyName });
      setCurrentUser(user);
      await bootSession();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message, fieldErrors: err.fieldErrors };
    }
  };

  const logout = async () => {
    setActiveTimerTaskId(null);
    try { await authApi.logout(); } catch { /* clearing locally regardless */ }
    setIsAuthenticated(false);
    setCurrentUser(null);
    setWorkspaces([]);
    setProjects([]);
    setTasks([]);
    setNotifications([]);
  };

  const verifyEmail = (token) => authApi.verifyEmail(token);
  const refreshCurrentUser = async () => {
    try { setCurrentUser(await meApi.get()); } catch { /* keep the cached user */ }
  };
  const resendVerification = (email) => authApi.resendVerification(email);
  const forgotPassword = (email) => authApi.forgotPassword(email);
  const resetPassword = (token, newPassword) => authApi.resetPassword(token, newPassword);

  const updateProfile = async (fields) => {
    try {
      const user = await meApi.update(fields);
      setCurrentUser(user);
      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await meApi.changePassword(currentPassword, newPassword);
      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  };

  const deleteAccount = async () => {
    try {
      await meApi.deleteAccount();
    } catch (err) {
      toastError(err, "Could not delete the account.");
      return;
    }
    tokenStore.clear();
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  // --- projects --------------------------------------------------------------

  const addProject = async (fields) => {
    if (!activeWorkspaceId) return null;
    try {
      const project = await projectApi.create(activeWorkspaceId, fields);
      refreshProjects();
      refreshActivities();
      refreshSubscription();
      pushNotification(`Project '${project.name}' created.`, "update", null, project.id, "Project Created");
      return project;
    } catch (err) {
      toastError(err, "Could not create the project.");
      return null;
    }
  };

  const updateProject = async (id, fields) => {
    try {
      await projectApi.update(id, fields);
      refreshProjects();
      refreshActivities();
    } catch (err) {
      toastError(err, "Could not update the project.");
    }
  };

  const deleteProject = async (id) => {
    try {
      await projectApi.remove(id);
      refreshProjects();
      refreshTasks();
      refreshActivities();
    } catch (err) {
      toastError(err, "Could not delete the project.");
    }
  };

  const addProjectMember = async (projectId, userId) => {
    try {
      await projectApi.addMember(projectId, userId);
      refreshProjects();
    } catch (err) {
      toastError(err, "Could not add the member.");
    }
  };

  const removeProjectMember = async (projectId, userId) => {
    try {
      await projectApi.removeMember(projectId, userId);
      refreshProjects();
    } catch (err) {
      toastError(err, "Could not remove the member.");
    }
  };

  const instantiateTemplate = async (templateId, targetProjectId) => {
    try {
      await projectApi.instantiateTemplate(targetProjectId, templateId);
      refreshTasks();
      refreshActivities();
      pushNotification("Template tasks created.", "update", null, targetProjectId, "Template Applied");
    } catch (err) {
      toastError(err, "Could not apply the template.");
    }
  };

  // --- tasks -----------------------------------------------------------------

  const statusIdByName = (name) => taskStatuses.find((s) => s.name === name)?.id;

  const mergeTask = (task) => {
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === task.id);
      // Preserve already-loaded children (comments/attachments) across refreshes.
      return exists
        ? prev.map((t) => (t.id === task.id
          ? {
              ...t,
              ...task,
              comments: task.comments?.length ? task.comments : t.comments,
              attachments: task.attachments?.length ? task.attachments : t.attachments,
              activities: task.activities?.length ? task.activities : t.activities,
            }
          : t))
        : [task, ...prev];
    });
  };

  const addTask = async (taskFields) => {
    const projectId = taskFields.projectId || projects[0]?.id;
    if (!projectId) return null;
    try {
      const created = await taskApi.create(projectId, {
        ...taskFields,
        statusId: taskFields.status ? statusIdByName(taskFields.status) : undefined,
      });
      // AI planner passes a checklist; the create endpoint doesn't take one.
      if (taskFields.checklist?.length) {
        for (const item of taskFields.checklist) {
          // eslint-disable-next-line no-await-in-loop
          await taskApi.addChecklistItem(created.id, item.title).catch(() => {});
        }
        created.checklistTotal = taskFields.checklist.length;
      }
      mergeTask(created);
      refreshProjects();
      refreshActivities();
      pushNotification(
        `Task '${created.title}' created.`, "assigned", created.id, projectId,
        "Task Created", `'${created.title}' was added to the project.`
      );
      refreshNotifications();
      return created;
    } catch (err) {
      toastError(err, "Could not create the task.");
      return null;
    }
  };

  const updateTask = async (id, fields) => {
    try {
      const patch = { ...fields };
      if (fields.status !== undefined && fields.statusId === undefined) {
        patch.statusId = statusIdByName(fields.status);
        delete patch.status;
      }
      const updated = await taskApi.update(id, patch);
      mergeTask(updated);
      refreshProjects();
      refreshActivities();
      refreshNotifications();
    } catch (err) {
      toastError(err, "Could not update the task.");
    }
  };

  const deleteTask = async (id) => {
    try {
      await taskApi.remove(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      if (activeTimerTaskId === id) setActiveTimerTaskId(null);
      if (activeTaskId === id) setActiveTaskId(null);
      refreshProjects();
      refreshActivities();
    } catch (err) {
      toastError(err, "Could not delete the task.");
    }
  };

  const duplicateTask = async (taskId) => {
    try {
      const copy = await taskApi.duplicate(taskId);
      mergeTask(copy);
      refreshProjects();
      pushNotification(`Task duplicated: '${copy.title}'.`, "update", copy.id, copy.projectId, "Task Duplicated");
      return copy;
    } catch (err) {
      toastError(err, "Could not duplicate the task.");
      return null;
    }
  };

  // Drawer detail hydration: children live behind separate endpoints.
  const loadTaskDetail = useCallback(async (taskId) => {
    try {
      const [detail, comments, activityList, attachmentList] = await Promise.all([
        taskApi.get(taskId),
        taskApi.comments(taskId),
        taskApi.activity(taskId),
        taskApi.attachments.list(taskId).catch(() => []),
      ]);
      setTasks((prev) => prev.map((t) => (t.id === taskId
        ? { ...t, ...detail, comments, activities: activityList, attachments: attachmentList }
        : t)));
    } catch {
      /* the drawer degrades to list data */
    }
  }, []);

  useEffect(() => {
    if (activeTaskId && activeTaskId !== "NEW_TEMP") loadTaskDetail(activeTaskId);
  }, [activeTaskId, loadTaskDetail]);

  // --- checklist / comments / attachments ------------------------------------

  const addChecklistItem = async (taskId, title) => {
    try {
      const item = await taskApi.addChecklistItem(taskId, title);
      setTasks((prev) => prev.map((t) => (t.id === taskId
        ? { ...t, checklist: [...(t.checklist || []), item], checklistTotal: (t.checklistTotal ?? 0) + 1 }
        : t)));
    } catch (err) {
      toastError(err, "Could not add the checklist item.");
    }
  };

  const toggleChecklistItem = async (taskId, itemId) => {
    const task = tasks.find((t) => t.id === taskId);
    const item = task?.checklist?.find((c) => c.id === itemId);
    if (!item) return;
    try {
      const updated = await taskApi.updateChecklistItem(itemId, { completed: !item.completed });
      setTasks((prev) => prev.map((t) => (t.id === taskId
        ? { ...t, checklist: t.checklist.map((c) => (c.id === itemId ? updated : c)) }
        : t)));
    } catch (err) {
      toastError(err, "Could not update the checklist item.");
    }
  };

  const deleteChecklistItem = async (taskId, itemId) => {
    try {
      await taskApi.removeChecklistItem(itemId);
      setTasks((prev) => prev.map((t) => (t.id === taskId
        ? { ...t, checklist: (t.checklist || []).filter((c) => c.id !== itemId) }
        : t)));
    } catch (err) {
      toastError(err, "Could not delete the checklist item.");
    }
  };

  const addComment = async (taskId, text) => {
    if (!text?.trim()) return;
    try {
      const comment = await taskApi.addComment(taskId, text.trim());
      setTasks((prev) => prev.map((t) => (t.id === taskId
        ? { ...t, comments: [...(t.comments || []), comment], commentCount: (t.commentCount ?? 0) + 1 }
        : t)));
      refreshNotifications();
    } catch (err) {
      toastError(err, "Could not post the comment.");
    }
  };

  /** Upload a real file (multipart). Accepts a File/Blob. */
  const attachFile = async (taskId, file) => {
    try {
      const attachment = await taskApi.attachments.upload(taskId, file);
      setTasks((prev) => prev.map((t) => (t.id === taskId
        ? { ...t, attachments: [...(t.attachments || []), attachment], attachmentCount: (t.attachmentCount ?? 0) + 1 }
        : t)));
      refreshNotifications();
      return attachment;
    } catch (err) {
      toastError(err, "Could not upload the file.");
      return null;
    }
  };

  const removeAttachment = async (taskId, attId) => {
    try {
      await taskApi.attachments.remove(attId);
      setTasks((prev) => prev.map((t) => (t.id === taskId
        ? { ...t, attachments: (t.attachments || []).filter((a) => a.id !== attId), attachmentCount: Math.max(0, (t.attachmentCount ?? 1) - 1) }
        : t)));
    } catch (err) {
      toastError(err, "Could not remove the file.");
    }
  };

  /** Object-URL for inline preview of a stored attachment. Caller revokes. */
  const getAttachmentBlobUrl = async (attachment) => {
    try {
      const blob = await taskApi.attachments.download(attachment.id);
      return URL.createObjectURL(blob);
    } catch (err) {
      toastError(err, "Could not load the file preview.");
      return null;
    }
  };

  const downloadAttachment = async (attachment) => {
    try {
      const blob = await taskApi.attachments.download(attachment.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toastError(err, "Could not download the file.");
    }
  };

  // Project file cabinet — API-backed.
  const loadProjectFiles = useCallback(async (projectId) => {
    try {
      const files = await projectApi.attachments.list(projectId);
      setProjectFiles((prev) => ({ ...prev, [projectId]: files }));
    } catch {
      /* non-member or transient; cabinet shows empty */
    }
  }, []);

  const attachFileToProject = async (projectId, file) => {
    try {
      const att = await projectApi.attachments.upload(projectId, file);
      setProjectFiles((prev) => ({ ...prev, [projectId]: [att, ...(prev[projectId] || [])] }));
      refreshActivities();
      return att;
    } catch (err) {
      toastError(err, "Could not upload the file.");
      return null;
    }
  };

  const removeAttachmentFromProject = async (projectId, attId) => {
    try {
      await taskApi.attachments.remove(attId); // shared /attachments/{id} delete
      setProjectFiles((prev) => ({ ...prev, [projectId]: (prev[projectId] || []).filter((a) => a.id !== attId) }));
    } catch (err) {
      toastError(err, "Could not remove the file.");
    }
  };

  // Automation rules — API-backed, Pro-gated server-side (402 on activation).
  const toggleAutomationRule = async (ruleId, active) => {
    try {
      const updated = await automationApi.setActive(ruleId, active);
      setAutomationRules((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
      return { success: true };
    } catch (err) {
      if (err instanceof ApiError && err.code === "PLAN_LIMIT") {
        return { error: "plan", message: err.message };
      }
      toastError(err, "Could not update the automation rule.");
      return { error: err.message };
    }
  };

  // --- statuses & tags -------------------------------------------------------

  const addTaskStatus = async (statusObj) => {
    if (!activeWorkspaceId) return null;
    try {
      const created = await taskStatusApi.create(activeWorkspaceId, statusObj);
      setTaskStatuses((prev) => [...prev, created]);
      return created;
    } catch (err) {
      toastError(err, "Could not add the status.");
      return null;
    }
  };

  const updateTaskStatus = async (id, fields) => {
    try {
      await taskStatusApi.update(id, fields);
      if (activeWorkspaceId) setTaskStatuses(await taskStatusApi.list(activeWorkspaceId));
      refreshTasks(); // renames propagate into task rows
    } catch (err) {
      toastError(err, "Could not update the status.");
    }
  };

  const deleteTaskStatus = async (id) => {
    try {
      await taskStatusApi.remove(id);
      if (activeWorkspaceId) setTaskStatuses(await taskStatusApi.list(activeWorkspaceId));
      refreshTasks(); // affected tasks fell back to the default status
    } catch (err) {
      toastError(err, "Could not delete the status.");
    }
  };

  const createTag = async (name, colorStyle) => {
    if (!activeWorkspaceId) return null;
    try {
      const tag = await tagApi.create(activeWorkspaceId, name, colorStyle);
      setTags((prev) => [...prev, tag]);
      return tag;
    } catch (err) {
      toastError(err, "Could not create the tag.");
      return null;
    }
  };

  // --- time tracking ---------------------------------------------------------

  const logTaskTime = async (taskId, hours) => {
    try {
      const updated = await taskApi.logTime(taskId, hours);
      mergeTask(updated);
    } catch (err) {
      toastError(err, "Could not log time.");
    }
  };

  const toggleTaskTimer = (taskId) => {
    if (activeTimerTaskId === taskId) {
      const hours = Math.max(0.01, Number((timerSeconds / 3600).toFixed(2)));
      setActiveTimerTaskId(null);
      logTaskTime(taskId, hours);
    } else {
      if (activeTimerTaskId) {
        const hours = Math.max(0.01, Number((timerSeconds / 3600).toFixed(2)));
        logTaskTime(activeTimerTaskId, hours);
      }
      setActiveTimerTaskId(taskId);
      setTimerSeconds(0);
    }
  };

  const addManualTime = (taskId, hours) => {
    const h = parseFloat(hours) || 0;
    if (h <= 0) return;
    logTaskTime(taskId, h);
  };

  // --- notifications ---------------------------------------------------------

  const setNotificationRead = async (id, read) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read } : n)));
    try { await notificationApi.setRead(id, read); } catch { refreshNotifications(); }
  };

  const markAllNotificationsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try { await notificationApi.markAllRead(); } catch { refreshNotifications(); }
  };

  const clearReadNotifications = async () => {
    setNotifications((prev) => prev.filter((n) => !n.read));
    try { await notificationApi.clearRead(); } catch { refreshNotifications(); }
  };

  const deleteNotification = async (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try { await notificationApi.remove(id); } catch { refreshNotifications(); }
  };

  const setNotificationSettings = async (next) => {
    const value = typeof next === "function" ? next(notificationSettings) : next;
    setNotificationSettingsState(value);
    try {
      await notificationApi.updatePreferences(value);
    } catch (err) {
      toastError(err, "Could not save preferences.");
    }
  };

  // --- billing ---------------------------------------------------------------

  const changePlan = async (wsId, planId, interval = "monthly", seats = 1) => {
    try {
      await billingApi.changePlan(wsId, planId, interval, seats);
      await refreshSubscription();
      pushNotification(`Workspace plan updated.`, "update", null, null, "Plan Updated");
    } catch (err) {
      toastError(err, "Could not change the plan.");
    }
  };

  const cancelSubscription = async (wsId) => {
    try {
      await billingApi.cancel(wsId);
      await refreshSubscription();
      pushNotification("Subscription canceled.", "update", null, null, "Subscription Canceled");
    } catch (err) {
      toastError(err, "Could not cancel the subscription.");
    }
  };

  const startTrial = async (wsId, planId = "pro") => {
    try {
      await billingApi.startTrial(wsId, planId);
      await refreshSubscription();
      pushNotification("Your 14-day trial has started.", "update", null, null, "Trial Started");
    } catch (err) {
      toastError(err, "Could not start the trial.");
    }
  };

  const getSubscription = () => activeSubscription;

  // --- misc compatibility ----------------------------------------------------

  const logActivity = () => { /* the backend writes the activity trail now */ };
  const resetToDefaultData = () => refreshWorkspaceData();

  const value = {
    // data
    users, setUsers,
    workspaces, setWorkspaces,
    activeWorkspaceId, setActiveWorkspaceId,
    activeWorkspace,
    projects, setProjects,
    activeWorkspaceProjects,
    tasks, setTasks,
    activeWorkspaceTasks,
    tags, setTags,
    notifications, setNotifications,
    notificationSettings, setNotificationSettings,
    activities, setActivities,
    templates, setTemplates,
    automationRules, setAutomationRules, toggleAutomationRule,
    taskStatuses, setTaskStatuses,
    invites,
    projectFiles,
    // async lifecycle
    bootLoading, dataLoading, dataError, refreshWorkspaceData, refreshNotifications,
    simulateErrors, setSimulateErrors,
    // session
    currentUser, setCurrentUser,
    isAuthenticated, setIsAuthenticated,
    theme, setTheme,
    // ui state
    quickAddTaskOpen, setQuickAddTaskOpen,
    aiPlannerOpen, setAiPlannerOpen,
    activeTaskId, setActiveTaskId,
    activeToast, setActiveToast,
    pushNotification,
    // rbac & billing derived
    currentRole, can,
    activeSubscription, activePlanId, activePlanLimits,
    canAddProject, canAddMember,
    getSubscription,
    // timer
    activeTimerTaskId, timerSeconds, toggleTaskTimer, addManualTime,
    // auth
    login, register, logout,
    verifyEmail, resendVerification, forgotPassword, resetPassword, refreshCurrentUser,
    plans, refreshPlans,
    isSystemOwner: currentUser?.systemRole === "SYSTEM_OWNER",
    updateProfile, changePassword, deleteAccount,
    // workspaces & members
    addWorkspace, updateWorkspace, deleteWorkspace,
    transferOwnership, leaveWorkspace,
    changeMemberRole, removeMember,
    // invites
    createInvite, revokeInvite, resendInvite, acceptInvite,
    // projects
    addProject, updateProject, deleteProject,
    addProjectMember, removeProjectMember,
    instantiateTemplate,
    // tasks
    addTask, updateTask, deleteTask, duplicateTask, loadTaskDetail,
    addChecklistItem, toggleChecklistItem, deleteChecklistItem,
    addComment,
    attachFile, removeAttachment, downloadAttachment, getAttachmentBlobUrl,
    attachFileToProject, removeAttachmentFromProject, loadProjectFiles,
    addTaskStatus, updateTaskStatus, deleteTaskStatus,
    createTag,
    // notifications
    setNotificationRead, markAllNotificationsRead, clearReadNotifications, deleteNotification,
    // billing
    changePlan, cancelSubscription, startTrial,
    // misc
    logActivity, resetToDefaultData,
    // server-query escape hatches for pages that want them
    dashboardApi, searchApi,
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
