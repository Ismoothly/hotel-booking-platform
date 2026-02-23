/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx,js,jsx,scss}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary-color)",
        accent: "var(--accent-color)",
        text1: "var(--text-1)",
        text2: "var(--text-2)",
        text3: "var(--text-3)",
        border: "var(--border-color)",
        app: "var(--bg-gray)",
        grayF9: "#f9f9f9",
        grayEEE: "#eee",
        grayCCC: "#ccc",
        grayBBB: "#bbb",
        orangeFF9800: "#ff9800",
        black70: "rgba(0,0,0,0.7)",
        accentTint: "rgba(255,122,0,0.1)",
      },
      spacing: {
        "0_5": "0.125rem",
        "1_5": "0.375rem",
        "2_5": "0.625rem",
      },
      fontSize: {
        "10px": "10px",
        "12px": "12px",
        "15px": "15px",
        "28px": "28px",
      },
      boxShadow: {
        soft: "0 2px 8px rgba(0,0,0,0.05)",
        card: "0 1px 2px rgba(0,0,0,0.06)",
        primary: "0 4px 10px rgba(23,101,255,0.3)",
        gradient: "0 4px 10px rgba(102,126,234,0.3)",
        lgsoft: "0 8px 20px rgba(0,0,0,0.08)",
      },
      height: {
        "400px": "400px",
      },
      minHeight: {
        "120px": "120px",
      },
      borderRadius: {
        "20px": "20px",
      },
      backgroundImage: {
        btnGradient: "linear-gradient(135deg,#667eea 0%,#764ba2 100%)",
      },
      scale: {
        "99_5": "0.995",
      },
      opacity: {
        98: "0.98",
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
};
