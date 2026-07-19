/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Domain-grouped endpoint functions (BACKEND_PLAN.md §4–§6). Every function
 * speaks wire-shape to the server and returns UI-shape via the adapters, so
 * the provider (and pages) never see backend casing or envelopes.
 */

import { http, tokenStore } from "./client";
import {
  activityToUi,
  attachmentToUi,
  checklistItemToUi,
  commentToUi,
  dashboardToUi,
  inviteToUi,
  memberToUi,
  notificationPrefsToApi,
  notificationPrefsToUi,
  notificationToUi,
  notificationTypeToApi,
  priorityToApi,
  projectStatusToApi,
  projectToUi,
  roleToApi,
  searchToUi,
  subscriptionToUi,
  tagToUi,
  taskActivityToUi,
  taskStatusToUi,
  taskToUi,
  upperToApi,
  userToUi,
  workspaceToUi,
  workspaceTypeToApi,
 planToUi,
 invoiceToUi,
 adminPlanToUi,
 adminUserRowToUi,
 adminUserDetailToUi,
 adminWorkspaceRowToUi,
 adminAuditEntryToUi,
 adminMetricsToUi,
} from "./adapters";

// --- auth (§4) ---------------------------------------------------------------

export const authApi = {
  async register({ name, email, password, accountType, companyName }) {
    const data = await http.post("/auth/register", {
      name, email, password,
      accountType: workspaceTypeToApi(accountType),
      companyName: companyName || null,
    }, { auth: false });
    tokenStore.set(data);
    return { user: userToUi(data.user) };
  },

  async login(email, password) {
    const data = await http.post("/auth/login", { email, password }, { auth: false });
    tokenStore.set(data);
    return { user: userToUi(data.user) };
  },

  async logout() {
    const refreshToken = tokenStore.refresh;
    try {
      if (refreshToken) await http.post("/auth/logout", { refreshToken });
    } finally {
      tokenStore.clear();
    }
  },

  verifyEmail: (token) => http.post("/auth/verify-email", { token }, { auth: false }),
  resendVerification: (email) => http.post("/auth/resend-verification", { email }, { auth: false }),
  forgotPassword: (email) => http.post("/auth/forgot-password", { email }, { auth: false }),
  resetPassword: (token, newPassword) => http.post("/auth/reset-password", { token, newPassword }, { auth: false }),
};

export const meApi = {
  get: async () => userToUi(await http.get("/me")),
  update: async (patch) => userToUi(await http.patch("/me", patch)),
  changePassword: (currentPassword, newPassword) => http.patch("/me/password", { currentPassword, newPassword }),
  uploadAvatar: async (file) => {
    const form = new FormData();
    form.append("file", file);
    return userToUi(await http.post("/me/avatar", form));
  },
  removeAvatar: async () => userToUi(await http.delete("/me/avatar")),
  deleteAccount: () => http.delete("/me"),
};

// --- workspaces & members (§6) ----------------------------------------------

export const workspaceApi = {
  list: async () => (await http.get("/workspaces")).map((w) => workspaceToUi(w)),
  get: async (id) => workspaceToUi(await http.get(`/workspaces/${id}`)),
  create: async ({ name, logo, description, type }) =>
    workspaceToUi(await http.post("/workspaces", {
      name, logoKey: logo, description: description || null, type: workspaceTypeToApi(type || "company"),
    })),
  update: async (id, fields) =>
    workspaceToUi(await http.patch(`/workspaces/${id}`, {
      name: fields.name, logoKey: fields.logo, description: fields.description,
    })),
  archive: (id) => http.post(`/workspaces/${id}/archive`),
  restore: (id) => http.post(`/workspaces/${id}/restore`),
  remove: (id) => http.delete(`/workspaces/${id}`),
  transferOwnership: (id, newOwnerId) => http.post(`/workspaces/${id}/transfer-ownership`, { newOwnerId }),
  leave: (id) => http.post(`/workspaces/${id}/leave`),

  members: async (id) => (await http.get(`/workspaces/${id}/members`)).map(memberToUi),
  changeMemberRole: (id, userId, role) => http.patch(`/workspaces/${id}/members/${userId}`, { role: roleToApi(role) }),
  removeMember: (id, userId) => http.delete(`/workspaces/${id}/members/${userId}`),

  activity: async (id, page = 0, size = 20) => {
    const res = await http.get(`/workspaces/${id}/activity?page=${page}&size=${size}`);
    return { ...res, content: res.content.map(activityToUi) };
  },
};

