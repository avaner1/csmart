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
        spotify: {
          green: "#1DB954",
          black: "#000000",
          darkgray: "#121212",
          card: "#181818",
          border: "#282828",
          text: "#FFFFFF",
          subtext: "#B3B3B3",
          error: "#E74C3C",
          warning: "#F39C12",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        card: "8px",
        container: "12px",
      },
    },
  },
  plugins: [],
};
export default config;
