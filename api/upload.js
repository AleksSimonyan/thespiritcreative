import { verifyToken } from "./_lib/auth.js";
import { writeAsset } from "./_lib/storage.js";

const DATA_URL_PATTERN = /^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/i;

export async function POST(request) {
  if (!verifyToken(request.headers.get("authorization"))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const match = String(body.dataUrl || "").match(DATA_URL_PATTERN);
    if (!match) {
      return Response.json({ error: "Invalid image payload" }, { status: 400 });
    }

    const mime = match[1].toLowerCase();
    const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
    const buffer = Buffer.from(match[2], "base64");
    const filename = `assets/uploads/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    const url = await writeAsset(filename, buffer);

    return Response.json({ url });
  } catch (error) {
    console.error("[POST /api/upload] failed", { error: error.message, stack: error.stack });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
