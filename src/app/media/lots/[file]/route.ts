import { readFile } from "node:fs/promises";
import path from "node:path";
import { FILE_NAME, UPLOAD_DIR } from "@/lib/uploads";

const TYPES = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!FILE_NAME.test(file)) return new Response("Not found", { status: 404 });
  try {
    const body = await readFile(path.join(UPLOAD_DIR, file));
    const ext = file.split(".").pop() as keyof typeof TYPES;
    return new Response(new Uint8Array(body), {
      headers: { "Content-Type": TYPES[ext], "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
