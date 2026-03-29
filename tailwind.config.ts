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
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          navy: "#0B2240",
          "navy-light": "#0B2740",
          teal: "#0AA696",
          "teal-mid": "#0D8C8C",
          "teal-dark": "#0D6973",
        },
      },
    },
  },
  plugins: [],
};
export default config;
