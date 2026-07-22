import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Wand2, Loader2, X, AlertCircle, Sparkles } from "lucide-react";
import { aiApi } from "../../api/endpoints";

const PRESETS = [
  { id: "grammar", label: "Fix Grammar" },
  { id: "professional", label: "Professional" },
  { id: "concise", label: "Concise" },
  { id: "expand", label: "Expand" },
];

export function AIEnhancerModal({ isOpen, onClose, initialValue, onApply, type = "description" }) {
  const [originalText, setOriginalText] = useState(initialValue || "");
  const [action, setAction] = useState("grammar"); // grammar, professional, concise, expand
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestion, setSuggestion] = useState("");

  // Sync initial value when opened
  useEffect(() => {
    if (isOpen) {
      setOriginalText(initialValue || "");
      setError("");
      setSuggestion("");
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleEnhance = async () => {
    if (!originalText.trim()) {
      setError("Add some text to refine first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const enhancedText = await aiApi.enhance(originalText, type, action);
      if (enhancedText) {
        setSuggestion(enhancedText);
      } else {
        throw new Error("No suggestion returned.");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong while refining.");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!suggestion) return;
    onApply(suggestion);
    onClose();
  };

  // Portal to <body>: the trigger can live inside a transformed ancestor (e.g.
  // the Tasks Lineup's framer-motion tab wrapper), which would otherwise make
  // `position: fixed` resolve against that ancestor instead of the viewport and
  // anchor the panel off-centre. No backdrop mask: a transparent layer only
  // catches outside clicks / Escape; the panel floats on its own shadow so the
  // page stays fully visible behind.
  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="AI Refiner"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-t-2xl sm:rounded-2xl shadow-elevated flex flex-col max-h-[92dvh] sm:max-h-[80vh] overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 fade-in duration-200"
      >
        <div className="sheet-grabber" />

        {/* Header — compact */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="font-display font-semibold text-sm text-zinc-900 dark:text-white">AI Refiner</h3>
          </div>
          <button onClick={onClose} className="btn-icon h-7 w-7" aria-label="Close AI refiner">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-3">

          {/* Preset chips — one compact row */}
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setAction(preset.id)}
                className={`h-7 px-2.5 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                  action === preset.id
                    ? "bg-primary text-white border-primary"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Draft */}
          <textarea
            id="ai-original-draft"
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
            placeholder="Write or paste the text to refine…"
            rows={3}
            className="field text-sm resize-none"
          />

          {error && (
            <div className="flex items-center gap-2 p-2.5 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-lg text-xs font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Suggestion — appears after generating */}
          {(loading || suggestion) && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Suggestion</span>
              </div>
              {loading ? (
                <div className="flex items-center justify-center gap-2 h-[76px] rounded-xl border border-dashed border-primary/30 bg-primary/5 dark:bg-primary/10">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Refining…</span>
                </div>
              ) : (
                <textarea
                  id="ai-suggestion"
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  rows={3}
                  aria-label="AI suggestion"
                  className="field text-sm resize-none border-primary/30 bg-primary/5 dark:bg-primary/10 text-zinc-800 dark:text-zinc-100"
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={handleEnhance}
            disabled={loading || !originalText.trim()}
            className="btn btn-primary btn-sm flex-1 sm:flex-initial"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Refining…</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5" />
                <span>{suggestion ? "Regenerate" : "Generate"}</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={loading || !suggestion}
            className="btn btn-secondary btn-sm flex-1 sm:flex-initial ml-auto"
          >
            Apply
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
