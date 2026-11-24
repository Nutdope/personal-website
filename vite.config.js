import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import modelFolders from "./vite-plugin-model-folders.js";

// https://vite.dev/config/
export default defineConfig({
  // modelFolders() lists the STL files in each public/assets/models/<folder>/
  // so assemblies can use { type: "stl-folder", folder: "<folder>" }.
  plugins: [react(), modelFolders()],
  build: {
    // three.js is big; it lives in its own lazy chunk (the SolidWorks viewer).
    chunkSizeWarningLimit: 900,
  },
  // If you deploy under a sub-path (e.g. https://user.github.io/repo/),
  // set `base: "/repo/"` here. BASE_URL is picked up automatically by
  // src/config.js and by the router.
});
