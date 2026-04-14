/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary:   "#1A3263",  // Deep Navy
        secondary: "#547792",  // Muted Blue
        accent:    "#FFC570",  // Warm Gold
        surface:   "#EFD2B0",  // Warm Beige
        danger:    "#EF4444",  // Red (semantic)
      },
      container: {
        center: true,
        padding: '2rem',
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
}