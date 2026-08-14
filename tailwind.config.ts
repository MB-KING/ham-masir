import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#061124",
        pine: "#0B1E43",
        night: "#07162E",
        mint: "#EFF6FF",
        ember: "#F59E0B",
        skyglass: "#F8FAFC",
        brand: {
          blue: "#1E3A8A",
          orange: "#F59E0B",
          gray: "#6B7280",
          white: "#FFFFFF"
        }
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" }
        },
        "sheet-up": {
          from: { opacity: "0", transform: "translateY(1rem)" },
          to: { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "sheet-up": "sheet-up 200ms ease-out"
      },
      fontFamily: {
        sans: ["var(--font-vazirmatn)", "Tahoma", "Arial", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
