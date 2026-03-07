/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/**/*.html", "./public/**/*.js"],
  theme: {
    extend: {
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      colors: {
        primary: "#7C3AED",
        "primary-hover": "#6D28D9",
      },
    },
  },
  plugins: [],
};
