import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        pine: "#1E3A8A",
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
      fontFamily: {
        sans: ["var(--font-vazirmatn)", "Tahoma", "Arial", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
