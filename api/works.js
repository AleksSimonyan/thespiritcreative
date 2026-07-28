import { verifyToken } from "./_lib/auth.js";
import { readData, writeData } from "./_lib/storage.js";

const emptyPayload = () => ({
  version: 2,
  updatedAt: new Date().toISOString(),
  works: [],
});

export async function GET() {
  try {
    const data = (await readData("works.json")) || emptyPayload();
    return Response.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  if (!verifyToken(request.headers.get("authorization"))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!Array.isArray(body.works)) {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }

    const payload = {
      version: 2,
      updatedAt: new Date().toISOString(),
      works: body.works,
    };

    await writeData("works.json", payload);
    return Response.json(payload);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
