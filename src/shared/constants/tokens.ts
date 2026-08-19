// tokens.ts — Chatme UI Kit design tokens

export const colors = {
  primary: {
    50: "#F5FBF7",
    200: "#ABDBBE",
    400: "#57B77D", // Primary/400 - Primary (main brand green)
  },
  neutral: {
    50: "#DDE2E8",
    300: "#6E8597",
    500: "#3A566A",
    600: "#1F3C51",
    700: "#163043",
    900: "#081C2C",
  },
  gray: {
    2: "#333333",
  },
  label: {
    light: { primary: "#000000" },
    dark: { primary: "#FFFFFF" },
  },
  other: {
    white: "#FFFFFF",
    divider: "#EAEEF2",
    bgLight: "#F5F7F9",
  },
} as const;

export const typography = {
  fontFamily: {
    display: "SF Pro Display",
    text: "SF Pro Display Regular",
  },
  heading: {
    bold14: { size: 14, weight: 700, lineHeight: 1.25 },
    bold18: { size: 18, weight: 700, lineHeight: 1.25 },
    bold20: { size: 20, weight: 700, lineHeight: 1.25 },
    bold28: { size: 28, weight: 700, lineHeight: 1.25 },
  },
  bodyLarge: {
    regular: { size: 16, weight: 400, lineHeight: 1.5 },
    medium: { size: 16, weight: 500, lineHeight: 1.5 },
    semibold: { size: 16, weight: 600, lineHeight: 1.5 },
  },
  bodyMedium: {
    regular: { size: 14, weight: 400, lineHeight: 1.5, letterSpacing: 0.5 },
    medium: { size: 14, weight: 500, lineHeight: 1.5 },
    semibold: { size: 14, weight: 600, lineHeight: 1.5 },
  },
  bodyRegular: {
    regular: { size: 12, weight: 400, lineHeight: 1.5 },
    medium: { size: 12, weight: 500, lineHeight: 1.5 },
    semibold: { size: 12, weight: 600, lineHeight: 1.5 },
  },
  default: {
    title2: {
      family: "SF Pro Display",
      size: 22,
      weight: 400,
      lineHeight: 28,
      letterSpacing: 0.35,
    },
    callout: {
      family: "SF Pro Display Regular",
      size: 16,
      weight: 400,
      lineHeight: 21,
      letterSpacing: -0.32,
    },
  },
  button14: { size: 14, weight: 700, lineHeight: 1.5 }, // used on Button component
} as const;
