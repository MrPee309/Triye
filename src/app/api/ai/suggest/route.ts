import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Category } from "@/lib/models/Category";
import { HttpError, readJson, requireUserId, route } from "@/lib/api";
import { getAI, isAIConfigured } from "@/lib/ai";
import { anthropicProvider } from "@/lib/ai/anthropic";

const schema = z.object({
  name: z.string().trim().max(160).optional(),
  description: z.string().trim().max(2000).optional(),
  // Only public HTTPS images (Cloudinary). Local dev uploads aren't reachable by the AI service.
  imageUrl: z.string().url().startsWith("https://res.cloudinary.com/").optional(),
});

export const POST = route(async (req: Request) => {
  const owner = await requireUserId();
  if (!isAIConfigured()) throw new HttpError(501, "Asistan AI a poko konfigire.");
  const input = schema.parse(await readJson(req));
  if (!input.imageUrl && !input.name && !input.description) {
    throw new HttpError(400, "Ajoute yon foto oswa ekri kèk mo sou pwodwi a anvan.");
  }
  await connectDB();
  const cats = await Category.find({ parent: null, $or: [{ owner: null }, { owner }] }).select("name").lean();
  if (getAI().name !== "anthropic") throw new HttpError(501, "Founisè AI sa a pa sipòte sijesyon pwodwi.");
  try {
    const suggestion = await anthropicProvider.suggestProduct({
      ...input,
      categories: cats.map((c) => ({ id: String(c._id), name: c.name })),
    });
    return NextResponse.json(suggestion);
  } catch (err) {
    console.error("[ai]", err);
    throw new HttpError(502, "Asistan AI a pa reponn. Ou ka kontinye ranpli fòm nan nòmalman.");
  }
});
