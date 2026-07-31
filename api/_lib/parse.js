export function parseJsonText(text, context) {
  const preview = typeof text === "string" ? text.slice(0, 500) : String(text);
  const length = typeof text === "string" ? text.length : 0;

  if (text == null || text === "") {
    const error = new Error(`[${context}] Empty response body (length=${length})`);
    console.error(error.message, { context, length, preview });
    throw error;
  }

  try {
    return JSON.parse(text);
  } catch (cause) {
    const error = new Error(`[${context}] JSON.parse failed: ${cause.message}`);
    error.cause = cause;
    console.error(error.message, { context, length, preview });
    throw error;
  }
}

export async function parseJsonResponse(response, context) {
  const text = await response.text();
  if (!response.ok) {
    const error = new Error(
      `[${context}] HTTP ${response.status} ${response.statusText} — body: ${text.slice(0, 500) || "(empty)"}`
    );
    console.error(error.message, { context, status: response.status, length: text.length });
    throw error;
  }
  return parseJsonText(text, context);
}
