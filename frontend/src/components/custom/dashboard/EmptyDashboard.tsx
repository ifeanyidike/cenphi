import {
  ArrowUpRight,
  Bot,
  Brain,
  FileText,
  MessageSquare,
  Plus,
  Star,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const EmptyDashboard = () => {
  return (
    <div className="p-4 lg:p-8 overflow-hidden">
      {/* Empty Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        {[
          {
            title: "Total Reviews",
            icon: MessageSquare,
            message: "No reviews yet",
          },
          {
            title: "Average Rating",
            icon: Star,
            message: "Pending ratings",
          },
          {
            title: "Conversion Rate",
            icon: ArrowUpRight,
            message: "Track progress",
          },
          {
            title: "Total Views",
            icon: Users,
            message: "Awaiting visitors",
          },
        ].map((stat, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 lg:p-8">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-gray-100 rounded-xl">
                  <stat.icon className="h-6 w-6 text-gray-400" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-500">
                  {stat.title}
                </h3>
                <div className="text-sm text-gray-400">{stat.message}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty Reviews and Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="p-6">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-semibold">
                  Your Customers
                </CardTitle>
                <div className="flex space-x-2">
                  <Button className="outline text-sm py-1 px-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Customer
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 bg-purple-50 rounded-full mb-4">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Customer Reviews Yet
                </h3>
                <p className="text-gray-500 max-w-md mb-6">
                  Start collecting feedback from your customers to build trust
                  and improve your services.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Customer
                  </Button>
                  <Button className="outline">Import Reviews</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="p-6">
              <CardTitle className="text-lg font-semibold">
                Available Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2">
                {[
                  {
                    label: "Generate Response",
                    icon: Bot,
                    color: "text-green-600",
                    description: "Use AI to craft replies",
                  },
                  {
                    label: "Analyze Feedback",
                    icon: Brain,
                    color: "text-blue-600",
                    description: "Get insights from reviews",
                  },
                  {
                    label: "Create Reports",
                    icon: FileText,
                    color: "text-purple-600",
                    description: "Track performance",
                  },
                ].map((action) => (
                  <button
                    key={action.label}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className={`${action.color}`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <span className="font-medium text-gray-700 block">
                        {action.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        {action.description}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-700">
                  These tools will be available once you add your first customer
                  review.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="p-6">
              <CardTitle className="text-lg font-semibold">
                Getting Started
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[
                  {
                    label: "Add Customers",
                    description: "Import or create customer profiles",
                    icon: Users,
                    status: "pending",
                  },
                  {
                    label: "Collect Reviews",
                    description: "Start gathering feedback",
                    icon: MessageSquare,
                    status: "pending",
                  },
                  {
                    label: "Analyze Data",
                    description: "Get insights from your reviews",
                    icon: Brain,
                    status: "pending",
                  },
                ].map((step) => (
                  <div
                    key={step.label}
                    className="flex items-start space-x-4 p-4 border rounded-lg"
                  >
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <step.icon className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{step.label}</p>
                      <p className="text-sm text-gray-500">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmptyDashboard;
