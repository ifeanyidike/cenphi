import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  ArrowUp,
  ArrowDown,
  Calendar,
  DownloadCloud,
  Mail,
  Eye,
  MousePointer,
  FileCheck,
  ThumbsUp,
  AlertCircle,
  Clock,
  Star,
  Zap,
  RefreshCw,
  Share2,
  BarChart,
  PieChart as PieChartIcon,
  MailOpen,
  CheckCircle,
  ShieldCheck,
  Video,
  Mic,
  Image as ImageIcon,
  FileText,
  XCircle,
  Users,
} from "lucide-react";

// Animation variants
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// Props for the component
interface EmailAnalyticsProps {
  hasData?: boolean; // Toggle between data and no-data states
}

// Types for our data
interface EmailMetric {
  title: string;
  value: string;
  changePercent: number;
  icon: React.ReactNode;
  tooltipText: string;
}

interface EmailPerformanceData {
  month: string;
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
}

interface FormatPerformanceData {
  format: string;
  count: number;
  conversionRate: number;
  avgRating: number;
  icon: React.ReactNode;
}

interface EmailTypeData {
  type: string;
  sent: number;
  converted: number;
  rate: number;
}

interface AudienceSegment {
  label: string;
  value: string;
  color: string;
}

interface EmailIssue {
  issue: string;
  value: string;
  status: "normal" | "warning" | "critical";
  description: string;
}

interface Recommendation {
  title: string;
  icon: React.ReactNode;
  description: string;
}

interface TimeRangeData {
  emailMetrics: EmailMetric[];
  emailPerformanceData: EmailPerformanceData[];
  formatPerformanceData: FormatPerformanceData[];
  emailTypeData: EmailTypeData[];
  audienceSegments: AudienceSegment[];
  emailIssues: EmailIssue[];
  recommendations: Recommendation[];
}

