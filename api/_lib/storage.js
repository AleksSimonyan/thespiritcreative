import fs from "fs";
import path from "path";
import { parseJsonResponse, parseJsonText } from "./parse.js";

const DATA_DIR = path.join(process.cwd(), "data");
const ROOT_DIR = process.cwd();

const githubConfigured = () => Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO);

const githubHeaders = () => ({
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
});

async function githubGetFileMeta(relativePath) {
  const [owner, repo] = process.env.GITHUB_REPO.split("/");
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${relativePath}`;
  const response = await fetch(url, { headers: githubHeaders() });

  if (response.status === 404) return null;
  return parseJsonResponse(response, `githubGetFileMeta ${relativePath}`);
}

async function fetchGitHubFileText(payload, relativePath) {
  if (payload.content) {
    const decoded = Buffer.from(String(payload.content).replace(/\n/g, ""), "base64").toString("utf8");
    if (decoded) return decoded;
  }

  if (payload.download_url) {
    console.info("[githubGetFile] falling back to download_url", { relativePath });
    const response = await fetch(payload.download_url, { headers: githubHeaders() });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(
        `[githubGetFile] download_url fetch failed (${response.status}) for ${relativePath}`
      );
    }
    return text;
  }

  throw new Error(`[githubGetFile] No content or download_url for ${relativePath}`);
}

async function githubGetFile(relativePath) {
  console.info("[githubGetFile] fetching", { relativePath });

  const payload = await githubGetFileMeta(relativePath);
  if (!payload) {
    console.info("[githubGetFile] file not found", { relativePath });
    return null;
  }

  let decoded;
  try {
    decoded = await fetchGitHubFileText(payload, relativePath);
  } catch (error) {
    console.error("[githubGetFile] failed to read file body", {
      relativePath,
      error: error.message,
      keys: Object.keys(payload || {}),
    });
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

async function githubPutRaw(relativePath, base64Content, sha, message) {
  const [owner, repo] = process.env.GITHUB_REPO.split("/");
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${relativePath}`;
  const body = { message, content: base64Content };
  if (sha) body.sha = sha;

  const response = await fetch(url, {
    method: "PUT",
    headers: { ...githubHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(
      `[githubPutRaw] HTTP ${response.status} — ${responseText.slice(0, 500) || "(empty body)"}`
    );
  }
}

async function githubPutFile(relativePath, content, sha) {
  const base64Content = Buffer.from(JSON.stringify(content, null, 2) + "\n").toString("base64");
  console.info("[githubPutFile] writing", {
    relativePath,
    hasSha: Boolean(sha),
    contentBytes: base64Content.length,
  });
  await githubPutRaw(relativePath, base64Content, sha, `Update ${relativePath}`);
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

async function githubGetFileBuffer(relativePath) {
  const payload = await githubGetFileMeta(relativePath);
  if (!payload) return null;

  if (payload.content) {
    return Buffer.from(String(payload.content).replace(/\n/g, ""), "base64");
  }

  if (payload.download_url) {
    const response = await fetch(payload.download_url, { headers: githubHeaders() });
    if (!response.ok) {
      throw new Error(`[readAssetBuffer] download failed (${response.status}) for ${relativePath}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  return null;
}

function localReadBuffer(relativePath) {
  const filePath = path.join(ROOT_DIR, relativePath.replace(/^\/+/, ""));
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath);
}

export async function readAssetBuffer(relativePath) {
  const normalizedPath = relativePath.replace(/^\/+/, "");

  if (githubConfigured()) {
    return githubGetFileBuffer(normalizedPath);
  }

  if (process.env.VERCEL) {
    throw new Error("Server storage is not configured.");
  }

  return localReadBuffer(normalizedPath);
}

export async function deleteAsset(relativePath) {
  const normalizedPath = relativePath.replace(/^\/+/, "");

  if (githubConfigured()) {
    const existing = await githubGetFileMeta(normalizedPath);
    if (!existing?.sha) return;
    const [owner, repo] = process.env.GITHUB_REPO.split("/");
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${normalizedPath}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: { ...githubHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Remove ${normalizedPath}`,
        sha: existing.sha,
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`[deleteAsset] HTTP ${response.status} — ${text.slice(0, 200)}`);
    }
    return;
  }

  const filePath = path.join(ROOT_DIR, normalizedPath);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

export async function writeAsset(relativePath, buffer) {
  const normalizedPath = relativePath.replace(/^\/+/, "");
  console.info("[writeAsset] start", {
    relativePath: normalizedPath,
    bytes: buffer.length,
    githubConfigured: githubConfigured(),
  });

  if (githubConfigured()) {
    const existing = await githubGetFileMeta(normalizedPath);
    await githubPutRaw(
      normalizedPath,
      buffer.toString("base64"),
      existing?.sha,
      `Upload ${normalizedPath}`
    );
    const [owner, repo] = process.env.GITHUB_REPO.split("/");
    const branch = process.env.GITHUB_BRANCH || "main";
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${normalizedPath}`;
  }

  if (process.env.VERCEL) {
    throw new Error(
      "Server storage is not configured. Add GITHUB_TOKEN and GITHUB_REPO to your Vercel project environment variables."
    );
  }

  const filePath = path.join(ROOT_DIR, normalizedPath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buffer);
  return `/${normalizedPath}`;
}
