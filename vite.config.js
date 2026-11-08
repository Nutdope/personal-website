import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // If you deploy under a sub-path (e.g. https://user.github.io/repo/),
  // set `base: "/repo/"` here. BASE_URL is picked up automatically by
  // src/config.js and by the router.
});
