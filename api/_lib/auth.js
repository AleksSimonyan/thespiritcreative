import crypto from "crypto";

const getSecret = () => process.env.ADMIN_PASSWORD || "spirit2026";

export function createToken() {
  const exp = Date.now() + 24 * 60 * 60 * 1000;
  const sig = crypto.createHmac("sha256", getSecret()).update(String(exp)).digest("hex");
  return Buffer.from(JSON.stringify({ exp, sig })).toString("base64url");
}

export function verifyToken(header) {
  if (!header?.startsWith("Bearer ")) return false;

  try {
    const token = header.slice(7);
    const { exp, sig } = JSON.parse(Buffer.from(token, "base64url").toString());
    if (Date.now() > exp) return false;
    const expected = crypto.createHmac("sha256", getSecret()).update(String(exp)).digest("hex");
    return sig === expected;
  } catch {
    return false;
  }
}
