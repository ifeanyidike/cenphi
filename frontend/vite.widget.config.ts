import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      include: ["src/embed/**/*.ts", "src/embed/**/*.tsx"],
    }),
  ],
  define: {
    "process.env": {},
    process: { env: {} },
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/embed/testimonial-widget.tsx"),
      name: "TestimonialWidget",
      fileName: () => `testimonial-widget.umd.js`,
      formats: ["umd"],
    },
    // Remove outDir setting to use default (which will be 'dist' by default)
    rollupOptions: {
      external: ["react", "react-dom"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith(".css")) {
            return "testimonial-widget.css";
          }
          return assetInfo.name || "assets/[name]-[hash][extname]";
        },
      },
    },
    minify: "terser",
    sourcemap: true,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
