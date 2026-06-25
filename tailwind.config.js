/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        "primary-dark": "#1D4ED8",
        accent: "#10B981",
        danger: "#EF4444",
        amber: "#F59E0B",
        surface: "#F8FAFC",
        "surface-dark": "#F1F5F9",
      },
    },
  },
  plugins: [],
};