// Define our data structure for different time ranges
const mockData: Record<string, TimeRangeData> = {
  // Last 7 days data
  "7days": {
    emailMetrics: [
      {
        title: "Emails Sent",
        value: "164",
        changePercent: 5.2,
        icon: <Mail className="h-5 w-5 text-blue-600" />,
        tooltipText: "Total number of testimonial request emails sent",
      },
      {
        title: "Open Rate",
        value: "30.5%",
        changePercent: 1.3,
        icon: <MailOpen className="h-5 w-5 text-green-600" />,
        tooltipText: "Percentage of emails that were opened",
      },
      {
        title: "Click Rate",
        value: "22.8%",
        changePercent: 2.1,
        icon: <MousePointer className="h-5 w-5 text-amber-600" />,
        tooltipText:
          "Percentage of opened emails where the recipient clicked the testimonial link",
      },
      {
        title: "Conversion Rate",
        value: "12.4%",
        changePercent: -1.2,
        icon: <FileCheck className="h-5 w-5 text-purple-600" />,
        tooltipText:
          "Percentage of clicked emails that resulted in submitted testimonials",
      },
    ],
    emailPerformanceData: [
      { month: "Mon", sent: 20, opened: 13, clicked: 9, converted: 3 },
      { month: "Tue", sent: 25, opened: 18, clicked: 12, converted: 5 },
      { month: "Wed", sent: 32, opened: 21, clicked: 15, converted: 6 },
      { month: "Thu", sent: 28, opened: 19, clicked: 14, converted: 5 },
      { month: "Fri", sent: 24, opened: 17, clicked: 12, converted: 4 },
      { month: "Sat", sent: 18, opened: 10, clicked: 6, converted: 2 },
      { month: "Sun", sent: 17, opened: 9, clicked: 5, converted: 2 },
    ],
    formatPerformanceData: [
      {
        format: "Text",
        count: 32,
        conversionRate: 15.7,
        avgRating: 4.1,
        icon: <FileText className="h-5 w-5" />,
      },
      {
        format: "Video",
        count: 8,
        conversionRate: 5.3,
        avgRating: 4.7,
        icon: <Video className="h-5 w-5" />,
      },
      {
        format: "Audio",
        count: 11,
        conversionRate: 7.4,
        avgRating: 4.3,
        icon: <Mic className="h-5 w-5" />,
      },
      {
        format: "Image",
        count: 6,
        conversionRate: 3.8,
        avgRating: 4.2,
        icon: <ImageIcon className="h-5 w-5" />,
      },
    ],
    emailTypeData: [
      {
        type: "Initial Request",
        sent: 112,
        converted: 8,
        rate: 7.1,
      },
      {
        type: "Follow-up #1",
        sent: 42,
        converted: 5,
        rate: 11.9,
      },
      {
        type: "Follow-up #2",
        sent: 10,
        converted: 1,
        rate: 10.0,
      },
      {
        type: "Incentive Offer",
        sent: 30,
        converted: 5,
        rate: 16.7,
      },
    ],
    audienceSegments: [
      {
        label: "High Engagement",
        value: "28%",
        color: "bg-green-100 text-green-800 border-green-200",
      },
      {
        label: "Medium Engagement",
        value: "42%",
        color: "bg-blue-100 text-blue-800 border-blue-200",
      },
      {
        label: "Low Engagement",
        value: "24%",
        color: "bg-amber-100 text-amber-800 border-amber-200",
      },
      {
        label: "Disengaged",
        value: "6%",
        color: "bg-red-100 text-red-800 border-red-200",
      },
    ],
    emailIssues: [
      {
        issue: "Unsubscribe Rate",
        value: "0.6%",
        status: "normal",
        description: "Within normal range",
      },
      {
        issue: "Spam Reports",
        value: "0.02%",
        status: "normal",
        description: "Below industry average",
      },
      {
        issue: "Invalid Emails",
        value: "1.8%",
        status: "normal",
        description: "Within acceptable range",
      },
    ],
    recommendations: [
      {
        title: "Adjust Sending Time",
        icon: <Calendar className="h-4 w-4 text-blue-500" />,
        description:
          "Your emails perform best on Tuesday and Wednesday mornings. Shift more campaigns to these times for a potential 12% lift in open rates.",
      },
      {
        title: "Optimize Follow-ups",
        icon: <RefreshCw className="h-4 w-4 text-blue-500" />,
        description:
          "First follow-up emails have higher conversion than initial emails. Ensure all non-responders receive at least one follow-up after 2-3 days.",
      },
      {
        title: "Add Incentives",
        icon: <Zap className="h-4 w-4 text-blue-500" />,
        description:
          "Incentive-based emails convert at 16.7% vs. 7.1% for standard emails. Consider adding incentives to more campaigns.",
      },
    ],
  },

  // Last 30 days data
  "30days": {
    emailMetrics: [
      {
        title: "Emails Sent",
        value: "864",
        changePercent: 12.4,
        icon: <Mail className="h-5 w-5 text-blue-600" />,
        tooltipText: "Total number of testimonial request emails sent",
      },
      {
        title: "Open Rate",
        value: "32.8%",
        changePercent: 3.7,
        icon: <MailOpen className="h-5 w-5 text-green-600" />,
        tooltipText: "Percentage of emails that were opened",
      },
      {
        title: "Click Rate",
        value: "24.2%",
        changePercent: 5.2,
        icon: <MousePointer className="h-5 w-5 text-amber-600" />,
        tooltipText:
          "Percentage of opened emails where the recipient clicked the testimonial link",
      },
      {
        title: "Conversion Rate",
        value: "14.6%",
        changePercent: -2.3,
        icon: <FileCheck className="h-5 w-5 text-purple-600" />,
        tooltipText:
          "Percentage of clicked emails that resulted in submitted testimonials",
      },
    ],
    emailPerformanceData: [
      { month: "Week 1", sent: 220, opened: 154, clicked: 112, converted: 44 },
      { month: "Week 2", sent: 245, opened: 171, clicked: 123, converted: 51 },
      { month: "Week 3", sent: 185, opened: 133, clicked: 92, converted: 39 },
      { month: "Week 4", sent: 214, opened: 153, clicked: 115, converted: 42 },
    ],
    formatPerformanceData: [
      {
        format: "Text",
        count: 156,
        conversionRate: 18.4,
        avgRating: 4.2,
        icon: <FileText className="h-5 w-5" />,
      },
      {
        format: "Video",
        count: 43,
        conversionRate: 6.7,
        avgRating: 4.8,
        icon: <Video className="h-5 w-5" />,
      },
      {
        format: "Audio",
        count: 62,
        conversionRate: 9.3,
        avgRating: 4.5,
        icon: <Mic className="h-5 w-5" />,
      },
      {
        format: "Image",
        count: 28,
        conversionRate: 4.1,
        avgRating: 4.3,
        icon: <ImageIcon className="h-5 w-5" />,
      },
    ],
    emailTypeData: [
      {
        type: "Initial Request",
        sent: 600,
        converted: 47,
        rate: 7.8,
      },
      {
        type: "Follow-up #1",
        sent: 264,
        converted: 26,
        rate: 9.8,
      },
      {
        type: "Follow-up #2",
        sent: 178,
        converted: 9,
        rate: 5.1,
      },
      {
        type: "Incentive Offer",
        sent: 120,
        converted: 24,
        rate: 20.0,
      },
    ],
    audienceSegments: [
      {
        label: "High Engagement",
        value: "32%",
        color: "bg-green-100 text-green-800 border-green-200",
      },
      {
        label: "Medium Engagement",
        value: "47%",
        color: "bg-blue-100 text-blue-800 border-blue-200",
      },
      {
        label: "Low Engagement",
        value: "18%",
        color: "bg-amber-100 text-amber-800 border-amber-200",
      },
      {
        label: "Disengaged",
        value: "3%",
        color: "bg-red-100 text-red-800 border-red-200",
      },
    ],
    emailIssues: [
      {
        issue: "Unsubscribe Rate",
        value: "0.8%",
        status: "normal",
        description: "Within normal range",
      },
      {
        issue: "Spam Reports",
        value: "0.04%",
        status: "normal",
        description: "Below industry average",
      },
      {
        issue: "Invalid Emails",
        value: "2.3%",
        status: "warning",
        description: "Higher than recommended",
      },
    ],
    recommendations: [
      {
        title: "Adjust Sending Time",
        icon: <Calendar className="h-4 w-4 text-blue-500" />,
        description:
          "Your emails perform best on Tuesday and Wednesday mornings. Shift more campaigns to these times for a potential 15% lift in open rates.",
      },
      {
        title: "Optimize Follow-ups",
        icon: <RefreshCw className="h-4 w-4 text-blue-500" />,
        description:
          "First follow-up emails have higher conversion than initial emails. Ensure all non-responders receive at least one follow-up after 3-4 days.",
      },
      {
        title: "Add Incentives",
        icon: <Zap className="h-4 w-4 text-blue-500" />,
        description:
          "Incentive-based emails convert at 20.0% vs. 7.8% for standard emails. Consider adding incentives to more campaigns.",
      },
    ],
  },

  // Last 90 days data
  "90days": {
    emailMetrics: [
      {
        title: "Emails Sent",
        value: "2,547",
        changePercent: 18.7,
        icon: <Mail className="h-5 w-5 text-blue-600" />,
        tooltipText: "Total number of testimonial request emails sent",
      },
      {
        title: "Open Rate",
        value: "33.5%",
        changePercent: 4.2,
        icon: <MailOpen className="h-5 w-5 text-green-600" />,
        tooltipText: "Percentage of emails that were opened",
      },
      {
        title: "Click Rate",
        value: "25.1%",
        changePercent: 6.7,
        icon: <MousePointer className="h-5 w-5 text-amber-600" />,
        tooltipText:
          "Percentage of opened emails where the recipient clicked the testimonial link",
      },
      {
        title: "Conversion Rate",
        value: "15.3%",
        changePercent: 1.8,
        icon: <FileCheck className="h-5 w-5 text-purple-600" />,
        tooltipText:
          "Percentage of clicked emails that resulted in submitted testimonials",
      },
    ],
    emailPerformanceData: [
      { month: "Jan", sent: 720, opened: 510, clicked: 375, converted: 144 },
      { month: "Feb", sent: 870, opened: 609, clicked: 441, converted: 186 },
      { month: "Mar", sent: 990, opened: 738, clicked: 552, converted: 234 },
    ],
    formatPerformanceData: [
      {
        format: "Text",
        count: 347,
        conversionRate: 19.2,
        avgRating: 4.3,
        icon: <FileText className="h-5 w-5" />,
      },
      {
        format: "Video",
        count: 78,
        conversionRate: 7.1,
        avgRating: 4.9,
        icon: <Video className="h-5 w-5" />,
      },
      {
        format: "Audio",
        count: 104,
        conversionRate: 10.5,
        avgRating: 4.6,
        icon: <Mic className="h-5 w-5" />,
      },
      {
        format: "Image",
        count: 52,
        conversionRate: 5.2,
        avgRating: 4.4,
        icon: <ImageIcon className="h-5 w-5" />,
      },
    ],
    emailTypeData: [
      {
        type: "Initial Request",
        sent: 1825,
        converted: 152,
        rate: 8.3,
      },
      {
        type: "Follow-up #1",
        sent: 748,
        converted: 84,
        rate: 11.2,
      },
      {
        type: "Follow-up #2",
        sent: 487,
        converted: 36,
        rate: 7.4,
      },
      {
        type: "Incentive Offer",
        sent: 352,
        converted: 78,
        rate: 22.2,
      },
    ],
    audienceSegments: [
      {
        label: "High Engagement",
        value: "35%",
        color: "bg-green-100 text-green-800 border-green-200",
      },
      {
        label: "Medium Engagement",
        value: "43%",
        color: "bg-blue-100 text-blue-800 border-blue-200",
      },
      {
        label: "Low Engagement",
        value: "17%",
        color: "bg-amber-100 text-amber-800 border-amber-200",
      },
      {
        label: "Disengaged",
        value: "5%",
        color: "bg-red-100 text-red-800 border-red-200",
      },
    ],
    emailIssues: [
      {
        issue: "Unsubscribe Rate",
        value: "0.7%",
        status: "normal",
        description: "Within normal range",
      },
      {
        issue: "Spam Reports",
        value: "0.03%",
        status: "normal",
        description: "Below industry average",
      },
      {
        issue: "Invalid Emails",
        value: "1.9%",
        status: "normal",
        description: "Within normal range",
      },
    ],
    recommendations: [
      {
        title: "Adjust Sending Time",
        icon: <Calendar className="h-4 w-4 text-blue-500" />,
        description:
          "Your emails perform best on Tuesday and Wednesday mornings. Shift more campaigns to these times for a potential 16% lift in open rates.",
      },
      {
        title: "Optimize Follow-ups",
        icon: <RefreshCw className="h-4 w-4 text-blue-500" />,
        description:
          "First follow-up emails have higher conversion than initial emails. Ensure all non-responders receive at least one follow-up after 3-4 days.",
      },
      {
        title: "Add Incentives",
        icon: <Zap className="h-4 w-4 text-blue-500" />,
        description:
          "Incentive-based emails convert at 22.2% vs. 8.3% for standard emails. Consider adding incentives to more campaigns.",
      },
    ],
  },

  // Last 12 months data
  "12months": {
    emailMetrics: [
      {
        title: "Emails Sent",
        value: "9,843",
        changePercent: 25.3,
        icon: <Mail className="h-5 w-5 text-blue-600" />,
        tooltipText: "Total number of testimonial request emails sent",
      },
      {
        title: "Open Rate",
        value: "34.2%",
        changePercent: 5.1,
        icon: <MailOpen className="h-5 w-5 text-green-600" />,
        tooltipText: "Percentage of emails that were opened",
      },
      {
        title: "Click Rate",
        value: "26.7%",
        changePercent: 8.4,
        icon: <MousePointer className="h-5 w-5 text-amber-600" />,
        tooltipText:
          "Percentage of opened emails where the recipient clicked the testimonial link",
      },
      {
        title: "Conversion Rate",
        value: "16.8%",
        changePercent: 3.5,
        icon: <FileCheck className="h-5 w-5 text-purple-600" />,
        tooltipText:
          "Percentage of clicked emails that resulted in submitted testimonials",
      },
    ],
    emailPerformanceData: [
      { month: "Q1", sent: 2580, opened: 1857, clicked: 1368, converted: 564 },
      { month: "Q2", sent: 3480, opened: 2436, clicked: 1716, converted: 756 },
      { month: "Q3", sent: 3045, opened: 2131, clicked: 1522, converted: 644 },
      { month: "Q4", sent: 3285, opened: 2300, clicked: 1642, converted: 700 },
    ],
    formatPerformanceData: [
      {
        format: "Text",
        count: 1243,
        conversionRate: 20.5,
        avgRating: 4.4,
        icon: <FileText className="h-5 w-5" />,
      },
      {
        format: "Video",
        count: 287,
        conversionRate: 8.2,
        avgRating: 4.9,
        icon: <Video className="h-5 w-5" />,
      },
      {
        format: "Audio",
        count: 452,
        conversionRate: 11.8,
        avgRating: 4.7,
        icon: <Mic className="h-5 w-5" />,
      },
      {
        format: "Image",
        count: 196,
        conversionRate: 5.9,
        avgRating: 4.5,
        icon: <ImageIcon className="h-5 w-5" />,
      },
    ],
    emailTypeData: [
      {
        type: "Initial Request",
        sent: 7285,
        converted: 638,
        rate: 8.8,
      },
      {
        type: "Follow-up #1",
        sent: 2938,
        converted: 352,
        rate: 12.0,
      },
      {
        type: "Follow-up #2",
        sent: 1845,
        converted: 157,
        rate: 8.5,
      },
      {
        type: "Incentive Offer",
        sent: 1324,
        converted: 308,
        rate: 23.3,
      },
    ],
    audienceSegments: [
      {
        label: "High Engagement",
        value: "37%",
        color: "bg-green-100 text-green-800 border-green-200",
      },
      {
        label: "Medium Engagement",
        value: "41%",
        color: "bg-blue-100 text-blue-800 border-blue-200",
      },
      {
        label: "Low Engagement",
        value: "16%",
        color: "bg-amber-100 text-amber-800 border-amber-200",
      },
      {
        label: "Disengaged",
        value: "6%",
        color: "bg-red-100 text-red-800 border-red-200",
      },
    ],
    emailIssues: [
      {
        issue: "Unsubscribe Rate",
        value: "0.9%",
        status: "normal",
        description: "Within normal range",
      },
      {
        issue: "Spam Reports",
        value: "0.05%",
        status: "normal",
        description: "Below industry average",
      },
      {
        issue: "Invalid Emails",
        value: "2.1%",
        status: "warning",
        description: "Slightly above recommended",
      },
    ],
    recommendations: [
      {
        title: "Adjust Sending Time",
        icon: <Calendar className="h-4 w-4 text-blue-500" />,
        description:
          "Your emails perform best on Tuesday and Wednesday mornings. Shift more campaigns to these times for a potential 18% lift in open rates.",
      },
      {
        title: "Optimize Follow-ups",
        icon: <RefreshCw className="h-4 w-4 text-blue-500" />,
        description:
          "First follow-up emails have higher conversion than initial emails. Ensure all non-responders receive at least one follow-up after 3-4 days.",
      },
      {
        title: "Add Incentives",
        icon: <Zap className="h-4 w-4 text-blue-500" />,
        description:
          "Incentive-based emails convert at 23.3% vs. 8.8% for standard emails. Consider adding incentives to more campaigns.",
      },
    ],
  },
};

