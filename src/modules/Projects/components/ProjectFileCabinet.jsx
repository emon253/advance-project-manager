/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Paperclip, AlertTriangle, FileText } from "lucide-react";
import { formatDateTime } from "../util/projectUtils";

export function ProjectFileCabinet({
  project,
  projectFiles,
  fileInputRef,
  handleRealFileUpload,
  errorMsg,
  setPreviewFile,
  handleDownloadFile,
  removeAttachmentFromProject
}) {
  return (
    <div className="card p-3 sm:p-4 text-left">
      <h3 className="font-display font-semibold text-sm sm:text-base text-zinc-900 dark:text-white mb-1">Asset Cabinet</h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 sm:mb-5 font-medium">Corporate assets, specs documentations, schemas, and design guidelines tied to this project.</p>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleRealFileUpload}
        accept="image/png, image/jpeg, image/jpg, image/webp, application/pdf"
        className="hidden"
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full border border-dashed border-zinc-300 dark:border-zinc-700 p-4 sm:p-6 rounded-xl text-center cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40 mb-3 sm:mb-6 transition-colors"
      >
        <Paperclip className="w-6 h-6 mx-auto text-zinc-400 mb-2" />
        <p className="text-sm font-semibold text-primary">Click to upload assets</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1">Supports PDF & Image files up to 1.5MB for storage protection.</p>
      </button>

      {errorMsg && (
        <div className="p-3 mb-4 text-xs font-semibold text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="divide-y divide-zinc-100 dark:divide-zinc-800 sm:divide-y-0 sm:space-y-2.5">
        {projectFiles.map((file, idx) => {
          const isImage = ["png", "jpg", "jpeg", "webp"].includes(file.type?.toLowerCase());
          const isPDF = file.type?.toLowerCase() === "pdf";
          const isMockFile = ["att_mock1", "att_mock2", "att_mock3"].includes(file.id);
          return (
            <div
              key={file.id || idx}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-0 py-2.5 border-0 bg-transparent rounded-none sm:p-3 sm:border sm:border-zinc-200 sm:dark:border-zinc-800 sm:rounded-xl sm:bg-zinc-50/50 sm:dark:bg-zinc-800/30 gap-2.5 sm:gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                {isImage && file.base64 ? (
                  <button
                    type="button"
                    onClick={() => setPreviewFile(file)}
                    className="shrink-0 cursor-pointer"
                    aria-label={`Preview ${file.name}`}
                  >
                    <img
                      src={file.base64}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover hover:opacity-85 border border-zinc-200 dark:border-zinc-700"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ) : (
                  <span className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shrink-0 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10">
                    <FileText className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  </span>
                )}
                <div className="min-w-0">
                  <h4 className="font-semibold text-sm text-zinc-800 dark:text-zinc-100 truncate">{file.name}</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate">
                    {file.size} • Uploaded {file.createdAt ? formatDateTime(file.createdAt) : (file.timestamp && file.timestamp !== "Just now" ? formatDateTime(file.timestamp) : file.timestamp || "Just now")} by {file.author || "Guest"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                {(isImage || isPDF) && file.base64 && (
                  <button
                    type="button"
                    onClick={() => setPreviewFile(file)}
                    className="btn btn-sm btn-ghost text-primary hover:text-primary hover:bg-primary/8 dark:hover:bg-primary/15"
                  >
                    Preview
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDownloadFile(file)}
                  className="btn btn-sm btn-secondary"
                >
                  Download
                </button>
                {!isMockFile && (
                  <button
                    type="button"
                    onClick={() => removeAttachmentFromProject(project.id, file.id)}
                    className="btn btn-sm btn-danger-soft"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
