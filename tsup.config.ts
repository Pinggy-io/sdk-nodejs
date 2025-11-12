import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./src/index.ts", "./src/worker/tunnel-worker.ts"],
  format: ["cjs", "esm"],
  dts: true,
  shims: true,
  skipNodeModulesBundle: true,
  clean: true,
  bundle: true,
  outDir: "dist",
});
