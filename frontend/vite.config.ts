import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   optimizeDeps: {
//     exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"],
//   },
//   resolve: {
//     alias: {
//       "@": path.resolve(__dirname, "./src"),
//     },
//   },
//   server: {
//     host: true,
//     port: 3000, // This is the port which we will use in docker
//     // Thanks @sergiomoura for the window fix
//     // add the next lines if you're using windows and hot reload doesn't work
//     watch: {
//       usePolling: true,
//     },
//     headers: {
//       "Cross-Origin-Opener-Policy": "same-origin",
//       "Cross-Origin-Embedder-Policy": "require-corp",
//     },
//   },
// });

export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";

  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      // Remove outDir setting to use default
      sourcemap: true,
      rollupOptions: {
        external: ["react", "react-dom"],
      },
    },
    server: {
      host: true,
      port: 3000, // This is the port which we will use in Docker
      watch: {
        usePolling: true,
      },
      headers: isProduction
        ? {
            "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Embedder-Policy": "require-corp",
          }
        : {},
    },
  };
});
