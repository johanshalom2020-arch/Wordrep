"use client";

import { Mark, mergeAttributes } from "@tiptap/core";
import { Highlight } from "@tiptap/extension-highlight";
import { Image } from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { TextAlign } from "@tiptap/extension-text-align";
import { Placeholder } from "@tiptap/extensions";
import { StarterKit } from "@tiptap/starter-kit";
import { PageBreak, Pagination } from "tiptap-community-pages";

/* ---------- custom marks: font family / size / color ---------- */

const FontFamily = Mark.create({
  name: "fontFamily",
  addAttributes() {
    return { family: { default: null } };
  },
  parseHTML() {
    return [{ style: "font-family", getAttrs: (v) => ({ family: v }) }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { style: `font-family: ${HTMLAttributes.family}` }), 0];
  },
});

const FontSize = Mark.create({
  name: "fontSize",
  addAttributes() {
    return { size: { default: null } };
  },
  parseHTML() {
    return [{ style: "font-size", getAttrs: (v) => ({ size: v }) }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { style: `font-size: ${HTMLAttributes.size}` }), 0];
  },
});

const TextColor = Mark.create({
  name: "textColor",
  addAttributes() {
    return { color: { default: null } };
  },
  parseHTML() {
    return [{ style: "color", getAttrs: (v) => ({ color: v }) }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { style: `color: ${HTMLAttributes.color}` }), 0];
  },
});

/* ---------- image with persisted dimensions ---------- */

const SizedImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: null },
      height: { default: null },
      bg: { default: null },
    };
  },
});

export const FOLIO_PAGE_MARGINS = { top: 88, right: 78, bottom: 96, left: 78 } as const;

type ExtensionOptions = {
  onPageCountChange?: (count: number) => void;
};

export function buildExtensions(options: ExtensionOptions = {}) {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      link: { openOnClick: false, autolink: true },
    }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Highlight.configure({ multicolor: true }),
    SizedImage.configure({ inline: false, allowBase64: true }),
    TableKit.configure({
      table: { resizable: true, lastColumnResizable: true },
    }),
    FontFamily,
    FontSize,
    TextColor,
    PageBreak,
    Pagination.configure({
      pageFormat: "A4",
      orientation: "portrait",
      margins: FOLIO_PAGE_MARGINS,
      pageGap: 30,
      showPageNumbers: true,
      pageNumberSeparator: "/",
      widowOrphanControl: true,
      minLinesAtBreak: 2,
      onPageCountChange: options.onPageCountChange,
    }),
    Placeholder.configure({ placeholder: "Start writing — Folio saves every keystroke…" }),
  ];
}

export const FONT_FAMILIES: { label: string; value: string }[] = [
  { label: "Georgia (default)", value: "" },
  { label: "Space Grotesk", value: "'Space Grotesk Variable', sans-serif" },
  { label: "Instrument Serif", value: "'Instrument Serif', serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Arial / Helvetica", value: "Arial, Helvetica, sans-serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "JetBrains Mono", value: "'JetBrains Mono Variable', monospace" },
];

export const FONT_SIZES: { label: string; value: string }[] = [
  { label: "12", value: "12px" },
  { label: "13", value: "13px" },
  { label: "14", value: "14px" },
  { label: "16", value: "16px" },
  { label: "18", value: "18px" },
  { label: "20", value: "20px" },
  { label: "24", value: "24px" },
  { label: "28", value: "28px" },
  { label: "32", value: "32px" },
  { label: "40", value: "40px" },
];