export const inviteApi = {
  create: async (workspaceId, { name, email, role }) =>
    inviteToUi(await http.post(`/workspaces/${workspaceId}/invites`, { name: name || null, email, role: roleToApi(role || "Member") })),
  listPending: async (workspaceId) =>
    (await http.get(`/workspaces/${workspaceId}/invites?status=PENDING`)).map(inviteToUi),
  resend: (inviteId) => http.post(`/invites/${inviteId}/resend`),
  revoke: (inviteId) => http.delete(`/invites/${inviteId}`),

  // Public endpoints (accept page)
  lookup: (token) => http.get(`/invites/token/${token}`, { auth: false }),
  accept: async (token, { name, password } = {}) => {
    const data = await http.post(`/invites/token/${token}/accept`,
      { name: name || null, password: password || null },
      { auth: tokenStore.hasSession });
    tokenStore.set(data);
    return { user: userToUi(data.user), workspaceId: data.workspaceId };
  },
};

// --- projects, statuses, tags (§6) ------------------------------------------

export const projectApi = {
  list: async (workspaceId, includeArchived = true) =>
    (await http.get(`/workspaces/${workspaceId}/projects?includeArchived=${includeArchived}`)).map(projectToUi),
  create: async (workspaceId, { name, description, icon, color, status, deadline }) =>
    projectToUi(await http.post(`/workspaces/${workspaceId}/projects`, {
      name,
      description: description || null,
      iconKey: icon || null,
      color: color || null,
      status: status ? projectStatusToApi(status) : null,
      deadline: deadline ? deadline.slice(0, 10) : null,
    })),
  update: async (id, fields) =>
    projectToUi(await http.patch(`/projects/${id}`, {
      name: fields.name,
      description: fields.description,
      iconKey: fields.icon,
      color: fields.color,
      status: fields.status ? projectStatusToApi(fields.status) : undefined,
      deadline: fields.deadline ? String(fields.deadline).slice(0, 10) : undefined,
    })),
  remove: (id) => http.delete(`/projects/${id}`),
  archive: (id) => http.post(`/projects/${id}/archive`),
  restore: (id) => http.post(`/projects/${id}/restore`),
  addMember: (id, userId) => http.post(`/projects/${id}/members/${userId}`),
  removeMember: (id, userId) => http.delete(`/projects/${id}/members/${userId}`),
  instantiateTemplate: (id, templateId) => http.post(`/projects/${id}/instantiate-template/${templateId}`),

  attachments: {
    list: async (projectId) => (await http.get(`/projects/${projectId}/attachments`)).map(attachmentToUi),
    upload: async (projectId, file) => {
      const form = new FormData();
      form.append("file", file);
      return attachmentToUi(await http.post(`/projects/${projectId}/attachments`, form));
    },
  },
};

export const templateApi = {
  list: () => http.get("/templates"),
};

const AUTOMATION_ACTIONS = {
  COMPLETE_CLEANUP: "When a task moves to a completed status, its tags are cleared and the assignee is removed.",
  URGENT_ALERT: "When a task is flagged Urgent, watchers get an immediate alert notification.",
};

export const automationApi = {
  list: async (workspaceId) =>
    (await http.get(`/workspaces/${workspaceId}/automation-rules`)).map((r) => ({
      id: r.id,
      ruleKey: r.ruleKey,
      name: r.name,
      trigger: r.name,
      action: AUTOMATION_ACTIONS[r.ruleKey] || "Automated workspace action.",
      active: r.active,
    })),
  setActive: async (ruleId, active) => {
    const r = await http.patch(`/automation-rules/${ruleId}`, { active });
    return { id: r.id, ruleKey: r.ruleKey, name: r.name, trigger: r.name, action: AUTOMATION_ACTIONS[r.ruleKey] || "Automated workspace action.", active: r.active };
  },
};

export const taskStatusApi = {
  list: async (workspaceId) => (await http.get(`/workspaces/${workspaceId}/task-statuses`)).map(taskStatusToUi),
  create: async (workspaceId, s) =>
    taskStatusToUi(await http.post(`/workspaces/${workspaceId}/task-statuses`, {
      name: s.name, bgStyle: s.bg, textStyle: s.text, borderStyle: s.border, iconKey: s.icon,
    })),
  update: async (id, fields) =>
    taskStatusToUi(await http.patch(`/task-statuses/${id}`, {
      name: fields.name, bgStyle: fields.bg, textStyle: fields.text, borderStyle: fields.border,
      iconKey: fields.icon, isDefault: fields.isDefault,
    })),
  remove: (id) => http.delete(`/task-statuses/${id}`),
};

