// Import required Node.js modules for OS detection, file operations, HTTP requests, and archive handling
const os = require("os");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const https = require("follow-redirects").https;
const tar = require("tar");
const AdmZip = require("adm-zip");

// Detect current platform
const platform = os.platform(); // 'linux', 'win32', 'darwin'

// Detect the host architecture, ignoring the architecture Node was built for.

function detectHostArch() {
  try {
    if (platform === "win32") {
      // Read PROCESSOR_ARCHITECTURE from the system environment via the registry.
      const out = execSync(
        'reg query "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment" /v PROCESSOR_ARCHITECTURE',
        { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
      );
      const m = out.match(/PROCESSOR_ARCHITECTURE\s+REG_SZ\s+(\S+)/i);
      if (m) {
        const v = m[1].toUpperCase();
        if (v === "ARM64") return "arm64";
        if (v === "AMD64") return "x64";
        if (v === "X86") return "ia32";
      }
    } else if (platform === "darwin") {
      // sysctl.proc_translated === "1" means we are an x86_64 process under Rosetta
      // on an Apple Silicon host.
      const translated = execSync("sysctl -n sysctl.proc_translated", {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
      if (translated === "1") return "arm64";
    } else if (platform === "linux") {
      const m = execSync("uname -m", { encoding: "utf8" }).trim();
      if (m === "aarch64" || m === "arm64") return "arm64";
      if (m === "x86_64" || m === "amd64") return "x64";
      if (m === "i686" || m === "i386") return "ia32";
      if (m.startsWith("armv")) return "arm";
    }
  } catch (_) {
    // Detection commands can fail in locked-down environments; fall back below.
  }
  return os.arch();
}

const arch = detectHostArch();

// Map Node.js platform names to our naming convention
const osMap = {
  win32: "windows",
  linux: "linux",
  darwin: "macos",
};

// Map Node.js architecture names to our naming convention
const archMap = {
  x64: "x86_64",
  arm64: "aarch64",
  ia32: "i686",
  arm: "armv7",
};

// Apply platform and architecture mappings
let mappedOS = osMap[platform];
let mappedArch = archMap[arch];

// Special case: use universal binary for macOS
if (mappedOS === "macos") {
  mappedArch = "universal";
}

// Validate that we support this platform/architecture combination
if (!mappedOS || !mappedArch) {
  console.error(`Unsupported platform/arch: ${platform} / ${arch}`);
  process.exit(1);
}

// Define the correct library filename for each operating system
const libNameMap = {
  windows: "pinggy.lib",
  linux: "libpinggy.so",
  macos: "libpinggy.dylib",
};

// Get the library filename for the current OS
const fileName = libNameMap[mappedOS];
if (!fileName) {
  console.error(`Unsupported mapped platform: ${mappedOS}`);
  process.exit(1);
}

// Define the version of libpinggy to download
const version = "0.3.1";

// Build artifact filename and URL based on OS and architecture
function getArtifactInfo(os, arch) {
  let artifactName, innerLibName;
  if (os === "linux") {
    artifactName = `libpinggy-${version}-linux-${arch}.tgz`;
    innerLibName = "libpinggy.so";
  } else if (os === "windows") {
    artifactName = `libpinggy-${version}-windows-${arch}-MT.zip`;
    innerLibName = "pinggy.lib";
  } else if (os === "macos") {
    artifactName = `libpinggy-${version}-ssl-macos-universal.tgz`;
    innerLibName = "libpinggy.dylib";
  } else {
    return null;
  }
  return { artifactName, innerLibName };
}

// Get artifact information for the current platform
const { artifactName, innerLibName } = getArtifactInfo(mappedOS, mappedArch);
if (!artifactName) {
  console.error(`Unsupported mapped platform: ${mappedOS}`);
  process.exit(1);
}

// Construct download URL and file paths
const githubBase = "https://github.com/Pinggy-io/libpinggy/releases/download";
const artifactUrl = `${githubBase}/v${version}/${artifactName}`;
const destArchivePath = path.join(__dirname, artifactName);
const destLibPath = path.join(__dirname, innerLibName);

// Download function - handles HTTPS download with proper error handling
function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          return reject(
            new Error(`Failed to get '${url}' (${response.statusCode})`)
          );
        }
        response.pipe(file);
        file.on("finish", () => file.close(resolve));
      })
      .on("error", (err) => {
        fs.unlink(dest, () => reject(err));
      });
  });
}

