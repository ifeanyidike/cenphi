import { FontOption } from "@/types/setup";

// Font options with categories
export const fontOptions: FontOption[] = [
  // Original Sans-Serif Fonts
  {
    value: "inter",
    label: "Inter",
    category: "sans",
    fallback: "sans-serif",
    description: "Clean, modern interface font",
  },
  {
    value: "roboto",
    label: "Roboto",
    category: "sans",
    fallback: "sans-serif",
    description: "Google's versatile system font",
  },

  {
    value: "openSans",
    label: "Open Sans",
    category: "sans",
    fallback: "sans-serif",
    description: "Friendly, highly readable font",
  },
  {
    value: "montserrat",
    label: "Montserrat",
    category: "sans",
    fallback: "sans-serif",
    description: "Geometric, elegant font",
  },
  {
    value: "lato",
    label: "Lato",
    category: "sans",
    fallback: "sans-serif",
    description: "Balanced, warm font",
  },
  {
    value: "sourceSansPro",
    label: "Source Sans Pro",
    category: "sans",
    fallback: "sans-serif",
    description: "Adobe's clean, versatile font",
  },
  {
    value: "poppins",
    label: "Poppins",
    category: "sans",
    fallback: "sans-serif",
    description: "Geometric with rounded terminals",
  },
  {
    value: "raleway",
    label: "Raleway",
    category: "sans",
    fallback: "sans-serif",
    description: "Elegant, thin typeface",
  },

  // Original Serif Fonts
  {
    value: "merriweather",
    label: "Merriweather",
    category: "serif",
    fallback: "serif",
    description: "Clear, readable serif",
  },
  {
    value: "playfairDisplay",
    label: "Playfair Display",
    category: "serif",
    fallback: "serif",
    description: "Elegant, contrasting serif",
  },
  {
    value: "lora",
    label: "Lora",
    category: "serif",
    fallback: "serif",
    description: "Contemporary, well-balanced serif",
  },
  {
    value: "crimsonText",
    label: "Crimson Text",
    category: "serif",
    fallback: "serif",
    description: "Old-style, readable serif",
  },

  // Original Display Fonts
  {
    value: "abrilFatface",
    label: "Abril Fatface",
    category: "display",
    fallback: "serif",
    description: "Bold, attention-grabbing display font",
  },
  {
    value: "bebasNeue",
    label: "Bebas Neue",
    category: "display",
    fallback: "sans-serif",
    description: "Narrow, all-caps font",
  },

  // Original Monospace Fonts
  {
    value: "jetbrainsMono",
    label: "JetBrains Mono",
    category: "mono",
    fallback: "monospace",
    description: "Developer-friendly coding font",
  },
  {
    value: "firaCode",
    label: "Fira Code",
    category: "mono",
    fallback: "monospace",
    description: "Programming font with ligatures",
  },

  // New Sans-Serif Fonts
  {
    value: "nunito",
    label: "Nunito",
    category: "sans",
    fallback: "sans-serif",
    description: "Rounded, friendly font",
  },
  {
    value: "nunitoSans",
    label: "Nunito Sans",
    category: "sans",
    fallback: "sans-serif",
    description: "Neutral, versatile sans-serif",
  },
  {
    value: "workSans",
    label: "Work Sans",
    category: "sans",
    fallback: "sans-serif",
    description: "Optimized for screen readability",
  },
  {
    value: "rubik",
    label: "Rubik",
    category: "sans",
    fallback: "sans-serif",
    description: "Modern geometric sans-serif",
  },
  {
    value: "quicksand",
    label: "Quicksand",
    category: "sans",
    fallback: "sans-serif",
    description: "Rounded geometric sans-serif",
  },
  {
    value: "karla",
    label: "Karla",
    category: "sans",
    fallback: "sans-serif",
    description: "Clean, grotesque sans-serif",
  },
  {
    value: "dmSans",
    label: "DM Sans",
    category: "sans",
    fallback: "sans-serif",
    description: "Low-contrast geometric sans",
  },
  {
    value: "mulish",
    label: "Mulish",
    category: "sans",
    fallback: "sans-serif",
    description: "Minimalist sans-serif",
  },
  {
    value: "oxygen",
    label: "Oxygen",
    category: "sans",
    fallback: "sans-serif",
    description: "Designed for clarity and simplicity",
  },
  {
    value: "manrope",
    label: "Manrope",
    category: "sans",
    fallback: "sans-serif",
    description: "Modern semi-rounded sans-serif",
  },
  {
    value: "atkinsonHyperlegible",
    label: "Atkinson Hyperlegible",
    category: "sans",
    fallback: "sans-serif",
    description: "Designed for maximum legibility",
  },

  // New Serif Fonts
  {
    value: "bitter",
    label: "Bitter",
    category: "serif",
    fallback: "serif",
    description: "Contemporary slab serif",
  },
  {
    value: "libreBaskerville",
    label: "Libre Baskerville",
    category: "serif",
    fallback: "serif",
    description: "Classic serif optimized for web",
  },
  {
    value: "notoSerif",
    label: "Noto Serif",
    category: "serif",
    fallback: "serif",
    description: "Google's versatile serif",
  },
  {
    value: "jost",
    label: "Jost",
    category: "sans",
    fallback: "sans-serif",
    description: "Geometric sans inspired by Futura",
  },
  {
    value: "fraunces",
    label: "Fraunces",
    category: "serif",
    fallback: "serif",
    description: "Distinctive, versatile serif",
  },
  {
    value: "ebGaramond",
    label: "EB Garamond",
    category: "serif",
    fallback: "serif",
    description: "Classic Garamond revival",
  },
  {
    value: "cormorantGaramond",
    label: "Cormorant Garamond",
    category: "serif",
    fallback: "serif",
    description: "Contemporary Garamond style",
  },
  {
    value: "spectral",
    label: "Spectral",
    category: "serif",
    fallback: "serif",
    description: "Serif designed for screen reading",
  },

  // New Display Fonts
  {
    value: "pacifico",
    label: "Pacifico",
    category: "display",
    fallback: "cursive",
    description: "Brush script with a retro feel",
  },
  {
    value: "righteous",
    label: "Righteous",
    category: "display",
    fallback: "cursive",
    description: "Bold, rounded display font",
  },
  {
    value: "permanentMarker",
    label: "Permanent Marker",
    category: "handwritten",
    fallback: "cursive",
    description: "Marker-style handwritten font",
  },
  {
    value: "playball",
    label: "Playball",
    category: "handwritten",
    fallback: "cursive",
    description: "Playball handwritten font",
  },
  {
    value: "alfaSlabOne",
    label: "Alfa Slab One",
    category: "slab",
    fallback: "serif",
    description: "Heavy slab serif font",
  },
  {
    value: "passionOne",
    label: "Passion One",
    category: "display",
    fallback: "sans-serif",
    description: "Bold, rounded display font",
  },
  {
    value: "staatliches",
    label: "Staatliches",
    category: "display",
    fallback: "sans-serif",
    description: "Tall, condensed display font",
  },
  {
    value: "archivoBlack",
    label: "Archivo Black",
    category: "display",
    fallback: "sans-serif",
    description: "Heavy, impactful sans-serif",
  },
  {
    value: "caveat",
    label: "Caveat",
    category: "handwritten",
    fallback: "cursive",
    description: "Casual handwritten style",
  },
  {
    value: "comfortaa",
    label: "Comfortaa",
    category: "display",
    fallback: "sans-serif",
    description: "Rounded geometric display font",
  },

  // New Monospace Fonts
  {
    value: "spaceMono",
    label: "Space Mono",
    category: "mono",
    fallback: "monospace",
    description: "Fixed-width retro-futuristic font",
  },
  {
    value: "inconsolata",
    label: "Inconsolata",
    category: "mono",
    fallback: "monospace",
    description: "Humanist monospace typeface",
  },
  {
    value: "ibmPlexMono",
    label: "IBM Plex Mono",
    category: "mono",
    fallback: "monospace",
    description: "IBM's distinctive monospace",
  },
  {
    value: "sourceCodePro",
    label: "Source Code Pro",
    category: "mono",
    fallback: "monospace",
    description: "Monospace font by Adobe",
  },
  {
    value: "ubuntuMono",
    label: "Ubuntu Mono",
    category: "mono",
    fallback: "monospace",
    description: "Ubuntu's monospace companion",
  },

  // System Font
  {
    value: "system",
    label: "System UI",
    category: "sans",
    fallback: "sans-serif",
    description: "Default system font stack",
  },
];