// Empty state placeholder data with the same structure
const emptyData: TimeRangeData = {
  emailMetrics: [
    {
      title: "Emails Sent",
      value: "0",
      changePercent: 0,
      icon: <Mail className="h-5 w-5 text-blue-600" />,
      tooltipText: "Total number of testimonial request emails sent",
    },
    {
      title: "Open Rate",
      value: "0.0%",
      changePercent: 0,
      icon: <MailOpen className="h-5 w-5 text-green-600" />,
      tooltipText: "Percentage of emails that were opened",
    },
    {
      title: "Click Rate",
      value: "0.0%",
      changePercent: 0,
      icon: <MousePointer className="h-5 w-5 text-amber-600" />,
      tooltipText:
        "Percentage of opened emails where the recipient clicked the testimonial link",
    },
    {
      title: "Conversion Rate",
      value: "0.0%",
      changePercent: 0,
      icon: <FileCheck className="h-5 w-5 text-purple-600" />,
      tooltipText:
        "Percentage of clicked emails that resulted in submitted testimonials",
    },
  ],
  emailPerformanceData: [
    { month: "Jan", sent: 0, opened: 0, clicked: 0, converted: 0 },
    { month: "Feb", sent: 0, opened: 0, clicked: 0, converted: 0 },
    { month: "Mar", sent: 0, opened: 0, clicked: 0, converted: 0 },
    { month: "Apr", sent: 0, opened: 0, clicked: 0, converted: 0 },
    { month: "May", sent: 0, opened: 0, clicked: 0, converted: 0 },
    { month: "Jun", sent: 0, opened: 0, clicked: 0, converted: 0 },
  ],
  formatPerformanceData: [
    {
      format: "Text",
      count: 0,
      conversionRate: 0,
      avgRating: 0,
      icon: <FileText className="h-5 w-5" />,
    },
    {
      format: "Video",
      count: 0,
      conversionRate: 0,
      avgRating: 0,
      icon: <Video className="h-5 w-5" />,
    },
    {
      format: "Audio",
      count: 0,
      conversionRate: 0,
      avgRating: 0,
      icon: <Mic className="h-5 w-5" />,
    },
    {
      format: "Image",
      count: 0,
      conversionRate: 0,
      avgRating: 0,
      icon: <ImageIcon className="h-5 w-5" />,
    },
  ],
  emailTypeData: [
    {
      type: "Initial Request",
      sent: 0,
      converted: 0,
      rate: 0,
    },
    {
      type: "Follow-up #1",
      sent: 0,
      converted: 0,
      rate: 0,
    },
    {
      type: "Follow-up #2",
      sent: 0,
      converted: 0,
      rate: 0,
    },
    {
      type: "Incentive Offer",
      sent: 0,
      converted: 0,
      rate: 0,
    },
  ],
  audienceSegments: [
    {
      label: "High Engagement",
      value: "0%",
      color: "bg-green-100 text-green-800 border-green-200",
    },
    {
      label: "Medium Engagement",
      value: "0%",
      color: "bg-blue-100 text-blue-800 border-blue-200",
    },
    {
      label: "Low Engagement",
      value: "0%",
      color: "bg-amber-100 text-amber-800 border-amber-200",
    },
    {
      label: "Disengaged",
      value: "0%",
      color: "bg-red-100 text-red-800 border-red-200",
    },
  ],
  emailIssues: [
    {
      issue: "Unsubscribe Rate",
      value: "0.0%",
      status: "normal",
      description: "No data available",
    },
    {
      issue: "Spam Reports",
      value: "0.0%",
      status: "normal",
      description: "No data available",
    },
    {
      issue: "Invalid Emails",
      value: "0.0%",
      status: "normal",
      description: "No data available",
    },
  ],
  recommendations: [
    {
      title: "No Recommendations",
      icon: <AlertCircle className="h-4 w-4 text-gray-500" />,
      description: "Start sending emails to get personalized recommendations",
    },
    {
      title: "No Data Available",
      icon: <AlertCircle className="h-4 w-4 text-gray-500" />,
      description: "No email data available for analysis",
    },
    {
      title: "Get Started",
      icon: <Mail className="h-4 w-4 text-gray-500" />,
      description:
        "Create your first email campaign to start collecting testimonials",
    },
  ],
};

