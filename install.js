const os = require("os");
const path = require("path");
const fs = require("fs");
const https = require("https");

const platform = os.platform(); // 'linux', 'win32', 'darwin'
const arch = os.arch(); // 'x64', 'arm64', etc.

// Map to your custom directory names
const osMap = {
  win32: "windows",
  linux: "linux",
  darwin: "mac",
};

const archMap = {
  x64: "x86_64",
  arm64: "aarch64",
  ia32: "i686",
  arm: "armv7",
};

// Resolve custom mapped names
const mappedOS = osMap[platform];
const mappedArch = archMap[arch];

if (!mappedOS || !mappedArch) {
  console.error(`Unsupported platform/arch: ${platform} / ${arch}`);
  process.exit(1);
}

// Map to correct library file per OS
const libNameMap = {
  windows: "pinggy.lib",
  linux: "libpinggy.so",
  mac: "libpinggy.dylib",
};

const fileName = libNameMap[mappedOS];
if (!fileName) {
  console.error(`Unsupported mapped platform: ${mappedOS}`);
  process.exit(1);
}

// Construct URL
const baseURL = "https://akashbag.a.pinggy.link";
const url = `${baseURL}/${mappedOS}/${mappedArch}/${fileName}`;
const destPath = path.join(__dirname, fileName);

// Download function
function download(url, dest, cb) {
  const file = fs.createWriteStream(dest);
  https
    .get(url, (response) => {
      if (response.statusCode !== 200) {
        return cb(new Error(`Failed to get '${url}' (${response.statusCode})`));
      }

      response.pipe(file);
      file.on("finish", () => file.close(cb));
    })
    .on("error", (err) => {
      fs.unlink(dest, () => cb(err));
    });
}

// Skip if already exists
if (fs.existsSync(destPath)) {
  console.log(
    `[Pinggy Prebuild] ${fileName} already exists, skipping download.`
  );
  process.exit(0);
}

console.log(`[Pinggy Prebuild] Downloading ${fileName} from ${url}...`);
download(url, destPath, (err) => {
  if (err) {
    console.error(`Download failed: ${err.message}`);
    process.exit(1);
  }
  console.log(`[Pinggy Prebuild] Successfully downloaded ${fileName}`);
  fs.writeFileSync(path.join(__dirname, "..", ".prebuild-step-done"), "done");
});
