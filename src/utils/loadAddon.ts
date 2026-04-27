import path from "path";
import fs from "fs";
import os from "os";
import crypto from "crypto";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// Returns true only when dest exists and its on-disk size matches the source bytes.
// A size mismatch catches truncation (crash mid-write, AV interference, etc.).
// No second hash pass is needed: the extract directory is already keyed on the
// content hash of addon.node, so a size match in that dir is sufficient.
function sizeMatches(dest: string, data: Buffer): boolean {
  try {
    return fs.statSync(dest).size === data.length;
  } catch {
    return false;
  }
}

// Writes data to <dest>.tmp then renames it to dest.
// rename() is atomic on the same filesystem, so dest is never partially written:
// a crash before rename leaves the stale (or absent) dest intact; a crash after
// rename leaves a valid dest. The .tmp file is harmless and gets overwritten next run.
function writeAtomic(dest: string, data: Buffer): void {
  const tmp = `${dest}.tmp`;
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, dest);
}

// On Windows, addon.node is extracted by pkg to a tmp cache dir but pinggy.dll
// is not placed alongside it. Windows DLL loading searches relative to the .node
// file's own directory, so both files must live together. We extract them into a
// content-addressed temp dir (keyed on addon.node's hash) so the cost is paid
// once per unique addon version. Each file is validated by size on every run and
// rewritten atomically on mismatch.
export function loadAddon(addonAbsPath: string): unknown {
  if (process.platform === "win32" && (process as NodeJS.Process & { pkg?: unknown }).pkg) {
    const dllAbsPath = path.join(path.dirname(addonAbsPath), "pinggy.dll");
    const addonBytes = fs.readFileSync(addonAbsPath);
    const dllBytes = fs.readFileSync(dllAbsPath);
    const hash = crypto.createHash("sha256").update(addonBytes).digest("hex").slice(0, 16);
    const extractDir = path.join(os.tmpdir(), "pinggy-native", hash);
    fs.mkdirSync(extractDir, { recursive: true });
    const addonDest = path.join(extractDir, "addon.node");
    const dllDest = path.join(extractDir, "pinggy.dll");
    if (!sizeMatches(addonDest, addonBytes)) writeAtomic(addonDest, addonBytes);
    if (!sizeMatches(dllDest, dllBytes)) writeAtomic(dllDest, dllBytes);
    return require(addonDest);
  }
  return require(addonAbsPath);
}
