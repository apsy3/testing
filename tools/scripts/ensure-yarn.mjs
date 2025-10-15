#!/usr/bin/env node
import fs from "node:fs";
import { pipeline } from "node:stream";
import { promisify } from "node:util";
import https from "node:https";
import path from "node:path";
import { execFile, execFileSync } from "node:child_process";

const PIPELINE = promisify(pipeline);
const execFileAsync = promisify(execFile);
const RELEASE_URL = "https://github.com/yarnpkg/berry/releases/download/@yarnpkg/cli/4.4.1/yarn-4.4.1.cjs";
const RELATIVE_PATH = ".yarn/releases/yarn-4.4.1.cjs";
const MIN_SIZE_BYTES = 1_000_000;

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function fileSize(filePath) {
  try {
    const stat = fs.statSync(filePath);
    return stat.size;
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return 0;
    }
    throw error;
  }
}

function hasCurl() {
  try {
    execFileSync("curl", ["--version"], { stdio: "ignore" });
    return true;
  } catch (error) {
    return false;
  }
}

function downloadWithNode(url, destination) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.destroy();
        resolve(downloadWithNode(response.headers.location, destination));
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Unexpected response ${response.statusCode} when downloading Yarn from ${url}`));
        return;
      }
      const fileStream = fs.createWriteStream(destination);
      PIPELINE(response, fileStream).then(resolve).catch(reject);
    });
    request.on("error", reject);
  });
}

async function downloadWithCurl(url, destination) {
  await execFileAsync("curl", ["-fL", "-o", destination, url], { stdio: "inherit" });
}

async function download(url, destination) {
  try {
    await downloadWithNode(url, destination);
    return;
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    if (!hasCurl()) {
      throw new Error(`${message}. Install Yarn manually or provide curl for fallback.`);
    }
    console.warn(`Falling back to curl for Yarn download (${message}).`);
    await downloadWithCurl(url, destination);
  }
}

async function main() {
  const yarnPath = path.resolve(RELATIVE_PATH);
  const currentSize = fileSize(yarnPath);
  if (currentSize >= MIN_SIZE_BYTES) {
    return;
  }

  if (process.env.NO_NETWORK === "1") {
    console.error(`Vendored Yarn CLI missing at ${RELATIVE_PATH}.`);
    console.error("Offline mode detected (NO_NETWORK=1). Please download the standalone release manually and commit it to the repo.");
    process.exit(1);
  }

  console.log(`Downloading Yarn CLI 4.4.1 to ${RELATIVE_PATH}...`);
  ensureDir(yarnPath);
  try {
    await download(RELEASE_URL, yarnPath);
  } catch (error) {
    console.error(`Failed to download Yarn CLI: ${error.message}`);
    console.error("Download Yarn manually with:\n  curl -fL -o .yarn/releases/yarn-4.4.1.cjs \"" + RELEASE_URL + "\"");
    process.exit(1);
  }

  const finalSize = fileSize(yarnPath);
  if (finalSize < MIN_SIZE_BYTES) {
    console.error(`Downloaded Yarn CLI appears to be truncated (${finalSize} bytes).`);
    process.exit(1);
  }

  fs.chmodSync(yarnPath, 0o755);
  console.log("Yarn CLI ready.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
