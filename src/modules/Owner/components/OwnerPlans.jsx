/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from "react";
import { ownerApi } from "../../../api/endpoints";
import { useAppState } from "../../../app/providers";
import { ErrorState } from "../../../components/common/ErrorState";
import { CardGridSkeleton } from "../../../components/common/Skeleton";
import { Pager, ConfirmDialog, PlanStatusBadge } from "./ownerUi";
import { Plus, MoreHorizontal, Eye, EyeOff, Pencil, Archive, Trash2, Star, CheckCircle2, Users, Folder } from "lucide-react";

const CURRENCIES = [
  { id: "USD", label: "USD — US Dollar ($)" },
  { id: "BDT", label: "BDT — Bangladeshi Taka (৳)" },
];

const EMPTY_FORM = {
  code: "", name: "", tagline: "", currency: "USD",
  monthly: "0", yearly: "0", projectLimit: "", memberLimit: "", workspaceLimit: "",
  ai: false, customStatuses: false, automation: false,
  trialDays: "14", features: "", highlight: false, visible: true, sortOrder: "10",
};

/** Finding #7: marketing bullets suggested live from the limit/feature inputs. */
function suggestedBullets(f) {
  const bullets = [];
  bullets.push(f.projectLimit === "" ? "Unlimited projects" : `Up to ${f.projectLimit} projects per workspace`);
  bullets.push(f.memberLimit === "" ? "Unlimited members" : `Up to ${f.memberLimit} members`);
  if (f.workspaceLimit !== "") bullets.push(`Own up to ${f.workspaceLimit} workspace${f.workspaceLimit === "1" ? "" : "s"}`);
  else bullets.push("Unlimited workspaces");
  if (f.ai) bullets.push("AI task planner & refiner");
  if (f.customStatuses) bullets.push("Custom task statuses");
  if (f.automation) bullets.push("Automation rules");
  if (parseInt(f.trialDays || "0", 10) > 0) bullets.push(`${f.trialDays}-day free trial`);
  return bullets.join("\n");
}

