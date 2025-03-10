// Type definitions
export type MegaMenuSection = {
  title: string;
  items: {
    icon: React.ReactNode;
    title: string;
    description: string;
    path: string;
    isNew?: boolean;
    isPro?: boolean;
    isHot?: boolean;
    isBeta?: boolean;
  }[];
};

export type NavbarProps = {
  userLoggedIn?: boolean;
  premiumUser?: boolean;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  alwaysDarkText?: boolean;
  className?: string;
};
