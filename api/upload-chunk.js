import { verifyToken } from "./_lib/auth.js";
import { writeAsset } from "./_lib/storage.js";

export async function POST(request) {
  if (!verifyToken(request.headers.get("authorization"))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const uploadId = String(body.uploadId || "").trim();
    const index = Number(body.index);
    const total = Number(body.total);
    const chunk = String(body.chunk || "");

    if (!uploadId || !Number.isInteger(index) || !Number.isInteger(total) || total < 1) {
      return Response.json({ error: "Invalid chunk payload" }, { status: 400 });
    }

    if (index < 0 || index >= total) {
      return Response.json({ error: "Invalid chunk index" }, { status: 400 });
    }

    const buffer = Buffer.from(chunk, "base64");
    if (!buffer.length) {
      return Response.json({ error: "Empty chunk" }, { status: 400 });
    }

    await writeAsset(`assets/uploads/.chunks/${uploadId}/${index}.part`, buffer);
    return Response.json({ ok: true, index });
  } catch (error) {
    console.error("[POST /api/upload-chunk] failed", { error: error.message, stack: error.stack });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
