/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * High-Fidelity Mock Data for the Advanced Task Manager.
 * All dates are dynamically computed relative to today to maintain realistic Today/Overdue tabs.
 */

const now = new Date();
const formatDate = (offsetDays = 0, hourOffset = 0) => {
  const d = new Date();
  d.setDate(now.getDate() + offsetDays);
  d.setHours(d.getHours() + hourOffset);
  return d.toISOString();
};

export const mockUsers = [
  { id: "u1", name: "Yasin Chowdhury", email: "yasin@company.com", avatar: "YC", color: "bg-[#533afd] text-white", role: "Owner" },
  { id: "u2", name: "Rakib Hasan", email: "rakib@company.com", avatar: "RH", color: "bg-emerald-600 text-white", role: "Admin" },
  { id: "u3", name: "Nadia Islam", email: "nadia@company.com", avatar: "NI", color: "bg-amber-600 text-white", role: "Manager" },
  { id: "u4", name: "Mehnaz Taj", email: "mehnaz@company.com", avatar: "MT", color: "bg-rose-600 text-white", role: "Member" },
  { id: "u5", name: "Sohan Ahmed", email: "sohan@company.com", avatar: "SA", color: "bg-sky-600 text-white", role: "Viewer" },
];

export const mockWorkspaces = [
  { id: "ws1", name: "Junction Auction Group", logo: "🏎️", ownerId: "u1", description: "All design & development for custom automotive bidding solutions." },
  { id: "ws2", name: "Personal Space", logo: "🏡", ownerId: "u1", description: "Individual tracks, learning, and private task boards." },
  { id: "ws3", name: "Innovate Labs", logo: "🧪", ownerId: "u2", description: "R&D workspace for greenfield experimental features." },
];

export const mockProjects = [
  {
    id: "p1",
    workspaceId: "ws1",
    name: "Junction Auction Platform",
    description: "Developing the real-time online bidder portal & auction host screens.",
    icon: "🏎️",
    color: "#4f46e5", // Indigo
    status: "Active",
    startDate: formatDate(-15),
    createdAt: formatDate(-15),
    deadline: formatDate(10),
    members: ["u1", "u2", "u3", "u4"],
    progress: 68,
  },
  {
    id: "p2",
    workspaceId: "ws1",
    name: "Finance Dashboard Redesign",
    description: "Revamping invoice exports, reporting widgets, and visual graphs with D3/Recharts.",
    icon: "📊",
    color: "#0ea5e9", // Sky
    status: "Active",
    startDate: formatDate(-5),
    createdAt: formatDate(-5),
    deadline: formatDate(4),
    members: ["u1", "u3", "u5"],
    progress: 35,
  },
  {
    id: "p3",
    workspaceId: "ws1",
    name: "Mobile PWA Task Manager",
    description: "Creating a native-feeling reactive progressive web app interface for task trackers.",
    icon: "📱",
    color: "#10b981", // Emerald
    status: "Active",
    startDate: formatDate(-3),
    createdAt: formatDate(-3),
    deadline: formatDate(2),
    members: ["u1", "u2", "u4"],
    progress: 90,
  },
  {
    id: "p4",
    workspaceId: "ws1",
    name: "Inventory Service API",
    description: "Refactoring the legacy vehicle catalog service into structured REST endpoints.",
    icon: "⚙️",
    color: "#f59e0b", // Amber
    status: "On Hold",
    startDate: formatDate(-20),
    createdAt: formatDate(-20),
    deadline: formatDate(15),
    members: ["u2", "u4"],
    progress: 45,
  },
  {
    id: "p5",
    workspaceId: "ws1",
    name: "SEO Group Page Builder",
    description: "CMS landing page generator with optimized schema tags for localized dealers.",
    icon: "🕸️",
    color: "#ec4899", // Pink
    status: "Planning",
    startDate: formatDate(5),
    createdAt: formatDate(5),
    deadline: formatDate(30),
    members: ["u1", "u4", "u5"],
    progress: 10,
  }
];

export const mockTags = [
  { id: "t1", name: "Frontend", color: "bg-[#533afd]/10 text-[#533afd] border-[#533afd]/20" },
  { id: "t2", name: "Backend", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "t3", name: "Urgent", color: "bg-rose-50 text-rose-700 border-rose-200" },
  { id: "t4", name: "Bug", color: "bg-red-50 text-red-700 border-red-200" },
  { id: "t5", name: "Client Request", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "t6", name: "Design", color: "bg-pink-50 text-pink-700 border-pink-200" },
  { id: "t7", name: "Research", color: "bg-zinc-100 text-zinc-700 border-zinc-300" },
];

