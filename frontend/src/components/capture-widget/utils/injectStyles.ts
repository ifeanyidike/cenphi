// src/components/capture-widget/utils/injectStyles.ts

/**
 * This utility function will handle injecting the CSS styles and fonts into the page
 * when the testimonial widget is loaded.
 */
export const injectStyles = (cssContent: string) => {
  // First check if our styles are already injected to avoid duplicates
  if (!document.getElementById("testimonial-widget-styles")) {
    // Create and inject main widget styles
    const styleElement = document.createElement("style");
    styleElement.id = "testimonial-widget-styles";
    styleElement.textContent = cssContent;
    document.head.appendChild(styleElement);
  }

  // Check if Google Fonts have already been loaded
  if (!document.getElementById("testimonial-widget-fonts")) {
    // Create and inject Google Fonts
    const fontLink = document.createElement("link");
    fontLink.id = "testimonial-widget-fonts";
    fontLink.rel = "stylesheet";
    fontLink.href =
      "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Manrope:wght@200..800&family=Outfit:wght@100..900&family=Playball&family=Urbanist:ital,wght@0,100..900;1,100..900&display=swap";

    // Add onload handler to update the CSS variables after fonts are loaded
    fontLink.onload = () => {
      // Create a style element to update the CSS variables with the loaded fonts
      const fontVarsStyle = document.createElement("style");
      fontVarsStyle.id = "testimonial-widget-font-vars";
      fontVarsStyle.textContent = `
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
        .tw-widget * {
          font-family: 'DM Sans', 'Outfit', 'Urbanist', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
        }
      `;
      document.head.appendChild(fontVarsStyle);
    };

    // Add the link to the document head
    document.head.appendChild(fontLink);
  }
};
