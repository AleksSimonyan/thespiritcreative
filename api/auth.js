import { createToken } from "./_lib/auth.js";

export async function POST(request) {
  try {
    const { password } = await request.json();
    const expected = process.env.ADMIN_PASSWORD || "spirit2026";

    if (password !== expected) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    return Response.json({ token: createToken() });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
