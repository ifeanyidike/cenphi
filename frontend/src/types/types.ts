// types.ts

export interface Review {
  mediaType: string;
  id: number;
  name: string;
  initials: string;
  rating: number;
  timeAgo: string;
  content: string;
  status: string;
}

export interface StatItem {
  title: string;
  value: string | number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  change: string;
  trend: "up" | "down";
}

export interface ActionItem {
  id?: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  bgColor?: string;
  borderColor?: string;
  hoverColor?: string;
  description: string;
}

export interface MetricItem {
  label: string;
  value: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  trend: "up" | "down";
}

export interface ExtendedReview extends Omit<Review, "id"> {
  id: number;
  duration: string;
  name: string;
  initials: string;
  rating: number;
  timeAgo: string;
  content: string;
  status: string;
  mediaType: string;
  _animate?: boolean;
  thumbnailUrl: string;
}
