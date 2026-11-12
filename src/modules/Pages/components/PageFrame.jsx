/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";

/**
 * A page design never runs in the app itself. It is a self-contained HTML
 * file (a template, or one Cortex rewrote) shown in a sandboxed frame with no
 * access to the app's origin, storage or login. The policy below also blocks
 * every network request except Google Fonts, so a design cannot load scripts
 * or send data anywhere.
 */
const POLICY = "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'\">";

/**
 * Hub's own few lines inside the frame: say when the design is ready for
 * data, print on request, (in the editor) let a click on a part of the
 * page point Cortex at it, and (outside the editor) tell Hub when a task's
 * comments button is pressed. Parts are elements carrying `data-hub-part`;
 * comment buttons carry `data-hub-comments="{taskId}"` and `data-hub-title`.
 * The thread itself opens in Hub, outside the frame.
 */
const BOOT = `<script>(function(){
var part=null,edit=false;
function post(m){parent.postMessage(m,'*');}
function mark(){
  var all=document.querySelectorAll('[data-hub-part]');
  for(var i=0;i<all.length;i++){var on=edit&&part!==null&&all[i].getAttribute('data-hub-part')===part;
    all[i].style.outline=on?'2px dashed rgba(77,159,255,.8)':'';all[i].style.outlineOffset=on?'-4px':'';}
}
window.addEventListener('message',function(e){var d=e.data||{};
  if(d.type==='hub-print'){window.print();}
  if(d.type==='hub-edit'){edit=!!d.on;if(!edit)part=null;document.documentElement.style.cursor=edit?'pointer':'';mark();}
  if(d.type==='hub-clear'){part=null;mark();}
});
document.addEventListener('click',function(e){
  if(!edit)return;
  var el=e.target.closest&&e.target.closest('[data-hub-part]');
  if(!el)return;
  if(e.target.closest('a'))e.preventDefault();
  var name=el.getAttribute('data-hub-part');
  part=part===name?null:name;mark();post({type:'hub-select',part:part});
},true);
document.addEventListener('click',function(e){
  if(edit)return;
  var el=e.target.closest&&e.target.closest('[data-hub-comments]');
  if(!el)return;
  e.preventDefault();
  post({type:'hub-comments',taskId:Number(el.getAttribute('data-hub-comments')),title:String(el.getAttribute('data-hub-title')||'')});
});
document.addEventListener('DOMContentLoaded',function(){
  new MutationObserver(mark).observe(document.body,{childList:true,subtree:true});
  post({type:'hub-ready'});
});
})();</script>`;

/**
 * The policy and Hub's script always come first, in a head of our own, so no
 * design can run anything before them or push them out of the head. The
 * parser folds the design's own html/head/body tags into this document.
 */
function withHubHead(html) {
  const design = (html || "").replace(/^\s*<!doctype[^>]*>/i, "");
  return `<!doctype html><html><head>${POLICY}${BOOT}</head>${design}`;
}

/**
 * Shows a page design with its data. Data is handed in by message (the
 * design cannot fetch), again each time `data` changes, which is how a live
 * page updates in place. `onOpenComments({ taskId, title })` fires when a
 * task's comments button is pressed in the design; leave it out and those
 * buttons do nothing. Ref: `print()` and `clearSelection()`.
 */
export const PageFrame = forwardRef(function PageFrame({ html, data, editable = false, onSelectPart, onOpenComments, title, className = "" }, ref) {
  const frame = useRef(null);
  const ready = useRef(false);
  const loads = useRef(0);
  const [left, setLeft] = useState(false);
  const srcDoc = useMemo(() => withHubHead(html), [html]);

  const post = useCallback((message) => frame.current?.contentWindow?.postMessage(message, "*"), []);
  const send = useCallback(() => {
    if (!data) return;
    post({ type: "hub-data", data });
    post({ type: "hub-edit", on: editable });
  }, [post, data, editable]);

  useEffect(() => { ready.current = false; loads.current = 0; setLeft(false); }, [srcDoc]);

  // A design has one document. A second load means it navigated itself somewhere else:
  // stop showing it (and stop handing it data) instead of trusting whatever it became.
  const onLoad = () => { loads.current += 1; if (loads.current > 1) setLeft(true); };

  useEffect(() => {
    const onMessage = (e) => {
      if (e.source !== frame.current?.contentWindow) return;
      if (e.data?.type === "hub-ready") { ready.current = true; send(); }
      if (e.data?.type === "hub-select") {
        // The name comes from the design, so take only a short plain string.
        const part = e.data.part;
        onSelectPart?.(typeof part === "string" && part ? part.slice(0, 120) : null);
      }
      if (e.data?.type === "hub-comments") {
        // Both values come from the design: a real task id and a short plain title, or nothing.
        const { taskId, title: taskTitle } = e.data;
        if (Number.isSafeInteger(taskId) && taskId > 0) {
          onOpenComments?.({ taskId, title: typeof taskTitle === "string" ? taskTitle.slice(0, 300) : "" });
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [send, onSelectPart, onOpenComments]);

  useEffect(() => { if (ready.current) send(); }, [send]);

  useImperativeHandle(ref, () => ({
    print: () => post({ type: "hub-print" }),
    clearSelection: () => post({ type: "hub-clear" }),
  }), [post]);

  if (left) {
    return (
      <div className={`w-full h-full flex items-center justify-center p-6 text-center text-sm text-zinc-300 bg-[#0f141c] ${className}`}>
        This design tried to open another page and was stopped. Restore an earlier version to fix it.
      </div>
    );
  }

  return (
    <iframe
      ref={frame}
      onLoad={onLoad}
      title={title || "Page"}
      srcDoc={srcDoc}
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-modals"
      className={`block w-full h-full border-0 bg-transparent ${className}`}
    />
  );
});
