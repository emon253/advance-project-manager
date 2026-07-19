/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from "react";

// OAuth 2.0 Web-application client ID (Google Cloud Console). Public by
// design — it identifies the app, it doesn't authenticate it — so the live
// ID is safe as the baked-in default; VITE_GOOGLE_CLIENT_ID overrides it
// (set it to "" to hide Google sign-in entirely).
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
  ?? "865958340443-18nmi7r1pfhtbiabi87ted2tkfaer7ca.apps.googleusercontent.com";

export const googleSignInAvailable = Boolean(CLIENT_ID);

let gsiLoader = null;
function loadGsi() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!gsiLoader) {
    gsiLoader = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = resolve;
      script.onerror = () => { gsiLoader = null; reject(new Error("gsi load failed")); };
      document.head.appendChild(script);
    });
  }
  return gsiLoader;
}

/**
 * The official Google Identity Services button (required branding for the
 * ID-token flow). On success it hands the signed credential to onCredential;
 * the caller exchanges it at POST /auth/google for a normal session.
 */
export function GoogleSignInButton({ onCredential, onError }) {
  const slotRef = useRef(null);
  const handlersRef = useRef({ onCredential, onError });
  handlersRef.current = { onCredential, onError };

  useEffect(() => {
    if (!CLIENT_ID) return undefined;
    let cancelled = false;
    loadGsi()
      .then(() => {
        if (cancelled || !slotRef.current) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          ux_mode: "popup",
          callback: (response) => handlersRef.current.onCredential?.(response.credential),
        });
        window.google.accounts.id.renderButton(slotRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rect",
          logo_alignment: "center",
          width: Math.min(400, Math.max(200, slotRef.current.offsetWidth || 360)),
        });
      })
      .catch(() => handlersRef.current.onError?.(
        "Google sign-in couldn't load — check your connection and try again."));
    return () => { cancelled = true; };
  }, []);

  if (!CLIENT_ID) return null;
  return <div ref={slotRef} className="flex justify-center" id="google-signin-slot" />;
}
