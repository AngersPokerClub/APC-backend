import { heroui } from "@heroui/react";

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",

    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      padding: {
        'safe-area': 'env(safe-area-inset-bottom)',
      },
      screens: {
        xs: "480px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px"
      },
      colors: {
        background: "#11181C",
        foreground: "var(--foreground)",
        background_card: "#FFFFFF0F",
        dark: "#09090B",
        ligth: "#FFFFFF",
        primary_background: "#165829",
        primary_hover_background: "#103E1D",
        primary: "#165829",
        neutral: {
          50: "#FAFAFA",
          100: "#F4F4F5",
          300: "#D4D4D8",
          400: "#A1A1AA",
          600: "#52525B",
          700: "#3F3F46",
          950: "#09090B"
        },
        primary_brand: {
          50: "#e8eeea",
          100: "#b7cbbd",
          200: "#94b29d",
          300: "#638f70",
          400: "#457954",
          500: "#165829",
          600: "#145025",
          700: "#103e1d",
          800: "#0c3017",
          900: "#092511"
        },
        secondary_brand: {
          50: "#FAF5FF",
          100: "#F3E8FF",
          300: "#D8B4FE",
          500: "#A855F7",
          700: "#7E22CE",
          900: "#581C87",
          950: "#3B0764"
        },
        success: {
          50: "#F0FDF4",
          100: "#DCFCE7",
          300: "#86EFAC",
          500: "#22C55E",
          700: "#15803D",
          900: "#14532D",
          950: "#052E16"
        },
        warning: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          300: "#FDBA74",
          500: "#F97316",
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12"
        },
        danger: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          300: "#FCA5A5",
          500: "#EF4444",
          700: "#B91C1C",
          900: "#7F1D1D",
          950: "#450A0A"
        },
        grey: {
          50: "#e9e9e9",
          100: "#bababc",
          200: "#98989c",
          300: "#6a6a6e",
          400: "#4d4d52",
          500: "#202027",
          600: "#1d1d23",
          700: "#17171c",
          800: "#121215",
          900: "#0d0d10"
        }
      },
      fontFamily: {
        satoshiRegular: ["Satoshi-regular", "sans-serif"],
        satoshiBlack: ["Satoshi-black", "sans-serif"],
        satoshiBold: ["Satoshi-bold", "sans-serif"],
        satoshiLight: ["Satoshi-light", "sans-serif"],
        satoshiItalic: ["Satoshi-italic", "sans-serif"],
        satoshiMedium: ["Satoshi-medium", "sans-serif"]
      },
      fontSize: {
        xl20: "200px",
        xl12: "120px",
        xl7: "80px",
        xl6: "60px",
        xl5: "48px",
        xl4: "36px",
        xl3p2: "32px",
        xl3: "30px",
        xl2p9: "29px",
        xl2p6: "26px",
        xl2: "24px",
        xl2p3: "23px",
        xl: "20px",
        l: "18px",
        m: "16px",
        s: "14px",
        xs: "12px",
        xs2: "10px"
      },
      spacing: {
        "5xs": "2px",
        "4xs": "4px",
        "3xs": "6px",
        "2xs": "8px",
        xs: "12px",
        s: "14px",
        m: "16px",
        l: "20px",
        "2xl": "28px",
        "3xl": "32px",
        "4xl": "48px",
        "5xl": "64px",
        "7xl": "80px"
      },
      gap: {
        "gap-6": "6px"
      },
      backgroundImage: {
        "apt-gradient":
          "radial-gradient(circle at bottom left, #103E1D 0%, transparent 10%), radial-gradient(circle at top right, #103E1D 0%, transparent 10%)"
      }
    }
  },
  darkMode: "class",
  plugins: [heroui()]
};
