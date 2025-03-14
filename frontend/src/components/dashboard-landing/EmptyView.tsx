import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { motion } from "framer-motion";
import { itemVariants } from "./constants";
import {
  ArrowUpRight,
  Award,
  Brain,
  FileText,
  MessageSquare,
  Plus,
  Send,
  ThumbsUp,
} from "lucide-react";
import { Button } from "../ui/button";
import { AIActionsCard } from "./AIActionsCard";
import { StepItem } from "./components";
import { observer } from "mobx-react-lite";
import { workspaceRepo } from "@/repositories/workspace";
import LoadingSkeleton from "./LoadingSkeleton";

export const EmptyStateView = observer(() => {
  const isLoading = workspaceRepo.testimonialManager.loading_testimonials;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Testimonials Area */}
      <motion.div variants={itemVariants} className="lg:col-span-2">
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <Card className="border-0 shadow-xl overflow-hidden bg-white">
            <CardHeader className="p-6 border-b bg-gray-50/60">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  Testimonials Gallery
                </CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-300"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Customer
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-gradient-to-b from-white to-gray-50">
                <div className="relative mb-8">
                  <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center">
                    <ThumbsUp className="h-10 w-10 text-indigo-600" />
                  </div>
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.2, 1, 0.2],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatType: "loop",
                    }}
                    className="absolute -inset-4 rounded-full border-4 border-indigo-100/50"
                  />
                  <motion.div
                    animate={{
                      scale: [1, 1.4, 1],
                      opacity: [0.1, 0.5, 0.1],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      repeatType: "loop",
                    }}
                    className="absolute -inset-8 rounded-full border-4 border-indigo-100/30"
                  />
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  No Testimonials Yet
                </h3>
                <p className="text-gray-500 max-w-md mb-8">
                  Customer testimonials build trust and showcase your value.
                  Start collecting feedback to transform visitors into
                  customers.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md w-full">
                  <Button className="w-full py-6 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                    <Plus className="h-5 w-5 mr-2" />
                    Add First Testimonial
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full py-6 border-2 hover:bg-gray-50"
                  >
                    <Send className="h-5 w-5 mr-2" />
                    Send Request
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-t">
              <div className="w-full flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Pro Tip:</span> Personalized
                  requests get 3x more responses
                </div>
                <Button
                  variant="ghost"
                  className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                >
                  Learn Best Practices
                  <ArrowUpRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}
      </motion.div>

      {/* Sidebar Tools */}
      <motion.div variants={itemVariants} className="space-y-8">
        {/* Premium Tools Card */}
        <AIActionsCard />

        {/* Getting Started Guide */}
        <Card className="border-0 shadow-xl overflow-hidden bg-white">
          <CardHeader className="p-6 border-b bg-gray-50/60">
            <CardTitle className="text-lg font-semibold flex items-center">
              <Award className="h-5 w-5 text-amber-500 mr-2" />
              Success Roadmap
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-0">
              <StepItem
                label="Create Your First Collection"
                description="Organize testimonials by product or service"
                icon={Plus}
                status="pending"
                number={1}
              />

              <StepItem
                label="Gather Customer Feedback"
                description="Send personalized request templates"
                icon={MessageSquare}
                status="pending"
                number={2}
              />

              <StepItem
                label="Analyze & Showcase"
                description="Display testimonials where they matter most"
                icon={Brain}
                status="pending"
                number={3}
              />
            </div>

            <div className="mt-6">
              <Button className="w-full justify-center py-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white">
                Start Your Journey
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
});
