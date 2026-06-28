/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1B1B1F",
        panel: "#F7F1E6",
        panel2: "#F1E6D6",
        line: "#D8C4A7",
        paper: "#FBF5EE",
        paperline: "#E4D7C1",
        signal: "#D9782D",
        blueprint: "#D99155",
        ok: "#6C8C6B",
        ink70: "rgba(27,27,31,0.70)",
        ink45: "rgba(27,27,31,0.45)",
        ink25: "rgba(27,27,31,0.25)",
      },
      fontFamily: {
        display: ['"Inter"', "system-ui", "sans-serif"],
        body: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      letterSpacing: { label: "0.18em" },
      boxShadow: {
        sheet: "0 24px 60px -24px rgba(0,0,0,0.12)",
      },
    },
  },
  plugins: [],
};