export const fontMapping = {
  inter: '"Inter", sans-serif',
  roboto: '"Roboto", sans-serif',
  openSans: '"Open Sans", sans-serif',
  montserrat: '"Montserrat", sans-serif',
  lato: '"Lato", sans-serif',
  sourceSansPro: '"Source Sans Pro", sans-serif',
  poppins: '"Poppins", sans-serif',
  raleway: '"Raleway", sans-serif',
  merriweather: '"Merriweather", serif',
  playfairDisplay: '"Playfair Display", serif',
  lora: '"Lora", serif',
  crimsonText: '"Crimson Text", serif',
  abrilFatface: '"Abril Fatface", serif',
  bebasNeue: '"Bebas Neue", sans-serif',
  jetbrainsMono: '"JetBrains Mono", monospace',
  firaCode: '"Fira Code", monospace',
  nunito: '"Nunito", sans-serif',
  nunitoSans: '"Nunito Sans", sans-serif',
  workSans: '"Work Sans", sans-serif',
  rubik: '"Rubik", sans-serif',
  quicksand: '"Quicksand", sans-serif',
  karla: '"Karla", sans-serif',
  dmSans: '"DM Sans", sans-serif',
  mulish: '"Mulish", sans-serif',
  oxygen: '"Oxygen", sans-serif',
  manrope: '"Manrope", sans-serif',
  atkinsonHyperlegible: '"Atkinson Hyperlegible", sans-serif',
  bitter: '"Bitter", serif',
  libreBaskerville: '"Libre Baskerville", serif',
  notoSerif: '"Noto Serif", serif',
  jost: '"Jost", sans-serif',
  fraunces: '"Fraunces", serif',
  ebGaramond: '"EB Garamond", serif',
  cormorantGaramond: '"Cormorant Garamond", serif',
  spectral: '"Spectral", serif',
  pacifico: '"Pacifico", cursive',
  righteous: '"Righteous", cursive',
  permanentMarker: '"Permanent Marker", cursive',
  playball: '"Playball", cursive',
  alfaSlabOne: '"Alfa Slab One", serif',
  passionOne: '"Passion One", sans-serif',
  staatliches: '"Staatliches", sans-serif',
  archivoBlack: '"Archivo Black", sans-serif',
  caveat: '"Caveat", cursive',
  comfortaa: '"Comfortaa", sans-serif',
  spaceMono: '"Space Mono", monospace',
  inconsolata: '"Inconsolata", monospace',
  ibmPlexMono: '"IBM Plex Mono", monospace',
  sourceCodePro: '"Source Code Pro", monospace',
  ubuntuMono: '"Ubuntu Mono", monospace',
  system:
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

// Testimonial style presets
export const testimonialStyles = [
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean, simple presentation with focus on content",
  },
  {
    id: "card",
    name: "Card",
    description: "Structured cards with shadows and distinct borders",
  },
  {
    id: "quote",
    name: "Quote",
    description: "Emphasis on quotation marks and attribution",
  },
  {
    id: "bubble",
    name: "Bubble",
    description: "Speech bubble style for a conversational feel",
  },
  {
    id: "highlight",
    name: "Highlight",
    description:
      "Key parts of testimonials are emphasized with your brand color",
  },
  {
    id: "modern",
    name: "Modern",
    description: "Contemporary design with subtle gradients and animations",
  },
  {
    id: "classic",
    name: "Classic",
    description: "Timeless design with elegant typography and spacing",
  },
];

// Get font family string
//  const getFontFamily = (fontValue: string): string => {
//     const font = fontOptions.find((f) => f.value === fontValue);
//     return font ? `${font.label}, ${font.fallback}` : "Inter, sans-serif";
//   };

export const getFontFamily = (fontValue: string): string => {
  if (fontValue === "system") {
    return 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  }

  const fontOption = fontOptions.find((font) => font.value === fontValue);

  if (!fontOption) {
    return "system-ui, sans-serif"; // Default fallback
  }

  return `"${fontOption.label}", ${fontOption.fallback}`;
};
