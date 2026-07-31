import fs from "fs";
import path from "path";
import { parseJsonResponse, parseJsonText } from "./parse.js";

const DATA_DIR = path.join(process.cwd(), "data");

const githubConfigured = () => Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO);

const githubHeaders = () => ({
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
});

async function githubGetFile(relativePath) {
  const [owner, repo] = process.env.GITHUB_REPO.split("/");
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${relativePath}`;
  console.info("[githubGetFile] fetching", { relativePath, owner, repo });

  const response = await fetch(url, { headers: githubHeaders() });

  if (response.status === 404) {
    console.info("[githubGetFile] file not found", { relativePath });
    return null;
  }

  const context = `githubGetFile response ${relativePath}`;
  let payload;
  try {
    payload = await parseJsonResponse(response, context);
  } catch (error) {
    console.error("[githubGetFile] failed to parse GitHub API response", {
      relativePath,
      status: response.status,
      error: error.message,
    });
    throw error;
  }

  if (!payload?.content) {
    const error = new Error(`[githubGetFile] Missing content field for ${relativePath}`);
    console.error(error.message, { relativePath, keys: Object.keys(payload || {}) });
    throw error;
  }

  let decoded;
  try {
    decoded = Buffer.from(payload.content, "base64").toString("utf8");
  } catch (error) {
    console.error("[githubGetFile] base64 decode failed", { relativePath, error: error.message });
    throw error;
  }

  let content;
  try {
    content = parseJsonText(decoded, `githubGetFile file content ${relativePath}`);
  } catch (error) {
    console.error("[githubGetFile] failed to parse file JSON", {
      relativePath,
      decodedLength: decoded.length,
      decodedPreview: decoded.slice(0, 200),
      error: error.message,
    });
    throw error;
  }

  return { content, sha: payload.sha };
}

async function githubPutFile(relativePath, content, sha) {
  const [owner, repo] = process.env.GITHUB_REPO.split("/");
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${relativePath}`;
  const body = {
    message: `Update ${relativePath}`,
    content: Buffer.from(JSON.stringify(content, null, 2) + "\n").toString("base64"),
  };

  if (sha) body.sha = sha;

  console.info("[githubPutFile] writing", {
    relativePath,
    hasSha: Boolean(sha),
    contentBytes: body.content.length,
  });

  const response = await fetch(url, {
    method: "PUT",
    headers: { ...githubHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const responseText = await response.text();

  if (!response.ok) {
    const error = new Error(
      `[githubPutFile] HTTP ${response.status} — ${responseText.slice(0, 500) || "(empty body)"}`
    );
    console.error(error.message, {
      relativePath,
      status: response.status,
      responseLength: responseText.length,
      responsePreview: responseText.slice(0, 500),
    });
    throw error;
  }

  if (responseText) {
    try {
      parseJsonText(responseText, `githubPutFile success response ${relativePath}`);
    } catch (error) {
      console.error("[githubPutFile] success response was not valid JSON", {
        relativePath,
        responseLength: responseText.length,
        responsePreview: responseText.slice(0, 500),
        error: error.message,
      });
      throw error;
    }
  } else {
    console.warn("[githubPutFile] success response had empty body", { relativePath, status: response.status });
  }
}

function localRead(fileName) {
  const filePath = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  return parseJsonText(raw, `localRead ${fileName}`);
}

function localWrite(fileName, content) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, fileName), JSON.stringify(content, null, 2) + "\n");
}

export async function readData(fileName) {
  if (githubConfigured()) {
    const githubFile = await githubGetFile(`data/${fileName}`);
    if (githubFile?.content) return githubFile.content;
  }

  return localRead(fileName);
}

export async function writeData(fileName, content) {
  console.info("[writeData] start", {
    fileName,
    githubConfigured: githubConfigured(),
    vercel: Boolean(process.env.VERCEL),
  });

  if (githubConfigured()) {
    try {
      const existing = await githubGetFile(`data/${fileName}`);
      await githubPutFile(`data/${fileName}`, content, existing?.sha);
      console.info("[writeData] GitHub write complete", { fileName });
      return;
    } catch (error) {
      console.error("[writeData] GitHub write failed", { fileName, error: error.message, stack: error.stack });
      throw error;
    }
  }

  if (process.env.VERCEL) {
    throw new Error(
      "Server storage is not configured. Add GITHUB_TOKEN and GITHUB_REPO to your Vercel project environment variables."
    );
  }

  localWrite(fileName, content);
}
