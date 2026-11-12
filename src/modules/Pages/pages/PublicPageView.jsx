/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { pagesApi } from "../../../api/endpoints";
import { PageFrame } from "../components/PageFrame";
import { Wordmark } from "../../../components/common/Logo";

const LIVE_MS = 60000;

/**
 * What the share link opens: the page, full window, nothing else. It reads
 * its data over REST on load, again every minute while the tab is visible
 * and when the tab comes back, so task changes show up without a republish.
 * The server answers 304 when nothing changed, and the frame is only
 * repainted when the answer differs. `?print=1` opens the print dialog (PDF).
 */
export function PublicPageView() {
  const { token } = useParams();
  const [params] = useSearchParams();
  const location = useLocation();
  const [view, setView] = useState(null);
  const [problem, setProblem] = useState(null); // "signin" | "missing"
  const seen = useRef("");
  const frame = useRef(null);
  const printed = useRef(false);

  const load = useCallback(async () => {
    try {
      const next = await pagesApi.viewByToken(token);
      const text = JSON.stringify(next);
      if (text !== seen.current) { seen.current = text; setView(next); }
      setProblem(null);
    } catch (err) {
      // The page was unpublished, made team-only or deleted: stop showing it. A network blip keeps the last good page.
      const gone = err.status === 401 || err.status === 403 || err.status === 404;
      if (gone || !seen.current) {
        seen.current = "";
        setView(null);
        setProblem(err.status === 401 ? "signin" : "missing");
      }
    }
  }, [token]);

  useEffect(() => {
    load();
    const tick = () => { if (document.visibilityState === "visible") load(); };
    const timer = setInterval(tick, LIVE_MS);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", tick); window.removeEventListener("focus", tick); };
  }, [load]);

  useEffect(() => { if (view?.title) document.title = view.title; }, [view?.title]);

  // PDF: give the design a moment to paint its first data, then print once.
  useEffect(() => {
    if (!view || printed.current || params.get("print") !== "1") return undefined;
    const timer = setTimeout(() => { printed.current = true; frame.current?.print(); }, 900);
    return () => clearTimeout(timer);
  }, [view, params]);

  if (problem) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-3 px-8 text-center bg-zinc-50 text-zinc-900">
        <Wordmark className="text-2xl" />
        <h1 className="mt-3 text-lg font-bold">{problem === "signin" ? "Sign in to view this page" : "This page isn't available"}</h1>
        <p className="max-w-sm text-sm text-zinc-600">
          {problem === "signin" ? "It is shared with the team only." : "The link may be wrong, or the page was unpublished or deleted."}
        </p>
        {problem === "signin" && <Link to={`/login?next=${encodeURIComponent(location.pathname)}`} className="btn btn-primary mt-1">Sign in</Link>}
      </div>
    );
  }
  if (!view) return <div className="min-h-dvh bg-[#0f141c]" aria-busy="true" />;

  return (
    <div className="h-dvh w-full bg-[#0f141c]">
      <PageFrame ref={frame} html={view.html} data={view.data} title={view.title} />
    </div>
  );
}
