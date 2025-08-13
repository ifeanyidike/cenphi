// vite.widget.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { readFileSync } from "fs";

// Create a plugin to properly handle and inject CSS and fonts
function cssAndFontInjectionPlugin() {
  return {
    name: "css-and-font-injection",
    generateBundle(options, bundle) {
      // Find the main JS chunk
      const mainChunk = Object.values(bundle).find(
        //@ts-expect-error no ts error
        (chunk) => chunk.type === "chunk" && chunk.isEntry
      );

      if (mainChunk) {
        // Read the CSS file
        const cssPath = path.resolve(
          __dirname,
          "src/components/capture-widget/styles/capture-widget.css"
        );
        const cssContent = readFileSync(cssPath, "utf-8");

        // Create a function to inject CSS and fonts when the widget loads
        const cssInjectionCode = `
        (function() {
          // Check if our styles are already injected
          if (!document.getElementById('testimonial-widget-styles')) {
            // Create and inject main widget styles
            var style = document.createElement('style');
            style.setAttribute('id', 'testimonial-widget-styles');
            
            // Add Google Fonts import at the top of the CSS
            var cssWithFonts = '@import url("https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Manrope:wght@200..800&family=Outfit:wght@100..900&family=Playball&family=Urbanist:ital,wght@0,100..900;1,100..900&display=swap");\\n' + ${JSON.stringify(cssContent)};
            
            style.textContent = cssWithFonts;
            document.head.appendChild(style);
          }
          
          // Inject additional font-specific styles with high specificity
          if (!document.getElementById('testimonial-widget-font-vars')) {
            var fontVarsStyle = document.createElement('style');
            fontVarsStyle.setAttribute('id', 'testimonial-widget-font-vars');
            fontVarsStyle.textContent = \`
              :root {
                --tw-font-sans: 'DM Sans', 'Outfit', 'Urbanist', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              }
              
              /* Increase specificity to ensure our font settings apply */
              #capture-widget-root, 
              #capture-widget-root .tw-widget * {
                font-family: var(--tw-font-sans) !important;
              }
              
              /* Additional direct style for elements to ensure fonts apply */
              .tw-widget,
              .tw-widget *,
              .tw-button,
              .tw-modal,
              .tw-header,
              .tw-content,
              .tw-footer,
              .tw-label,
              .tw-input,
              .tw-textarea,
              .tw-btn,
              .tw-method-title,
              .tw-method-desc,
              .tw-checkbox-label,
              .tw-question {
                font-family: 'DM Sans', 'Outfit', 'Urbanist', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
              }
            \`;
            document.head.appendChild(fontVarsStyle);
          }
        })();
        `;

        // Add injection code at the beginning of the main chunk
        //@ts-expect-error no error here
        mainChunk.code = cssInjectionCode + mainChunk.code;
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    cssAndFontInjectionPlugin(), // Add our improved CSS and font injection plugin
  ],

  // Define global constants - this fixes the "process is not defined" error
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    "process.env": JSON.stringify({}),
    process: JSON.stringify({}),
  },

  // Define the widget as the entry point
  build: {
    // Set the entry point to your widget's main file
    lib: {
      entry: path.resolve(__dirname, "src/components/capture-widget/index.tsx"),
      name: "TestimonialWidget",
      // Create a file named widget.js
      fileName: () => "cenphi-widget.js",
      formats: ["umd"],
    },
    outDir: "dist/public",
    emptyOutDir: false, // Don't delete other files in the output directory

    // Optimize the build
    minify: "terser",
    sourcemap: false,

    rollupOptions: {
      // Include React in the bundle - don't list any externals
      external: [],
      output: {
        // Ensure styles are inlined
        inlineDynamicImports: true,
      },
    },

    // This is important to ensure CSS is correctly handled
    cssCodeSplit: false,
    assetsInlineLimit: 100000000, // Inline all assets
  },
});
