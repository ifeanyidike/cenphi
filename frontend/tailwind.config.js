/** @type {import('tailwindcss').Config} */

/** App Colors
 *
 * Primary: blue-400, blue-500, blue-600, purple-400, purple-500, purple-600, violet-600, indigo-600
 * Neutral: black, white, slate-50, slate-300, slate-400, slate-700
 * Accent: cyan-400, fuchsia-400, rgba(17,24,39,1), rgba(59,130,246,0.3)
 *
 */

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        outfit: ["Outfit", "sans-serif"],
        manrope: ["Manrope", "sans-serif"],
        urbanist: ["urbanist", "sans-serif"],
        playball: ["Playball", "cursive"],

        // App fonts
        inter: ['"Inter"', "sans-serif"],
        roboto: ['"Roboto"', "sans-serif"],
        "open-sans": ['"Open Sans"', "sans-serif"],
        montserrat: ['"Montserrat"', "sans-serif"],
        lato: ['"Lato"', "sans-serif"],
        "source-sans-pro": ['"Source Sans Pro"', "sans-serif"],
        poppins: ['"Poppins"', "sans-serif"],
        raleway: ['"Raleway"', "sans-serif"],
        nunito: ['"Nunito"', "sans-serif"],
        "nunito-sans": ['"Nunito Sans"', "sans-serif"],
        "work-sans": ['"Work Sans"', "sans-serif"],
        rubik: ['"Rubik"', "sans-serif"],
        quicksand: ['"Quicksand"', "sans-serif"],
        karla: ['"Karla"', "sans-serif"],
        "dm-sans": ['"DM Sans"', "sans-serif"],
        mulish: ['"Mulish"', "sans-serif"],
        oxygen: ['"Oxygen"', "sans-serif"],
        manrope: ['"Manrope"', "sans-serif"],
        "atkinson-hyperlegible": ['"Atkinson Hyperlegible"', "sans-serif"],
        jost: ['"Jost"', "sans-serif"],

        // Serif fonts
        merriweather: ['"Merriweather"', "serif"],
        "playfair-display": ['"Playfair Display"', "serif"],
        lora: ['"Lora"', "serif"],
        "crimson-text": ['"Crimson Text"', "serif"],
        bitter: ['"Bitter"', "serif"],
        "libre-baskerville": ['"Libre Baskerville"', "serif"],
        "noto-serif": ['"Noto Serif"', "serif"],
        fraunces: ['"Fraunces"', "serif"],
        "eb-garamond": ['"EB Garamond"', "serif"],
        "cormorant-garamond": ['"Cormorant Garamond"', "serif"],
        spectral: ['"Spectral"', "serif"],

        // Display fonts
        "abril-fatface": ['"Abril Fatface"', "serif"],
        "bebas-neue": ['"Bebas Neue"', "sans-serif"],
        pacifico: ['"Pacifico"', "cursive"],
        righteous: ['"Righteous"', "cursive"],
        "permanent-marker": ['"Permanent Marker"', "cursive"],
        "alfa-slab-one": ['"Alfa Slab One"', "serif"],
        "passion-one": ['"Passion One"', "sans-serif"],
        staatliches: ['"Staatliches"', "sans-serif"],
        "archivo-black": ['"Archivo Black"', "sans-serif"],
        caveat: ['"Caveat"', "cursive"],
        comfortaa: ['"Comfortaa"', "sans-serif"],

        // Monospace fonts
        "jetbrains-mono": ['"JetBrains Mono"', "monospace"],
        "fira-code": ['"Fira Code"', "monospace"],
        "space-mono": ['"Space Mono"', "monospace"],
        inconsolata: ['"Inconsolata"', "monospace"],
        "ibm-plex-mono": ['"IBM Plex Mono"', "monospace"],
        "source-code-pro": ['"Source Code Pro"', "monospace"],
        "ubuntu-mono": ['"Ubuntu Mono"', "monospace"],
      },
      borderRadius: {
        xl: "var(--radius-xl)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        "cta-journey": "linear-gradient(to right, #4f46e5, #2563eb)",
        "cta-demo": "linear-gradient(to right, #9333ea, #7c3aed)",
      },
      colors: {
        "dark-blue-gray": "rgba(17,24,39,1)",
        "semi-blue": "rgba(59,130,246,0.3)",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
        sidebar: {
          bg: "hsl(var(--sidebar-bg))",
          border: "hsl(var(--sidebar-border))",
          rail: "hsl(var(--sidebar-rail))",
          foreground: "hsl(var(--sidebar-foreground))",
          muted: "hsl(var(--sidebar-muted))",
          accent: "hsl(var(--sidebar-accent))",
          primary: "hsl(var(--sidebar-primary))",
          secondary: "hsl(var(--sidebar-secondary))",
          icon: "hsl(var(--sidebar-icon))",
          item: {
            active: "hsl(var(--sidebar-item-active))",
            "active-foreground": "hsl(var(--sidebar-item-active-foreground))",
            "active-icon": "hsl(var(--sidebar-item-active-icon))",
            hover: "hsl(var(--sidebar-item-hover))",
            icon: "hsl(var(--sidebar-item-icon))",
          },
          subitem: {
            hover: "hsl(var(--sidebar-subitem-hover))",
            foreground: "hsl(var(--sidebar-subitem-foreground))",
            icon: "hsl(var(--sidebar-subitem-icon))",
          },
          action: {
            hover: "hsl(var(--sidebar-action-hover))",
            icon: "hsl(var(--sidebar-action-icon))",
            "icon-hover": "hsl(var(--sidebar-action-icon-hover))",
          },
          project: {
            icon: "hsl(var(--sidebar-project-icon))",
            accent: "hsl(var(--sidebar-project-accent))",
          },
          user: {
            hover: "hsl(var(--sidebar-user-hover))",
            active: "hsl(var(--sidebar-user-active))",
            border: "hsl(var(--sidebar-user-border))",
            "fallback-from": "hsl(var(--sidebar-user-fallback-from))",
            "fallback-to": "hsl(var(--sidebar-user-fallback-to))",
            "fallback-text": "hsl(var(--sidebar-user-fallback-text))",
          },
        },
        dropdown: {
          bg: "hsl(var(--dropdown-bg))",
          border: "hsl(var(--dropdown-border))",
          foreground: "hsl(var(--dropdown-foreground))",
          muted: "hsl(var(--dropdown-muted))",
          "muted-foreground": "hsl(var(--dropdown-muted-foreground))",
          hover: "hsl(var(--dropdown-hover))",
          accent: "hsl(var(--dropdown-accent))",
          primary: "hsl(var(--dropdown-primary))",
          secondary: "hsl(var(--dropdown-secondary))",
          icon: "hsl(var(--dropdown-icon))",
          "icon-hover": "hsl(var(--dropdown-icon-hover))",
          selected: "hsl(var(--dropdown-selected))",
          "selected-foreground": "hsl(var(--dropdown-selected-foreground))",
          danger: "hsl(var(--dropdown-danger))",
          badge: "hsl(var(--dropdown-badge))",
          "badge-foreground": "hsl(var(--dropdown-badge-foreground))",
          user: {
            border: "hsl(var(--dropdown-user-border))",
            "fallback-from": "hsl(var(--dropdown-user-fallback-from))",
            "fallback-to": "hsl(var(--dropdown-user-fallback-to))",
            "fallback-text": "hsl(var(--dropdown-user-fallback-text))",
          },
        },
      },
      keyframes: {
        in: {
          "0%": {
            opacity: "0",
            transform: "translateY(5px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        in: "in 0.2s ease-out",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
