/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useAppState } from "../../../app/providers";
import { WorkspaceGeneralSection } from "../sections/WorkspaceGeneralSection";
import { MembersSection } from "../sections/MembersSection";
import { StatusSettingsPanel } from "../components/StatusSettingsPanel";
import { AutomationSection } from "../sections/AutomationSection";
import { BillingPage } from "../../Billing/pages/BillingPage";
import { ProfileSection, SecuritySection } from "../sections/ProfileSections";
import { NotificationsSection } from "../sections/NotificationsSection";

const SECTIONS = [
  { group: "Workspace", items: [["general", "General"], ["members", "Members & invites"], ["statuses", "Task statuses"], ["automation", "Automation"], ["billing", "Plan & billing"]] },
  { group: "You", items: [["profile", "Profile"], ["notifications", "Notifications"], ["security", "Password & security"]] },
];

/**
 * One Settings page. Left: sections (workspace · you · platform). Right: the
 * selected section. Members & invites is the only place to invite anyone.
 */
export function SettingsPage() {
  const { section } = useParams();
  const { activeWorkspace, activePlanId, isSystemOwner, can } = useAppState();

  if (!section) return <Navigate to="/settings/general" replace />;

  const sections = SECTIONS.map((g) => ({
    ...g,
    items: g.items.filter(([id]) => (id === "billing" ? can("manageBilling") : true)),
  }));

  const body = {
    general: <WorkspaceGeneralSection />,
    members: <MembersSection />,
    statuses: <StatusSettingsPanel />,
    automation: <AutomationSection />,
    billing: <BillingPage embedded />,
    profile: <ProfileSection />,
    notifications: <NotificationsSection />,
    security: <SecuritySection />,
  }[section] || <Navigate to="/settings/general" replace />;

  const subtitle = `${activeWorkspace?.name} workspace · ${activePlanId ? activePlanId.charAt(0).toUpperCase() + activePlanId.slice(1) : "Free"} plan`;

  return (
    <div className="text-left flex flex-wrap gap-6 items-start" id="settings-root">
      <div className="lg:hidden w-full -mb-3">
        <h1 className="page-title">Settings</h1>
        <p className="page-sub">{subtitle}</p>
      </div>
      <nav aria-label="Settings sections" className="flex-[0_0_184px] flex flex-col lg:pt-[46px] w-full lg:w-auto">
        <div className="flex lg:flex-col gap-1 lg:gap-0.5 overflow-x-auto no-scrollbar">
          {sections.map((g) => (
            <React.Fragment key={g.group}>
              <p className="hidden lg:block text-[11px] font-bold uppercase tracking-wider text-zinc-400 px-2.5 pt-3 pb-1 first:pt-0">{g.group}</p>
              {g.items.map(([id, label]) => (
                <Link
                  key={id}
                  to={`/settings/${id}`}
                  aria-current={section === id ? "page" : undefined}
                  className={`shrink-0 flex items-center h-[30px] px-2.5 rounded-md text-[13px] whitespace-nowrap ${
                    section === id ? "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold" : "text-zinc-600 dark:text-zinc-400 font-medium hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </React.Fragment>
          ))}
          {isSystemOwner && (
            <>
              <p className="hidden lg:block text-[11px] font-bold uppercase tracking-wider text-zinc-400 px-2.5 pt-3 pb-1">Platform</p>
              <Link to="/owner" className="shrink-0 flex items-center h-[30px] px-2.5 rounded-md text-[13px] whitespace-nowrap text-zinc-600 dark:text-zinc-400 font-medium hover:text-zinc-900 dark:hover:text-white">Owner console</Link>
            </>
          )}
        </div>
      </nav>

      <section className="flex-[999_1_480px] min-w-0 flex flex-col gap-4">
        <div className="hidden lg:block">
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">{subtitle}</p>
        </div>
        {body}
      </section>
    </div>
  );
}
