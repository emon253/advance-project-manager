/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAppState } from "../../../app/providers";
import { Eye, EyeOff, ShieldAlert, CheckCircle2 } from "lucide-react";

export function AuthPages() {
  const { login, register, forgotPassword, resetPassword, isAuthenticated } = useAppState();
  const navigate = useNavigate();
  const location = useLocation();

  // Route sniffing to determine which auth form to render
  const isRegister = location.pathname === "/register";
  const isForgot = location.pathname === "/forgot-password";
  const isReset = location.pathname === "/reset-password";
  const isLogin = location.pathname === "/login" || (!isRegister && !isForgot && !isReset);
  const sessionExpired = isLogin && new URLSearchParams(location.search).get("expired") === "1";

  // States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState("personal"); // personal | company
  const [companyName, setCompanyName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Please input a valid corporate email address.");
      return;
    }

    if (isLogin) {
      setSubmitting(true);
      const res = await login(email, password);
      setSubmitting(false);
      if (res.success) {
        navigate("/dashboard");
      } else {
        setError(res.error || "Invalid email or password.");
      }
    } else if (isRegister) {
      if (!name) {
        setError("Please enter your name.");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (accountType === "company" && !companyName.trim()) {
        setError("Please enter your company name.");
        return;
      }
      setSubmitting(true);
      const res = await register({
        name,
        email,
        password,
        accountType,
        companyName: accountType === "company" ? companyName.trim() : null,
      });
      setSubmitting(false);
      if (!res.success) {
        setError(res.error || "Could not create the account.");
        return;
      }
      const next = accountType === "company" ? "/welcome" : "/dashboard";
      navigate(`/verify-email?email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`);
    } else if (isForgot) {
      setSubmitting(true);
      try { await forgotPassword(email); } catch { /* always succeed: no user enumeration */ }
      setSubmitting(false);
      setSuccess("If that email exists, reset instructions are on their way.");
    } else if (isReset) {
      const token = new URLSearchParams(location.search).get("token");
      if (!token) {
        setError("This reset link is missing its token. Use the link from your email.");
        return;
      }
      setSubmitting(true);
      try {
        await resetPassword(token, password);
        setSuccess("Password changed successfully. Redirecting back to login...");
        setTimeout(() => navigate("/login"), 1200);
      } catch (err) {
        setError(err.message || "This reset link is invalid or expired.");
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-dvh bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center px-5 py-8 pt-safe pb-safe">
      <div className="w-full max-w-sm mx-auto">

        {/* Brand mark */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-12 w-12 bg-primary text-white rounded-xl mb-3 shadow-soft font-display font-bold text-2xl leading-none select-none">
            C
          </div>
          <h1 className="font-display font-bold text-xl text-zinc-950 dark:text-white leading-tight tracking-wider uppercase">
            Carbarn
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-1">
            Project & task management workspace
          </p>
        </div>

        {/* Auth form card — borderless on mobile, card on ≥sm */}
        <div className="w-full sm:bg-white sm:dark:bg-zinc-900 sm:border sm:border-zinc-200/80 sm:dark:border-zinc-800 sm:rounded-xl sm:shadow-soft sm:p-6">
          <h2 className="font-display font-semibold text-base text-zinc-900 dark:text-white text-center mb-5">
            {isLogin && "Welcome back"}
            {isRegister && "Create your account"}
            {isForgot && "Reset your password"}
            {isReset && "Choose a new password"}
          </h2>

          {sessionExpired && !error && !success && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 text-xs font-medium flex items-center gap-2 border border-amber-200 dark:border-amber-500/20">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500" />
              <span>Your session expired. Please sign in again.</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 text-xs font-medium flex items-center gap-2 border border-rose-100 dark:border-rose-900/30">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 text-xs font-medium flex items-center gap-2 border border-emerald-100 dark:border-emerald-900/30">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <span className="label" id="auth-account-type-label">How will you use Carbarn?</span>
                <div className="grid grid-cols-2 gap-2 mb-4" role="radiogroup" aria-labelledby="auth-account-type-label">
                  {[
                    { id: "personal", title: "For myself", sub: "Personal projects & tasks" },
                    { id: "company", title: "With my company", sub: "Invite your team, per-seat billing" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={accountType === opt.id}
                      onClick={() => setAccountType(opt.id)}
                      className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                        accountType === opt.id
                          ? "border-primary/50 bg-primary/5 dark:bg-primary/10"
                          : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                      }`}
                    >
                      <span className={`block text-sm font-semibold ${accountType === opt.id ? "text-primary" : "text-zinc-800 dark:text-zinc-200"}`}>
                        {opt.title}
                      </span>
                      <span className="block text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5 leading-snug">
                        {opt.sub}
                      </span>
                    </button>
                  ))}
                </div>

                {accountType === "company" && (
                  <div className="mb-4">
                    <label htmlFor="auth-company" className="label">Company name</label>
                    <input
                      id="auth-company"
                      type="text"
                      placeholder="e.g. Carbarn Auction Group"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="field"
                    />
                  </div>
                )}

                <label htmlFor="auth-name" className="label">Full Name</label>
                <input
                  id="auth-name"
                  type="text"
                  placeholder="e.g. Yasin Chowdhury"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="field"
                />
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="label">Email</label>
              <input
                id="auth-email"
                type="email"
                placeholder="yasin@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field"
              />
            </div>

            {(isLogin || isRegister || isReset) && (
              <div>
                <div className="flex justify-between items-center">
                  <label htmlFor="auth-password" className="label">Password</label>
                  {isLogin && (
                    <Link to="/forgot-password" className="text-[11px] font-semibold text-primary hover:underline mb-1.5">
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="field pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {isReset && (
              <div>
                <label htmlFor="auth-confirm-password" className="label">Confirm Password</label>
                <input
                  id="auth-confirm-password"
                  type="password"
                  placeholder="••••••••"
                  className="field"
                />
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
              {isLogin && "Sign in"}
              {isRegister && "Create account"}
              {isForgot && "Send reset link"}
              {isReset && "Update password"}
            </button>
          </form>

          {/* Social logins */}
          {(isLogin || isRegister) && (
            <div className="mt-6">
              <div className="relative flex items-center justify-center my-4">
                <div className="absolute w-full border-t border-zinc-200 dark:border-zinc-800" />
                <span className="relative px-3 bg-zinc-50 sm:bg-white dark:bg-zinc-950 sm:dark:bg-zinc-900 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 tracking-wide uppercase">
                  or continue with
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setError("Social sign-in arrives with the SSO rollout — use email and password for now.")}
                  className="flex flex-col items-center justify-center py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                  title="Google SSO"
                >
                  <svg className="w-4 h-4 mb-1" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.86c2.26-2.09 3.58-5.17 3.58-8.81z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.86-3c-1.08.72-2.45 1.15-4.08 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z" />
                    <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.63H1.29a11.99 11.99 0 0 0 0 10.74l3.98-3.09z" />
                    <path fill="#EA4335" d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.42-3.42A11.97 11.97 0 0 0 12 0 11.99 11.99 0 0 0 1.29 6.63l3.98 3.09C6.22 6.88 8.87 4.77 12 4.77z" />
                  </svg>
                  <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">Google</span>
                </button>
                <button
                  type="button"
                  onClick={() => setError("Social sign-in arrives with the SSO rollout — use email and password for now.")}
                  className="flex flex-col items-center justify-center py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                  title="Apple SSO"
                >
                  <svg className="w-4 h-4 mb-1 fill-zinc-900 dark:fill-white" viewBox="0 0 24 24">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">Apple</span>
                </button>
                <button
                  type="button"
                  onClick={() => setError("Social sign-in arrives with the SSO rollout — use email and password for now.")}
                  className="flex flex-col items-center justify-center py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                  title="Microsoft SSO"
                >
                  <svg className="w-4 h-4 mb-1" viewBox="0 0 23 23">
                    <path fill="#F35325" d="M1 1h10v10H1z" />
                    <path fill="#81BC06" d="M12 1h10v10H12z" />
                    <path fill="#05A6F0" d="M1 12h10v10H1z" />
                    <path fill="#FFBA08" d="M12 12h10v10H12z" />
                  </svg>
                  <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">Microsoft</span>
                </button>
              </div>
            </div>
          )}

          {/* Switch screens */}
          <div className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            {isLogin && (
              <p>
                First time using Carbarn?{" "}
                <Link to="/register" className="font-semibold text-primary hover:underline">
                  Request access
                </Link>
              </p>
            )}
            {isRegister && (
              <p>
                Already have corporate credentials?{" "}
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            )}
            {(isForgot || isReset) && (
              <p>
                Remembered your credentials?{" "}
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  Back to login
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
