import path from "node:path";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  outDir: "dist",
  dts: true,
  sourcemap: true,
  clean: true,
  bundle: true,
  minify: false,
  splitting: false,
  platform: "node",
  target: "node18",
  external: [],
  tsconfig: "tsconfig.json",
  alias: {
    "@": path.resolve(__dirname, "./src"),
    "@/types": path.resolve(__dirname, "./src/types"),
    "@/utils": path.resolve(__dirname, "./src/utils"),
    "@/services": path.resolve(__dirname, "./src/services"),
  },
});