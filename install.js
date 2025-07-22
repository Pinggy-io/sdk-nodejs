// Import required Node.js modules for OS detection, file operations, HTTP requests, and archive handling
const os = require("os");
const path = require("path");
const fs = require("fs");
const https = require("follow-redirects").https;
const tar = require("tar");
const AdmZip = require("adm-zip");

// Detect current platform and architecture
const platform = os.platform(); // 'linux', 'win32', 'darwin'
const arch = os.arch(); // 'x64', 'arm64', etc.

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
const version = "0.0.17";

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
// const githubBase = "https://github.com/Pinggy-io/libpinggy/releases/download";
// const artifactUrl = `${githubBase}/v${version}/${artifactName}`;
const artifactUrl = `https://akashbag.a.pinggy.link/${artifactName}`;
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

// Main execution block - orchestrates the download, extraction, and cleanup process
(async () => {
  try {
    // Step 1: Download the prebuilt library archive
    console.log(
      `[Pinggy Prebuild] Downloading ${artifactName} from ${artifactUrl}...`
    );
    await download(artifactUrl, destArchivePath);

    // Step 2: Extract the library from the downloaded archive
    console.log(`[Pinggy Prebuild] Extracting ${artifactName}...`);
    await extractArchive(destArchivePath, __dirname, innerLibName, destLibPath);

    // Step 3: Clean up the downloaded archive file
    fs.unlinkSync(destArchivePath);
    console.log(`[Pinggy Prebuild] Successfully extracted ${innerLibName}`);

    // Step 4: Create a marker file to indicate successful completion
    fs.writeFileSync(path.join(__dirname, ".prebuild-step-done"), "done");
  } catch (err) {
    console.error(`Download or extraction failed: ${err.message}`);
    process.exit(1);
  }
})();
