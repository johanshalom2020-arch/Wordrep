export const welcomeDoc: Record<string, unknown> = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: "Welcome to Folio" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Folio is a " },
        {
          type: "text",
          text: "free and open-source word processor",
          marks: [{ type: "bold" }],
        },
        {
          type: "text",
          text: " that treats Microsoft Word files as first-class citizens. Write here, then export a real .docx — or open one you already have. Your documents live in your own database; nothing is tracked and nothing leaves your infrastructure.",
        },
      ],
    },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "What you can do right now" }] },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "Format with headings, bold, italic, underline, highlights, colors, and custom fonts from the toolbar above." },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "Import any " },
                { type: "text", text: ".docx", marks: [{ type: "code" }] },
                { type: "text", text: " file and keep editing — or export yours as DOCX, Markdown, HTML, or plain text." },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "Insert tables and images, align paragraphs, and print a clean, paged PDF." },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "Everything autosaves to PostgreSQL. Close the tab; your draft is waiting when you return." },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Built on open shoulders" }],
    },
    {
      type: "table",
      content: [
        {
          type: "tableRow",
          content: [
            { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", text: "Layer" }] }] },
            { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", text: "Project" }] }] },
            { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", text: "License" }] }] },
          ],
        },
        {
          type: "tableRow",
          content: [
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Editor core" }] }] },
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Tiptap / ProseMirror" }] }] },
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "MIT" }] }] },
          ],
        },
        {
          type: "tableRow",
          content: [
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "DOCX import" }] }] },
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Mammoth" }] }] },
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "BSD-2-Clause" }] }] },
          ],
        },
        {
          type: "tableRow",
          content: [
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Storage" }] }] },
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "PostgreSQL · S3-ready" }] }] },
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "PostgreSQL License" }] }] },
          ],
        },
      ],
    },
    {
      type: "blockquote",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "“Own your words. Own your files. Own your server.” — the Folio principle" },
          ],
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Delete this page whenever you like — press " },
        { type: "text", text: "New document", marks: [{ type: "bold" }] },
        { type: "text", text: " and make it yours." },
      ],
    },
  ],
};