/** Plan catalog management: create, edit, lifecycle, safe deletion. */
export function OwnerPlans() {
  const { refreshPlans } = useAppState();
  const [plans, setPlans] = useState(null);
  const [error, setError] = useState(false);
  const [menuFor, setMenuFor] = useState(null);
  const [editor, setEditor] = useState(null);      // {mode:"create"|"edit", code?, form}
  const [confirm, setConfirm] = useState(null);    // {type:"archive"|"delete", plan}
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");

  const load = useCallback(() => {
    setError(false);
    ownerApi.plans.list().then(setPlans).catch(() => setError(true));
  }, []);
  useEffect(load, [load]);

  const refresh = async () => { load(); refreshPlans(); };

  const openCreate = () => {
    setFormError("");
    const form = { ...EMPTY_FORM };
    form.features = suggestedBullets(form);
    setEditor({ mode: "create", featuresTouched: false, form });
  };
  const openEdit = (plan) => {
    setFormError("");
    setEditor({
      mode: "edit",
      code: plan.code,
      isDefault: plan.isDefault,
      featuresTouched: true, // existing bullets are deliberate — never clobber

      form: {
        code: plan.code,
        name: plan.name,
        tagline: plan.tagline || "",
        currency: plan.currency,
        monthly: String(plan.monthly),
        yearly: String(plan.yearly),
        projectLimit: plan.projectLimitRaw == null ? "" : String(plan.projectLimitRaw),
        memberLimit: plan.memberLimitRaw == null ? "" : String(plan.memberLimitRaw),
        workspaceLimit: plan.workspaceLimitRaw == null ? "" : String(plan.workspaceLimitRaw),
        ai: plan.limits.ai,
        customStatuses: plan.limits.customStatuses,
        automation: plan.limits.automation,
        trialDays: String(plan.trialDays),
        features: plan.features.join("\n"),
        highlight: plan.highlight,
        visible: plan.visible,
        sortOrder: String(plan.sortOrder),
      },
    });
    setMenuFor(null);
  };

  const submitEditor = async () => {
    const f = editor.form;
    if (!f.name.trim()) { setFormError("A plan name is required."); return; }
    if (editor.mode === "create" && !/^[A-Za-z0-9_]{2,16}$/.test(f.code.trim())) {
      setFormError("Code must be 2–16 letters, digits, or underscores."); return;
    }
    const body = {
      code: editor.mode === "create" ? f.code.trim().toUpperCase() : undefined,
      name: f.name.trim(),
      tagline: f.tagline.trim() || null,
      currency: f.currency,
      monthlyPerSeatCents: Math.round(parseFloat(f.monthly || "0") * 100),
      yearlyPerSeatCents: Math.round(parseFloat(f.yearly || "0") * 100),
      projectLimit: f.projectLimit === "" ? null : parseInt(f.projectLimit, 10),
      memberLimit: f.memberLimit === "" ? null : parseInt(f.memberLimit, 10),
      workspaceLimit: f.workspaceLimit === "" ? null : parseInt(f.workspaceLimit, 10),
      ai: f.ai, customStatuses: f.customStatuses, automation: f.automation,
      trialDays: parseInt(f.trialDays || "0", 10),
      features: f.features.split("\n").map((x) => x.trim()).filter(Boolean),
      highlight: f.highlight, visible: f.visible,
      sortOrder: parseInt(f.sortOrder || "0", 10),
    };
    if (Number.isNaN(body.monthlyPerSeatCents) || Number.isNaN(body.yearlyPerSeatCents) || body.monthlyPerSeatCents < 0 || body.yearlyPerSeatCents < 0) {
      setFormError("Prices must be zero or positive numbers."); return;
    }
    setBusy(true);
    setFormError("");
    try {
      if (editor.mode === "create") await ownerApi.plans.create(body);
      else await ownerApi.plans.update(editor.code, body);
      setEditor(null);
      refresh();
    } catch (err) {
      setFormError(err.message || "Could not save the plan.");
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (plan, status) => {
    setMenuFor(null);
    setActionError("");
    try {
      await ownerApi.plans.setStatus(plan.code, status);
      refresh();
    } catch (err) {
      setActionError(err.message || "Could not update the plan.");
    }
  };

  const runConfirm = async () => {
    setBusy(true);
    try {
      if (confirm.type === "delete") await ownerApi.plans.remove(confirm.plan.code);
      else await ownerApi.plans.setStatus(confirm.plan.code, "ARCHIVED");
      setConfirm(null);
      refresh();
    } catch (err) {
      setConfirm(null);
      setActionError(err.message || "Could not complete the action.");
    } finally {
      setBusy(false);
    }
  };

  if (error) return <ErrorState onRetry={load} />;
  if (!plans) return <CardGridSkeleton cards={3} />;

  const field = (key) => ({
    value: editor?.form[key] ?? "",
    onChange: (e) => setEditor((ed) => {
      const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
      const form = { ...ed.form, [key]: value };
      const featuresTouched = key === "features" ? true : ed.featuresTouched;
      // Until the owner writes their own bullets, keep them in sync with the
      // limits/features being configured (finding #7).
      if (!featuresTouched && key !== "features") {
        form.features = suggestedBullets(form);
      }
      return { ...ed, featuresTouched, form };
    }),
  });

  return (
    <div className="space-y-2.5 sm:space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
          {plans.length} plans · changes apply to the pricing page immediately. Plans with subscribers can be archived, never deleted.
        </p>
        <button type="button" className="btn btn-primary btn-sm shrink-0" onClick={openCreate}>
          <Plus className="w-3.5 h-3.5" /> New plan
        </button>
      </div>

      {actionError && (
        <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 text-xs font-medium border border-rose-100 dark:border-rose-900/30 flex items-center justify-between gap-3" role="alert">
          <span>{actionError}</span>
          <button type="button" className="font-semibold hover:underline cursor-pointer shrink-0" onClick={() => setActionError("")}>Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-4">
        {plans.map((plan) => (
          <div key={plan.code} className={`card p-3 sm:p-4 relative ${plan.status === "ARCHIVED" ? "opacity-70" : ""}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-display font-semibold text-base text-zinc-900 dark:text-white">{plan.name}</h3>
                  {plan.isDefault && <span className="badge bg-primary/8 text-primary border-primary/20 dark:bg-primary/15">Default</span>}
                  {plan.highlight && <Star className="w-3.5 h-3.5 text-amber-400" title="Highlighted on pricing" />}
                  {!plan.visible && <EyeOff className="w-3.5 h-3.5 text-zinc-400" title="Hidden from pricing page" />}
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{plan.code}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <PlanStatusBadge status={plan.status} />
                <div className="relative">
                  <button type="button" className="btn-icon" onClick={() => setMenuFor(menuFor === plan.code ? null : plan.code)} aria-label={`Actions for ${plan.name}`}>
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {menuFor === plan.code && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} aria-hidden="true" />
                      <div className="menu-panel absolute right-0 top-9 z-20 w-56 py-1 overflow-hidden">
                        <button type="button" className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer text-left" onClick={() => openEdit(plan)}>
                          <Pencil className="w-4 h-4" /> Edit plan
                        </button>
                        {plan.status === "ACTIVE" && !plan.isDefault && (
                          <button type="button" className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer text-left" onClick={() => setStatus(plan, "INACTIVE")}>
                            <EyeOff className="w-4 h-4" /> Deactivate (stop selling)
                          </button>
                        )}
                        {plan.status === "INACTIVE" && (
                          <button type="button" className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer text-left" onClick={() => setStatus(plan, "ACTIVE")}>
                            <Eye className="w-4 h-4" /> Reactivate
                          </button>
                        )}
                        {plan.status !== "ARCHIVED" && !plan.isDefault && (
                          <button type="button" className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer text-left" onClick={() => { setMenuFor(null); setConfirm({ type: "archive", plan }); }}>
                            <Archive className="w-4 h-4" /> Archive
                          </button>
                        )}
                        {plan.status === "ARCHIVED" && (
                          <button type="button" className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer text-left" onClick={() => setStatus(plan, "INACTIVE")}>
                            <Archive className="w-4 h-4" /> Restore to inactive
                          </button>
                        )}
                        <button
                          type="button"
                          className={`w-full flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer text-left ${plan.subscriberCount > 0 || plan.isDefault ? "opacity-40 cursor-not-allowed" : "text-rose-600 dark:text-rose-400"}`}
                          disabled={plan.subscriberCount > 0 || plan.isDefault}
                          title={plan.isDefault ? "The default plan can't be deleted"
                            : plan.subscriberCount > 0 ? `${plan.subscriberCount} subscription(s) reference this plan — archive instead` : undefined}
                          onClick={() => { setMenuFor(null); setConfirm({ type: "delete", plan }); }}
                        >
                          <Trash2 className="w-4 h-4" /> Delete permanently
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <p className="mt-2">
              <span className="text-xl font-bold text-zinc-900 dark:text-white font-tnum">{plan.symbol}{plan.monthly.toLocaleString()}</span>
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400"> /seat/mo · {plan.symbol}{plan.yearly.toLocaleString()}/yr · {plan.currency}</span>
            </p>
            {plan.tagline && <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1">{plan.tagline}</p>}

            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
              <span className="inline-flex items-center gap-1"><Folder className="w-3 h-3 text-zinc-400" />{plan.limits.projects === Infinity ? "Unlimited projects" : `${plan.limits.projects} projects`}</span>
              <span className="inline-flex items-center gap-1"><Users className="w-3 h-3 text-zinc-400" />{plan.limits.members === Infinity ? "Unlimited members" : `${plan.limits.members} members`}</span>
              {plan.limits.ai && <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" />AI</span>}
              {plan.limits.customStatuses && <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" />Statuses</span>}
              {plan.limits.automation && <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" />Automation</span>}
            </div>

            <p className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              {plan.subscriberCount} subscription{plan.subscriberCount === 1 ? "" : "s"} · trial {plan.trialDays}d · sort {plan.sortOrder}
            </p>
          </div>
        ))}
      </div>

      {/* -------- editor sheet -------- */}
      {editor && (
        <div className="modal-overlay">
          <div className="absolute inset-0" onClick={() => setEditor(null)} aria-hidden="true" />
          <div className="modal-panel sm:max-w-lg" role="dialog" aria-modal="true" aria-label={editor.mode === "create" ? "New plan" : "Edit plan"}>
            <div className="sheet-grabber" />
            <div className="px-5 pt-4 pb-2">
              <h2 className="font-display font-semibold text-base text-zinc-900 dark:text-white">
                {editor.mode === "create" ? "New plan" : `Edit ${editor.form.name}`}
              </h2>
            </div>
            <div className="px-5 pb-4 space-y-3 max-h-[62vh] overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 text-xs font-medium border border-rose-100 dark:border-rose-900/30" role="alert">
                  {formError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="plan-code">Code</label>
                  <input id="plan-code" className="field uppercase" disabled={editor.mode === "edit"} placeholder="e.g. STARTUP" {...field("code")} />
                </div>
                <div>
                  <label className="label" htmlFor="plan-name">Name</label>
                  <input id="plan-name" className="field" placeholder="e.g. Startup" {...field("name")} />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="plan-tagline">Tagline</label>
                <input id="plan-tagline" className="field" placeholder="Shown under the plan name" {...field("tagline")} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label" htmlFor="plan-currency">Currency</label>
                  <select id="plan-currency" className="field" {...field("currency")}>
                    {CURRENCIES.map((c) => <option key={c.id} value={c.id}>{c.id}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="plan-monthly">Monthly / seat</label>
                  <input id="plan-monthly" className="field" type="number" min="0" step="0.01" {...field("monthly")} />
                </div>
                <div>
                  <label className="label" htmlFor="plan-yearly">Yearly / seat</label>
                  <input id="plan-yearly" className="field" type="number" min="0" step="0.01" {...field("yearly")} />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="label" htmlFor="plan-projects">Project limit</label>
                  <input id="plan-projects" className="field" type="number" min="1" placeholder="Unlimited" {...field("projectLimit")} />
                </div>
                <div>
                  <label className="label" htmlFor="plan-members">Member limit</label>
                  <input id="plan-members" className="field" type="number" min="1" placeholder="Unlimited" {...field("memberLimit")} />
                </div>
                <div>
                  <label className="label" htmlFor="plan-workspaces">Workspace limit</label>
                  <input id="plan-workspaces" className="field" type="number" min="1" placeholder="Unlimited" {...field("workspaceLimit")} />
                </div>
                <div>
                  <label className="label" htmlFor="plan-trial">Trial days</label>
                  <input id="plan-trial" className="field" type="number" min="0" max="90" {...field("trialDays")} />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[["ai", "AI features"], ["customStatuses", "Custom statuses"], ["automation", "Automation"], ["highlight", "Highlight card"], ["visible", "Visible on pricing"]].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <input type="checkbox" className="accent-[#533afd]" checked={!!editor.form[key]} {...{ onChange: field(key).onChange }} />
                    {label}
                  </label>
                ))}
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="label" htmlFor="plan-features">Marketing bullets (one per line)</label>
                  {editor.featuresTouched && (
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-primary hover:underline mb-1.5 cursor-pointer"
                      onClick={() => setEditor((ed) => ({ ...ed, featuresTouched: false, form: { ...ed.form, features: suggestedBullets(ed.form) } }))}
                    >
                      Reset to suggested
                    </button>
                  )}
                </div>
                <textarea id="plan-features" rows={4} className="field" placeholder={"Unlimited projects\nPriority support"} {...field("features")} />
              </div>
              <div className="w-32">
                <label className="label" htmlFor="plan-sort">Sort order</label>
                <input id="plan-sort" className="field" type="number" min="0" {...field("sortOrder")} />
              </div>
            </div>
            <div className="flex gap-2.5 px-5 py-3.5 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
              <button type="button" className="btn btn-secondary flex-1" onClick={() => setEditor(null)}>Cancel</button>
              <button type="button" className="btn btn-primary flex-1" disabled={busy} onClick={submitEditor}>
                {busy ? "Saving…" : editor.mode === "create" ? "Create plan" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------- archive / delete confirms -------- */}
      <ConfirmDialog
        open={confirm?.type === "archive"}
        title={`Archive ${confirm?.plan?.name}?`}
        body="Archived plans disappear from pricing and can't be assigned, but existing subscribers keep their limits until you move them."
        confirmLabel="Archive plan"
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={runConfirm}
      />
      <ConfirmDialog
        open={confirm?.type === "delete"}
        danger
        title={`Delete ${confirm?.plan?.name} permanently?`}
        body="This removes the plan for good. Only possible while no subscription has ever referenced it."
        confirmLabel="Delete plan"
        confirmWord={confirm?.plan?.code}
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={runConfirm}
      />
    </div>
  );
}
