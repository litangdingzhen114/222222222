const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..", "..");
const projectConfig = require("../../project.config.json");
const miniprogramRoot = path.join(root, projectConfig.miniprogramRoot || "miniprogram");
const maxUploadBytes = 2 * 1024 * 1024;

const ignoredFolders = new Set(
  ((projectConfig.packOptions && projectConfig.packOptions.ignore) || [])
    .filter((item) => item.type === "folder")
    .map((item) => item.value.replace(/^\/+|\/+$/g, "")),
);

function isIgnored(relativePath) {
  return Array.from(ignoredFolders).some((folder) => {
    return relativePath === folder || relativePath.startsWith(`${folder}/`);
  });
}

function walk(dir, prefix = "") {
  let total = 0;
  for (const name of fs.readdirSync(dir)) {
    const filePath = path.join(dir, name);
    const relativePath = prefix ? `${prefix}/${name}` : name;
    if (isIgnored(relativePath)) continue;
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      total += walk(filePath, relativePath);
    } else {
      total += stats.size;
    }
  }
  return total;
}

const uploadBytes = walk(miniprogramRoot);

assert(
  uploadBytes <= maxUploadBytes,
  `miniprogram upload source should stay under 2MB, got ${(uploadBytes / 1024).toFixed(1)}KB`,
);
assert(
  ignoredFolders.has("assets/photos"),
  "large photo assets should be loaded from https://www.hailin.store instead of bundled in the upload package",
);

console.log(`miniprogram upload source size ok: ${(uploadBytes / 1024).toFixed(1)}KB`);
