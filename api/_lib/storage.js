import fs from "fs";
import path from "path";

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
  const response = await fetch(url, { headers: githubHeaders() });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`GitHub read failed (${response.status})`);
  }

  const payload = await response.json();
  return {
    content: JSON.parse(Buffer.from(payload.content, "base64").toString("utf8")),
    sha: payload.sha,
  };
}

async function githubPutFile(relativePath, content, sha) {
  const [owner, repo] = process.env.GITHUB_REPO.split("/");
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${relativePath}`;
  const body = {
    message: `Update ${relativePath}`,
    content: Buffer.from(JSON.stringify(content, null, 2) + "\n").toString("base64"),
  };

  if (sha) body.sha = sha;

  const response = await fetch(url, {
    method: "PUT",
    headers: { ...githubHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GitHub write failed (${response.status}): ${detail}`);
  }
}

function localRead(fileName) {
  const filePath = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
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
  if (githubConfigured()) {
    const existing = await githubGetFile(`data/${fileName}`);
    await githubPutFile(`data/${fileName}`, content, existing?.sha);
    return;
  }

  if (process.env.VERCEL) {
    throw new Error(
      "Server storage is not configured. Add GITHUB_TOKEN and GITHUB_REPO to your Vercel project environment variables."
    );
  }

  localWrite(fileName, content);
}