// Archive extraction function - handles both .tgz and .zip formats
function extractArchive(archivePath, outDir, innerLibName, destLibPath) {
  return new Promise((resolve, reject) => {
    if (archivePath.endsWith(".tgz")) {
      tar
        .x({
          file: archivePath,
          cwd: outDir,
          strict: true,
        })
        .then(() => {
          if (!fs.existsSync(destLibPath)) {
            return reject(new Error("Library was not extracted correctly."));
          }
          resolve();
        })
        .catch((err) =>
          reject(new Error(`tar extraction failed: ${err.message}`))
        );
    } else if (archivePath.endsWith(".zip")) {
      try {
        const zip = new AdmZip(archivePath);
        zip.extractAllTo(outDir, true);
        if (!fs.existsSync(destLibPath)) {
          return reject(new Error("Library was not extracted correctly."));
        }
        resolve();
      } catch (err) {
        reject(new Error(`zip extraction failed: ${err.message}`));
      }
    } else {
      reject(new Error("Unknown archive format: " + archivePath));
    }
  });
}

// If LIBPINGGY_PATH is set, resolve it to the library source on disk.
// Accepts: a directory containing innerLibName, an archive (.tgz/.zip), or a direct path to the lib file.
async function useLocalLibpinggy(localPath) {
  if (!fs.existsSync(localPath)) {
    throw new Error(`LIBPINGGY_PATH does not exist: ${localPath}`);
  }
  const stat = fs.statSync(localPath);

  if (stat.isDirectory()) {
    const sourceLib = path.join(localPath, innerLibName);
    if (!fs.existsSync(sourceLib)) {
      throw new Error(
        `LIBPINGGY_PATH directory does not contain ${innerLibName}: ${localPath}`
      );
    }
    fs.copyFileSync(sourceLib, destLibPath);
    console.log(`[Pinggy Prebuild] Copied ${innerLibName} from ${localPath}`);
    return;
  }

  if (localPath.endsWith(".tgz") || localPath.endsWith(".zip")) {
    console.log(`[Pinggy Prebuild] Extracting local archive ${localPath}...`);
    await extractArchive(localPath, __dirname, innerLibName, destLibPath);
    return;
  }

  fs.copyFileSync(localPath, destLibPath);
  console.log(`[Pinggy Prebuild] Copied library file from ${localPath}`);
}

// Main execution block - orchestrates the download, extraction, and cleanup process
(async () => {
  try {
    const localLibPath = process.env.LIBPINGGY_PATH;

    if (localLibPath) {
      console.log(
        `[Pinggy Prebuild] LIBPINGGY_PATH is set, using local source: ${localLibPath}`
      );
      await useLocalLibpinggy(localLibPath);
    } else {
      // Step 1: Download the prebuilt library archive
      console.log(
        `[Pinggy Prebuild] Downloading ${artifactName} from ${artifactUrl}...`
      );
      await download(artifactUrl, destArchivePath);

      // Step 2: Extract the library from the downloaded archive
      console.log(`[Pinggy Prebuild] Extracting ${artifactName}...`);
      await extractArchive(
        destArchivePath,
        __dirname,
        innerLibName,
        destLibPath
      );

      // Step 3: Clean up the downloaded archive file
      fs.unlinkSync(destArchivePath);
    }

    if (!fs.existsSync(destLibPath)) {
      throw new Error(`Library was not placed at ${destLibPath}`);
    }
    console.log(`[Pinggy Prebuild] Successfully prepared ${innerLibName}`);

    // Step 4: Create a marker file to indicate successful completion
    fs.writeFileSync(path.join(__dirname, ".prebuild-step-done"), "done");
  } catch (err) {
    console.error(`Download or extraction failed: ${err.message}`);
    process.exit(1);
  }
})();
