import { mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig({ command: "serve", mode: "test" }),
  {
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      exclude: ["e2e/**", "node_modules/**"]
    }
  }
);
