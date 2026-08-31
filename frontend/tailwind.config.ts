import type { Config } from "tailwindcss";

/**
 * TekRovia design tokens.
 *
 * Direction: this is a career-transformation platform — the brand moment is
 * the staged journey from first ad to placement (Attract -> Assess -> Train
 * -> Prepare -> Place). The palette leans into that: a deep indigo-ink base
 * (not flat black) for the hero/authority moments, a warm paper background
 * for reading-heavy sections, an amber "readiness gate" accent for anything
 * about qualifying/checkpoints, and a teal "placement" accent reserved for
 * success states (offers, joined). Two typefaces: Fraunces (serif, has
 * character, carries the headline voice) and Inter (workhorse UI/body sans).
 */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#14213D",
          light: "#1F3057",
          dark: "#0E1730",
        },
        paper: {
          DEFAULT: "#F4F2EC",
          dim: "#EAE7DD",
        },
        gold: {
          DEFAULT: "#E2A63B",
          dark: "#C68A22",
        },
        teal: {
          DEFAULT: "#2E7D6B",
          dark: "#215B4E",
        },
        line: "#D8D3C4",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        prose: "68ch",
      },
    },
  },
  plugins: [],
};

export default config;
