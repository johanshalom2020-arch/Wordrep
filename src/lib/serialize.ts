/* Serialize helpers: word count, Markdown export, downloads. */

export type Jrn = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown> | null;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  content?: Jrn[];
};

export function countWords(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* ---------------- Markdown ---------------- */

function inlineMd(node: Jrn): string {
  if (!node) return "";
  if (node.type === "text") {
    let t = node.text ?? "";
    const marks = node.marks ?? [];
    for (const m of marks) {
      if (m.type === "bold") t = `**${t}**`;
      else if (m.type === "italic") t = `*${t}*`;
      else if (m.type === "strike") t = `~~${t}~~`;
      else if (m.type === "code") t = `\`${t}\``;
      else if (m.type === "link") t = `[${t}](${String(m.attrs?.href ?? "#")})`;
    }
    return t;
  }
  if (node.type === "hardBreak") return "  \n";
  if (node.type === "image") return `![${String(node.attrs?.alt ?? "image")}](${String(node.attrs?.src ?? "")})`;
  return "";
}

function inlineChildren(node: Jrn): string {
  return (node.content ?? []).map(inlineMd).join("");
}

function blockMd(node: Jrn, depth: number): string {
  const pad = "  ".repeat(depth);
  switch (node.type) {
    case "heading":
      return `${"#".repeat(Math.min(6, Number(node.attrs?.level ?? 1)))} ${inlineChildren(node)}`;
    case "paragraph":
      return inlineChildren(node);
    case "blockquote":
      return (node.content ?? [])
        .map((c) => blockMd(c, depth))
        .join("\n\n")
        .split("\n")
        .map((l) => `> ${l}`)
        .join("\n");
    case "codeBlock":
      return "```\n" + (node.content ?? []).map((c) => c.text ?? "").join("") + "\n```";
    case "horizontalRule":
      return "---";
    case "bulletList":
      return (node.content ?? [])
        .map((li) => {
          const paras = (li.content ?? []).map((c) => blockMd(c, depth));
          return `${pad}- ${paras.join(`\n${pad}  `)}`;
        })
        .join("\n");
    case "orderedList":
      return (node.content ?? [])
        .map((li, i) => {
          const paras = (li.content ?? []).map((c) => blockMd(c, depth));
          return `${pad}${i + 1}. ${paras.join(`\n${pad}   `)}`;
        })
        .join("\n");
    case "image":
      return inlineMd(node);
    case "table": {
      const rows = (node.content ?? []).map((r) =>
        (r.content ?? []).map((cell) => (cell.content ?? []).map((c) => blockMd(c, depth)).join(" ").trim())
      );
      if (rows.length === 0) return "";
      const head = rows[0];
      const lines = [
        `| ${head.join(" | ")} |`,
        `| ${head.map(() => "---").join(" | ")} |`,
        ...rows.slice(1).map((r) => `| ${r.join(" | ")} |`),
      ];
      return lines.join("\n");
    }
    default:
      return (node.content ?? []).map((c) => blockMd(c, depth)).join("\n\n");
  }
}

export function jsonToMarkdown(doc: Jrn): string {
  return (doc.content ?? [])
    .map((c) => blockMd(c, 0))
    .filter((s) => s.trim().length > 0)
    .join("\n\n");
}

export function safeFilename(title: string): string {
  return (
    title
      .trim()
      .replace(/[^\w\s.-]+/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 80) || "document"
  );
}
