import * as mammoth from "mammoth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 12 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return Response.json({ ok: false, error: "no_file" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return Response.json({ ok: false, error: "too_large" }, { status: 413 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await mammoth.convertToHtml(
      { buffer },
      {
        styleMap: [
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Heading 3'] => h3:fresh",
          "p[style-name='Title'] => h1:fresh",
          "p[style-name='Quote'] => blockquote:fresh",
          "b => strong",
          "i => em",
        ],
      }
    );
    const title = file.name.replace(/\.docx?$/i, "") || "Imported document";
    return Response.json({ ok: true, html: result.value, title });
  } catch {
    return Response.json({ ok: false, error: "convert_failed" }, { status: 500 });
  }
}
