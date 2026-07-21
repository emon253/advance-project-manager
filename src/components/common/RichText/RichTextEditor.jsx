/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Bold, Italic, Underline, List, ListOrdered, Quote, Code, Link2, X, Check } from "lucide-react";
import { sanitizeHtml } from "./sanitizeHtml";

/**
 * Self-contained WYSIWYG editor (no external library). Bold/italic/underline,
 * bulleted & numbered lists, block quote, inline code, and links — the same
 * formatting set a Trello card offers, rendered live as you type.
 *
 * Storage is HTML, sanitized on every keystroke via {@link sanitizeHtml} before
 * it leaves the component, so onChange only ever emits allowlisted markup. The
 * contentEditable node stays uncontrolled to preserve the caret; the incoming
 * `value` is only written back when it differs from what's on screen and the
 * field isn't focused (external resets, opening a different record).
 */

// Live formatting styles so typed content looks right inside the editor. Mirror
// these in RichTextView so authoring and reading match.
export const RICHTEXT_CONTENT_CLASS =
  "[&_p]:my-0 [&_p]:leading-relaxed " +
  "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1.5 [&_li]:my-0.5 " +
  "[&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:mt-2.5 [&_h4]:mb-1 " +
  "[&_blockquote]:border-l-2 [&_blockquote]:border-zinc-300 dark:[&_blockquote]:border-zinc-600 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-zinc-500 dark:[&_blockquote]:text-zinc-400 [&_blockquote]:my-1.5 " +
  "[&_code]:font-mono [&_code]:text-[0.85em] [&_code]:bg-zinc-100 dark:[&_code]:bg-zinc-800 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded " +
  "[&_pre]:font-mono [&_pre]:text-[0.8125rem] [&_pre]:bg-zinc-100 dark:[&_pre]:bg-zinc-800 [&_pre]:rounded-lg [&_pre]:px-3 [&_pre]:py-2 [&_pre]:my-1.5 [&_pre]:whitespace-pre-wrap [&_pre]:overflow-x-auto " +
  "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a]:break-words " +
  "[&_strong]:font-semibold";

function ToolButton({ onMouseDown, active, disabled, title, children }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={onMouseDown}
      className={
        "flex h-7 w-7 items-center justify-center rounded-md transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default " +
        (active
          ? "bg-primary/10 text-primary"
          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200")
      }
    >
      {children}
    </button>
  );
}

