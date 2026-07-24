import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

function normalizeBasePath(raw: string | undefined): string {
  if (!raw || raw === "/") return "/";
  return `/${raw.replace(/^\/+|\/+$/g, "")}/`;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const base = normalizeBasePath(env.BASE_PATH);

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        strategies: "injectManifest",
        srcDir: "src",
        filename: "sw.ts",
        registerType: "prompt",
        injectRegister: false,
        manifest: {
          id: base,
          lang: "en-SG",
          name: "Return to Me: The School Years",
          short_name: "Return to Me",
          description: "A reflective visual novel about the school years before Nurul.",
          theme_color: "#101728",
          background_color: "#090d18",
          display: "standalone",
          orientation: "any",
          scope: base,
          start_url: base,
          icons: [
            {
              src: "icons/favicon.svg",
              sizes: "any",
              type: "image/svg+xml",
              purpose: "any"
            },
            {
              src: "icons/icon-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any"
            },
            {
              src: "icons/icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any"
            },
            {
              src: "icons/icon-maskable-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable"
            }
          ]
        },
        injectManifest: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,json,woff2}"],
          globIgnores: ["**/voices/**"],
          maximumFileSizeToCacheInBytes: 8 * 1024 * 1024
        },
        devOptions: {
          enabled: false,
          type: "module"
        }
      })
    ],
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      css: true,
      coverage: {
        reporter: ["text", "html"]
      }
    }
  };
});
