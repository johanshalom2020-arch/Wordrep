"use client";

import type { Editor } from "@tiptap/core";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Code2,
  Eraser,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Palette,
  Quote,
  Redo2,
  ScissorsLineDashed,
  Strikethrough,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { useRef, type ReactNode } from "react";
import { FONT_FAMILIES, FONT_SIZES } from "@/lib/editor-extensions";

function Btn({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded-md transition-colors disabled:opacity-30 ${
        active ? "bg-accent/15 text-accent" : "text-paper-2 hover:bg-ink-3 hover:text-paper"
      }`}
    >
      {children}
    </button>
  );
}

const Sep = () => <span className="mx-1 h-5 w-px shrink-0 bg-line" />;

const ICON = 15;

export function Toolbar({ editor }: { editor: Editor }) {
  const fileRef = useRef<HTMLInputElement>(null);

  const insertImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result);
      const probe = new window.Image();
      probe.onload = () => {
        const w = Math.min(probe.naturalWidth, 620);
        const h = Math.round((probe.naturalHeight / probe.naturalWidth) * w);
        editor.chain().focus().setImage({ src, alt: file.name, width: w, height: h }).run();
      };
      probe.src = src;
    };
    reader.readAsDataURL(file);
  };

  const insertLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL:", prev ?? "https://");
    if (url === null) return;
    if (url.trim() === "" || url === "https://") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const blockValue = editor.isActive("heading", { level: 1 })
    ? "h1"
    : editor.isActive("heading", { level: 2 })
      ? "h2"
      : editor.isActive("heading", { level: 3 })
        ? "h3"
        : editor.isActive("blockquote")
          ? "quote"
          : "p";

  return (
    <div className="flex min-w-max items-center gap-0.5 px-4 py-2.5">
      <Btn title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
        <Undo2 size={ICON} />
      </Btn>
      <Btn title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
        <Redo2 size={ICON} />
      </Btn>
      <Sep />

      <select
        aria-label="Paragraph style"
        className="mr-1 h-8 rounded-md border border-line bg-ink-3 px-2 text-[12px] text-paper-2 outline-none transition-colors hover:border-line-2"
        value={blockValue}
        onChange={(e) => {
          const v = e.target.value;
          const c = editor.chain().focus();
          if (v === "h1") c.toggleHeading({ level: 1 }).run();
          else if (v === "h2") c.toggleHeading({ level: 2 }).run();
          else if (v === "h3") c.toggleHeading({ level: 3 }).run();
          else if (v === "quote") c.toggleBlockquote().run();
          else c.setParagraph().run();
        }}
      >
        <option value="p">Paragraph</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
        <option value="quote">Quote</option>
      </select>

      <select
        aria-label="Font family"
        className="mr-1 h-8 max-w-[168px] rounded-md border border-line bg-ink-3 px-2 text-[12px] text-paper-2 outline-none transition-colors hover:border-line-2"
        value={(editor.getAttributes("fontFamily").family as string) ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") editor.chain().focus().unsetMark("fontFamily").run();
          else editor.chain().focus().setMark("fontFamily", { family: v }).run();
        }}
      >
        {FONT_FAMILIES.map((f) => (
          <option key={f.label} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>

      <select
        aria-label="Font size"
        className="mr-1 h-8 rounded-md border border-line bg-ink-3 px-2 text-[12px] text-paper-2 outline-none transition-colors hover:border-line-2"
        value={(editor.getAttributes("fontSize").size as string) ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") editor.chain().focus().unsetMark("fontSize").run();
          else editor.chain().focus().setMark("fontSize", { size: v }).run();
        }}
      >
        <option value="">Size</option>
        {FONT_SIZES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <Sep />

      <Btn title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold size={ICON} />
      </Btn>
      <Btn title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic size={ICON} />
      </Btn>
      <Btn
        title="Underline"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon size={ICON} />
      </Btn>
      <Btn
        title="Strikethrough"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough size={ICON} />
      </Btn>
      <Btn title="Inline code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
        <Code2 size={ICON} />
      </Btn>
      <Sep />

      <label
        title="Text color"
        className="relative grid h-8 w-8 cursor-pointer place-items-center rounded-md text-paper-2 transition-colors hover:bg-ink-3"
        style={editor.isActive("textColor") ? { color: String(editor.getAttributes("textColor").color) } : undefined}
      >
        <Palette size={ICON} />
        <input
          type="color"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          onChange={(e) => editor.chain().focus().setMark("textColor", { color: e.target.value }).run()}
        />
      </label>
      <label
        title="Highlight"
        className="relative grid h-8 w-8 cursor-pointer place-items-center rounded-md text-paper-2 transition-colors hover:bg-ink-3"
      >
        <Highlighter size={ICON} style={editor.isActive("highlight") ? { color: String(editor.getAttributes("highlight").color ?? "#facc15") } : undefined} />
        <input
          type="color"
          defaultValue="#fef08a"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          onChange={(e) => editor.chain().focus().setHighlight({ color: e.target.value }).run()}
        />
      </label>
      <Sep />

      <Btn title="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
        <AlignLeft size={ICON} />
      </Btn>
      <Btn title="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
        <AlignCenter size={ICON} />
      </Btn>
      <Btn title="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
        <AlignRight size={ICON} />
      </Btn>
      <Btn title="Justify" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()}>
        <AlignJustify size={ICON} />
      </Btn>
      <Sep />

      <Btn title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List size={ICON} />
      </Btn>
      <Btn title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered size={ICON} />
      </Btn>
      <Btn title="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote size={ICON} />
      </Btn>
      <Btn title="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        <Code size={ICON} />
      </Btn>
      <Btn title="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus size={ICON} />
      </Btn>
      <Btn title="Page break (Ctrl/⌘ + Enter)" onClick={() => editor.chain().focus().setPageBreak().run()}>
        <ScissorsLineDashed size={ICON} />
      </Btn>
      <Sep />

      <Btn title="Insert link" active={editor.isActive("link")} onClick={insertLink}>
        <Link2 size={ICON} />
      </Btn>
      <Btn title="Insert image" onClick={() => fileRef.current?.click()}>
        <ImageIcon size={ICON} />
      </Btn>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) insertImage(f);
          e.target.value = "";
        }}
      />
      <Btn
        title="Insert 3×3 table"
        active={editor.isActive("table")}
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      >
        <TableIcon size={ICON} />
      </Btn>
      <Sep />
      <Btn
        title="Clear formatting"
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
      >
        <Eraser size={ICON} />
      </Btn>
    </div>
  );
}

export function TableActions({ editor }: { editor: Editor }) {
  if (!editor.isActive("table")) return null;
  const ops: [string, () => void][] = [
    ["+ row", () => editor.chain().focus().addRowAfter().run()],
    ["− row", () => editor.chain().focus().deleteRow().run()],
    ["+ col", () => editor.chain().focus().addColumnAfter().run()],
    ["− col", () => editor.chain().focus().deleteColumn().run()],
    ["merge", () => editor.chain().focus().mergeCells().run()],
    ["split", () => editor.chain().focus().splitCell().run()],
    ["delete table", () => editor.chain().focus().deleteTable().run()],
  ];
  return (
    <div className="flex min-w-max items-center gap-1 border-t border-line/70 px-4 py-1.5">
      <span className="mr-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted">Table</span>
      {ops.map(([label, fn]) => (
        <button
          key={label}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={fn}
          className="rounded border border-line bg-ink-3 px-2 py-1 font-mono text-[10.5px] text-paper-2 transition-colors hover:border-accent/60 hover:text-paper"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
