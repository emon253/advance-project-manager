/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { GoogleSignInButton, googleSignInAvailable } from "../components/GoogleSignInButton";
import { useAppState } from "../../../app/providers";
import { Wordmark } from "../../../components/common/Logo";
import {
  Eye, EyeOff, ShieldAlert, CheckCircle2, Loader2,
  LayoutDashboard, BellRing, Users, User, Building2,
} from "lucide-react";

/** Left-hand brand panel (≥lg): pure primary base with layered glows. */
function BrandPanel() {
  return (
    <div className="relative hidden lg:flex flex-col justify-between w-[44%] max-w-2xl shrink-0 bg-primary text-white p-10 xl:p-14 overflow-hidden select-none">
      {/* depth: soft gradient + glow fields + faint grid */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.10] via-transparent to-black/[0.25]" aria-hidden="true" />
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-44 -left-24 h-[28rem] w-[28rem] rounded-full bg-black/20 blur-3xl" aria-hidden="true" />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
        aria-hidden="true"
      />

      <div className="relative">
        <Wordmark inverted className="text-2xl" />
      </div>

      <div className="relative max-w-md">
        <h2 className="font-display font-bold text-4xl xl:text-[2.75rem] leading-[1.12] tracking-tight">
          Ship every project with calm clarity.
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-white/75 font-medium">
          Tasks, timelines, files, and your team — one workspace that keeps
          everyone moving in the same direction.
        </p>

        <ul className="mt-10 space-y-5">
          {[
            { Icon: LayoutDashboard, title: "Plan with boards & timelines", sub: "Statuses, priorities, and workloads at a glance" },
            { Icon: BellRing, title: "Know the moment work moves", sub: "Real-time notifications across every device" },
            { Icon: Users, title: "Built for teams", sub: "Roles, invitations, and per-seat billing included" },
          ].map(({ Icon, title, sub }) => (
            <li key={title} className="flex items-start gap-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/12 border border-white/15">
                <Icon className="w-4.5 h-4.5" />
              </span>
              <span>
                <span className="block text-sm font-semibold leading-tight">{title}</span>
                <span className="block text-[13px] text-white/65 font-medium mt-1">{sub}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-[13px] font-medium text-white/55">
        Free plan available · Pro &amp; Business for growing teams
      </p>
    </div>
  );
}


export function AuthPages() {
  const { login, loginWithGoogle, register, forgotPassword, resetPassword } = useAppState();
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
  const [confirmPassword, setConfirmPassword] = useState("");
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
      setError("Please enter your email address.");
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
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("The passwords don't match.");
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

  const handleGoogleCredential = async (credential) => {
    setError("");
    setSuccess("");
    setSubmitting(true);
    const res = await loginWithGoogle(credential);
    setSubmitting(false);
    if (res.success) {
      navigate("/dashboard");
    } else {
      setError(res.error || "Google sign-in failed — please try again.");
    }
  };

  const title = isLogin ? "Welcome back"
    : isRegister ? "Create your account"
    : isForgot ? "Reset your password"
    : "Choose a new password";

  const subtitle = isLogin ? "Sign in to pick up where your team left off."
    : isRegister ? "Free to start — no credit card required."
    : isForgot ? "Enter your account email and we'll send you a reset link."
    : "Make it at least 8 characters — a passphrase works best.";

  const cta = isLogin ? (submitting ? "Signing in…" : "Sign in")
    : isRegister ? (submitting ? "Creating account…" : "Create account")
    : isForgot ? (submitting ? "Sending…" : "Send reset link")
    : (submitting ? "Updating…" : "Update password");

  return (
    <div className="min-h-dvh flex bg-zinc-50 dark:bg-zinc-950">
      <BrandPanel />

      {/* Form column */}
      <div className="flex-1 flex flex-col min-h-dvh overflow-y-auto pt-safe pb-safe">
        {/* Compact brand header (below lg the panel is hidden) */}
        <div className="lg:hidden flex items-center px-6 pt-6">
          <Wordmark className="text-xl" />
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-[400px]">
            <h1 className="font-display font-bold text-2xl text-zinc-950 dark:text-white tracking-tight">{title}</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-1.5">{subtitle}</p>

            <div className="mt-7">
              {sessionExpired && !error && !success && (
                <div className="mb-4 p-3 rounded-xl bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 text-xs font-medium flex items-center gap-2 border border-amber-200 dark:border-amber-500/20">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>Your session expired. Please sign in again.</span>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 text-xs font-medium flex items-center gap-2 border border-rose-100 dark:border-rose-900/30" role="alert">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 text-xs font-medium flex items-center gap-2 border border-emerald-100 dark:border-emerald-900/30" role="status">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                {isRegister && (
                  <div>
                    <span className="label" id="auth-account-type-label">How will you use Junction?</span>
                    <div className="grid grid-cols-2 gap-2.5 mb-4" role="radiogroup" aria-labelledby="auth-account-type-label">
                      {[
                        { id: "personal", Icon: User, title: "For myself", sub: "Personal projects & tasks" },
                        { id: "company", Icon: Building2, title: "With my team", sub: "Invites & per-seat billing" },
                      ].map(({ id, Icon, title: optTitle, sub }) => {
                        const active = accountType === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => setAccountType(id)}
                            className={`relative p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                              active
                                ? "border-primary/60 bg-primary/5 dark:bg-primary/10 shadow-[0_0_0_1px_theme(colors.primary/60%)]"
                                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                            }`}
                          >
                            {active && (
                              <CheckCircle2 className="absolute top-2.5 right-2.5 w-4 h-4 text-primary" />
                            )}
                            <Icon className={`w-4.5 h-4.5 mb-2 ${active ? "text-primary" : "text-zinc-400 dark:text-zinc-500"}`} />
                            <span className={`block text-sm font-semibold leading-tight ${active ? "text-primary" : "text-zinc-800 dark:text-zinc-200"}`}>
                              {optTitle}
                            </span>
                            <span className="block text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mt-1 leading-snug">
                              {sub}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {accountType === "company" && (
                      <div className="mb-4 animate-in fade-in slide-in-from-top-1 duration-200">
                        <label htmlFor="auth-company" className="label">Company name</label>
                        <input
                          id="auth-company"
                          type="text"
                          placeholder="e.g. Junction Labs"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="field"
                        />
                      </div>
                    )}

                    <label htmlFor="auth-name" className="label">Full name</label>
                    <input
                      id="auth-name"
                      type="text"
                      placeholder="Your full name"
                      autoComplete="name"
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
                    placeholder="you@company.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="field"
                  />
                </div>

                {(isLogin || isRegister || isReset) && (
                  <div>
                    <div className="flex justify-between items-center">
                      <label htmlFor="auth-password" className="label">
                        {isReset ? "New password" : "Password"}
                      </label>
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
                        placeholder={isRegister || isReset ? "8+ characters" : "••••••••"}
                        autoComplete={isLogin ? "current-password" : "new-password"}
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
                    <label htmlFor="auth-confirm-password" className="label">Confirm password</label>
                    <input
                      id="auth-confirm-password"
                      type="password"
                      placeholder="Repeat the new password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="field"
                    />
                  </div>
                )}

                <button type="submit" className="btn btn-primary w-full h-11 text-sm" disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {cta}
                </button>
              </form>

              {/* Social logins (Apple/Microsoft return with their rollouts) */}
              {(isLogin || isRegister) && googleSignInAvailable && (
                <div className="mt-6">
                  <div className="relative flex items-center justify-center my-4">
                    <div className="absolute w-full border-t border-zinc-200 dark:border-zinc-800" />
                    <span className="relative px-3 bg-zinc-50 dark:bg-zinc-950 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 tracking-wide uppercase">
                      or continue with
                    </span>
                  </div>
                  <GoogleSignInButton onCredential={handleGoogleCredential} onError={setError} />
                </div>
              )}

              {/* Switch screens */}
              <div className="mt-7 text-center text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                {isLogin && (
                  <p>
                    New to Junction?{" "}
                    <Link to="/register" className="font-semibold text-primary hover:underline">
                      Create an account
                    </Link>
                  </p>
                )}
                {isRegister && (
                  <p>
                    Already have an account?{" "}
                    <Link to="/login" className="font-semibold text-primary hover:underline">
                      Sign in
                    </Link>
                  </p>
                )}
                {(isForgot || isReset) && (
                  <p>
                    Remembered it?{" "}
                    <Link to="/login" className="font-semibold text-primary hover:underline">
                      Back to sign in
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
