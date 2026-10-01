import { readFile } from "node:fs/promises";
import path from "node:path";
import { MEDIA_DIR, MEDIA_FILE_NAME, MEDIA_TYPES, type MediaExt } from "@/lib/uploads";

// Media library files (uploads/media). Names are random + validated, so the response is immutable.
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!MEDIA_FILE_NAME.test(file)) return new Response("Not found", { status: 404 });
  try {
    const body = await readFile(path.join(MEDIA_DIR, file));
    const ext = file.split(".").pop() as MediaExt;
    return new Response(new Uint8Array(body), {
      headers: {
        "Content-Type": MEDIA_TYPES[ext],
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
