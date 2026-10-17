"use client";

import {
  ArrowRight,
  Bold,
  CloudOff,
  FileText,
  Highlighter,
  Image as ImageIcon,
  Italic,
  List,
  Loader2,
  LockKeyhole,
  Palette,
  ShieldCheck,
  Table as TableIcon,
  Underline,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

/* ----------------------------- reveal ---------------------------- */

function useInView() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && (setOn(true), io.disconnect())),
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, on };
}

function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const { ref, on } = useInView();
  return (
    <div
      ref={ref}
      className={`reveal ${on ? "is-in" : ""} ${className}`}
      style={{ ["--reveal-delay" as string]: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ----------------------------- pieces ---------------------------- */

const FORMATS_IN = ["DOCX", "HTML"];
const FORMATS_OUT = ["DOCX", "PDF", "HTML", "Markdown", "Plain text"];

const ECO = [
  "Tiptap",
  "ProseMirror",
  "Mammoth",
  "docx.js",
  "Yjs",
  "Hocuspocus",
  "Nextcloud",
  "ONLYOFFICE",
  "MinIO",
  "PostgreSQL",
];

function EditorMock() {
  return (
    <div className="relative">
      <div className="overflow-hidden rounded-xl border border-line-2 bg-ink-2 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)]">
        {/* window bar */}
        <div className="flex items-center gap-2 border-b border-line bg-ink-3/70 px-4 py-2.5">
          <i className="h-2.5 w-2.5 rounded-full bg-line-2" />
          <i className="h-2.5 w-2.5 rounded-full bg-line-2" />
          <i className="h-2.5 w-2.5 rounded-full bg-line-2" />
          <span className="ml-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
            folio — quarterly-letter.docx
          </span>
          <span className="ml-auto flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-ok">
            <i className="h-1.5 w-1.5 rounded-full bg-ok" /> saved
          </span>
        </div>
        {/* toolbar */}
        <div className="flex items-center gap-3 border-b border-line px-4 py-2.5 text-muted">
          <Bold size={13} className="text-accent" />
          <Italic size={13} />
          <Underline size={13} />
          <Highlighter size={13} />
          <Palette size={13} />
          <span className="h-4 w-px bg-line" />
          <List size={13} />
          <ImageIcon size={13} />
          <TableIcon size={13} />
          <span className="ml-auto rounded border border-line px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest">
            Heading 1
          </span>
        </div>
        {/* paper */}
        <div className="paper-scroll px-6 py-8 md:px-10">
          <div className="folio-paper !min-h-0 !p-8 md:!p-10" style={{ width: "100%" }}>
            <div className="font-sans text-[19px] font-semibold tracking-tight text-[#101216]">
              The Quarterly Letter
            </div>
            <p className="mt-3 font-serif text-[12.5px] leading-[1.75] text-[#3d4149]">
              Dear team — this quarter we shipped the editor we always wanted:
              <span className="font-semibold text-[#101216]"> fast</span>,
              <span className="italic"> private</span>, and
              <span className="text-[#c2410c] underline underline-offset-2"> free to run</span>. No accounts.
              No telemetry. No rent.
            </p>
            <p className="mt-2.5 font-serif text-[12.5px] leading-[1.75] text-[#3d4149]">
              Every file round-trips as a real <mark className="rounded bg-[#fef08a] px-0.5">.docx</mark>,
              because owning your words means owning the bytes too
              <span className="ml-0.5 inline-block h-[13px] w-[2px] translate-y-[2px] animate-pulse bg-accent" />
            </p>
            <div className="mt-4 grid grid-cols-3 overflow-hidden rounded border border-[#d7dae0] text-[9.5px]">
              {[
                ["Layer", "Project", "License"],
                ["Editor", "Tiptap", "MIT"],
                ["Import", "Mammoth", "BSD"],
              ].map((r, i) =>
                r.map((c, j) => (
                  <div
                    key={`${i}-${j}`}
                    className={`border-[#e3e5ea] px-2.5 py-1.5 ${i === 0 ? "bg-[#eef1f5] font-sans font-semibold" : "bg-white font-serif"} ${j > 0 ? "border-l" : ""} ${i > 0 ? "border-t" : ""}`}
                  >
                    {c}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      {/* floating chips */}
      <div className="absolute -left-4 top-24 hidden rounded-lg border border-line bg-ink-2/95 px-3 py-2 font-mono text-[9.5px] uppercase tracking-[0.18em] text-paper-2 backdrop-blur md:block">
        Stored in <span className="text-ok">your</span> database
      </div>
      <div className="absolute -right-3 bottom-10 hidden items-center gap-2 rounded-lg border border-line bg-ink-2/95 px-3 py-2 font-mono text-[9.5px] uppercase tracking-[0.18em] text-paper-2 backdrop-blur md:flex">
        <FileText size={11} className="text-accent" /> export .docx
      </div>
    </div>
  );
}

/* ----------------------------- page ------------------------------ */

export function Landing() {
  return (
    <div className="min-h-screen">
      {/* nav */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-line/70 bg-ink/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-5 md:px-8">
          <div className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-[4px] border border-line-2 bg-ink-3 font-serif italic text-[15px] leading-none text-accent">
              F
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.26em] text-paper">Folio</span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="#features" className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-muted transition-colors hover:text-paper sm:block">
              Features
            </a>
            <a href="#formats" className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-muted transition-colors hover:text-paper sm:block">
              Formats
            </a>
            <Link
              href="/app"
              className="flex items-center gap-2 rounded-full bg-paper px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-accent hover:text-ink"
            >
              Open the editor <ArrowRight size={11} />
            </Link>
          </nav>
        </div>
      </header>

      {/* hero */}
      <section className="blueprint relative overflow-hidden pb-20 pt-36">
        <div
          className="pointer-events-none absolute -top-32 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full opacity-[0.12]"
          style={{ background: "radial-gradient(closest-side, #ff5a26, transparent)" }}
        />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-14 px-5 md:px-8 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <Reveal>
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.26em] text-muted">
                <span className="rounded border border-ok/40 px-2 py-0.5 text-ok">Free &amp; open-source</span>
                <span>MIT · Apache-2.0</span>
              </div>
              <h1 className="mt-6 text-[clamp(2.6rem,5.6vw,4.6rem)] font-medium leading-[0.98] tracking-[-0.03em]">
                Write beautifully.
                <br />
                Save it as{" "}
                <span className="font-serif italic text-accent">Word.</span>
                <br />
                Keep it on{" "}
                <span className="mark">your server.</span>
              </h1>
              <p className="mt-6 max-w-md text-[15px] leading-relaxed text-paper-2">
                Folio is a word processor with real .docx support, a calm paged editor, and storage you
                control. No accounts, no telemetry, no rent — just your words, saved to your own database.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/app"
                  className="group flex items-center gap-3 rounded-full bg-accent px-7 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ink transition-all hover:bg-paper"
                >
                  Start writing
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <a
                  href="#features"
                  className="font-mono text-[11px] uppercase tracking-[0.18em] text-paper-2 underline underline-offset-4 transition-colors hover:text-paper"
                >
                  See features
                </a>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                <span className="flex items-center gap-2"><ShieldCheck size={12} className="text-ok" /> No telemetry</span>
                <span className="flex items-center gap-2"><CloudOff size={12} className="text-ok" /> Works offline</span>
                <span className="flex items-center gap-2"><FileText size={12} className="text-ok" /> Real .docx in &amp; out</span>
              </div>
            </Reveal>
          </div>
          <Reveal delay={150}>
            <EditorMock />
          </Reveal>
        </div>

        {/* marquee */}
        <div className="relative mt-24 border-t border-line/70 py-5">
          <div className="marquee-track items-center gap-10 pr-10">
            {[...ECO, ...ECO].map((p, i) => (
              <span key={i} className="flex shrink-0 items-center gap-10">
                <span className="whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.3em] text-muted">{p}</span>
                <span className="h-1 w-1 rounded-full bg-accent" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* features */}
      <section id="features" className="scroll-mt-24 border-t border-line/70 py-20 md:py-28">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <Reveal>
            <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-accent">Why Folio</span>
            <h2 className="mt-4 max-w-2xl text-[clamp(1.9rem,3.8vw,3rem)] font-medium leading-[1.05] tracking-[-0.02em]">
              Everything a word processor should do.{" "}
              <span className="font-serif italic text-paper/60">Nothing it shouldn’t.</span>
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: FileText,
                t: "True DOCX, in and out",
                d: "Open an existing .docx with one click and keep editing — or export yours with headings, styles, lists, tables, and images intact. Word will never know it left.",
              },
              {
                icon: TableIcon,
                t: "A full writing toolkit",
                d: "Headings, fonts, sizes, colors, highlights, alignment, lists, quotes, code blocks, links, images, resizable tables with merge and split — all one keystroke away.",
              },
              {
                icon: Zap,
                t: "Autosave you can trust",
                d: "Every keystroke is persisted to your own PostgreSQL within a second. Close the tab mid-sentence; your draft is waiting exactly where you left it.",
              },
              {
                icon: LockKeyhole,
                t: "Storage you control",
                d: "Documents live in your database, period. Pair with Nextcloud or any S3-compatible store — Cloudflare R2, Backblaze B2, or self-hosted MinIO — entirely on your terms.",
              },
              {
                icon: Users,
                t: "Collaboration-ready core",
                d: "The editor engine is built for CRDT co-editing (Yjs / Hocuspocus): live cursors, comments, and conflict-free merging plug straight into the document model.",
              },
              {
                icon: ShieldCheck,
                t: "Free forever, truly open",
                d: "MIT, Apache-2.0, and AGPLv3 components only. No paywalled features, no analytics, no license gotchas — self-host it, audit it, fork it.",
              },
            ].map((f, i) => (
              <Reveal key={f.t} delay={i * 60}>
                <div className="group h-full rounded-xl border border-line bg-ink-2 p-6 transition-colors hover:border-accent/50">
                  <f.icon size={17} className="text-accent" />
                  <h3 className="mt-4 text-[16px] font-medium tracking-tight">{f.t}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-paper-2">{f.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* formats */}
      <section id="formats" className="scroll-mt-24 border-t border-line/70 bg-ink-2/40 py-20 md:py-24">
        <div className="mx-auto grid max-w-[1200px] gap-12 px-5 md:px-8 lg:grid-cols-2">
          <Reveal>
            <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-accent">Formats</span>
            <h2 className="mt-4 text-[clamp(1.7rem,3vw,2.4rem)] font-medium leading-tight tracking-[-0.02em]">
              Your files stay <span className="font-serif italic text-accent">yours.</span>
            </h2>
            <p className="mt-4 max-w-md text-[14px] leading-relaxed text-paper-2">
              Import is powered by Mammoth; export is generated with the open-source docx library — both run
              on your server, not a conversion service. Print gives you a clean, paged PDF for free.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <div className="space-y-6">
              <div>
                <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                  <Loader2 size={11} className="rotate-45" /> Import
                </div>
                <div className="flex flex-wrap gap-2">
                  {FORMATS_IN.map((f) => (
                    <span key={f} className="rounded-md border border-line bg-ink-3 px-3 py-1.5 font-mono text-[11px] tracking-wider text-paper">
                      {f}
                    </span>
                  ))}
                  <span className="rounded-md border border-dashed border-line-2 px-3 py-1.5 font-mono text-[11px] tracking-wider text-muted">
                    ODT · RTF — soon
                  </span>
                </div>
              </div>
              <div>
                <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                  <ArrowRight size={11} /> Export
                </div>
                <div className="flex flex-wrap gap-2">
                  {FORMATS_OUT.map((f) => (
                    <span
                      key={f}
                      className={`rounded-md border px-3 py-1.5 font-mono text-[11px] tracking-wider ${
                        f === "DOCX"
                          ? "border-accent/60 bg-accent/10 text-accent"
                          : "border-line bg-ink-3 text-paper"
                      }`}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-line bg-ink-3/60 p-4 font-mono text-[10.5px] uppercase leading-relaxed tracking-[0.14em] text-muted">
                Round-trip rule — <span className="text-paper-2">words, styles and structures survive every open and save.</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* steps */}
      <section className="border-t border-line/70 py-20 md:py-24">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <div className="grid gap-10 md:grid-cols-3">
            {[
              ["01", "Open Folio", "One click — no signup, no onboarding email sequence, no “workspace” to configure. The welcome document shows you everything."],
              ["02", "Write without friction", "A calm sheet of paper, a real toolbar, and autosave that never asks questions. Import a .docx whenever you like."],
              ["03", "Take it anywhere", "Export to Word, Markdown, HTML, or print a paged PDF. Your words were never locked in — they were just resting."],
            ].map(([n, t, d], i) => (
              <Reveal key={n} delay={i * 80}>
                <div className="border-t-2 border-accent/70 pt-5">
                  <span className="font-serif text-[34px] italic text-accent">{n}</span>
                  <h3 className="mt-2 text-[17px] font-medium">{t}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-paper-2">{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-line/70 py-20 md:py-28">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <Reveal>
            <div className="blueprint relative overflow-hidden rounded-2xl border border-line bg-ink-2 px-8 py-14 text-center md:py-20">
              <div
                className="pointer-events-none absolute -top-24 left-1/2 h-[340px] w-[620px] -translate-x-1/2 rounded-full opacity-[0.14]"
                style={{ background: "radial-gradient(closest-side, #ff5a26, transparent)" }}
              />
              <div className="relative">
                <span className="font-serif text-[clamp(3rem,7vw,5.5rem)] italic leading-none text-paper">
                  folio<span className="text-accent">.</span>
                </span>
                <p className="mx-auto mt-5 max-w-md text-[14px] leading-relaxed text-paper-2">
                  Your next document is one click away — and it will still open in Word in 2046.
                </p>
                <Link
                  href="/app"
                  className="group mx-auto mt-8 flex w-fit items-center gap-3 rounded-full bg-accent px-8 py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ink transition-colors hover:bg-paper"
                >
                  Open the editor
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                  Free today · free forever · your server, your rules
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-line py-8">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted md:px-8">
          <span>Folio — the open word processor</span>
          <span>MIT · Apache-2.0 · AGPLv3 — nothing else</span>
          <span>No telemetry, ever</span>
        </div>
      </footer>
    </div>
  );
}
