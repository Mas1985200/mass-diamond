import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Mass Diamond — build configuration
// PWA is installable, mobile-first, responsive. No native app claims.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/*.png"],
      manifest: {
        name: "Mass Diamond",
        short_name: "MassDiamond",
        description: "One app. Every need. Anywhere in the world.",
        theme_color: "#060907",
        background_color: "#060907",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: {
        // Basic offline handling: cache the app shell, do NOT cache
        // authenticated API responses or claim full offline functionality.
        globPatterns: ["**/*.{js,css,html,svg,png}"],
        navigateFallbackDenylist: [/^\/functions\//]
      }
    })
  ],
  server: { port: 5173 }
});
