import path from "node:path";
import { readFileSync } from "node:fs";
import { defineConfig } from "tsup";

// 读取 package.json 版本号，用于编译时注入
const packageJson = JSON.parse(
  readFileSync(path.resolve(__dirname, "package.json"), "utf-8")
);

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
  define: {
    PACKAGE_VERSION: JSON.stringify(packageJson.version),
  },
});