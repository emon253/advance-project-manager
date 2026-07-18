/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_URL } from "./client";

/**
 * Wire ⇄ UI adapters (BACKEND_PLAN.md §9.7).
 *
 * The backend serializes enum NAMES (UPPERCASE) and integer cents; the UI was
 * built against the mock's mixed casing and dollar amounts. Every mapping
 * between the two lives HERE — components keep rendering the shapes they were
 * built with, and requests are translated back on the way out.
 */

// --- enum casing -------------------------------------------------------------

const TITLE = (s) => (s ? s.charAt(0) + s.slice(1).toLowerCase() : s);

/** URGENT → Urgent (UI PriorityBadge keys) */
export const priorityToUi = (p) => TITLE(p);
export const priorityToApi = (p) => (p ? p.toUpperCase() : p);

/** OWNER → Owner (UI role labels) */
export const roleToUi = (r) => TITLE(r);
export const roleToApi = (r) => (r ? r.toUpperCase() : r);

/** ACTIVE / ON_HOLD → Active / On Hold (UI project status labels) */
export const projectStatusToUi = (s) =>
  s ? s.split("_").map(TITLE).join(" ") : s;
export const projectStatusToApi = (s) =>
  s ? s.toUpperCase().replace(/\s+/g, "_") : s;

/** PRO/ACTIVE/YEARLY → pro/active/yearly (billingUtils keys) */
export const lowerToUi = (v) => (v ? v.toLowerCase() : v);
export const upperToApi = (v) => (v ? v.toUpperCase() : v);

/** COMPANY → company (workspace type) */
export const workspaceTypeToUi = lowerToUi;
export const workspaceTypeToApi = upperToApi;

/** ASSIGNED → assigned (notification type keys used by the inbox UI) */
export const notificationTypeToUi = lowerToUi;
export const notificationTypeToApi = upperToApi;

// --- small helpers -----------------------------------------------------------

const iso = (v) => (v == null ? null : String(v));

export function formatBytes(bytes) {
  if (bytes == null) return "";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

// --- users / workspaces ------------------------------------------------------

/** UserResponse | MemberResponse | UserSummaryResponse → mock user shape */
export function userToUi(u) {
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email ?? null,
    avatar: u.avatarInitials || u.name?.slice(0, 2).toUpperCase(),
    color: u.avatarColor || "bg-primary text-white",
    role: u.role ? roleToUi(u.role) : undefined,
    phone: u.phone ?? null,
    emailVerified: u.emailVerified,
    systemRole: u.systemRole || "USER",
    avatarUrl: toAvatarUrl(u.avatarUrl),
  };
}

/** API-relative avatar path -> absolute URL a plain <img> can load. */
export function toAvatarUrl(path) {
  if (!path) return null;
  return path.startsWith("http") ? path : `${BASE_URL}${path}`;
}

export function memberToUi(m) {
  return { ...userToUi(m), role: roleToUi(m.role) };
}

/** WorkspaceResponse → mock workspace shape (members hydrated separately) */
export function workspaceToUi(w, members = []) {
  return {
    id: w.id,
    name: w.name,
    logo: w.logoKey || "💼",
    description: w.description || "",
    ownerId: w.ownerId,
    isArchived: !!w.archived,
    type: workspaceTypeToUi(w.type) || "company",
    currentUserRole: roleToUi(w.currentUserRole),
    memberCount: w.memberCount ?? members.length,
    members,
    createdAt: iso(w.createdAt),
  };
}

// --- projects / tasks --------------------------------------------------------

export function projectToUi(p) {
  return {
    id: p.id,
    workspaceId: p.workspaceId,
    name: p.name,
    description: p.description || "",
    icon: p.iconKey || "📁",
    color: p.color || "#4f46e5",
    status: projectStatusToUi(p.status),
    startDate: iso(p.startDate),
    createdAt: iso(p.createdAt),
    deadline: iso(p.deadline),
    members: p.memberIds || [],
    progress: p.progressPct ?? 0,
    doneTasks: p.doneTasks,
    totalTasks: p.totalTasks,
  };
}

export function checklistItemToUi(c) {
  return { id: c.id, title: c.title, completed: !!c.completed, createdAt: iso(c.createdAt) };
}

export function commentToUi(c) {
  return {
    id: c.id,
    userId: c.author?.id ?? null,
    author: userToUi(c.author),
    text: c.body,
    timestamp: iso(c.createdAt),
  };
}

