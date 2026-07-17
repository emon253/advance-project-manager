import React, { useState, useEffect } from "react";
import { Wand2, Loader2, X, AlertCircle, CheckCircle2 } from "lucide-react";

const PRESETS = [
  { id: "grammar", title: "Fix Grammar", hint: "Spelling & typos" },
  { id: "professional", title: "Professional Tone", hint: "Executive & formal" },
  { id: "concise", title: "Make Concise", hint: "Trim extra words" },
  { id: "expand", title: "Expand Detail", hint: "Structure & bullets" },
];

export function AIEnhancerModal({ isOpen, onClose, initialValue, onApply, type = "description" }) {
  const [originalText, setOriginalText] = useState(initialValue || "");
  const [action, setAction] = useState("grammar"); // grammar, professional, concise, expand
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestion, setSuggestion] = useState("");

  // Sync initial value when modal opens
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
      setError("Please write some text to enhance.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/enhance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: originalText,
          type,
          action,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to contact Gemini API.");
      }

      const data = await response.json();
      if (data.enhancedText) {
        setSuggestion(data.enhancedText);
      } else {
        throw new Error("No suggestion returned from the AI model.");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong while connecting to Gemini.");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    const finalVal = suggestion || originalText;
    onApply(finalVal);
    onClose();
  };

  const getPresetLabel = () => {
    switch (action) {
      case "grammar": return "Fix spelling & grammar mistakes while keeping original style.";
      case "professional": return "Polishes tone to be highly executive, articulate and formal.";
      case "concise": return "Trims extra words to make it crisp, fast-reading and impactful.";
      case "expand": return "Enriches description with clear structure, professional bullet points or detail.";
      default: return "";
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel sm:max-w-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Gemini AI Refiner"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-grabber" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/8 dark:bg-primary/15 flex items-center justify-center border border-primary/20">
              <Wand2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-sm text-zinc-900 dark:text-white leading-tight">Gemini AI Refiner</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Grammar fixer, text enhancer & professional polisher</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" aria-label="Close AI refiner">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Preset buttons */}
          <div>
            <span className="label">Enhancement Presets</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setAction(preset.id)}
                  className={`px-3 py-2 rounded-lg border transition-colors text-left flex flex-col gap-0.5 cursor-pointer ${
                    action === preset.id
                      ? "bg-primary/8 dark:bg-primary/15 border-primary/20 text-primary"
                      : "bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-700 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span className="text-[11px] font-semibold">{preset.title}</span>
                  <span className="text-[10px] opacity-75 font-normal leading-tight">{preset.hint}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mt-2">
              {getPresetLabel()}
            </p>
          </div>

          {/* Core editors grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Original draft column */}
            <div className="flex flex-col">
              <label htmlFor="ai-original-draft" className="label">Original draft</label>
              <textarea
                id="ai-original-draft"
                value={originalText}
                onChange={(e) => setOriginalText(e.target.value)}
                placeholder="Write your draft description or text here..."
                className="field flex-1 min-h-[160px] text-xs"
              />
            </div>

            {/* AI suggestion column */}
            <div className="flex flex-col">
              <label htmlFor="ai-suggestion" className="label">AI Suggestion</label>
              <div className="flex-1 relative min-h-[160px] flex flex-col">
                {loading ? (
                  <div className="absolute inset-0 z-10 bg-zinc-50/90 dark:bg-zinc-950/90 border border-dashed border-primary/20 rounded-lg flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Gemini is rewriting...</span>
                  </div>
                ) : null}
                <textarea
                  id="ai-suggestion"
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  placeholder="The AI suggestion will appear here. You can refine or edit it before applying."
                  className={`field grow min-h-[160px] text-xs ${
                    suggestion
                      ? "border-primary/20 bg-primary/8 dark:bg-primary/15 text-zinc-800 dark:text-zinc-100"
                      : ""
                  }`}
                  disabled={loading}
                />
              </div>
            </div>

          </div>

          {/* Feedback details */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-lg text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {suggestion && !loading && (
            <div className="flex items-start gap-2 p-3 bg-primary/8 dark:bg-primary/15 text-zinc-700 dark:text-zinc-300 border border-primary/20 rounded-lg text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-primary mt-0.5" />
              <span>
                <strong>Gemini Tip:</strong> You can edit the AI output directly in the suggestion panel to make any final tweaks before clicking <strong>Apply Refinement</strong>.
              </span>
            </div>
          )}

        </div>

        {/* Footer controls */}
        <div className="px-5 pt-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium hidden sm:inline-block">
            Powered by Gemini 3.5 Flash
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto ml-auto">
            <button
              type="button"
              onClick={handleEnhance}
              disabled={loading || !originalText.trim()}
              className="btn btn-primary flex-1 sm:flex-initial shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Refining Text...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Generate Refinement</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={loading || (!suggestion && !originalText.trim())}
              className="btn btn-secondary flex-1 sm:flex-initial shrink-0"
            >
              Apply Refinement
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
