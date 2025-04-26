const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "build", "Release", "addon.node");
const dest = path.join(__dirname, "lib", "addon.node");
const libPathWin = path.join(__dirname, "pinggy.lib"); // <- path to pinggy.lib
const libPathMac = path.join(__dirname, "libpinggy.dylib"); // <- path to libpinggy.dylib
const libPathLinux = path.join(__dirname, "libpinggy.so"); // <- path to libpinggy.so

// Ensure lib folder exists
fs.mkdirSync(path.dirname(dest), { recursive: true });

// Copy addon.node if it exists
if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  console.log(`Copied addon.node to lib/`);
} else {
  console.warn(`addon.node not found at ${src}`);
}

// Remove build directory
fs.rmSync(path.join(__dirname, "build"), { recursive: true, force: true });
console.log(`Removed build/ directory`);

// Remove pinggy.lib if it exists
if (fs.existsSync(libPathWin)) {
  fs.rmSync(libPathWin);
  console.log(`Removed pinggy.lib`);
} else if (fs.existsSync(libPathMac)) {
  fs.rmSync(libPathMac);
  console.log(`Removed libpinggy.dylib`);
}
else if (fs.existsSync(libPathLinux)) {
  fs.rmSync(libPathLinux);
  console.log(`Removed libpinggy.so`);
} else {
  console.warn(`pinggy.lib / libpinggy.dylib / libpinggy.so not found`);
}
