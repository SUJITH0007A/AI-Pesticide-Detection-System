/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      "colors": {
        "inverse-on-surface": "#f0f1f2",
        "on-background": "#191c1d",
        "on-tertiary-container": "#fffbff",
        "on-surface-variant": "#3d4943",
        "inverse-primary": "#68dbae",
        "secondary-fixed-dim": "#ffb869",
        "secondary": "#885200",
        "surface-container-highest": "#e1e3e4",
        "primary": "#00694c",
        "surface-container-high": "#e7e8e9",
        "on-primary-container": "#f5fff7",
        "outline-variant": "#bccac1",
        "secondary-fixed": "#ffdcbb",
        "on-tertiary-fixed-variant": "#900a18",
        "on-secondary-container": "#704200",
        "surface-variant": "#e1e3e4",
        "error-container": "#ffdad6",
        "on-secondary-fixed": "#2b1700",
        "surface": "#f8f9fa",
        "primary-fixed": "#86f8c9",
        "on-primary-fixed": "#002115",
        "tertiary-fixed": "#ffdad7",
        "on-secondary-fixed-variant": "#673d00",
        "secondary-container": "#fdad4e",
        "on-error-container": "#93000a",
        "on-primary-fixed-variant": "#00513a",
        "tertiary": "#af262a",
        "on-tertiary": "#ffffff",
        "on-secondary": "#ffffff",
        "surface-container-low": "#f3f4f5",
        "surface-dim": "#d9dadb",
        "primary-fixed-dim": "#68dbae",
        "on-primary": "#ffffff",
        "outline": "#6d7a73",
        "primary-container": "#008560",
        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "surface-container": "#edeeef",
        "tertiary-container": "#d23f40",
        "surface-bright": "#f8f9fa",
        "on-surface": "#191c1d",
        "on-tertiary-fixed": "#410004",
        "surface-container-lowest": "#ffffff",
        "inverse-surface": "#2e3132",
        "background": "#f8f9fa",
        "surface-tint": "#006c4e",
        "tertiary-fixed-dim": "#ffb3ae"
      },
      "borderRadius": {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      "spacing": {
        "stack-sm": "4px",
        "base": "8px",
        "container-margin": "16px",
        "gutter": "12px",
        "stack-lg": "24px",
        "stack-md": "12px"
      },
      "fontFamily": {
        "title-lg": ["Inter", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "headline-lg": ["Inter", "sans-serif"],
        "headline-md": ["Inter", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "label-md": ["Inter", "sans-serif"]
      },
      "fontSize": {
        "title-lg": ["18px", {"lineHeight": "24px", "fontWeight": "600"}],
        "body-lg": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
        "headline-lg": ["28px", {"lineHeight": "34px", "letterSpacing": "-0.02em", "fontWeight": "500"}],
        "headline-md": ["22px", {"lineHeight": "28px", "letterSpacing": "-0.01em", "fontWeight": "500"}],
        "body-md": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
        "label-md": ["12px", {"lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "500"}]
      }
    },
  },
  plugins: [],
}

