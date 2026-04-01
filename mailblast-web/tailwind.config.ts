import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light mode design tokens
        bg: "#FAFAFA",
        "bg-alt": "#F2F3F5",
        "bg-card": "#FFFFFF",
        border: "#D8DADF",
        "border-lt": "#E8E9EC",
        "blue-lt": "#8BCAF9",
        blue: "#40AAF8",
        brand: "#1297FD",
        "brand-dk": "#0A82E0",
        // Semantic aliases (keep for backward compat)
        bgAlpha: "#FAFAFA",
        bgBeta: "#F2F3F5",
        bgGamma: "#FFFFFF",
        bgDelta: "#F2F3F5",
        cyan: "#1297FD",
        cyanDim: "#0A82E0",
        borderAlpha: "#E8E9EC",
        textPrimary: "#0C0D10",
        textSecondary: "#474A56",
        textMuted: "#8D909C",
      },
      fontFamily: {
        sans: ["var(--font-inter)"],
        mono: ["var(--font-mono)"],
        head: ["Bricolage Grotesque", "sans-serif"],
        body: ["Instrument Sans", "sans-serif"],
      },
      boxShadow: {
        sm: "0 1px 4px rgba(0,0,0,.06)",
        md: "0 4px 20px rgba(0,0,0,.08)",
        lg: "0 12px 48px rgba(0,0,0,.1)",
        brand: "0 2px 12px rgba(18,151,253,.32)",
        "brand-lg": "0 4px 20px rgba(18,151,253,.35)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
