export interface DemoCredential {
  email: string;
  password: string;
  name: string;
  role: string;
}

export interface BrandThemeTokens {
  primaryHsl: string;
  accentHsl: string;
  navyHsl: string;
  successHsl: string;
  warningHsl: string;
  infoHsl: string;
}

export interface BrandConfig {
  clientName: string;
  platformName: string;
  moduleName: string;
  logoPath: string;
  logoWhitePath: string;
  logoAlt: string;
  emailDomain: string;
  footerYear: string;
  theme: BrandThemeTokens;
  demoCredentials: DemoCredential[];
}

const env = import.meta.env;

const clientName = env.VITE_BRAND_CLIENT_NAME ?? "Bankinter";
const platformName = env.VITE_BRAND_PLATFORM_NAME ?? "Talent Intelligence";
const moduleName = env.VITE_BRAND_MODULE_NAME ?? "Suite RRHH 360";
const emailDomain = env.VITE_BRAND_EMAIL_DOMAIN ?? "bankinter.com";

export const brandConfig: BrandConfig = {
  clientName,
  platformName,
  moduleName,
  logoPath: env.VITE_BRAND_LOGO_PATH ?? "/bankinter-logo.svg",
  logoWhitePath: env.VITE_BRAND_LOGO_WHITE_PATH ?? "/bankinter-logo-white.svg",
  logoAlt: env.VITE_BRAND_LOGO_ALT ?? clientName,
  emailDomain,
  footerYear: env.VITE_BRAND_FOOTER_YEAR ?? "2026",
  theme: {
    primaryHsl: env.VITE_BRAND_PRIMARY_HSL ?? "27 100% 50%",
    accentHsl: env.VITE_BRAND_ACCENT_HSL ?? "27 100% 45%",
    navyHsl: env.VITE_BRAND_NAVY_HSL ?? "0 0% 12%",
    successHsl: env.VITE_BRAND_SUCCESS_HSL ?? "160 60% 40%",
    warningHsl: env.VITE_BRAND_WARNING_HSL ?? "40 80% 48%",
    infoHsl: env.VITE_BRAND_INFO_HSL ?? "210 60% 50%",
  },
  demoCredentials: [
    {
      email: env.VITE_BRAND_DEMO_ADMIN_EMAIL ?? `admin@${emailDomain}`,
      password: env.VITE_BRAND_DEMO_ADMIN_PASSWORD ?? "talent2026",
      name: env.VITE_BRAND_DEMO_ADMIN_NAME ?? "Marina López",
      role: env.VITE_BRAND_DEMO_ADMIN_ROLE ?? "Directora de Talento",
    },
    {
      email: env.VITE_BRAND_DEMO_RECRUITER_EMAIL ?? `hr@${emailDomain}`,
      password: env.VITE_BRAND_DEMO_RECRUITER_PASSWORD ?? "talent2026",
      name: env.VITE_BRAND_DEMO_RECRUITER_NAME ?? "Javier Ortega",
      role: env.VITE_BRAND_DEMO_RECRUITER_ROLE ?? "Business Partner RRHH",
    },
  ],
};

export const appTitle = `${brandConfig.platformName} · ${brandConfig.clientName}`;

export function getPrimaryDemoCredential(): DemoCredential {
  return brandConfig.demoCredentials[0];
}
