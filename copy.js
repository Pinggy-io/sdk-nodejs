const fs = require("fs");
const path = require("path");

const srcAddon = path.join(__dirname, "build", "Release", "addon.node");
const destAddon = path.join(__dirname, "lib", "addon.node");

// Determine the correct native library name based on OS
let nativeLibName;
switch (process.platform) {
  case "win32":
    nativeLibName = "pinggy.lib";
    break;
  case "darwin":
    nativeLibName = "libpinggy.dylib";
    break;
  case "linux":
  default:
    nativeLibName = "libpinggy.so";
    break;
}

const srcLib = path.join(__dirname, nativeLibName);
const destLib = path.join(__dirname, "lib", nativeLibName);

// For Windows, also handle the DLL file
let srcDll, destDll;
if (process.platform === "win32") {
  srcDll = path.join(__dirname, "pinggy.dll");
  destDll = path.join(__dirname, "lib", "pinggy.dll");
}

// Ensure lib folder exists
fs.mkdirSync(path.dirname(destAddon), { recursive: true });

// Copy addon.node if it exists
if (fs.existsSync(srcAddon)) {
  fs.copyFileSync(srcAddon, destAddon);
  console.log(`Copied addon.node to lib/`);
} else {
  console.warn(`addon.node not found at ${srcAddon}`);
}

// Copy the native library (.so/.lib/.dll/.dylib) if it exists
if (fs.existsSync(srcLib)) {
  fs.copyFileSync(srcLib, destLib);
  console.log(`Copied ${nativeLibName} to lib/`);
} else {
  console.warn(`${nativeLibName} not found at ${srcLib}`);
}

// For Windows, copy the DLL file if it exists
if (process.platform === "win32" && fs.existsSync(srcDll)) {
  fs.copyFileSync(srcDll, destDll);
  console.log(`Copied pinggy.dll to lib/`);
} else if (process.platform === "win32") {
  console.warn(`pinggy.dll not found at ${srcDll}`);
}

// Remove build directory
fs.rmSync(path.join(__dirname, "build"), { recursive: true, force: true });
console.log(`Removed build/ directory`);
