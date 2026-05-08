import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#101820",
        cloud: "#f7f8f3",
        mint: "#d8f3dc",
        fern: "#2d6a4f",
        ember: "#f77f00",
        berry: "#7b2cbf",
        lagoon: "#0077b6"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(16, 24, 32, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
