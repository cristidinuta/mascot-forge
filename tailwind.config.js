/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#15151B",        // app background — studio darkroom
        panel: "#1E1E27",      // raised panels
        panel2: "#262631",     // hover / inset
        line: "#33333F",       // hairline dividers
        paper: "#F3EEE2",      // the model-sheet drafting canvas
        paperline: "#D9D1BE",  // grid lines on the canvas
        signal: "#FF5436",     // marker red — registration ink, primary action
        blueprint: "#5B8DEF",  // blueprint blue — secondary / data
        ok: "#54C08A",
        ink70: "rgba(243,238,226,0.70)",
        ink45: "rgba(243,238,226,0.45)",
        ink25: "rgba(243,238,226,0.25)",
      },
      fontFamily: {
        display: ['"Space Grotesk"', "system-ui", "sans-serif"],
        body: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      letterSpacing: { label: "0.18em" },
      boxShadow: {
        sheet: "0 24px 60px -24px rgba(0,0,0,0.55)",
      },
    },
  },
  plugins: [],
};