const EmailAnalytics: React.FC<EmailAnalyticsProps> = ({ hasData = true }) => {
  const [timeRange, setTimeRange] = useState<string>("30days");
  const [chartType, setChartType] = useState<string>("performance");
  const [showEmptyState, setShowEmptyState] = useState<boolean>(!hasData);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  // Toggle between data and empty states for testing
  const toggleDataState = () => {
    setShowEmptyState(!showEmptyState);
  };

  // Get correct data based on the current state and time range
  const currentData = showEmptyState
    ? emptyData
    : mockData[timeRange as keyof typeof mockData];

  // Handle export button click
  const handleExport = () => {
    if (showEmptyState) return;

    setIsExporting(true);

    try {
      // Format the data based on the current tab and time range
      let csvData: string;
      const filename = `testimonial_emails_${timeRange}_${chartType}_${new Date().toISOString().slice(0, 10)}.csv`;

      // Create column headers and format data based on the active tab
      if (chartType === "performance") {
        // Performance data export
        csvData =
          "Month,Emails Sent,Emails Opened,Links Clicked,Testimonials Received\n";

        currentData.emailPerformanceData.forEach((item) => {
          csvData += `${item.month},${item.sent},${item.opened},${item.clicked},${item.converted}\n`;
        });

        // Add summary metrics
        csvData += "\nSummary Metrics\n";
        csvData += "Metric,Value,Change\n";
        currentData.emailMetrics.forEach((metric) => {
          csvData += `${metric.title},${metric.value},${metric.changePercent > 0 ? "+" : ""}${metric.changePercent}%\n`;
        });
      } else if (chartType === "funnels") {
        // Funnel data export
        csvData =
          "Email Type,Emails Sent,Testimonials Received,Conversion Rate\n";

        currentData.emailTypeData.forEach((item) => {
          csvData += `${item.type},${item.sent},${item.converted},${item.rate}%\n`;
        });

        // Add funnel stages
        csvData += "\nFunnel Stages\n";
        const totalSent = parseInt(
          currentData.emailMetrics[0].value.replace(/,/g, "")
        );
        const openRate = parseFloat(currentData.emailMetrics[1].value);
        const clickRate = parseFloat(currentData.emailMetrics[2].value);
        const convRate = parseFloat(currentData.emailMetrics[3].value);

        csvData += "Stage,Count,Rate\n";
        csvData += `Emails Sent,${totalSent},100%\n`;
        csvData += `Emails Opened,${Math.round((totalSent * openRate) / 100)},${openRate}%\n`;
        csvData += `Links Clicked,${Math.round((totalSent * clickRate) / 100)},${clickRate}%\n`;
        csvData += `Started Form,${Math.round(((totalSent * convRate) / 100) * 1.5)},${(convRate * 1.5).toFixed(1)}%\n`;
        csvData += `Testimonials Submitted,${Math.round((totalSent * convRate) / 100)},${convRate}%\n`;
      } else {
        // Format performance data export
        csvData = "Format,Count,Conversion Rate,Average Rating\n";

        currentData.formatPerformanceData.forEach((item) => {
          csvData += `${item.format},${item.count},${item.conversionRate}%,${item.avgRating}\n`;
        });

        // Add total
        const totalCount = currentData.formatPerformanceData.reduce(
          (sum, item) => sum + item.count,
          0
        );
        const avgConversion =
          currentData.formatPerformanceData.reduce(
            (sum, item) => sum + item.count * item.conversionRate,
            0
          ) / totalCount;
        const avgRating =
          currentData.formatPerformanceData.reduce(
            (sum, item) => sum + item.count * item.avgRating,
            0
          ) / totalCount;

        csvData += `Total,${totalCount},${avgConversion.toFixed(1)}%,${avgRating.toFixed(1)}\n`;
      }

      // Create a Blob and trigger download
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });

      // Create a link element and trigger the download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        setIsExporting(false);
        // alert(`Data successfully exported to ${filename}`);
      }, 1000);
    } catch (error) {
      console.error("Export failed:", error);
      setIsExporting(false);
      alert("Export failed. Please try again.");
    }
  };

  // Empty state message component
  const EmptyStateMessage = () => (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300 mt-2">
      <Mail className="h-12 w-12 text-gray-400 mb-3" />
      <h3 className="text-lg font-medium text-gray-600">
        No Email Analytics Data Yet
      </h3>
      <p className="text-sm text-gray-500 text-center max-w-md mt-2">
        Start sending testimonial request emails to see analytics and insights
        here.
      </p>
    </div>
  );

  // Custom date picker
  const DateRangePicker = () => (
    <div className="absolute right-0 top-full mt-2 bg-white shadow-lg rounded-lg border p-4 z-10 w-[300px]">
      <h4 className="font-medium mb-3">Custom Date Range</h4>
      <div className="space-y-3">
        <div>
          <label className="text-sm text-gray-600 block mb-1">Start Date</label>
          <input
            type="date"
            className="w-full border rounded-md px-3 py-2 text-sm"
            defaultValue="2025-01-01"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600 block mb-1">End Date</label>
          <input
            type="date"
            className="w-full border rounded-md px-3 py-2 text-sm"
            defaultValue="2025-03-31"
          />
        </div>
        <div className="flex justify-end space-x-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDatePicker(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setTimeRange("30days"); // Default to 30 days for demo
              setShowDatePicker(false);
            }}
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header with time range selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Email Analytics
          </h2>
          <p className="text-sm text-muted-foreground">
            Track the performance of your testimonial request emails
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Select
              value={timeRange}
              onValueChange={(value) => {
                if (value === "custom") {
                  setShowDatePicker(true);
                } else {
                  setTimeRange(value);
                  setShowDatePicker(false);
                }
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
                <SelectItem value="12months">Last 12 months</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
            {showDatePicker && <DateRangePicker />}
          </div>

          <Button
            variant="outline"
            className="flex items-center gap-1.5"
            onClick={toggleDataState}
          >
            <RefreshCw className="h-4 w-4" />
            <span>{showEmptyState ? "Show Data" : "Show Empty State"}</span>
          </Button>

          <Button
            variant="outline"
            className="flex items-center gap-1.5"
            onClick={handleExport}
            disabled={isExporting || showEmptyState}
          >
            {isExporting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <DownloadCloud className="h-4 w-4" />
                <span>Export</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Key Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {currentData.emailMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </p>
                  <div className="flex items-baseline mt-1 gap-2">
                    <h3 className="text-2xl font-bold">{metric.value}</h3>
                    {metric.changePercent !== 0 && (
                      <div
                        className={`flex items-center text-xs font-medium ${
                          metric.changePercent > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {metric.changePercent > 0 ? (
                          <ArrowUp className="h-3 w-3 mr-0.5" />
                        ) : (
                          <ArrowDown className="h-3 w-3 mr-0.5" />
                        )}
                        {Math.abs(metric.changePercent)}%
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-gray-100">{metric.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Analytics Charts */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Email Analytics</CardTitle>
              <CardDescription>
                Analyze your testimonial email campaign performance
              </CardDescription>
            </div>

            <div className="self-start md:self-auto">
              <div className="flex space-x-1 border rounded-lg p-1 bg-muted">
                <Button
                  variant={chartType === "performance" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setChartType("performance")}
                  className="flex items-center gap-1.5 text-xs md:text-sm h-8"
                >
                  <BarChart className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden md:inline">Performance</span>
                  <span className="md:hidden">Perf</span>
                </Button>
                <Button
                  variant={chartType === "funnels" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setChartType("funnels")}
                  className="flex items-center gap-1.5 text-xs md:text-sm h-8"
                >
                  <PieChartIcon className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden md:inline">Conversion</span>
                  <span className="md:hidden">Funnel</span>
                </Button>
                <Button
                  variant={chartType === "formats" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setChartType("formats")}
                  className="flex items-center gap-1.5 text-xs md:text-sm h-8"
                >
                  <LineChart className="h-3 w-3 md:h-4 md:w-4" />
                  <span>Formats</span>
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartType === "performance" && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
                <h3 className="text-blue-800 font-medium text-sm">
                  Performance Overview
                </h3>
                <p className="text-blue-700 text-xs mt-1">
                  This tab shows your email campaign performance over time with
                  metrics like emails sent, opened, clicked, and testimonials
                  received.
                </p>
              </div>

              {showEmptyState ? (
                <EmptyStateMessage />
              ) : (
                <>
                  <div className="h-[400px] w-full bg-gray-50 border rounded-lg flex items-center justify-center overflow-hidden">
                    {/* This would be a real chart in a production app */}
                    <div className="relative w-full h-full p-6">
                      {/* Mock Bar Chart */}
                      <div className="absolute inset-x-0 bottom-0 flex justify-around h-[350px] items-end px-12">
                        {(() => {
                          // Calculate the maximum value to scale the chart properly
                          const maxVal = Math.max(
                            ...currentData.emailPerformanceData.flatMap(
                              (data) => [
                                data.sent,
                                data.opened,
                                data.clicked,
                                data.converted,
                              ]
                            )
                          );

                          // Calculate scale factor - max height should be 80% of chart height
                          const scaleFactor = maxVal > 0 ? 280 / maxVal : 1;

                          return currentData.emailPerformanceData.map(
                            (data, index) => (
                              <div
                                key={index}
                                className="flex flex-col items-center space-y-2 w-1/6"
                              >
                                <div className="flex gap-1 w-full">
                                  <div
                                    className="bg-blue-200 rounded-t w-1/4"
                                    style={{
                                      height: `${data.sent * scaleFactor}px`,
                                    }}
                                  />
                                  <div
                                    className="bg-green-300 rounded-t w-1/4"
                                    style={{
                                      height: `${data.opened * scaleFactor}px`,
                                    }}
                                  />
                                  <div
                                    className="bg-amber-300 rounded-t w-1/4"
                                    style={{
                                      height: `${data.clicked * scaleFactor}px`,
                                    }}
                                  />
                                  <div
                                    className="bg-purple-300 rounded-t w-1/4"
                                    style={{
                                      height: `${data.converted * scaleFactor}px`,
                                    }}
                                  />
                                </div>
                                <span className="text-xs font-medium">
                                  {data.month}
                                </span>
                              </div>
                            )
                          );
                        })()}
                      </div>

                      {/* Y-axis labels */}
                      <div className="absolute left-0 inset-y-0 w-12 flex flex-col justify-between text-xs text-gray-500 py-6">
                        {(() => {
                          // Calculate the maximum value for Y-axis labels
                          const maxVal = Math.max(
                            ...currentData.emailPerformanceData.flatMap(
                              (data) => [
                                data.sent,
                                data.opened,
                                data.clicked,
                                data.converted,
                              ]
                            )
                          );

                          // Create 6 evenly spaced labels
                          const labels = [];
                          for (let i = 5; i >= 0; i--) {
                            labels.push(
                              <span key={i}>
                                {Math.round((maxVal * i) / 5).toLocaleString()}
                              </span>
                            );
                          }
                          return labels;
                        })()}
                      </div>

                      {/* Legend */}
                      <div className="absolute top-0 right-0 flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-blue-200 rounded" />
                          <span>Sent</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-green-300 rounded" />
                          <span>Opened</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-amber-300 rounded" />
                          <span>Clicked</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-purple-300 rounded" />
                          <span>Converted</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-1.5">
                          <Star className="h-4 w-4 text-amber-500" />
                          <span>Best Performing Template</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                              <Mail className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium">
                                Incentive Template
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                19.8% conversion rate
                              </p>
                            </div>
                          </div>
                          <Badge>+32% vs avg</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <span>Best Sending Time</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                              <Calendar className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium">Tuesday, 10:00 AM</h4>
                              <p className="text-xs text-muted-foreground">
                                36.2% open rate
                              </p>
                            </div>
                          </div>
                          <Badge>+9% vs avg</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-1.5">
                          <Zap className="h-4 w-4 text-amber-500" />
                          <span>Top Converting Trigger</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                              <CheckCircle className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium">Post-Purchase</h4>
                              <p className="text-xs text-muted-foreground">
                                22.4% conversion rate
                              </p>
                            </div>
                          </div>
                          <Badge>+42% vs avg</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </div>
          )}

          {chartType === "funnels" && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4">
                <h3 className="text-amber-800 font-medium text-sm">
                  Conversion Funnel Analysis
                </h3>
                <p className="text-amber-700 text-xs mt-1">
                  This tab analyzes the customer journey from email to submitted
                  testimonial, highlighting conversion rates at each step and
                  identifying drop-off points.
                </p>
              </div>

              {showEmptyState ? (
                <EmptyStateMessage />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-base font-medium mb-4">
                      Testimonial Funnel Breakdown
                    </h3>

                    <div className="h-[350px] relative">
                      {/* Mock Funnel Chart */}
                      <div className="absolute inset-0 flex flex-col gap-1 items-center">
                        <div className="w-full h-16 bg-blue-100 rounded-t-lg flex items-center px-4 justify-between">
                          <div className="flex items-center gap-2">
                            <Mail className="h-5 w-5 text-blue-600" />
                            <span className="font-medium">Emails Sent</span>
                          </div>
                          <Badge className="font-mono">
                            {parseInt(
                              currentData.emailMetrics[0].value.replace(
                                /,/g,
                                ""
                              )
                            )}
                          </Badge>
                        </div>

                        <div className="w-4 h-6 bg-gray-100"></div>

                        <div className="w-[75%] h-16 bg-green-100 rounded-lg flex items-center px-4 justify-between">
                          <div className="flex items-center gap-2">
                            <Eye className="h-5 w-5 text-green-600" />
                            <span className="font-medium">Emails Opened</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge className="font-mono">
                              {Math.round(
                                (parseInt(
                                  currentData.emailMetrics[0].value.replace(
                                    /,/g,
                                    ""
                                  )
                                ) *
                                  parseFloat(
                                    currentData.emailMetrics[1].value
                                  )) /
                                  100
                              )}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-100"
                            >
                              {currentData.emailMetrics[1].value}
                            </Badge>
                          </div>
                        </div>

                        <div className="w-4 h-6 bg-gray-100"></div>

                        <div className="w-[60%] h-16 bg-amber-100 rounded-lg flex items-center px-4 justify-between">
                          <div className="flex items-center gap-2">
                            <MousePointer className="h-5 w-5 text-amber-600" />
                            <span className="font-medium">Links Clicked</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge className="font-mono">
                              {Math.round(
                                (parseInt(
                                  currentData.emailMetrics[0].value.replace(
                                    /,/g,
                                    ""
                                  )
                                ) *
                                  parseFloat(
                                    currentData.emailMetrics[2].value
                                  )) /
                                  100
                              )}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700 border-amber-100"
                            >
                              {currentData.emailMetrics[2].value}
                            </Badge>
                          </div>
                        </div>

                        <div className="w-4 h-6 bg-gray-100"></div>

                        <div className="w-[40%] h-16 bg-purple-100 rounded-lg flex items-center px-4 justify-between">
                          <div className="flex items-center gap-2">
                            <FileCheck className="h-5 w-5 text-purple-600" />
                            <span className="font-medium">Started Form</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge className="font-mono">
                              {Math.round(
                                ((parseInt(
                                  currentData.emailMetrics[0].value.replace(
                                    /,/g,
                                    ""
                                  )
                                ) *
                                  parseFloat(
                                    currentData.emailMetrics[3].value
                                  )) /
                                  100) *
                                  1.5
                              )}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="bg-purple-50 text-purple-700 border-purple-100"
                            >
                              {(
                                parseFloat(currentData.emailMetrics[3].value) *
                                1.5
                              ).toFixed(1)}
                              %
                            </Badge>
                          </div>
                        </div>

                        <div className="w-4 h-6 bg-gray-100"></div>

                        <div className="w-[30%] h-16 bg-indigo-100 rounded-b-lg flex items-center px-4 justify-between">
                          <div className="flex items-center gap-2">
                            <ThumbsUp className="h-5 w-5 text-indigo-600" />
                            <span className="font-medium">Completed</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge className="font-mono">
                              {Math.round(
                                (parseInt(
                                  currentData.emailMetrics[0].value.replace(
                                    /,/g,
                                    ""
                                  )
                                ) *
                                  parseFloat(
                                    currentData.emailMetrics[3].value
                                  )) /
                                  100
                              )}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="bg-indigo-50 text-indigo-700 border-indigo-100"
                            >
                              {currentData.emailMetrics[3].value}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-amber-700 font-medium">
                            Funnel Analysis
                          </p>
                          <p className="text-xs text-amber-600 mt-1">
                            The biggest drop-off occurs between emails opened
                            and links clicked (
                            {(
                              100 -
                              (parseFloat(currentData.emailMetrics[2].value) *
                                100) /
                                parseFloat(currentData.emailMetrics[1].value)
                            ).toFixed(1)}
                            %). Consider testing different email designs and
                            CTAs to improve this step.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-base font-medium mb-4">
                      Conversion by Email Type
                    </h3>

                    <div className="space-y-3">
                      {currentData.emailTypeData.map((email, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm">
                              {email.type}
                            </h4>
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-100"
                            >
                              {email.rate}% conversion
                            </Badge>
                          </div>

                          <div className="bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-green-500 h-full rounded-full"
                              style={{ width: `${email.rate * 5}%` }}
                            />
                          </div>

                          <div className="flex justify-between mt-2 text-xs text-gray-500">
                            <span>{email.converted} converted</span>
                            <span>{email.sent} sent</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Card className="border-green-100">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-green-100 rounded-full text-green-600">
                            <Zap className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-medium text-green-800">
                              Opportunity Identified
                            </h4>
                            <p className="text-sm text-green-700 mt-1">
                              Incentive-based emails have a{" "}
                              {(
                                currentData.emailTypeData[3].rate /
                                currentData.emailTypeData[0].rate
                              ).toFixed(1)}
                              x higher conversion rate. Consider increasing your
                              incentive email volume or testing different
                              incentive types.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}

          {chartType === "formats" && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-100 rounded-lg p-3 mb-4">
                <h3 className="text-green-800 font-medium text-sm">
                  Testimonial Format Analysis
                </h3>
                <p className="text-green-700 text-xs mt-1">
                  This tab compares performance metrics across different
                  testimonial formats (text, video, audio, image) to help you
                  identify which formats are most effective for your customers.
                </p>
              </div>

              {showEmptyState ? (
                <EmptyStateMessage />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <h3 className="text-base font-medium mb-4">
                      Performance by Testimonial Format
                    </h3>

                    <div className="bg-gray-50 border rounded-lg p-4 h-[400px] overflow-hidden">
                      <div className="relative h-full">
                        {/* Mock Format Performance Chart */}
                        <div className="absolute inset-0 flex items-end justify-around p-6 pb-12">
                          {(() => {
                            // Calculate the maximum value to scale the chart properly
                            const maxVal = Math.max(
                              ...currentData.formatPerformanceData.map(
                                (format) => format.count
                              )
                            );

                            // Calculate scale factor - max height should be 80% of chart height
                            const scaleFactor = maxVal > 0 ? 280 / maxVal : 1;

                            return currentData.formatPerformanceData.map(
                              (format, index) => (
                                <div
                                  key={index}
                                  className="flex flex-col items-center"
                                >
                                  <div
                                    className="w-24 bg-blue-400 rounded-t-lg"
                                    style={{
                                      height: `${format.count * scaleFactor}px`,
                                    }}
                                  />
                                  <div className="mt-2 text-xs font-medium">
                                    {format.format}
                                  </div>
                                </div>
                              )
                            );
                          })()}
                        </div>

                        {/* Y-axis labels */}
                        <div className="absolute left-0 inset-y-0 w-12 flex flex-col justify-between text-xs text-gray-500 p-6">
                          {(() => {
                            // Calculate the maximum value for Y-axis labels
                            const maxVal = Math.max(
                              ...currentData.formatPerformanceData.map(
                                (format) => format.count
                              )
                            );

                            // Create 5 evenly spaced labels
                            const labels = [];
                            for (let i = 4; i >= 0; i--) {
                              labels.push(
                                <span key={i}>
                                  {Math.round(
                                    (maxVal * i) / 4
                                  ).toLocaleString()}
                                </span>
                              );
                            }
                            return labels;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-medium mb-4">
                      Format Details
                    </h3>

                    <div className="space-y-3">
                      {currentData.formatPerformanceData.map(
                        (format, index) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                  {format.icon}
                                </div>
                                <div>
                                  <h4 className="font-medium">
                                    {format.format}
                                  </h4>
                                  <p className="text-xs text-muted-foreground">
                                    {format.count} testimonials
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">
                                    Conversion Rate
                                  </p>
                                  <p className="font-medium">
                                    {format.conversionRate}%
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">
                                    Avg. Rating
                                  </p>
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                                    <span className="font-medium">
                                      {format.avgRating}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Quality Monitoring */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Email Quality & Deliverability</CardTitle>
          <CardDescription>
            Monitor email performance metrics and identify issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {showEmptyState ? (
            <EmptyStateMessage />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-green-500" />
                      <span>Deliverability Score</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="relative h-24 w-24">
                        {/* Circular progress indicator */}
                        <div className="absolute inset-0 rounded-full bg-gray-100"></div>
                        <div
                          className="absolute inset-0 rounded-full bg-green-500"
                          style={{
                            clipPath:
                              "polygon(50% 50%, 50% 0, 100% 0, 100% 100%, 0 100%, 0 0, 50% 0)",
                          }}
                        ></div>
                        <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
                          <div className="text-lg font-bold">96%</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                          <div className="text-xs">98% Inbox Placement</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                          <div className="text-xs">0.4% Spam Rate</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                          <div className="text-xs">0.8% Bounce Rate</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span>Audience Engagement</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {currentData.audienceSegments.map((segment, index) => (
                        <div
                          key={index}
                          className="border rounded-lg p-2 flex flex-col items-center justify-center"
                        >
                          <Badge variant="outline" className={segment.color}>
                            {segment.value}
                          </Badge>
                          <p className="text-xs mt-1">{segment.label}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-1.5">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span>Issues to Address</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {currentData.emailIssues.map((issue, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between border-b pb-2"
                        >
                          <div>
                            <p className="text-sm font-medium">{issue.issue}</p>
                            <p className="text-xs text-muted-foreground">
                              {issue.description}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              issue.status === "normal"
                                ? "bg-green-50 text-green-700 border-green-100"
                                : "bg-amber-50 text-amber-700 border-amber-100"
                            }
                          >
                            {issue.value}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  className="flex items-center gap-1.5"
                  onClick={() => alert("Data refreshed successfully!")}
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh Data</span>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Optimization Recommendations */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500 text-white rounded-lg">
              <Share2 className="h-6 w-6" />
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-blue-800">
                  Testimonial Collection Optimization
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  {showEmptyState
                    ? "Start sending emails to collect testimonials and get personalized recommendations."
                    : `Based on your email performance data for the ${
                        timeRange === "7days"
                          ? "last 7 days"
                          : timeRange === "30days"
                            ? "last 30 days"
                            : timeRange === "90days"
                              ? "last 90 days"
                              : "last 12 months"
                      }, here are recommendations to improve your testimonial collection rates:`}
                </p>
              </div>

              {!showEmptyState && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {currentData.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm"
                    >
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-1.5">
                        {rec.icon}
                        <span>{rec.title}</span>
                      </h4>
                      <p className="text-xs text-gray-600">{rec.description}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={showEmptyState}
                  // onClick={() =>
                  //   alert(
                  //     "Recommendations are being applied to your email campaigns!"
                  //   )
                  // }
                >
                  Apply Recommendations
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EmailAnalytics;
