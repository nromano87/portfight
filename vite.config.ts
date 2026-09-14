import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.GITHUB_PAGES ? "/portfight/" : "/",
  server: {
    port: 5173,
    host: true,
  },
});
