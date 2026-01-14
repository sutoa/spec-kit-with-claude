/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#137fec",
        "background-light": "#f6f7f8",
        "background-dark": "#101922",
        "panel-light": "#ffffff",
        "panel-dark": "#111a22",
        "border-light": "#e5e7eb",
        "border-dark": "#233648",
        "text-primary-light": "#1f2937",
        "text-primary-dark": "#ffffff",
        "text-secondary-light": "#6b7280",
        "text-secondary-dark": "#92adc9",
        "input-bg-light": "#ffffff",
        "input-bg-dark": "#192633",
        "input-border-light": "#d1d5db",
        "input-border-dark": "#324d67",
        "search-bg-light": "#f3f4f6",
        "search-bg-dark": "#233648",
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
