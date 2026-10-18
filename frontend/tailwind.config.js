/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        docmind: {
          bg: "#0B0F19",
          card: "#111827",
          border: "#1E293B",
          hover: "#1F2937",
          primary: "#3B82F6",
          accent: "#6366F1",
          cyan: "#06B6D4",
          violet: "#8B5CF6",
          muted: "#94A3B8"
        }
      }
    },
  },
  plugins: [],
}
