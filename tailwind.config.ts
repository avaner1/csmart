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
          green: "var(--accent-color)",
          black: "var(--sidebar-bg)",
          darkgray: "var(--page-bg)",
          card: "var(--card-bg)",
          border: "var(--card-border)",
          text: "var(--text-primary)",
          subtext: "var(--text-secondary)",
          error: "#E74C3C",
          warning: "#F39C12",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        card: "var(--card-radius)",
        container: "var(--container-radius)",
      },
    },
  },
  plugins: [],
};
export default config;
