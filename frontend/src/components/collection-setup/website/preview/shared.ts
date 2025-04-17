export interface StyleConfig {
  primaryColor: string;
  secondaryColor: string;
  isDarkTheme: boolean;
  textColor: string;
  mutedTextColor: string;
  borderColor: string;
  backgroundColor: string;
  inputBackgroundColor: string;
  stylePreset: string;
  widgetClasses: string;
  buttonClasses: string;
  inputClasses: string;
  boxShadow: string;
  surfaceColor: string;
  elevatedSurfaceColor: string;
  accentColor: string;
  cardRadius: string;
  buttonRadius: string;
  inputRadius: string;
}

export type WidgetStep =
  | "closed"
  | "opening"
  | "open"
  | "forms"
  | "recording"
  | "review"
  | "complete";
export type PreviewDevice = "desktop" | "mobile" | "tablet";
