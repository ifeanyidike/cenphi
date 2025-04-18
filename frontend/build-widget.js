// build-widget.js
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create widget build directory if it doesn't exist
const widgetDir = path.join(__dirname, "public", "widget");
if (!fs.existsSync(widgetDir)) {
  fs.mkdirSync(widgetDir, { recursive: true });
}

// Build widget
console.log("Building widget...");
execSync("vite build --config vite.widget.config.ts", { stdio: "inherit" });

// Copy widget files to public directory
console.log("Copying widget files to public/widget...");
fs.copyFileSync(
  path.join(__dirname, "dist", "testimonial-widget.umd.js"),
  path.join(widgetDir, "testimonial-widget.umd.js")
);
fs.copyFileSync(
  path.join(__dirname, "dist", "testimonial-widget.css"),
  path.join(widgetDir, "testimonial-widget.css")
);

console.log("Widget built and files copied to public/widget/");