export const tagApi = {
  list: async (workspaceId) => (await http.get(`/workspaces/${workspaceId}/tags`)).map(tagToUi),
  create: async (workspaceId, name, colorStyle) =>
    tagToUi(await http.post(`/workspaces/${workspaceId}/tags`, { name, colorStyle: colorStyle || null })),
};

// --- tasks & children (§6) ---------------------------------------------------

export const taskApi = {
  list: async (workspaceId, { projectId, statusId, priority, assigneeId, segment, page = 0, size = 200 } = {}) => {
    const params = new URLSearchParams({ page, size });
    if (projectId) params.set("projectId", projectId);
    if (statusId) params.set("statusId", statusId);
    if (priority) params.set("priority", priorityToApi(priority));
    if (assigneeId) params.set("assigneeId", assigneeId);
    if (segment) params.set("segment", segment);
    const res = await http.get(`/workspaces/${workspaceId}/tasks?${params}`);
    return { ...res, content: res.content.map(taskToUi) };
  },
  get: async (id) => taskToUi(await http.get(`/tasks/${id}`)),
  create: async (projectId, t) =>
    taskToUi(await http.post(`/projects/${projectId}/tasks`, {
      title: t.title,
      description: t.description || null,
      statusId: t.statusId ?? null,
      priority: t.priority ? priorityToApi(t.priority) : null,
      assigneeId: t.assigneeId ?? null,
      dueDate: t.dueDate ? String(t.dueDate).slice(0, 10) : null,
      startDate: t.startDate ? String(t.startDate).slice(0, 10) : null,
      estimatedHours: t.estimatedTime ?? null,
      tagIds: t.tags || [],
      dependencyIds: t.dependencies || [],
    })),
  update: async (id, fields) =>
    taskToUi(await http.patch(`/tasks/${id}`, {
      title: fields.title,
      description: fields.description,
      statusId: fields.statusId,
      priority: fields.priority ? priorityToApi(fields.priority) : undefined,
      assigneeId: fields.assigneeId,
      dueDate: fields.dueDate ? String(fields.dueDate).slice(0, 10) : undefined,
      startDate: fields.startDate ? String(fields.startDate).slice(0, 10) : undefined,
      estimatedHours: fields.estimatedTime,
      tagIds: fields.tags,
      dependencyIds: fields.dependencies,
    })),
  remove: (id) => http.delete(`/tasks/${id}`),
  duplicate: async (id) => taskToUi(await http.post(`/tasks/${id}/duplicate`)),
  activity: async (id, page = 0, size = 50) => {
    const res = await http.get(`/tasks/${id}/activity?page=${page}&size=${size}`);
    return res.content.map(taskActivityToUi);
  },

  addChecklistItem: async (taskId, title) => checklistItemToUi(await http.post(`/tasks/${taskId}/checklist`, { title })),
  updateChecklistItem: async (itemId, fields) => checklistItemToUi(await http.patch(`/checklist/${itemId}`, fields)),
  removeChecklistItem: (itemId) => http.delete(`/checklist/${itemId}`),

  comments: async (taskId) => (await http.get(`/tasks/${taskId}/comments`)).map(commentToUi),
  addComment: async (taskId, body) => commentToUi(await http.post(`/tasks/${taskId}/comments`, { body })),

  addWatcher: (taskId, userId) => http.put(`/tasks/${taskId}/watchers/${userId}`),
  removeWatcher: (taskId, userId) => http.delete(`/tasks/${taskId}/watchers/${userId}`),
  logTime: async (taskId, hours) => taskToUi(await http.post(`/tasks/${taskId}/time`, { hours })),

  attachments: {
    list: async (taskId) => (await http.get(`/tasks/${taskId}/attachments`)).map(attachmentToUi),
    upload: async (taskId, file) => {
      const form = new FormData();
      form.append("file", file);
      return attachmentToUi(await http.post(`/tasks/${taskId}/attachments`, form));
    },
    download: (attachmentId) => http.get(`/attachments/${attachmentId}/download`, { blob: true }),
    remove: (attachmentId) => http.delete(`/attachments/${attachmentId}`),
  },
};

// --- notifications (§6) ------------------------------------------------------