export function attachmentToUi(a) {
  return {
    id: a.id,
    name: a.fileName,
    size: formatBytes(a.sizeBytes),
    sizeBytes: a.sizeBytes,
    type: a.contentType || "file",
    timestamp: iso(a.createdAt),
    createdAt: iso(a.createdAt),
    author: a.uploadedBy?.name || "",
  };
}

export function taskActivityToUi(a) {
  return { id: a.id, text: a.text, timestamp: iso(a.createdAt) };
}

/** TaskResponse → mock task shape (lists carry counts; detail carries children) */
export function taskToUi(t) {
  return {
    id: t.id,
    projectId: t.project?.id ?? t.projectId ?? null,
    projectName: t.project?.name,
    title: t.title,
    description: t.description || "",
    status: t.statusName,
    statusId: t.statusId,
    priority: priorityToUi(t.priority),
    assigneeId: t.assignee?.id ?? null,
    assignee: userToUi(t.assignee),
    startDate: iso(t.startDate),
    createdAt: iso(t.createdAt),
    dueDate: iso(t.dueDate),
    estimatedTime: t.estimatedHours != null ? Number(t.estimatedHours) : 0,
    actualTime: t.actualHours != null ? Number(t.actualHours) : 0,
    tags: t.tagIds || [],
    watchers: t.watcherIds || [],
    dependencies: t.dependencyIds || [],
    recurring: { isRecurring: !!t.recurring },
    // Lists carry counts; the drawer loads full children on demand.
    checklist: (t.checklist || []).map(checklistItemToUi),
    checklistDone: t.checklistDone ?? 0,
    checklistTotal: t.checklistTotal ?? (t.checklist?.length || 0),
    commentCount: t.commentCount ?? 0,
    attachmentCount: t.attachmentCount ?? 0,
    comments: [],
    attachments: [],
    activities: [],
  };
}

const STATUS_STYLE_FALLBACK = {
  bg: "bg-zinc-100", text: "text-zinc-700", border: "border-zinc-200",
  darkBg: "dark:bg-zinc-800", darkText: "dark:text-zinc-300", darkBorder: "dark:border-zinc-700",
};

/** TaskStatusResponse → mock status shape (StatusBadge reads these classes) */
export function taskStatusToUi(s) {
  return {
    id: s.id,
    name: s.name,
    bg: s.bgStyle || STATUS_STYLE_FALLBACK.bg,
    text: s.textStyle || STATUS_STYLE_FALLBACK.text,
    border: s.borderStyle || STATUS_STYLE_FALLBACK.border,
    darkBg: s.darkBgStyle || STATUS_STYLE_FALLBACK.darkBg,
    darkText: s.darkTextStyle || STATUS_STYLE_FALLBACK.darkText,
    darkBorder: s.darkBorderStyle || STATUS_STYLE_FALLBACK.darkBorder,
    icon: s.iconKey || "FileEdit",
    isDefault: !!s.isDefault,
    system: !!s.isSystem,
    isCompleted: !!s.isCompleted,
    isCancelled: !!s.isCancelled,
    isStarted: !!s.isStarted,
    sortOrder: s.sortOrder,
  };
}

export function tagToUi(t) {
  return { id: t.id, name: t.name, color: t.colorStyle || "bg-primary/8 text-primary border-primary/20" };
}

// --- invitations / activity --------------------------------------------------

export function inviteToUi(i) {
  return {
    id: i.id,
    token: i.token ?? null,
    workspaceId: i.workspaceId,
    email: i.email,
    name: i.name,
    role: roleToUi(i.role),
    status: lowerToUi(i.status),
    invitedBy: i.invitedBy,
    expiresAt: iso(i.expiresAt),
    createdAt: iso(i.createdAt),
  };
}

export function activityToUi(a) {
  return {
    id: a.id,
    userId: a.actorId ?? null,
    text: a.text,
    timestamp: iso(a.createdAt),
    time: iso(a.createdAt),
  };
}

// --- notifications -----------------------------------------------------------

export function notificationToUi(n) {
  return {
    id: n.id,
    type: notificationTypeToUi(n.type),
    title: n.title,
    message: n.message,
    text: `${n.title}: ${n.message}`,
    read: !!n.read,
    timestamp: iso(n.createdAt),
    time: iso(n.createdAt),
    taskId: n.taskId ?? null,
    projectId: n.projectId ?? null,
    workspaceId: n.workspaceId,
  };
}

