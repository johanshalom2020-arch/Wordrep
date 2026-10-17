import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  HighlightColor,
  ImageRun,
  LevelFormat,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  UnderlineType,
  WidthType,
} from "docx";
import type { Jrn } from "./serialize";

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

const HEADING: Record<number, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
};

const ALIGN: Record<string, (typeof AlignmentType)[keyof typeof AlignmentType]> = {
  left: AlignmentType.LEFT,
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT,
  justify: AlignmentType.JUSTIFIED,
};

function nearestHighlight(hex: string): (typeof HighlightColor)[keyof typeof HighlightColor] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return HighlightColor.YELLOW;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  if (r > 200 && g > 200 && b < 170) return HighlightColor.YELLOW;
  if (g >= r && g >= b && g > 150) return HighlightColor.GREEN;
  if (b >= r && b > 150) return HighlightColor.CYAN;
  if (r > 200 && b > 150 && g < 170) return HighlightColor.MAGENTA;
  if (r > 220 && g < 150 && b < 150) return HighlightColor.RED;
  return HighlightColor.YELLOW;
}

function cleanHex(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const m = /^#?([0-9a-f]{6})$/i.exec(v.trim());
  return m ? m[1].toUpperCase() : undefined;
}

function pxToHalfPoints(v: unknown): number | undefined {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.round(n * 1.5);
}

function dataUrlToBytes(src: string): { bytes: Uint8Array; type: "png" | "jpg" | "gif" } | null {
  const m = /^data:image\/(png|jpe?g|gif);base64,(.+)$/i.exec(src);
  if (!m) return null;
  const bin = atob(m[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const kind = m[1].toLowerCase();
  return { bytes, type: kind.startsWith("j") ? "jpg" : (kind as "png" | "gif") };
}

/* ------------------------------------------------------------------ */
/* inline runs                                                         */
/* ------------------------------------------------------------------ */

function textRun(node: Jrn): TextRun {
  const marks = node.marks ?? [];
  const get = (name: string) => marks.find((m) => m.type === name);
  const colorMark = get("textColor");
  const familyMark = get("fontFamily");
  const sizeMark = get("fontSize");
  const highlightMark = get("highlight");

  return new TextRun({
    text: node.text ?? "",
    bold: Boolean(get("bold")),
    italics: Boolean(get("italic")),
    strike: Boolean(get("strike")),
    underline: get("underline") ? { type: UnderlineType.SINGLE } : undefined,
    font: get("code")
      ? "Courier New"
      : familyMark?.attrs?.family
        ? String(familyMark.attrs.family)
        : undefined,
    size: pxToHalfPoints(sizeMark?.attrs?.size),
    color: cleanHex(colorMark?.attrs?.color),
    highlight: highlightMark?.attrs?.color
      ? nearestHighlight(String(highlightMark.attrs.color))
      : get("highlight")
        ? HighlightColor.YELLOW
        : undefined,
  });
}

function inlineChildren(node: Jrn): (TextRun | ExternalHyperlink | ImageRun)[] {
  const out: (TextRun | ExternalHyperlink | ImageRun)[] = [];
  for (const child of node.content ?? []) {
    if (child.type === "text") {
      const linkMark = (child.marks ?? []).find((m) => m.type === "link");
      const run = textRun(child);
      if (linkMark?.attrs?.href) {
        out.push(
          new ExternalHyperlink({
            link: String(linkMark.attrs.href),
            children: [
              new TextRun({
                text: child.text ?? "",
                style: "Hyperlink",
                bold: Boolean((child.marks ?? []).some((m) => m.type === "bold")),
                italics: Boolean((child.marks ?? []).some((m) => m.type === "italic")),
              }),
            ],
          })
        );
      } else {
        out.push(run);
      }
    } else if (child.type === "hardBreak") {
      out.push(new TextRun({ text: "", break: 1 }));
    } else if (child.type === "image") {
      const img = imageRun(child);
      if (img) out.push(img);
    }
  }
  return out;
}

function imageRun(node: Jrn): ImageRun | null {
  const src = String(node.attrs?.src ?? "");
  const packed = dataUrlToBytes(src);
  if (!packed) return null;
  const w = Number(node.attrs?.width) || 480;
  const h = Number(node.attrs?.height) || Math.round(w * 0.66);
  const scale = Math.min(1, 480 / w);
  return new ImageRun({
    data: packed.bytes,
    type: packed.type,
    transformation: { width: Math.round(w * scale), height: Math.round(h * scale) },
    altText: { title: String(node.attrs?.alt ?? "image"), description: "", name: "image" },
  });
}

/* ------------------------------------------------------------------ */
/* blocks                                                              */
/* ------------------------------------------------------------------ */

function paragraphFrom(node: Jrn, extra: Record<string, unknown> = {}): Paragraph {
  const h = node.attrs?.level ? HEADING[Number(node.attrs.level)] : undefined;
  const align = node.attrs?.textAlign ? ALIGN[String(node.attrs.textAlign)] : undefined;
  return new Paragraph({
    heading: h,
    alignment: align,
    children: inlineChildren(node),
    spacing: { after: h ? 160 : 140, before: h ? 280 : 0 },
    ...extra,
  });
}

function listItems(node: Jrn, ordered: boolean, level: number, out: (Paragraph | Table)[]) {
  for (const item of node.content ?? []) {
    const paras = (item.content ?? []).filter((c) => c.type === "paragraph");
    const first = paras[0] ?? { type: "paragraph" };
    out.push(
      new Paragraph({
        children: inlineChildren(first),
        spacing: { after: 60 },
        ...(ordered
          ? { numbering: { reference: "folio-ol", level: Math.min(level, 2) } }
          : { bullet: { level: Math.min(level, 2) } }),
      })
    );
    for (const extra of paras.slice(1)) out.push(paragraphFrom(extra, {}));
    for (const nested of (item.content ?? []).filter(
      (c) => c.type === "bulletList" || c.type === "orderedList"
    )) {
      listItems(nested, nested.type === "orderedList", level + 1, out);
    }
  }
}

function cellParagraphs(cell: Jrn): Paragraph[] {
  const ps: Paragraph[] = [];
  for (const c of cell.content ?? []) {
    if (c.type === "paragraph" || c.type === "heading") ps.push(paragraphFrom(c, { spacing: { after: 40, before: 40 } }));
    else if (c.content) ps.push(paragraphFrom({ type: "paragraph", content: c.content }));
  }
  return ps.length ? ps : [new Paragraph({ children: [] })];
}

const TBorder = { style: BorderStyle.SINGLE, size: 2, color: "C9CDD4" } as const;

function tableFrom(node: Jrn): Table {
  const rows = (node.content ?? []).map(
    (row) =>
      new TableRow({
        children: (row.content ?? []).map((cell) => {
          const fill = cleanHex(cell.attrs?.bg);
          const isHeader = cell.type === "tableHeader";
          return new TableCell({
            children: cellParagraphs(cell),
            shading: isHeader
              ? { type: ShadingType.CLEAR, color: "auto", fill: fill ?? "EEF1F5" }
              : fill
                ? { type: ShadingType.CLEAR, color: "auto", fill }
                : undefined,
          });
        }),
      })
  );
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: TBorder,
      bottom: TBorder,
      left: TBorder,
      right: TBorder,
      insideHorizontal: TBorder,
      insideVertical: TBorder,
    },
    rows,
  });
}