export const notificationApi = {
  list: async ({ unread, type, search, page = 0, size = 100 } = {}) => {
    const params = new URLSearchParams({ page, size });
    if (unread != null) params.set("unread", unread);
    if (type) params.set("type", notificationTypeToApi(type));
    if (search) params.set("search", search);
    const res = await http.get(`/me/notifications?${params}`);
    return { ...res, content: res.content.map(notificationToUi) };
  },
  setRead: async (id, read) => notificationToUi(await http.patch(`/notifications/${id}`, { read })),
  markAllRead: () => http.post("/me/notifications/mark-all-read"),
  clearRead: () => http.delete("/me/notifications/read"),
  remove: (id) => http.delete(`/notifications/${id}`),
  getPreferences: async () => notificationPrefsToUi(await http.get("/me/notification-preferences")),
  updatePreferences: async (prefs) =>
    notificationPrefsToUi(await http.put("/me/notification-preferences", notificationPrefsToApi(prefs))),
};

// --- billing (§6) ------------------------------------------------------------

export const billingApi = {
  // Invoices are billing-page-only — fetched separately so the boot path
  // stays one request (finding: per-screen loading).
  subscription: async (workspaceId) =>
    subscriptionToUi(await http.get(`/workspaces/${workspaceId}/subscription`), []),
  invoices: async (workspaceId) =>
    (await http.get(`/workspaces/${workspaceId}/invoices`)).map(invoiceToUi),
  changePlan: (workspaceId, plan, interval, seats) =>
    http.post(`/workspaces/${workspaceId}/subscription/change`, {
      plan: upperToApi(plan), interval: upperToApi(interval), seats,
    }),
  cancel: (workspaceId) => http.post(`/workspaces/${workspaceId}/subscription/cancel`),
  startTrial: (workspaceId, plan = "pro") =>
    http.post(`/workspaces/${workspaceId}/subscription/trial`, { plan: upperToApi(plan) }),
};

// --- dashboard & search (§6) -------------------------------------------------

export const dashboardApi = {
  get: async (workspaceId) => dashboardToUi(await http.get(`/workspaces/${workspaceId}/dashboard`)),
};

export const searchApi = {
  query: async (workspaceId, q, type) => {
    const params = new URLSearchParams({ q });
    if (type) params.set("type", type);
    return searchToUi(await http.get(`/workspaces/${workspaceId}/search?${params}`));
  },
};

// --- plans (public catalog) ----------------------------------------------------

export const planApi = {
  list: async () => (await http.get("/plans")).map(planToUi),
};

// --- owner console (System Owner role required server-side) --------------------

const adminPage = (data, mapRow) => ({
  content: data.content.map(mapRow),
  page: data.page,
  size: data.size,
  totalElements: data.totalElements,
  totalPages: data.totalPages,
  hasNext: data.hasNext,
});

const q = (params) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, value);
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
};

export const ownerApi = {
  metrics: async () => adminMetricsToUi(await http.get("/admin/metrics")),

  users: {
    list: async ({ query, status, plan, sort, page = 0, size = 20 } = {}) =>
      adminPage(await http.get(`/admin/users${q({ query, status, plan, sort, page, size })}`), adminUserRowToUi),
    get: async (id) => adminUserDetailToUi(await http.get(`/admin/users/${id}`)),
    setStatus: async (id, enabled, reason) =>
      adminUserRowToUi(await http.patch(`/admin/users/${id}/status`, { enabled, reason: reason || null })),
  },

  subscriptions: {
    list: async ({ query, plan, status, page = 0, size = 20 } = {}) =>
      adminPage(await http.get(`/admin/subscriptions${q({ query, plan, status, page, size })}`), adminWorkspaceRowToUi),
    update: async (workspaceId, patch) =>
      adminWorkspaceRowToUi(await http.patch(`/admin/subscriptions/${workspaceId}`, patch)),
  },

  plans: {
    list: async () => (await http.get("/admin/plans")).map(adminPlanToUi),
    create: async (body) => adminPlanToUi(await http.post("/admin/plans", body)),
    update: async (code, body) => adminPlanToUi(await http.patch(`/admin/plans/${code}`, body)),
    setStatus: async (code, status) => adminPlanToUi(await http.post(`/admin/plans/${code}/status`, { status })),
    remove: (code) => http.delete(`/admin/plans/${code}`),
  },

  audit: {
    list: async ({ targetType, page = 0, size = 25 } = {}) =>
      adminPage(await http.get(`/admin/audit${q({ targetType, page, size })}`), adminAuditEntryToUi),
  },
};
