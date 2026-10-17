import { db } from "@/db";
import { documents } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const [row] = await db.select().from(documents).where(eq(documents.id, id));
  if (!row) return Response.json({ ok: false, error: "not_found" }, { status: 404 });
  return Response.json({ ok: true, document: row });
}

export async function PUT(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const body = (await req.json()) as {
      title?: string;
      content?: unknown;
      wordCount?: number;
    };
    const [row] = await db
      .update(documents)
      .set({
        ...(body.title !== undefined ? { title: body.title.slice(0, 500) } : {}),
        ...(body.content !== undefined ? { content: body.content as Record<string, unknown> } : {}),
        ...(body.wordCount !== undefined ? { wordCount: body.wordCount } : {}),
        updatedAt: new Date(),
      })
      .where(eq(documents.id, id))
      .returning();
    if (!row) return Response.json({ ok: false, error: "not_found" }, { status: 404 });
    return Response.json({ ok: true, document: row });
  } catch {
    return Response.json({ ok: false, error: "update_failed" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  await db.delete(documents).where(eq(documents.id, id));
  return Response.json({ ok: true });
}
