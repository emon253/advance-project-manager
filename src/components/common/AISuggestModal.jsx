/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useAppState } from "../../app/providers";
import { Bot, CheckCircle, Import, Loader2, Info, X } from "lucide-react";

export function AISuggestModal({ isOpen, onClose }) {
  const { activeWorkspaceProjects, addTask } = useAppState();
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [results, setResults] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(activeWorkspaceProjects[0]?.id || "");

  if (!isOpen) return null;

  const handleAISimulate = () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setResults(null);

    const steps = [
      "Reading your request...",
      "Identifying goals and deliverables...",
      "Balancing priorities and workload...",
      "Drafting tasks and time estimates...",
      "Finalizing checklists..."
    ];

    let currentStep = 0;
    setLoadingStep(steps[0]);

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setLoadingStep(steps[currentStep]);
      } else {
        clearInterval(timer);
        generateMockResponse();
      }
    }, 850);
  };

  const generateMockResponse = () => {
    // Generate logical task breakdowns based on high frequency descriptors
    const text = prompt.toLowerCase();

    let suggestedTitle = "AI Plan: Workspace Optimizations";
    let list = [
      {
        title: "Perform comparative analysis on dependencies",
        priority: "High",
        est: 4,
        checklist: ["Check node integrity", "Audit legacy logs"]
      },
      {
        title: "Review documentation with key stakeholders",
        priority: "Medium",
        est: 2,
        checklist: ["Deliver slides PDF", "Schedule review chat"]
      },
      {
        title: "Draft deployment checklists and rollbacks",
        priority: "Urgent",
        est: 5,
        checklist: ["Configure fail-safe triggers", "Verify backup files"]
      }
    ];

    if (text.includes("launch") || text.includes("website") || text.includes("deploy")) {
      suggestedTitle = "AI Plan: Digital Channel Launch Plan";
      list = [
        {
          title: "Setup DNS zone file redirects & SSL configurations",
          priority: "Urgent",
          est: 3,
          checklist: ["Purchase SSL certificate", "Configure backup MX records", "Point nameservers to CDN"]
        },
        {
          title: "Execute browser visual regression test script",
          priority: "High",
          est: 6,
          checklist: ["Test on iOS 16 & Safari", "Audit core checkout touch targets", "Verify accessibility aria-labels"]
        },
        {
          title: "Assemble SEO metadata, rich snippets & JSON-LD markup",
          priority: "Medium",
          est: 4,
          checklist: ["Write schema tags for landing page", "Upload updated sitemap.xml", "Audit robots.txt tags"]
        },
        {
          title: "Configure performance optimization assets bundling",
          priority: "Low",
          est: 3,
          checklist: ["Optimize image WebP assets", "Minify production bundle caches", "Audit Lighthouse core web vitals"]
        }
      ];
    } else if (text.includes("bug") || text.includes("fix") || text.includes("test")) {
      suggestedTitle = "AI Plan: Technical Bug Squashing Sprint";
      list = [
        {
          title: "Identify call stack trace in error reports",
          priority: "Urgent",
          est: 2,
          checklist: ["Isolate crash logs in Sentry", "Trace null value boundaries", "Audit memory heap spikes"]
        },
        {
          title: "Inject automated regression visual test scripts",
          priority: "High",
          est: 5,
          checklist: ["Write Jest testing mocks", "Trigger CI/CD environment integration"]
        },
        {
          title: "Draft post-mortem and deployment guidelines",
          priority: "Low",
          est: 2,
          checklist: ["Update Readme documentation", "Notify project leads of patch success"]
        }
      ];
    } else if (text.includes("design") || text.includes("ui") || text.includes("ux")) {
      suggestedTitle = "AI Plan: Visual UI/UX Refinement Cycle";
      list = [
        {
          title: "Establish cohesive color system variables and CSS themes",
          priority: "High",
          est: 8,
          checklist: ["Test light/dark modes contrast ratios", "Map tailwind.config attributes", "Define color-blind palette"]
        },
        {
          title: "Construct pixel-perfect task card layout states",
          priority: "Urgent",
          est: 10,
          checklist: ["Create hover scale transition classes", "Insert compact mobile visual badges", "Design double-tap checklists"]
        },
        {
          title: "Assemble high contrast icon system",
          priority: "Medium",
          est: 4,
          checklist: ["Import Lucide React vectors", "Audit alignment offsets", "Include dynamic size parameters"]
        }
      ];
    }

    setResults({
      title: suggestedTitle,
      tasks: list
    });
    setIsLoading(false);
  };

  const handleImport = () => {
    if (!results) return;

    results.tasks.forEach((t) => {
      addTask({
        title: t.title,
        description: `Auto-generated checklist via Advanced AI Assistant analysis. Initial target request: "${prompt}"`,
        projectId: selectedProjectId,
        priority: t.priority,
        estimatedTime: t.est,
        checklist: t.checklist.map((c) => ({ id: `ai_cl_${Math.random().toString(36).slice(2, 9)}`, title: c, completed: false }))
      });
    });

    setPrompt("");
    setResults(null);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div className="modal-panel sm:max-w-xl" role="dialog" aria-modal="true" aria-label="AI task planner">
        <div className="sheet-grabber" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <Bot className="w-4.5 h-4.5 text-primary" />
            <h2 className="font-display font-semibold text-zinc-900 dark:text-white text-base">AI Task Planner</h2>
          </div>
          <button type="button" onClick={onClose} className="btn-icon -mr-1.5" aria-label="Close">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {/* Prompt form */}
          {!results && !isLoading && (
            <div className="space-y-4">
              <div className="p-3 bg-primary/5 border border-primary/15 rounded-lg flex items-start gap-2.5">
                <Bot className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed">
                  Describe a project goal, chore list, or rollout strategy in plain English. The assistant breaks it down into tasks with priorities and checklists.
                </p>
              </div>

              <div>
                <label htmlFor="ai-prompt" className="label">Your request</label>
                <textarea
                  id="ai-prompt"
                  rows={3}
                  autoFocus
                  placeholder="e.g. Prepare website launch plan by Friday, or design a client onboarding UI cycle"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="field"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPrompt("Design complete visual UI/UX refinement cycle with mobile and desktop variables")}
                  className="btn btn-sm btn-secondary"
                >
                  <span>UX refinement plan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrompt("Prepare detailed website launch checklist and final CDN hosting configs")}
                  className="btn btn-sm btn-secondary"
                >
                  <span>Launch checklist</span>
                </button>
              </div>

              <button
                onClick={handleAISimulate}
                disabled={!prompt.trim()}
                className="btn btn-primary w-full"
              >
                <Bot className="w-4 h-4" />
                <span>Generate Plan</span>
              </button>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="card p-6 my-2 flex flex-col items-center text-center gap-3 select-none" role="status" aria-live="polite">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8 dark:bg-primary/15 text-primary">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">Building your plan…</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1">{loadingStep}</p>
              </div>
              <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-lg text-xs font-medium">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{results.tasks.length} tasks generated for your goal.</span>
              </div>

              <div className="p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-800/40">
                <p className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase">Suggested plan</p>
                <h3 className="font-display font-semibold text-sm text-zinc-900 dark:text-white mt-0.5">{results.title}</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div>
                  <label htmlFor="ai-target-project" className="label">Import into project</label>
                  <select
                    id="ai-target-project"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="field"
                  >
                    {activeWorkspaceProjects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="text-zinc-500 dark:text-zinc-400 text-xs flex items-center gap-1.5 pb-2">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>Estimated effort: <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-tnum">{results.tasks.reduce((sum, t) => sum + t.est, 0)}h</span> total.</span>
                </div>
              </div>

              {/* Task previews */}
              <div className="space-y-2.5 max-h-[36vh] overflow-y-auto pr-1">
                {results.tasks.map((task, idx) => (
                  <div key={idx} className="card p-3 text-left">
                    <div className="flex items-start justify-between gap-2.5">
                      <h4 className="font-semibold text-sm text-zinc-900 dark:text-white leading-snug">{task.title}</h4>
                      <span className="shrink-0 inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-primary/8 text-primary dark:bg-primary/15">
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 font-medium mt-1 font-tnum">Est. effort: {task.est}h</p>

                    {task.checklist.length > 0 && (
                      <ul className="mt-2 pl-3 border-l-2 border-zinc-200 dark:border-zinc-700 space-y-1">
                        {task.checklist.map((item, i) => (
                          <li key={i} className="flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400">
                            <span className="w-1 h-1 rounded-full bg-zinc-400 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button type="button" onClick={() => setResults(null)} className="btn btn-secondary flex-1">
                  Start Over
                </button>
                <button onClick={handleImport} className="btn btn-primary flex-1">
                  <Import className="w-4 h-4" />
                  <span>Import {results.tasks.length} Tasks</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
