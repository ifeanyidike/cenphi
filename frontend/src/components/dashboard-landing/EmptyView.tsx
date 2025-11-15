import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { motion } from "framer-motion";
import { itemVariants } from "./constants";
import {
  MessageSquare,
  Lightbulb,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import LoadingSkeleton from "./LoadingSkeleton";
import { workspaceHub } from "@/repo/workspace_hub";

export const EmptyStateView = observer(() => {
  const isLoading = workspaceHub.testimonialManager.loading_testimonials;

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <motion.div variants={itemVariants}>
      <Card className="border border-slate-200 shadow-sm bg-white">
        <CardHeader className="border-b border-slate-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Testimonials Gallery
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Start building your social proof
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            {/* Animated Icon */}
            <div className="relative mb-8">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
                <MessageSquare className="h-10 w-10 text-slate-400" />
              </div>
              <motion.div
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "loop",
                }}
                className="absolute -inset-3 rounded-full border-2 border-slate-200"
              />
            </div>

            {/* Content */}
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No Testimonials Yet
            </h3>
            <p className="text-sm text-slate-600 max-w-md leading-relaxed">
              Customer testimonials build trust and showcase your value.
              Use the "Request" or "Share Link" buttons above to start collecting feedback.
            </p>
          </div>
        </CardContent>

        {/* Footer Tip */}
        <div className="p-5 bg-slate-50 border-t border-slate-100">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="h-4 w-4 text-slate-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-900 mb-1">
                Pro Tip
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Personalized requests get 3× more responses. Make your outreach
                count by tailoring each message.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
});
