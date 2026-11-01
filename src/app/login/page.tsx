import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Fingerprint, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

export const metadata: Metadata = {
  title: "Secure sign in — Folio",
  description: "Sign in to your private Folio document workspace.",
  robots: { index: false, follow: false },
};

function safeNextPath(value: string | string[] | undefined): string {
  if (typeof value !== "string") return "/app";
  if (value === "/app" || value.startsWith("/app?") || value.startsWith("/app/")) return value;
  return "/app";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const nextPath = safeNextPath(params.next);
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (session) redirect(nextPath);

  return (
    <main className="blueprint relative grid min-h-dvh place-items-center overflow-hidden bg-ink px-4 py-10 text-paper">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(255,90,38,0.10),transparent_38%)]" />
      <Link
        href="/"
        className="absolute left-5 top-5 z-10 flex items-center gap-2 rounded-md px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted transition-colors hover:bg-ink-3 hover:text-paper md:left-8 md:top-7"
      >
        <ArrowLeft size={13} />
        Back to Folio
      </Link>

      <section className="relative z-10 w-full max-w-[430px] overflow-hidden rounded-xl border border-line-2 bg-ink-2 shadow-[0_32px_100px_-32px_rgba(0,0,0,0.9)]">
        <div className="h-1 bg-gradient-to-r from-accent via-accent-2 to-accent" />
        <div className="p-7 sm:p-9">
          <div className="flex items-start justify-between gap-5">
            <div>
              <div className="mb-4 flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-[5px] border border-line-2 bg-ink-3 font-serif text-[17px] italic leading-none text-accent">
                  F
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-paper">
                  Folio <span className="text-muted">Docs</span>
                </span>
              </div>
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-accent">Private workspace</p>
              <h1 className="mt-2 text-[27px] font-medium tracking-[-0.035em] text-paper">Sign in securely</h1>
              <p className="mt-2 max-w-[300px] text-[13px] leading-relaxed text-muted">
                Your documents and import tools are protected behind an encrypted, time-limited session.
              </p>
            </div>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-ok/25 bg-ok/8 text-ok">
              <Fingerprint size={20} aria-hidden="true" />
            </span>
          </div>

          <LoginForm nextPath={nextPath} />

          <div className="mt-7 flex items-center justify-center gap-2 border-t border-line pt-5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
            <ShieldCheck size={12} className="text-ok" />
            HTTP-only cookie · 12-hour session
          </div>
        </div>
      </section>
    </main>
  );
}
