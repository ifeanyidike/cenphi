import React from "react";
import { motion } from "framer-motion";
import { Activity, Clock, Sparkles, Video, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProcessingJob } from "@/types/ai-service";

interface JobProcessingPlaceholderProps {
  job: ProcessingJob;
  serviceType: string;
}

const serviceIcons = {
  enhancement: Sparkles,
  story_mode: Video,
  clipping: Video,
  content_generation: FileText,
  text_polishing: FileText,
  translation: FileText,
  narration: FileText,
  platform_optimizer: Video,
};

const JobProcessingPlaceholder: React.FC<JobProcessingPlaceholderProps> = ({
  job,
  serviceType,
}) => {
  const ServiceIcon =
    serviceIcons[serviceType as keyof typeof serviceIcons] || Activity;

  return (
    <Card className="border-2 border-dashed border-blue-200 bg-blue-50/30">
      <CardContent className="p-6 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 mx-auto mb-4 rounded-xl bg-blue-100 flex items-center justify-center"
        >
          <ServiceIcon className="w-6 h-6 text-blue-600" />
        </motion.div>

        <h3 className="font-semibold text-gray-900 mb-2">
          {serviceType.replace("_", " ")} In Progress
        </h3>

        <p className="text-sm text-gray-600 mb-4">
          AI is processing your content. Results will appear here when ready.
        </p>

        <div className="flex items-center justify-center gap-4 text-sm">
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            <Activity className="w-3 h-3 mr-1 animate-spin" />
            {job.status}
          </Badge>

          {job.progress && (
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-blue-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${job.progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-blue-600 font-medium">{job.progress}%</span>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 mt-3">
          <Clock className="w-3 h-3 inline mr-1" />
          Started {new Date(job.startTime).toLocaleTimeString()}
        </p>
      </CardContent>
    </Card>
  );
};

export default JobProcessingPlaceholder;