export function notificationPrefsToUi(p) {
  return {
    inApp: p.inApp,
    emailMock: p.email,
    pushMock: p.push,
    dailySummary: p.dailySummary,
    weeklySummary: p.weeklySummary,
    dueReminders: p.dueReminders,
    mentions: p.mentions,
    projectUpdates: p.projectUpdates,
  };
}

export function notificationPrefsToApi(p) {
  return {
    inApp: !!p.inApp,
    email: !!p.emailMock,
    push: !!p.pushMock,
    dailySummary: !!p.dailySummary,
    weeklySummary: !!p.weeklySummary,
    dueReminders: !!p.dueReminders,
    mentions: !!p.mentions,
    projectUpdates: !!p.projectUpdates,
  };
}

// --- billing -----------------------------------------------------------------

/** SubscriptionResponse (+InvoiceResponse[]) → the mock subscription shape billingUtils reads */
export function subscriptionToUi(s, invoices = []) {
  return {
    plan: lowerToUi(s.plan) || "free",
    interval: lowerToUi(s.interval) || "monthly",
    seats: s.seats ?? 1,
    status: lowerToUi(s.status) || "active",
    renewsAt: iso(s.renewsAt),
    trialEndsAt: iso(s.trialEndsAt),
    paymentMethod: s.paymentMethod
      ? { brand: s.paymentMethod.brand, last4: s.paymentMethod.last4 }
      : null,
    usage: s.usage
      ? {
          projects: s.usage.projects,
          members: s.usage.members,
          pendingInvites: s.usage.pendingInvites,
          projectLimit: s.usage.projectLimit,
          memberLimit: s.usage.memberLimit,
        }
      : null,
    invoices: invoices.map(invoiceToUi),
  };
}

export function invoiceToUi(inv) {
  return {
    id: inv.id,
    date: iso(inv.issuedAt),
    description: inv.description,
    amount: Math.round(inv.amountCents) / 100,
    currency: inv.currency || "USD",
    status: TITLE(inv.status), // PAID → Paid
  };
}

// --- dashboard / search ------------------------------------------------------

export function dashboardToUi(d) {
  return {
    stats: d.stats,
    projectPerformance: d.projectPerformance || [],
    workload: (d.workload || []).map((w) => ({
      userId: w.userId,
      name: w.name,
      avatar: w.avatarInitials,
      color: w.avatarColor,
      activeTaskCount: w.activeTaskCount,
    })),
    recentActivity: (d.recentActivity || []).map(activityToUi),
  };
}

export function searchToUi(s) {
  return {
    tasks: (s.taskHits || []).map((h) => ({
      id: h.id, title: h.title, projectId: h.projectId, projectName: h.projectName, status: h.status,
    })),
    projects: (s.projectHits || []).map((h) => ({
      id: h.id, name: h.name, icon: h.iconKey, color: h.color, status: projectStatusToUi(h.status),
    })),
    people: (s.peopleHits || []).map((h) => ({
      id: h.id, name: h.name, email: h.email, avatar: h.avatarInitials, color: h.avatarColor, avatarUrl: toAvatarUrl(h.avatarUrl),
    })),
  };
}

// --- plans (owner-managed catalog) -------------------------------------------

const CURRENCY_SYMBOLS = { USD: "$", BDT: "\u09f3" };

export function planToUi(p) {
  return {
    id: p.code.toLowerCase(),
    code: p.code,
    name: p.name,
    tagline: p.tagline || "",
    currency: p.currency || "USD",
    symbol: CURRENCY_SYMBOLS[p.currency] || "$",
    monthly: Math.round(p.monthlyPerSeatCents) / 100,
    yearly: Math.round(p.yearlyPerSeatCents) / 100,
    highlight: !!p.highlight,
    trialDays: p.trialDays ?? 14,
    features: p.features || [],
    limits: {
      projects: p.projectLimit == null ? Infinity : p.projectLimit,
      members: p.memberLimit == null ? Infinity : p.memberLimit,
      workspaces: p.workspaceLimit == null ? Infinity : p.workspaceLimit,
      ai: !!p.ai,
      customStatuses: !!p.customStatuses,
      automation: !!p.automation,
    },
  };
}

// --- owner console ------------------------------------------------------------

