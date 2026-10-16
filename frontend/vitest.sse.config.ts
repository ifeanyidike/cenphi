import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Separate from the app's Vite config: no Firebase initialization or live I/O.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  define: {
    "import.meta.env.VITE_API_URL": JSON.stringify("https://api.example.test"),
  },
  test: {
    environment: "jsdom",
    include: ["src/hooks/sse/*.test.{ts,tsx}"],
    setupFiles: ["./src/hooks/sse/testSetup.ts"],
    restoreMocks: true,
  },
});
