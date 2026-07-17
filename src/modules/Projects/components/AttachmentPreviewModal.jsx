/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { X, Download } from "lucide-react";

export function AttachmentPreviewModal({ previewFile, setPreviewFile, handleDownloadFile }) {
  if (!previewFile) return null;

  return (
    <div
      onClick={() => setPreviewFile(null)}
      className="modal-overlay z-[99]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-panel max-w-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="attachment-preview-title"
      >
        <div className="sheet-grabber" />

        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <h4 id="attachment-preview-title" className="font-display font-semibold text-sm text-zinc-900 dark:text-white truncate">
            {previewFile.name}
          </h4>
          <button
            type="button"
            onClick={() => setPreviewFile(null)}
            className="btn-icon"
            aria-label="Close preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="flex items-center justify-center bg-zinc-100 dark:bg-zinc-950 rounded-xl p-2 min-h-[300px]">
            {["png", "jpg", "jpeg", "webp"].includes(previewFile.type?.toLowerCase()) ? (
              <img
                src={previewFile.base64}
                alt=""
                className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-soft"
                referrerPolicy="no-referrer"
              />
            ) : previewFile.type?.toLowerCase() === "pdf" ? (
              <iframe
                src={previewFile.base64}
                className="w-full h-[60vh] rounded-lg border-0 bg-white"
                title={previewFile.name}
              />
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                Download to inspect unviewable mime types ({previewFile.type}).
              </p>
            )}
          </div>
        </div>

        {/* Sticky footer */}
        <div className="flex items-center justify-end gap-2 px-5 pt-3.5 border-t border-zinc-200 dark:border-zinc-800 shrink-0 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => setPreviewFile(null)}
            className="btn btn-secondary flex-1 sm:flex-none"
          >
            Close
          </button>
          {previewFile.base64 && (
            <button
              type="button"
              onClick={() => handleDownloadFile(previewFile)}
              className="btn btn-primary flex-1 sm:flex-none"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