export const mockTasks = [
  {
    id: "t_1",
    projectId: "p3",
    title: "Design mobile task card layout",
    description: "Design compact card views with high touch targets, priority badges, and visual tags for native phone ratios. Ensure comfortable single-hand reach guidelines.",
    status: "In Progress",
    priority: "High",
    assigneeId: "u1",
    startDate: formatDate(-2),
    createdAt: formatDate(-2),
    dueDate: formatDate(0, 4), // Today, in 4 hours
    estimatedTime: 8,
    actualTime: 5.5,
    tags: ["t1", "t6"],
    checklist: [
      { id: "cl1", title: "Sketch safe-area spacing map", completed: true, createdAt: formatDate(-2) },
      { id: "cl2", title: "Establish priority indicator dot markup", completed: true, createdAt: formatDate(-2) },
      { id: "cl3", title: "Verify touch target dimensions (> 44px)", completed: false, createdAt: formatDate(-2) },
    ],
    comments: [
      { id: "c1", userId: "u3", text: "@Yasin Chowdhury Looks brilliant. Let's make sure the priority bar is thick enough.", timestamp: formatDate(-1) },
      { id: "c2", userId: "u1", text: "Got it! Added a colored status ring too which enhances recognition on small viewports.", timestamp: formatDate(-1, 2) }
    ],
    watchers: ["u1", "u3"],
    dependencies: [],
    recurring: { isRecurring: false },
    attachments: [
      { id: "att1", name: "mobile-gesture-guide.pdf", size: "2.4 MB", type: "pdf", createdAt: formatDate(-2) },
      { id: "att2", name: "framer-mockup-v2.png", size: "840 KB", type: "image", createdAt: formatDate(-2) }
    ],
    activities: [
      { id: "ac1", text: "Yasin Chowdhury changed status to In Progress", timestamp: formatDate(-1) },
      { id: "ac2", text: "Nadia Islam added a comment", timestamp: formatDate(-1, 1) },
    ]
  },
  {
    id: "t_2",
    projectId: "p3",
    title: "Build authentication screens",
    description: "Implement simple validated login, register, and password reset flows with Google, Apple, and Microsoft logins for branding integration inside PWA wrappers.",
    status: "To Do",
    priority: "Medium",
    assigneeId: "u4",
    startDate: formatDate(0),
    createdAt: formatDate(0),
    dueDate: formatDate(2), // 2 days from now
    estimatedTime: 12,
    actualTime: 0,
    tags: ["t1"],
    checklist: [
      { id: "cl4", title: "Login responsive CSS grid layout", completed: false, createdAt: formatDate(0) },
      { id: "cl5", title: "Integrate SSO mock buttons for client brands", completed: false, createdAt: formatDate(0) },
      { id: "cl6", title: "Include show/hide password toggle", completed: false, createdAt: formatDate(0) },
    ],
    comments: [],
    watchers: ["u4"],
    dependencies: [],
    recurring: { isRecurring: false },
    attachments: [],
    activities: []
  },
  {
    id: "t_3",
    projectId: "p1",
    title: "Create project dashboard template",
    description: "Assemble widgets including project speed dials, active members block, progress graphs, stats indicators, and shortcut quick-actions.",
    status: "Completed",
    priority: "High",
    assigneeId: "u1",
    startDate: formatDate(-6),
    createdAt: formatDate(-6),
    dueDate: formatDate(-1), // Due yesterday, but completed
    estimatedTime: 10,
    actualTime: 11,
    tags: ["t1", "t5"],
    checklist: [
      { id: "cl7", title: "Draft custom layout with CSS Grid", completed: true, createdAt: formatDate(-6) },
      { id: "cl8", title: "Implement Recharts widget", completed: true, createdAt: formatDate(-6) },
    ],
    comments: [],
    watchers: ["u1", "u2"],
    dependencies: [],
    recurring: { isRecurring: false },
    attachments: [],
    activities: [
      { id: "ac3", text: "Yasin Chowdhury marked this task as Completed", timestamp: formatDate(-1) },
    ]
  },
  {
    id: "t_4",
    projectId: "p2",
    title: "Fix overdue task filter logic",
    description: "The dashboard filter is currently skipping tasks that expired with yesterday's local timezone dates. Ensure standard UTC zero-hour checks fix this.",
    status: "Blocked",
    priority: "Urgent",
    assigneeId: "u2",
    startDate: formatDate(-3),
    createdAt: formatDate(-3),
    dueDate: formatDate(-2), // Overdue & Blocked
    estimatedTime: 4,
    actualTime: 2,
    tags: ["t2", "t4", "t3"],
    checklist: [
      { id: "cl9", title: "Locate date-helper parsing library", completed: true, createdAt: formatDate(-3) },
      { id: "cl10", title: "Write tests covering edge timezones", completed: false, createdAt: formatDate(-3) }
    ],
    comments: [
      { id: "c3", userId: "u2", text: "Waiting on the updated timezone definition spreadsheet from backend team.", timestamp: formatDate(-1) }
    ],
    watchers: ["u2", "u1"],
    dependencies: ["t_5"], // Waits for "Review API contract"
    recurring: { isRecurring: false },
    attachments: [],
    activities: []
  },
  {
    id: "t_5",
    projectId: "p1",
    title: "Review API contract and response schemas",
    description: "Ensure the auction sockets use identical attributes for vehicle IDs, timestamps, and instant bids across client apps and catalog indexes.",
    status: "In Review",
    priority: "Medium",
    assigneeId: "u3",
    startDate: formatDate(-4),
    createdAt: formatDate(-4),
    dueDate: formatDate(1),
    estimatedTime: 6,
    actualTime: 4.5,
    tags: ["t2", "t7"],
    checklist: [],
    comments: [],
    watchers: ["u3"],
    dependencies: [],
    recurring: { isRecurring: false },
    attachments: [],
    activities: []
  },
  {
    id: "t_6",
    projectId: "p3",
    title: "Test PWA offline mode features",
    description: "Mock network loss scenarios, check local database fallback triggers, ensure queued changes sync once connection registers as online again.",
    status: "To Do",
    priority: "Low",
    assigneeId: "u2",
    startDate: formatDate(2),
    createdAt: formatDate(2),
    dueDate: formatDate(5),
    estimatedTime: 6,
    actualTime: 0,
    tags: ["t1", "t7"],
    checklist: [],
    comments: [],
    watchers: [],
    dependencies: [],
    recurring: { isRecurring: false },
    attachments: [],
    activities: []
  },
  {
    id: "t_7",
    projectId: "p3",
    title: "Daily Standup sync-check",
    description: "Quick round-robin update on blocking vectors, tasks assigned, and goals. Completed automatically each morning.",
    status: "Completed",
    priority: "Medium",
    assigneeId: "u1",
    startDate: formatDate(0),
    createdAt: formatDate(0),
    dueDate: formatDate(0, 1), // Completed today
    estimatedTime: 0.5,
    actualTime: 0.5,
    tags: ["t7"],
    checklist: [],
    comments: [],
    watchers: [],
    dependencies: [],
    recurring: { isRecurring: true, pattern: "Daily" },
    attachments: [],
    activities: []
  },
  {
    id: "t_8",
    projectId: "p2",
    title: "Prepare invoice CSV bulk downloader",
    description: "Allow finance admins to select thousands of items, generate a streamable CSV download payload, and parse date ranges.",
    status: "In Progress",
    priority: "High",
    assigneeId: "u3",
    startDate: formatDate(-2),
    createdAt: formatDate(-2),
    dueDate: formatDate(3),
    estimatedTime: 8,
    actualTime: 4,
    tags: ["t2", "t5"],
    checklist: [
      { id: "cl11", title: "Build custom query criteria parameters", completed: true, createdAt: formatDate(-2) },
      { id: "cl12", title: "Benchmark string builder for > 10,000 records", completed: false, createdAt: formatDate(-2) }
    ],
    comments: [],
    watchers: ["u3", "u5"],
    dependencies: [],
    recurring: { isRecurring: false },
    attachments: [],
    activities: []
  }
];

