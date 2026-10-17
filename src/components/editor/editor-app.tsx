"use client";

import type { Content, Editor } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import {
  ArrowLeft,
  Check,
  CloudUpload,
  FileDown,
  FilePlus2,
  FileText,
  Loader2,
  Printer,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { buildExtensions } from "@/lib/editor-extensions";
import { exportDocx } from "@/lib/docx-export";
import { countWords, download, jsonToMarkdown, safeFilename, type Jrn } from "@/lib/serialize";
import { TableActions, Toolbar } from "./toolbar";

type DocRow = {
  id: string;
  title: string;
  content: unknown;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
};

type SaveState = "saved" | "dirty" | "saving" | "error";

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

/* ================================================================== */
/* Editor pane — one mounted per active document (key = doc.id)        */
/* ================================================================== */

function EditorPane({
  doc,
  pendingHtml,
  onConsumeImport,
  onSaved,
}: {
  doc: DocRow;
  pendingHtml: string | null;
  onConsumeImport: () => void;
  onSaved: (id: string, patch: { title: string; wordCount: number; updatedAt: string }) => void;
}) {
  const [, force] = useReducer((x: number) => x + 1, 0);
  const [title, setTitle] = useState(doc.title);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [words, setWords] = useState(0);
  const [chars, setChars] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef<{ json: unknown; title: string; words: number }>({
    json: doc.content,
    title: doc.title,
    words: 0,
  });
  const editorRef = useRef<Editor | null>(null);

  const save = useCallback(async () => {
    if (!dirtyRef.current) return;
    dirtyRef.current = false;
    setSaveState("saving");
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: latestRef.current.title,
          content: latestRef.current.json,
          wordCount: latestRef.current.words,
        }),
      });
      if (!res.ok) throw new Error("save failed");
      setSaveState("saved");
      onSaved(doc.id, {
        title: latestRef.current.title,
        wordCount: latestRef.current.words,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      setSaveState("error");
    }
  }, [doc.id, onSaved]);

  const scheduleSave = useCallback(() => {
    dirtyRef.current = true;
    setSaveState("dirty");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void save(), 1100);
  }, [save]);

  /* flush on unmount (doc switch / navigation) */
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (dirtyRef.current) {
        fetch(`/api/documents/${doc.id}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: latestRef.current.title,
            content: latestRef.current.json,
            wordCount: latestRef.current.words,
          }),
          keepalive: true,
        }).catch(() => undefined);
      }
    };
  }, [doc.id]);

  const editor = useEditor({
    extensions: buildExtensions(),
    content: doc.content as Content,
    immediatelyRender: false,
    autofocus: "end",
    editorProps: { attributes: { class: "folio-prose" } },
    onUpdate: ({ editor: e }) => {
      const text = e.getText();
      latestRef.current = { json: e.getJSON(), title: latestRef.current.title, words: countWords(text) };
      setWords(latestRef.current.words);
      setChars(text.trim().length);
      scheduleSave();
    },
  });
  editorRef.current = editor;

  /* initial counters */
  useEffect(() => {
    if (!editor) return;
    const text = editor.getText();
    latestRef.current.words = countWords(text);
    setWords(latestRef.current.words);
    setChars(text.trim().length);
  }, [editor]);

  /* consume imported docx html once */
  useEffect(() => {
    if (!editor || pendingHtml == null) return;
    editor.commands.setContent(pendingHtml, { emitUpdate: true });
    onConsumeImport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, pendingHtml]);

  /* re-render chrome on transactions */
  useEffect(() => {
    if (!editor) return;
    const fn = () => force();
    editor.on("transaction", fn);
    return () => {
      editor.off("transaction", fn);
    };
  }, [editor]);

  const base = safeFilename(title);

  const doExport = async (kind: "docx" | "md" | "html" | "txt") => {
    if (!editor) return;
    setMenuOpen(false);
    setExporting(true);
    try {
      const json = editor.getJSON() as Jrn;
      if (kind === "docx") {
        download(await exportDocx(json, title), `${base}.docx`);
      } else if (kind === "md") {
        download(new Blob([jsonToMarkdown(json)], { type: "text/markdown" }), `${base}.md`);
      } else if (kind === "html") {
        const body = editor.getHTML();
        const shell = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>body{max-width:760px;margin:48px auto;font-family:Georgia,serif;line-height:1.65;padding:0 24px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:6px 10px}blockquote{border-left:3px solid #ddd;margin:0;padding-left:16px;color:#555}img{max-width:100%}</style></head><body>${body}</body></html>`;
        download(new Blob([shell], { type: "text/html" }), `${base}.html`);
      } else {
        download(new Blob([editor.getText()], { type: "text/plain" }), `${base}.txt`);
      }
    } finally {
      setExporting(false);
    }
  };

  const statusMeta: Record<SaveState, { label: string; cls: string }> = {
    saved: { label: "Saved", cls: "text-ok" },
    dirty: { label: "Unsaved changes", cls: "text-accent-2" },
    saving: { label: "Saving…", cls: "text-accent-2" },
    error: { label: "Save failed — retrying next edit", cls: "text-bad" },
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* document header */}
      <header className="no-print flex flex-wrap items-center gap-3 border-b border-line bg-ink-2 px-4 py-2.5 md:px-6">
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            latestRef.current.title = e.target.value;
            scheduleSave();
          }}
          placeholder="Untitled document"
          className="min-w-0 flex-1 bg-transparent text-[16px] font-medium tracking-[-0.01em] text-paper outline-none placeholder:text-muted"
          maxLength={200}
        />
        <span className={`flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] ${statusMeta[saveState].cls}`}>
          {saveState === "saving" ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
          {statusMeta[saveState].label}
        </span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-8 items-center gap-2 rounded-md bg-paper px-3.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:bg-accent hover:text-ink"
          >
            {exporting ? <Loader2 size={12} className="animate-spin" /> : <FileDown size={12} />}
            Export
          </button>
          {menuOpen ? (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-lg border border-line bg-ink-3 shadow-2xl">
                {[
                  ["docx", "Word document", ".docx — styles, tables, images"],
                  ["md", "Markdown", ".md — portable plain format"],
                  ["html", "Web page", ".html — styled, standalone"],
                  ["txt", "Plain text", ".txt — words only"],
                ].map(([kind, label, hint]) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => void doExport(kind as "docx" | "md" | "html" | "txt")}
                    className="block w-full px-4 py-2.5 text-left transition-colors hover:bg-ink-2"
                  >
                    <span className="block text-[13px] text-paper">{label}</span>
                    <span className="block font-mono text-[10px] text-muted">{hint}</span>
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>
        <button
          type="button"
          title="Print / save as PDF"
          onClick={() => window.print()}
          className="grid h-8 w-8 place-items-center rounded-md border border-line text-paper-2 transition-colors hover:border-line-2 hover:text-paper"
        >
          <Printer size={13} />
        </button>
      </header>

      {/* toolbar */}
      <div className="no-print sticky top-0 z-10 border-b border-line bg-ink-2/95 backdrop-blur">
        {editor ? <Toolbar editor={editor} /> : null}
        {editor ? <TableActions editor={editor} /> : null}
      </div>

      {/* paper */}
      <div className="paper-scroll flex-1 overflow-y-auto">
        <div className="folio-paper-wrap">
          <div className="folio-paper">
            <EditorContent editor={editor} />
          </div>
          <div className="no-print pb-10 pt-3 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
            A4 · 210 × 297 mm · margins 25 mm
          </div>
        </div>
      </div>

      {/* status bar */}
      <footer className="no-print flex items-center justify-between border-t border-line bg-ink-2 px-4 py-2 md:px-6">
        <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
          <span>{words.toLocaleString()} words</span>
          <span className="hidden sm:inline">{chars.toLocaleString()} characters</span>
        </div>
        <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
          <span className="hidden md:inline">Autosave → PostgreSQL</span>
          <span className="flex items-center gap-1.5 text-ok">
            <CloudUpload size={11} />
            DOCX-ready
          </span>
        </div>
      </footer>
    </div>
  );
}

/* ================================================================== */
/* Shell — document library + pane                                     */
/* ================================================================== */

export function EditorApp() {
  const [docs, setDocs] = useState<DocRow[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<{ id: string; html: string } | null>(null);
  const [query, setQuery] = useState("");
  const [importing, setImporting] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/documents");
    const data = (await res.json()) as { documents?: DocRow[] };
    const list = data.documents ?? [];
    setDocs(list);
    setActiveId((prev) => prev ?? list[0]?.id ?? null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const createDoc = useCallback(
    async (title = "Untitled document") => {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, content: EMPTY_DOC }),
      });
      const data = (await res.json()) as { document?: DocRow };
      if (data.document) {
        setDocs((d) => [data.document as DocRow, ...(d ?? [])]);
        setActiveId(data.document.id);
        return data.document.id;
      }
      return null;
    },
    []
  );

  const deleteDoc = useCallback(
    async (id: string) => {
      if (!window.confirm("Delete this document permanently?")) return;
      await fetch(`/api/documents/${id}`, { method: "DELETE" });
      setDocs((d) => {
        const next = (d ?? []).filter((x) => x.id !== id);
        if (activeId === id) setActiveId(next[0]?.id ?? null);
        return next;
      });
    },
    [activeId]
  );

  const onSaved = useCallback(
    (id: string, patch: { title: string; wordCount: number; updatedAt: string }) => {
      setDocs((d) =>
        (d ?? [])
          .map((x) => (x.id === id ? { ...x, ...patch } : x))
          .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      );
    },
    []
  );

  const importDocx = useCallback(
    async (file: File) => {
      setImporting(true);
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/import-docx", { method: "POST", body: form });
        const data = (await res.json()) as { ok: boolean; html?: string; title?: string };
        if (!data.ok || !data.html) throw new Error("import failed");
        const id = await createDoc(data.title ?? "Imported document");
        if (id) setPendingImport({ id, html: data.html });
      } catch {
        window.alert("Could not import that file — is it a valid .docx?");
      } finally {
        setImporting(false);
      }
    },
    [createDoc]
  );

  useEffect(() => {
    if (docs && docs.length === 0) void createDoc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docs]);

  const active = docs?.find((d) => d.id === activeId) ?? null;
  const filtered = (docs ?? []).filter((d) => d.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="flex h-screen overflow-hidden bg-ink">
      {/* ======= sidebar ======= */}
      <aside className="no-print hidden w-[292px] shrink-0 flex-col border-r border-line bg-ink-2 md:flex">
        <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-[4px] border border-line-2 bg-ink-3 font-serif italic text-[15px] leading-none text-accent">
              F
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-paper">
              Folio <span className="text-muted">Docs</span>
            </span>
          </Link>
          <Link
            href="/"
            title="Back to folio.sh"
            className="grid h-7 w-7 place-items-center rounded-md text-muted transition-colors hover:bg-ink-3 hover:text-paper"
          >
            <ArrowLeft size={13} />
          </Link>
        </div>

        <div className="border-b border-line p-3">
          <button
            type="button"
            onClick={() => void createDoc()}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-md bg-accent font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-accent-2"
          >
            <FilePlus2 size={13} />
            New document
          </button>
          <div className="mt-2.5 flex items-center gap-2 rounded-md border border-line bg-ink px-3">
            <Search size={12} className="shrink-0 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search documents…"
              className="h-8 w-full bg-transparent text-[12.5px] text-paper outline-none placeholder:text-muted"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {docs === null ? (
            <div className="space-y-2 p-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-md bg-ink-3" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-3 font-mono text-[11px] text-muted">No documents match.</p>
          ) : (
            filtered.map((d) => {
              const on = d.id === activeId;
              const date = new Date(d.updatedAt);
              return (
                <div
                  key={d.id}
                  onClick={() => setActiveId(d.id)}
                  className={`group mb-1 flex cursor-pointer items-start gap-2.5 rounded-md border px-3 py-2.5 transition-colors ${
                    on ? "border-accent/50 bg-accent/10" : "border-transparent hover:bg-ink-3"
                  }`}
                >
                  <FileText size={13} className={`mt-0.5 shrink-0 ${on ? "text-accent" : "text-muted"}`} />
                  <div className="min-w-0 flex-1">
                    <div className={`truncate text-[13px] ${on ? "text-paper" : "text-paper-2"}`}>{d.title}</div>
                    <div className="mt-0.5 font-mono text-[9.5px] uppercase tracking-wider text-muted">
                      {d.wordCount.toLocaleString()} words ·{" "}
                      {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </div>
                  </div>
                  <button
                    type="button"
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      void deleteDoc(d.id);
                    }}
                    className="mt-0.5 hidden shrink-0 text-muted transition-colors hover:text-bad group-hover:block"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-line p-3">
          <button
            type="button"
            disabled={importing}
            onClick={() => importRef.current?.click()}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-md border border-line font-mono text-[10.5px] uppercase tracking-[0.16em] text-paper-2 transition-colors hover:border-accent/60 hover:text-paper disabled:opacity-50"
          >
            {importing ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            Import .docx
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".docx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importDocx(f);
              e.target.value = "";
            }}
          />
          <div className="mt-3 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
            <span>{docs?.length ?? 0} documents</span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-ok" />
              PostgreSQL
            </span>
          </div>
        </div>
      </aside>

      {/* ======= main ======= */}
      <main className="flex min-w-0 flex-1 flex-col">
        {active ? (
          <EditorPane
            key={active.id}
            doc={active}
            pendingHtml={pendingImport?.id === active.id ? pendingImport.html : null}
            onConsumeImport={() => setPendingImport(null)}
            onSaved={onSaved}
          />
        ) : (
          <div className="grid flex-1 place-items-center">
            <div className="text-center">
              <Loader2 size={18} className="mx-auto animate-spin text-accent" />
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
                {docs === null ? "Opening your library…" : "Creating a document…"}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
