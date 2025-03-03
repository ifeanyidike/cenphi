import { Sparkles, Star, Zap } from "lucide-react";

type Props = {
  children: React.ReactNode;
  className?: string;
};
export const GlassPanel = ({ children, className = "" }: Props) => (
  <div
    className={`backdrop-blur-xl bg-white dark:bg-gray-900/90 dark:text-white text-gray-800 ${className}`}
  >
    {children}
  </div>
);

export const NavbarProTag = () => (
  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white">
    <Sparkles className="h-3 w-3 mr-0.5" />
    PRO
  </span>
);

export const NavbarBetaTag = () => (
  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-violet-500 to-purple-600 text-white">
    <Zap className="h-3 w-3 mr-0.5" />
    BETA
  </span>
);

export const NavbarNewTag = () => (
  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-400 to-green-500 text-white">
    NEW
  </span>
);

export const NavbarHotTag = () => (
  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-rose-500 to-red-600 text-white">
    <Star className="h-3 w-3 mr-0.5" />
    HOT
  </span>
);
