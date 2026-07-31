import { verifyToken } from "./_lib/auth.js";
import { deleteAsset, readAssetBuffer, writeAsset } from "./_lib/storage.js";

const extensionForType = (type = "") => {
  const mime = type.toLowerCase();
  if (mime.includes("mp4") || mime.includes("video") || mime.includes("quicktime")) return "mp4";
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  return "jpg";
};

export async function POST(request) {
  if (!verifyToken(request.headers.get("authorization"))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const uploadId = String(body.uploadId || "").trim();
    const total = Number(body.total);
    const mime = String(body.mime || "application/octet-stream");

    if (!uploadId || !Number.isInteger(total) || total < 1) {
      return Response.json({ error: "Invalid upload payload" }, { status: 400 });
    }

    const parts = [];
    for (let index = 0; index < total; index += 1) {
      const part = await readAssetBuffer(`assets/uploads/.chunks/${uploadId}/${index}.part`);
      if (!part?.length) {
        return Response.json({ error: `Missing upload chunk ${index + 1}` }, { status: 400 });
      }
      parts.push(part);
    }

    const merged = Buffer.concat(parts);
    const ext = extensionForType(mime);
    const filename = `assets/uploads/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    const url = await writeAsset(filename, merged);

    await Promise.allSettled(
      Array.from({ length: total }, (_, index) =>
        deleteAsset(`assets/uploads/.chunks/${uploadId}/${index}.part`)
      )
    );

    return Response.json({ url });
  } catch (error) {
    console.error("[POST /api/upload-complete] failed", { error: error.message, stack: error.stack });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
