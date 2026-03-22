import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      injectRegister: false,
      registerType: "autoUpdate",
      manifest: {
        name: "Engineering Knowledge Vault",
        short_name: "Knowledge Vault",
        description: "A local-first engineering knowledge system for report language, materials, features, and review.",
        theme_color: "#1f2937",
        background_color: "#f5f5f4",
        display: "standalone",
        start_url: "/"
      },
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/__/, /\/[^/?]+\.[^/]+$/],
        globPatterns: ["**/*.{js,css,html,png,svg,webp}"],
        globIgnores: ["**/*debug*.js", "**/*debug*.wasm"],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "image-assets",
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          }
        ]
      }
    })
  ]
});
