// types.ts

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

export interface Review {
  mediaType: string;
  id: number;
  name: string;
  initials: string;
  rating: number;
  timeAgo: string;
  content: string;
  status: string;

  duration: string;

}



export interface ExtendedReview extends Review {
  audioUrl?: string; 
  videoUrl: string;
  imageUrl: string;
  mediaUrl: string;
  _animate?: boolean;
  thumbnailUrl: string
}