export const mockNotifications = [
  { id: "n1", type: "assigned", text: "You were assigned a new task: Design mobile task card layout.", read: false, time: "2 hours ago", taskId: "t_1" },
  { id: "n2", type: "mention", text: "Nadia Islam mentioned you in a comment on 'Fix overdue task filter logic'.", read: false, time: "4 hours ago", taskId: "t_4" },
  { id: "n3", type: "reminder", text: "Task 'Fix overdue task filter logic' is overdue by 1 day!", read: true, time: "Yesterday", taskId: "t_4" },
  { id: "n4", type: "update", text: "Project 'Finance Dashboard Redesign' progress was updated to 35%.", read: true, time: "2 days ago", projectId: "p2" }
];

export const mockActivities = [
  { id: "act1", userId: "u1", text: "changed status of 'Design mobile task card layout' to In Progress", time: "2 hours ago" },
  { id: "act2", userId: "u3", text: "added a comment on 'Design mobile task card layout'", time: "4 hours ago" },
  { id: "act3", userId: "u2", text: "uploaded 'framer-mockup-v2.png' to 'Design mobile task card layout'", time: "Yesterday" },
  { id: "act4", userId: "u1", text: "created the project 'Mobile PWA Task Manager'", time: "3 days ago" },
];

export const mockTemplates = [
  { id: "tpl1", name: "⚛️ UI Design and Prototyping", category: "Design", tasks: ["Conduct competitor research", "Sketch layout wireframes", "Export SVG assets", "Draft Interactive Proto"] },
  { id: "tpl2", name: "🐛 Technical Bug Fix Cycle", category: "Engineering", tasks: ["Replicate issue in local staging", "Write boundary condition test cases", "Introduce targeted patch", "Review heap and memory signatures"] },
  { id: "tpl3", name: "🚀 Production Deployment Guide", category: "Operations", tasks: ["Flush database snapshots", "Build production client build bundle", "Verify CDN cache clear triggers", "Trigger email notification scripts"] },
];

export const mockAutomationRules = [
  { id: "ar1", event: "When status changes to Completed", action: "Clear all tags & unassign task", active: true },
  { id: "ar2", event: "When priority is raised to Urgent", action: "Send Slack & Discord warning ping", active: true },
  { id: "ar3", event: "When due date becomes Overdue", action: "Auto assign to Workspace Owner", active: false }
];
