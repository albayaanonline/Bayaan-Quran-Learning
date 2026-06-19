import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

const rawPort = process.env.PORT;
const port = Number(rawPort || "5173");
if (Number.isNaN(port) || port <= 0) {
  console.warn(`[vite] Invalid PORT value "${rawPort}", defaulting to 5173`);
}

const basePath = process.env.BASE_PATH || "/";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["favicon.svg", "logo.svg"],
      manifest: {
        name: "Al Bayaan AI Quran",
        short_name: "Al Bayaan",
        description: "AI-powered Quran learning with Tajweed coaching, Hifdh tracking, and personalized guidance",
        theme_color: "#047857",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        start_url: basePath || "/",
        scope: basePath || "/",
        lang: "en",
        categories: ["education", "religion"],
        icons: [
          { src: "favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" },
          { src: "logo.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
        ],
        shortcuts: [
          { name: "Learn Quran", short_name: "Learn", description: "Browse and practice surahs", url: `${basePath || ""}/learn`, icons: [{ src: "favicon.svg", sizes: "any" }] },
          { name: "AI Teacher", short_name: "Teacher", description: "Chat with AI Quran teacher", url: `${basePath || ""}/teacher`, icons: [{ src: "favicon.svg", sizes: "any" }] },
          { name: "Voice Teacher", short_name: "Voice", description: "Speak with AI voice teacher", url: `${basePath || ""}/voice-teacher`, icons: [{ src: "favicon.svg", sizes: "any" }] },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^\/api\/surahs/,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "api-surahs", expiration: { maxAgeSeconds: 60 * 60 * 24 } },
          },
          {
            urlPattern: /^\/api\/progress/,
            handler: "NetworkFirst",
            options: { cacheName: "api-progress", expiration: { maxAgeSeconds: 60 * 5 } },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
