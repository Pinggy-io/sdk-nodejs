const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "build", "Release", "addon.node");
const dest = path.join(__dirname, "lib", "addon.node");
const libPath = path.join(__dirname, "pinggy.lib"); // <- path to pinggy.lib

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
// if (fs.existsSync(libPath)) {
//   fs.rmSync(libPath);
//   console.log(`Removed pinggy.lib`);
// } else {
//   console.warn(`pinggy.lib not found in root directory`);
// }
