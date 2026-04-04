/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Këto mund t'i ndryshoni sipas dëshirës më vonë
        primary: "#4F46E5",   // Indigo e bukur
        secondary: "#10B981", // Jeshile për sukses/përfitime
        danger: "#EF4444",    // E kuqe për shpenzimet
        dark: "#1F2937",      // Gri e errët për tekstin
      },
      container: {
        center: true,
        padding: '2rem',
      },
    },
  },
  plugins: [
    // Këto i instaluam te Hapi 1
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
}