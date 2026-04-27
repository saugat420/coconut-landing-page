/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        leaf: "#247A52",
        mint: "#DDF8E8",
        aqua: "#DDF7F4",
        sun: "#FFE19C",
        cocoa: "#653A24",
        ink: "#173126",
      },
      boxShadow: {
        soft: "0 22px 70px rgba(36, 122, 82, 0.14)",
      },
    },
  },
  plugins: [],
};
