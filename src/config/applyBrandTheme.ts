import { brandConfig } from "./brand";

export function applyBrandTheme(): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const { theme } = brandConfig;

  root.style.setProperty("--primary", theme.primaryHsl);
  root.style.setProperty("--ring", theme.primaryHsl);
  root.style.setProperty("--accent", theme.accentHsl);
  root.style.setProperty("--navy", theme.navyHsl);
  root.style.setProperty("--success", theme.successHsl);
  root.style.setProperty("--score-high", theme.successHsl);
  root.style.setProperty("--warning", theme.warningHsl);
  root.style.setProperty("--score-medium", theme.warningHsl);
  root.style.setProperty("--info", theme.infoHsl);
}
