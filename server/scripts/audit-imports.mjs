// Audit script: verify every relative .js import matches the physical file casing.
// On Windows (case-insensitive FS) Node resolves mismatches silently; on Linux/Vercel they crash.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const importRe = /from\s+["'](\.[^"']+\.js)["']/g;

const mismatches = [];
const visited = new Set();

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".js")) checkFile(full);
  }
}

function checkFile(file) {
  if (visited.has(file)) return;
  visited.add(file);
  const src = fs.readFileSync(file, "utf8");
  const dir = path.dirname(file);
  let m;
  importRe.lastIndex = 0;
  while ((m = importRe.exec(src)) !== null) {
    const resolved = path.resolve(dir, m[1]);
    // Node resolves case-insensitively on Windows — compare actual directory
    // listing instead of fs.existsSync to detect case drift.
    const targetDir = path.dirname(resolved);
    const wanted = path.basename(resolved);
    let actualNames = [];
    try { actualNames = fs.readdirSync(targetDir); } catch { /* dir missing */ }
    if (actualNames.length > 0 && !actualNames.includes(wanted)) {
      const match = actualNames.find((n) => n.toLowerCase() === wanted.toLowerCase());
      mismatches.push({
        file: path.relative(serverRoot, file),
        import: m[1],
        onDisk: match || "(missing)",
      });
    } else if (actualNames.length === 0 && !fs.existsSync(resolved)) {
      mismatches.push({
        file: path.relative(serverRoot, file),
        import: m[1],
        onDisk: "(directory missing)",
      });
    }
  }
}

walk(serverRoot);

if (mismatches.length === 0) {
  console.log("AUDIT PASS: all relative .js imports match physical file casing.");
} else {
  console.log(`AUDIT FAIL: ${mismatches.length} case mismatch(es):`);
  for (const mm of mismatches) {
    console.log(`  ${mm.file}  imports '${mm.import}'  ->  on disk: ${mm.onDisk}`);
  }
  process.exitCode = 1;
}
