import { db } from "@/db";
import { documents } from "@/db/schema";
import { welcomeDoc } from "@/lib/welcome-doc";
import { requireApiSession } from "@/lib/session";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

export async function GET(req: Request) {
  const unauthorized = await requireApiSession(req);
  if (unauthorized) return unauthorized;

  let rows = await db.select().from(documents).orderBy(desc(documents.updatedAt));
  if (rows.length === 0) {
    const [seed] = await db
      .insert(documents)
      .values({ title: "Welcome to Folio", content: welcomeDoc, wordCount: 356 })
      .returning();
    rows = [seed];
  }
  return Response.json({ ok: true, documents: rows });
}

export async function POST(req: Request) {
  const unauthorized = await requireApiSession(req);
  if (unauthorized) return unauthorized;

  try {
    const body = (await req.json()) as {
      title?: string;
      content?: unknown;
      wordCount?: number;
    };
    const [row] = await db
      .insert(documents)
      .values({
        title: (body.title ?? "Untitled document").slice(0, 500),
        content: (body.content ?? EMPTY_DOC) as Record<string, unknown>,
        wordCount: body.wordCount ?? 0,
      })
      .returning();
    return Response.json({ ok: true, document: row });
  } catch {
    return Response.json({ ok: false, error: "create_failed" }, { status: 500 });
  }
}