export function adminPlanToUi(p) {
  return {
    ...planToUi(p),
    visible: !!p.visible,
    status: p.status, // ACTIVE | INACTIVE | ARCHIVED
    isDefault: !!p.defaultPlan,
    sortOrder: p.sortOrder ?? 0,
    subscriberCount: p.subscriberCount ?? 0,
    projectLimitRaw: p.projectLimit,
    memberLimitRaw: p.memberLimit,
    workspaceLimitRaw: p.workspaceLimit,
    monthlyCents: p.monthlyPerSeatCents,
    yearlyCents: p.yearlyPerSeatCents,
  };
}

export function adminUserRowToUi(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    initials: u.avatarInitials,
    avatarUrl: toAvatarUrl(u.avatarUrl),
    color: u.avatarColor,
    emailVerified: !!u.emailVerified,
    systemRole: u.systemRole,
    enabled: !!u.enabled,
    createdAt: iso(u.createdAt),
    lastLoginAt: iso(u.lastLoginAt),
    ownedWorkspaces: u.ownedWorkspaces ?? 0,
    memberWorkspaces: u.memberWorkspaces ?? 0,
    ownedPlans: (u.ownedPlans || []).map((c) => c.toLowerCase()),
  };
}

export function adminSubscriptionInfoToUi(s) {
  if (!s) return null;
  return {
    plan: s.plan.toLowerCase(),
    planCode: s.plan,
    planName: s.planName,
    currency: s.currency || "USD",
    symbol: CURRENCY_SYMBOLS[s.currency] || "$",
    status: (s.status || "ACTIVE").toLowerCase(),
    interval: (s.interval || "MONTHLY").toLowerCase(),
    seats: s.seats ?? 1,
    renewsAt: iso(s.renewsAt),
    trialEndsAt: iso(s.trialEndsAt),
    overrideProjectLimit: s.overrideProjectLimit,
    overrideMemberLimit: s.overrideMemberLimit,
    adminNotes: s.adminNotes || "",
  };
}

export function adminWorkspaceRowToUi(w) {
  return {
    workspaceId: w.workspaceId,
    name: w.workspaceName,
    logoKey: w.logoKey,
    type: (w.type || "PERSONAL").toLowerCase(),
    ownerId: w.ownerId,
    ownerName: w.ownerName,
    ownerEmail: w.ownerEmail,
    members: w.members ?? 0,
    projects: w.projects ?? 0,
    subscription: adminSubscriptionInfoToUi(w.subscription),
  };
}

export function adminUserDetailToUi(d) {
  return {
    user: adminUserRowToUi(d.user),
    workspaces: (d.workspaces || []).map((w) => ({
      workspaceId: w.workspaceId,
      name: w.workspaceName,
      logoKey: w.logoKey,
      type: (w.type || "PERSONAL").toLowerCase(),
      role: TITLE(w.role),
      members: w.members ?? 0,
      projects: w.projects ?? 0,
      subscription: adminSubscriptionInfoToUi(w.subscription),
    })),
    recentAudit: (d.recentAudit || []).map(adminAuditEntryToUi),
  };
}

export function adminAuditEntryToUi(e) {
  return {
    id: e.id,
    actorId: e.actorId,
    actorName: e.actorName,
    actorEmail: e.actorEmail,
    action: e.action,
    targetType: e.targetType,
    targetId: e.targetId,
    detail: e.detail || "",
    createdAt: iso(e.createdAt),
  };
}

export function adminMetricsToUi(m) {
  return {
    totalUsers: m.totalUsers,
    suspendedUsers: m.suspendedUsers,
    newUsers7d: m.newUsers7d,
    newUsers30d: m.newUsers30d,
    totalWorkspaces: m.totalWorkspaces,
    activeSubscriptions: m.activeSubscriptions,
    trialingSubscriptions: m.trialingSubscriptions,
    planDistribution: (m.planDistribution || []).map((p) => ({
      plan: p.plan.toLowerCase(),
      planName: p.planName,
      active: p.active,
      trialing: p.trialing,
      canceled: p.canceled,
    })),
    estimatedMrr: (m.estimatedMrr || []).map((r) => ({
      currency: r.currency,
      symbol: CURRENCY_SYMBOLS[r.currency] || "$",
      monthly: Math.round(r.monthlyMinorUnits) / 100,
    })),
    trialsEndingSoon: (m.trialsEndingSoon || []).map(alertToUi),
    lapsedSubscriptions: (m.lapsedSubscriptions || []).map(alertToUi),
  };
}

function alertToUi(a) {
  return {
    workspaceId: a.workspaceId,
    workspaceName: a.workspaceName,
    plan: (a.plan || "").toLowerCase(),
    when: iso(a.when),
  };
}
