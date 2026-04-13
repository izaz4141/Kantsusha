export interface ThemeColors {
  background: string;
  surface: string;
  surfaceRaised: string;
  surfaceSunken: string;

  text: string;
  textMuted: string;
  textOnPrimary: string;

  primary: string;
  primaryHover: string;
  primaryActive: string;
  secondary: string;

  success: string;
  warning: string;
  error: string;
  info: string;

  border: string;
  borderStrong: string;
  ring: string;
  overlay: string;
}

export interface ThemePreset {
  name: string;
  colorScheme: string;
  colors: Partial<ThemeColors>;
}