function blocks(node: Jrn): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  for (const child of node.content ?? []) {
    switch (child.type) {
      case "paragraph":
      case "heading":
        if ((child.content?.length ?? 0) > 0 || child.type === "paragraph")
          out.push(paragraphFrom(child));
        break;
      case "blockquote":
        for (const c of child.content ?? []) {
          out.push(
            paragraphFrom(c, {
              indent: { left: 640 },
              border: { left: { style: BorderStyle.SINGLE, size: 18, color: "9BA3AF", space: 10 } },
            })
          );
        }
        break;
      case "codeBlock": {
        const text = (child.content ?? []).map((c) => c.text ?? "").join("");
        for (const line of text.split("\n")) {
          out.push(
            new Paragraph({
              children: [new TextRun({ text: line || " ", font: "Courier New", size: 19 })],
              shading: { type: ShadingType.CLEAR, color: "auto", fill: "F3F4F6" },
              spacing: { after: 0 },
            })
          );
        }
        break;
      }
      case "horizontalRule":
        out.push(
          new Paragraph({
            children: [],
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "9BA3AF", space: 1 } },
          })
        );
        break;
      case "bulletList":
      case "orderedList":
        listItems(child, child.type === "orderedList", 0, out);
        break;
      case "table":
        out.push(tableFrom(child));
        out.push(new Paragraph({ children: [] }));
        break;
      case "image": {
        const img = imageRun(child);
        out.push(
          new Paragraph({
            children: img ? [img] : [new TextRun({ text: "[image]", font: "Courier New", size: 18 })],
            alignment: child.attrs?.textAlign ? ALIGN[String(child.attrs.textAlign)] : undefined,
          })
        );
        break;
      }
      default:
        if (child.content) out.push(...blocks(child));
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */

export async function exportDocx(doc: Jrn, title: string): Promise<Blob> {
  const children = blocks(doc);
  const document = new Document({
    title,
    creator: "Folio",
    description: "Written in Folio — the free and open-source word processor.",
    numbering: {
      config: [
        {
          reference: "folio-ol",
          levels: [
            { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.START },
            { level: 1, format: LevelFormat.LOWER_LETTER, text: "%2)", alignment: AlignmentType.START },
            { level: 2, format: LevelFormat.LOWER_ROMAN, text: "%3.", alignment: AlignmentType.START },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: { size: { width: 11906, height: 16838 } }, // A4 in twips
        },
        children: children.length ? children : [new Paragraph({ children: [] })],
      },
    ],
  });
  return Packer.toBlob(document);
}
