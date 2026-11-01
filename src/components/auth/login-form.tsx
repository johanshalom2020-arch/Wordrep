"use client";

import { Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";

type LoginError =
  | "invalid_credentials"
  | "too_many_attempts"
  | "not_configured"
  | "invalid_request"
  | "unknown";

const messages: Record<LoginError, string> = {
  invalid_credentials: "The username or password is incorrect.",
  too_many_attempts: "Too many attempts. Wait a few minutes before trying again.",
  not_configured:
    "Login is not configured yet. Add FOLIO_USERNAME, FOLIO_PASSWORD, and AUTH_SECRET to the deployment environment.",
  invalid_request: "The login request was invalid. Please try again.",
  unknown: "Unable to sign in right now. Please try again.",
};

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<LoginError | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) {
        const known = Object.hasOwn(messages, result.error ?? "")
          ? (result.error as LoginError)
          : "unknown";
        setError(known);
        if (known === "invalid_credentials") setPassword("");
        return;
      }
      window.location.replace(nextPath);
    } catch {
      setError("unknown");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-8 space-y-5">
      <div>
        <label htmlFor="username" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-paper-2">
          Username
        </label>
        <div className="flex items-center rounded-md border border-line-2 bg-ink px-3 transition-colors focus-within:border-accent/80">
          <UserRound size={14} className="shrink-0 text-muted" aria-hidden="true" />
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            maxLength={320}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="h-11 min-w-0 flex-1 bg-transparent px-3 text-[14px] text-paper outline-none placeholder:text-muted"
            placeholder="Enter your username"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-paper-2">
          Password
        </label>
        <div className="flex items-center rounded-md border border-line-2 bg-ink px-3 transition-colors focus-within:border-accent/80">
          <LockKeyhole size={14} className="shrink-0 text-muted" aria-hidden="true" />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            maxLength={1024}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 min-w-0 flex-1 bg-transparent px-3 text-[14px] text-paper outline-none placeholder:text-muted"
            placeholder="Enter your password"
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((visible) => !visible)}
            className="grid h-8 w-8 shrink-0 place-items-center rounded text-muted transition-colors hover:bg-ink-3 hover:text-paper"
          >
            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      {error ? (
        <div role="alert" aria-live="polite" className="rounded-md border border-bad/30 bg-bad/8 px-3.5 py-3 text-[12px] leading-relaxed text-bad">
          {messages[error]}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={submitting || !username || !password}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-accent font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-accent-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
        {submitting ? "Verifying…" : "Secure sign in"}
      </button>
    </form>
  );
}
