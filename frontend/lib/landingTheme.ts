export const landingThemeCookie = "soyle-landing-theme";
export const landingThemes = ["light", "dark", "system"] as const;
export type LandingTheme = (typeof landingThemes)[number];

export function parseLandingTheme(value: string | undefined): LandingTheme {
  return value === "light" || value === "dark" ? value : "system";
}