export function RichTextEditor({ value = "", onChange, placeholder = "Write something…", id, minHeight = 120, disabled = false }) {
  const editorRef = useRef(null);
  const savedRange = useRef(null);
  const [activeMarks, setActiveMarks] = useState({});
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  // Write external value in only when it truly differs from the DOM — never
  // mid-edit — so the caret never jumps while typing.
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const incoming = value || "";
    if (el !== document.activeElement && el.innerHTML !== incoming) {
      el.innerHTML = incoming;
    }
  }, [value]);

  useEffect(() => {
    // Paragraphs (not <div>) as the line separator keeps output tidy.
    try { document.execCommand("defaultParagraphSeparator", false, "p"); } catch { /* not all engines */ }
  }, []);

  const emit = useCallback(() => {
    const el = editorRef.current;
    if (el) onChange?.(sanitizeHtml(el.innerHTML));
  }, [onChange]);

  const refreshMarks = useCallback(() => {
    if (!editorRef.current || document.activeElement !== editorRef.current) return;
    const q = (cmd) => { try { return document.queryCommandState(cmd); } catch { return false; } };
    setActiveMarks({
      bold: q("bold"), italic: q("italic"), underline: q("underline"),
      ul: q("insertUnorderedList"), ol: q("insertOrderedList"),
    });
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", refreshMarks);
    return () => document.removeEventListener("selectionchange", refreshMarks);
  }, [refreshMarks]);

  const exec = (command, arg) => (e) => {
    e.preventDefault(); // keep focus/selection in the editor
    editorRef.current?.focus();
    try { document.execCommand(command, false, arg); } catch { /* unsupported */ }
    emit();
    refreshMarks();
  };

  const toggleBlock = (block) => (e) => {
    e.preventDefault();
    editorRef.current?.focus();
    // formatBlock toggles: re-applying the current block returns to a paragraph.
    let current = "";
    try { current = (document.queryCommandValue("formatBlock") || "").toLowerCase(); } catch { /* ignore */ }
    try { document.execCommand("formatBlock", false, current === block ? "p" : block); } catch { /* ignore */ }
    emit();
  };

  const openLink = (e) => {
    e.preventDefault();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      editorRef.current?.focus();
      return; // need selected text to link
    }
    savedRange.current = sel.getRangeAt(0).cloneRange();
    setLinkUrl("");
    setLinkOpen(true);
  };

  const applyLink = () => {
    const url = linkUrl.trim();
    setLinkOpen(false);
    if (!url || !savedRange.current) return;
    const href = /^(https?:|mailto:)/i.test(url) ? url : `https://${url}`;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedRange.current);
    try { document.execCommand("createLink", false, href); } catch { /* ignore */ }
    emit();
  };

  return (
    <div className={"rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15 transition-shadow " + (disabled ? "opacity-60 pointer-events-none" : "")}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-zinc-100 dark:border-zinc-800 px-1.5 py-1">
        <ToolButton title="Bold (Ctrl+B)" active={activeMarks.bold} onMouseDown={exec("bold")}><Bold className="w-3.5 h-3.5" /></ToolButton>
        <ToolButton title="Italic (Ctrl+I)" active={activeMarks.italic} onMouseDown={exec("italic")}><Italic className="w-3.5 h-3.5" /></ToolButton>
        <ToolButton title="Underline (Ctrl+U)" active={activeMarks.underline} onMouseDown={exec("underline")}><Underline className="w-3.5 h-3.5" /></ToolButton>
        <span className="mx-0.5 h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
        <ToolButton title="Bulleted list" active={activeMarks.ul} onMouseDown={exec("insertUnorderedList")}><List className="w-3.5 h-3.5" /></ToolButton>
        <ToolButton title="Numbered list" active={activeMarks.ol} onMouseDown={exec("insertOrderedList")}><ListOrdered className="w-3.5 h-3.5" /></ToolButton>
        <ToolButton title="Quote" onMouseDown={toggleBlock("blockquote")}><Quote className="w-3.5 h-3.5" /></ToolButton>
        <ToolButton title="Code block" onMouseDown={toggleBlock("pre")}><Code className="w-3.5 h-3.5" /></ToolButton>
        <span className="mx-0.5 h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
        <ToolButton title="Add link (select text first)" onMouseDown={openLink}><Link2 className="w-3.5 h-3.5" /></ToolButton>
      </div>

      {linkOpen && (
        <div className="flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800 px-2 py-1.5">
          <input
            autoFocus
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyLink(); } if (e.key === "Escape") setLinkOpen(false); }}
            placeholder="https://…"
            className="flex-1 bg-transparent text-xs text-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none"
          />
          <button type="button" onClick={applyLink} className="flex h-6 w-6 items-center justify-center rounded text-primary hover:bg-primary/10 cursor-pointer" title="Apply link"><Check className="w-3.5 h-3.5" /></button>
          <button type="button" onClick={() => setLinkOpen(false)} className="flex h-6 w-6 items-center justify-center rounded text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer" title="Cancel"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <div
        id={id}
        ref={editorRef}
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        data-placeholder={placeholder}
        style={{ minHeight }}
        className={
          "richtext-editable px-3 py-2.5 text-sm text-zinc-700 dark:text-zinc-200 focus:outline-none overflow-y-auto " +
          RICHTEXT_CONTENT_CLASS
        }
      />
    </div>
  );
}
