// node-gyp calls this script since it is specified in binding.gyp in the prebuild_step action

const os = require("os");
const path = require("path");
const fs = require("fs");
const https = require("follow-redirects").https;
const zlib = require("zlib");
const tar = require("tar");
const { pipeline } = require("stream");
const { exec } = require("child_process");

const platform = os.platform(); // 'linux', 'win32', 'darwin'
const arch = os.arch(); // 'x64', 'arm64', etc.

const osMap = {
  win32: "windows",
  linux: "linux",
  darwin: "macos",
};

const archMap = {
  x64: "x86_64",
  arm64: "aarch64",
  ia32: "i686",
  arm: "armv7",
};

let mappedOS = osMap[platform];
let mappedArch = archMap[arch];

// currently we have an universal binary for mac
if (mappedOS === "macos") {
  mappedArch = "universal";
}

if (!mappedOS || !mappedArch) {
  console.error(`Unsupported platform/arch: ${platform} / ${arch}`);
  process.exit(1);
}

// correct library file per OS
const libNameMap = {
  windows: "pinggy.lib",
  linux: "libpinggy.so",
  macos: "libpinggy.dylib",
};

const fileName = libNameMap[mappedOS];
if (!fileName) {
  console.error(`Unsupported mapped platform: ${mappedOS}`);
  process.exit(1);
}

// Version to use
const version = "0.0.14";

// Build artifact filename and URL
function getArtifactInfo(os, arch) {
  let artifactName, innerLibName;
  if (os === "linux") {
    artifactName = `libpinggy-${version}-linux-${arch}.tgz`;
    innerLibName = "libpinggy.so";
  } else if (os === "windows") {
    // Default to MT, skip SSL, prefer x86_64
    artifactName = `libpinggy-${version}-windows-${arch}-MT.zip`;
    innerLibName = "pinggy.lib";
  } else if (os === "macos") {
    artifactName = `libpinggy-${version}-macos-universal.tgz`;
    innerLibName = "libpinggy.dylib";
  } else {
    return null;
  }
  return { artifactName, innerLibName };
}

const { artifactName, innerLibName } = getArtifactInfo(mappedOS, mappedArch);
if (!artifactName) {
  console.error(`Unsupported mapped platform: ${mappedOS}`);
  process.exit(1);
}

const githubBase = "https://github.com/Pinggy-io/libpinggy/releases/download";
const artifactUrl = `${githubBase}/v${version}/${artifactName}`;
const destArchivePath = path.join(__dirname, artifactName);
const destLibPath = path.join(__dirname, innerLibName);

// Download function (Promise-based)
function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          return reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
        }
        response.pipe(file);
        file.on("finish", () => file.close(resolve));
      })
      .on("error", (err) => {
        fs.unlink(dest, () => reject(err));
      });
  });
}

// Extraction logic (Promise-based, using terminal commands)
function extractArchive(archivePath, outDir, innerLibName, destLibPath) {
  return new Promise((resolve, reject) => {
    if (archivePath.endsWith(".tgz")) {
      // Use tar command
      const cmd = `tar -xzf "${archivePath}" -C "${outDir}"`;
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          return reject(new Error(`tar extraction failed: ${stderr || error.message}`));
        }
        if (!fs.existsSync(destLibPath)) {
          return reject(new Error("Library was not extracted correctly."));
        }
        resolve();
      });
    } else if (archivePath.endsWith(".zip")) {
      // Use unzip command
      const cmd = `unzip -o "${archivePath}" -d "${outDir}"`;
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          return reject(new Error(`unzip extraction failed: ${stderr || error.message}`));
        }
        if (!fs.existsSync(destLibPath)) {
          return reject(new Error("Library was not extracted correctly."));
        }
        resolve();
      });
    } else {
      reject(new Error("Unknown archive format: " + archivePath));
    }
  });
}


(async () => {
  try {
    console.log(`[Pinggy Prebuild] Downloading ${artifactName} from ${artifactUrl}...`);
    await download(artifactUrl, destArchivePath);
    console.log(`[Pinggy Prebuild] Extracting ${artifactName}...`);
    await extractArchive(destArchivePath, __dirname, innerLibName, destLibPath);
    fs.unlinkSync(destArchivePath);
    console.log(`[Pinggy Prebuild] Successfully extracted ${innerLibName}`);
    fs.writeFileSync(path.join(__dirname, "..", ".prebuild-step-done"), "done");
  } catch (err) {
    console.error(`Download or extraction failed: ${err.message}`);
    process.exit(1);
  }
})();

// To do: `${baseURL}/${mappedOS}/${mappedArch}/${fileName}`; will contain version of libpinggy as well
// check if the version is correct and if not, download the new version, md5 hash check
// postaction: remove .prebuild-step-done file
