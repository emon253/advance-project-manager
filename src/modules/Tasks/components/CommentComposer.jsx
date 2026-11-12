/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Paperclip, X, Loader2, ArrowUp, AtSign } from "lucide-react";
import { UserAvatar } from "../../../components/common/UserAvatar";

/**
 * Comment composer, chat style: a rounded input with mention and attach
 * inside and a round send button beside it. The inline edit box (`compact`)
 * is a plain box with Save / Cancel underneath. @mention
 * autocomplete, paste/drop files. Mentions are tracked as "@Full Name" tokens
 * → user id; on submit only tokens still present in the text are sent.
 *
 * Props: members, onSubmit({ text, mentionUserIds, attachmentIds })
 * → Promise<bool>, onUpload(file) → Promise<attachment|null>, initial for edit
 * mode, compact (edit mode: Save/Cancel), onCancel, maxLength. With no
 * `members` there is no mention button; with no `onUpload`, no attach button.
 * `disabled` holds sending (the text stays typed); `label` names the input
 * and the send button when this is not a comment box (the assistant chat).
 */
export const CommentComposer = forwardRef(function CommentComposer(
  { members = [], onSubmit, onUpload, initial, compact = false, onCancel, placeholder = "Write a comment…", maxLength, disabled = false, label },
  ref
) {
  const [text, setText] = useState(initial?.text || "");
  const [mentions, setMentions] = useState(() => (initial?.mentions || []).map((m) => ({ id: m.id, name: m.name })));
  const [attachments, setAttachments] = useState(initial?.attachments || []);
  const [uploading, setUploading] = useState(0);
  const [sending, setSending] = useState(false);
  const [focused, setFocused] = useState(false);
  const [mentionQuery, setMentionQuery] = useState(null); // { start, query }
  const [highlight, setHighlight] = useState(0);
  const textareaRef = useRef(null);
  const fileRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
    prefill: (value) => {
      setText(value);
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (el) { el.focus(); el.setSelectionRange(value.length, value.length); }
      });
    },
  }));

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  const suggestions = mentionQuery
    ? members.filter((m) => m.name.toLowerCase().includes(mentionQuery.query.toLowerCase())).slice(0, 6)
    : [];

  const detectMention = (value, caret) => {
    const before = value.slice(0, caret);
    const at = before.lastIndexOf("@");
    if (at === -1) return null;
    const query = before.slice(at + 1);
    if (/\s{2,}|\n/.test(query) || query.length > 30) return null;
    if (at > 0 && !/\s/.test(before[at - 1])) return null;
    return { start: at, query };
  };

  const handleChange = (e) => {
    setText(e.target.value);
    setMentionQuery(detectMention(e.target.value, e.target.selectionStart));
    setHighlight(0);
  };

  const insertMention = (member) => {
    if (!mentionQuery) return;
    const token = `@${member.name} `;
    const caret = textareaRef.current?.selectionStart ?? text.length;
    const next = text.slice(0, mentionQuery.start) + token + text.slice(caret);
    setText(next);
    setMentions((prev) => (prev.some((m) => m.id === member.id) ? prev : [...prev, { id: member.id, name: member.name }]));
    setMentionQuery(null);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      const pos = mentionQuery.start + token.length;
      el?.focus();
      el?.setSelectionRange(pos, pos);
    });
  };

  const startMention = () => {
    const el = textareaRef.current;
    const caret = el?.selectionStart ?? text.length;
    const needsSpace = caret > 0 && !/\s/.test(text[caret - 1]);
    const insert = `${needsSpace ? " " : ""}@`;
    const next = text.slice(0, caret) + insert + text.slice(caret);
    setText(next);
    setMentionQuery({ start: caret + (needsSpace ? 1 : 0), query: "" });
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(caret + insert.length, caret + insert.length); });
  };

  const addFiles = async (files) => {
    const list = Array.from(files || []).filter(Boolean);
    if (!list.length || !onUpload) return;
    setUploading((n) => n + list.length);
    for (const file of list) {
      // eslint-disable-next-line no-await-in-loop
      const att = await onUpload(file);
      if (att) setAttachments((prev) => [...prev, att]);
      setUploading((n) => n - 1);
    }
  };

  const handlePaste = (e) => {
    const files = Array.from(e.clipboardData?.files || []);
    if (files.length) { e.preventDefault(); addFiles(files); }
  };

  const submit = async () => {
    if (!text.trim() || sending || disabled || uploading > 0) return;
    setSending(true);
    const mentionUserIds = mentions.filter((m) => text.includes(`@${m.name}`)).map((m) => m.id);
    const ok = await onSubmit({ text: text.trim(), mentionUserIds, attachmentIds: attachments.map((a) => a.id) });
    setSending(false);
    if (ok !== false && !compact) { setText(""); setMentions([]); setAttachments([]); }
  };

  const handleKeyDown = (e) => {
    if (mentionQuery && suggestions.length) {
      if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => (h + 1) % suggestions.length); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertMention(suggestions[highlight]); return; }
      if (e.key === "Escape") { setMentionQuery(null); return; }
    }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
    if (e.key === "Escape" && compact) onCancel?.();
  };

  const canSend = text.trim().length > 0 && !sending && !disabled && uploading === 0;

  const iconBtn = compact ? "btn-icon h-7 w-7" : "btn-icon h-8 w-8 rounded-full";
  const attachButton = onUpload && (
    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => fileRef.current?.click()} className={iconBtn} aria-label="Attach a file" title="Attach a file (or paste an image)">
      <Paperclip className="w-4 h-4" />
    </button>
  );
  const mentionButton = members.length > 0 && (
    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={startMention} className={iconBtn} aria-label="Mention someone" title="Mention someone">
      <AtSign className="w-4 h-4" />
    </button>
  );
  const boxTone = focused || compact
    ? "border-primary ring-2 ring-primary/15 bg-white dark:bg-zinc-900"
    : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600";

  return (
    <div
      className={`relative ${compact ? "" : "flex items-end gap-2 md:gap-2.5"}`}
      onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
      onDragOver={(e) => e.preventDefault()}
    >
      <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
      <div className="flex-1 min-w-0 relative">
        {mentionQuery && suggestions.length > 0 && (
          <ul role="listbox" aria-label="Mention a member" className="menu-panel absolute left-0 bottom-full mb-1.5 z-40 w-64 max-w-full p-1">
            {suggestions.map((m, i) => (
              <li key={m.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={i === highlight}
                  onMouseDown={(e) => { e.preventDefault(); insertMention(m); }}
                  className={`w-full flex items-center gap-2 h-9 md:h-8 px-2 rounded-md text-left text-[13px] cursor-pointer ${i === highlight ? "bg-primary/8 dark:bg-primary/15" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
                >
                  <UserAvatar user={m} size="xs" />
                  <span className="font-semibold text-zinc-900 dark:text-white truncate">{m.name}</span>
                  {m.role && <span className="ml-auto text-[11px] text-zinc-400">{m.role}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className={`border transition-[border-color,box-shadow,background-color] ${compact ? "rounded-lg" : "rounded-[22px]"} ${boxTone}`}>
          <div className={compact ? "" : "flex items-end"}>
            <textarea
              ref={textareaRef}
              value={text}
              rows={1}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onFocus={() => setFocused(true)}
              onBlur={() => { setFocused(false); setTimeout(() => setMentionQuery(null), 150); }}
              placeholder={placeholder}
              maxLength={maxLength}
              aria-label={label || (compact ? "Edit comment" : "Write a comment")}
              className={`w-full max-h-40 bg-transparent text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none resize-none leading-relaxed ${
                compact ? "min-h-[36px] px-3 pt-2 pb-1 text-base md:text-[13px]" : `flex-1 min-h-[42px] pl-3.5 ${mentionButton || attachButton ? "pr-1" : "pr-3.5"} py-[9px] text-base md:text-sm md:py-[10px]`
              }`}
            />
            {!compact && (mentionButton || attachButton) && <div className="flex items-center gap-1 shrink-0 pr-1.5 pb-[5px]">{mentionButton}{attachButton}</div>}
          </div>
          {(attachments.length > 0 || uploading > 0) && (
            <div className="flex flex-wrap gap-1.5 px-3 pb-2">
              {attachments.map((a) => (
                <span key={a.id} className="inline-flex items-center gap-1.5 h-6 pl-2 pr-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 max-w-[220px]">
                  <Paperclip className="w-3 h-3 shrink-0" />
                  <span className="truncate">{a.name}</span>
                  <button type="button" onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))} className="btn-icon h-4 w-4 rounded" aria-label={`Remove ${a.name}`}><X className="w-3 h-3" /></button>
                </span>
              ))}
              {uploading > 0 && (
                <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[11px] font-semibold text-zinc-500">
                  <Loader2 className="w-3 h-3 animate-spin" /> Uploading…
                </span>
              )}
            </div>
          )}
          {compact && (
            <div className="flex items-center gap-0.5 px-1.5 pb-1.5">
              {attachButton}
              {mentionButton}
              <span className="flex-1" />
              <span className="hidden sm:inline text-[11px] text-zinc-400 mr-1.5">Esc to cancel</span>
              <button type="button" onClick={onCancel} className="btn btn-sm btn-ghost">Cancel</button>
              <button type="button" onClick={submit} disabled={!canSend} className="btn btn-sm btn-primary">Save</button>
            </div>
          )}
        </div>
      </div>

      {!compact && (
        <button
          type="button"
          onClick={submit}
          disabled={!canSend}
          aria-label={label ? "Send message" : "Send comment"}
          className="shrink-0 inline-flex items-center justify-center h-11 w-11 rounded-full bg-primary text-white hover:bg-primary-hover active:scale-95 disabled:bg-zinc-200 disabled:text-zinc-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500 transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          {sending ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <ArrowUp className="w-[18px] h-[18px]" strokeWidth={2.4} />}
        </button>
      )}
    </div>
  );
});
