import { verifyToken } from "./_lib/auth.js";
import { writeAsset } from "./_lib/storage.js";

const DATA_URL_PATTERN = /^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/i;

const extensionForType = (type = "") => {
  const mime = type.toLowerCase();
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  return "jpg";
};

const saveBuffer = async (buffer, type) => {
  const ext = extensionForType(type);
  const filename = `assets/uploads/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  return writeAsset(filename, buffer);
};

export async function POST(request) {
  if (!verifyToken(request.headers.get("authorization"))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!file || typeof file === "string") {
        return Response.json({ error: "Missing image file" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      if (!buffer.length) {
        return Response.json({ error: "Empty image file" }, { status: 400 });
      }

      const url = await saveBuffer(buffer, file.type || "image/jpeg");
      return Response.json({ url });
    }

    const body = await request.json();
    const match = String(body.dataUrl || "").match(DATA_URL_PATTERN);
    if (!match) {
      return Response.json({ error: "Invalid image payload" }, { status: 400 });
    }

    const buffer = Buffer.from(match[2], "base64");
    const url = await saveBuffer(buffer, match[1]);
    return Response.json({ url });
  } catch (error) {
    console.error("[POST /api/upload] failed", { error: error.message, stack: error.stack });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
