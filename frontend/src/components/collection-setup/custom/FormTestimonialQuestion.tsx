import React, { FC } from "react";
import { motion, MotionValue } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MessageSquare, EyeIcon, Lightbulb } from "lucide-react";
import { CollectionSettings } from "@/types/setup";
import { itemVariants } from "./constants";
import { observer } from "mobx-react-lite";

type FormTestimonialQuestionProps = {
  settings: CollectionSettings["custom"];
  scrollToPreview: () => void;
  handleMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  onNestedSettingsChange: <
    U extends keyof CollectionSettings["custom"],
    F extends keyof NonNullable<CollectionSettings["custom"][U]>,
  >(
    parentField: U,
    field: F,
    value: NonNullable<CollectionSettings["custom"][U]>[F]
  ) => void;
};
const FormTestimonialQuestion: FC<FormTestimonialQuestionProps> = ({
  settings,
  scrollToPreview,
  handleMouseMove,
  rotateX,
  rotateY,
  onNestedSettingsChange,
}) => {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ scale: 1.005 }}
      onMouseMove={handleMouseMove}
      style={{
        rotateX: rotateX,
        rotateY: rotateY,
        transformPerspective: 5000,
      }}
    >
      <Card className="overflow-hidden shadow-xl border-0 rounded-xl">
        <CardHeader className="bg-gradient-to-r from-teal-50 via-emerald-50 to-green-50 px-6 py-5 border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
                <MessageSquare className="w-4 h-4" />
              </div>
              <CardTitle className="text-gray-900">
                Testimonial Question
              </CardTitle>
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger onClick={scrollToPreview} asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800"
                  >
                    <EyeIcon className="h-3.5 w-3.5" />
                    <span>Preview</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>See how your questions will appear</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription className="mt-1">
            Customize the main testimonial prompt
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-8">
          <div className="grid gap-6">
            <div className="space-y-2 relative">
              <Label
                htmlFor="testimonial-instructions"
                className="text-gray-800 flex items-center gap-1.5"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9 12H15M9 16H15M9 8H15M5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Instructions
              </Label>
              <Textarea
                id="testimonial-instructions"
                value={settings.customForm?.instructions || ""}
                onChange={(e) =>
                  onNestedSettingsChange(
                    "customForm",
                    "instructions",
                    e.target.value
                  )
                }
                placeholder="Please share your honest feedback about our product/service. What did you like most? How has it helped you?"
                rows={3}
                className="resize-none border-gray-300 focus:border-teal-300 focus:ring-teal-200 text-base h-24"
              />
              <p className="text-xs text-gray-500 mt-1.5">
                General instructions shown at the top of the form
              </p>

              <Button
                size="sm"
                variant="ghost"
                className="absolute right-2 top-8 text-gray-400 hover:text-teal-600 hover:bg-teal-50"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 15L8 11H16L12 15Z" fill="currentColor" />
                </svg>
              </Button>
            </div>

            <div className="space-y-2 relative">
              <Label
                htmlFor="testimonial-question"
                className="text-gray-800 flex items-center gap-1.5"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 12H12M16 12H12M12 12V8M12 12V16M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.8214 2.48697 15.5291 3.33782 17L2.5 21.5L7 20.6622C8.47087 21.513 10.1786 22 12 22Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Main Question
              </Label>
              <div className="relative">
                <Input
                  id="testimonial-question"
                  value={settings.customForm?.mainQuestion || ""}
                  onChange={(e) =>
                    onNestedSettingsChange(
                      "customForm",
                      "mainQuestion",
                      e.target.value
                    )
                  }
                  placeholder="What has been your experience with our product/service?"
                  className="border-gray-300 focus:border-teal-300 focus:ring-teal-200 pr-10 text-base h-12"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 border-0">
                    Required
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                The primary question that prompts the testimonial content
              </p>
            </div>
          </div>

          <div className="relative">
            <Separator className="absolute left-0 right-0" />
            <div className="relative flex justify-center">
              <span className="bg-white px-2 text-sm text-gray-500">
                Form Submission
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="submit-button-text"
              className="text-gray-800 flex items-center gap-1.5"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 12H19M19 12L12 5M19 12L12 19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Submit Button Text
            </Label>
            <Input
              id="submit-button-text"
              value={settings.customForm?.submitButtonText || ""}
              onChange={(e) =>
                onNestedSettingsChange(
                  "customForm",
                  "submitButtonText",
                  e.target.value
                )
              }
              placeholder="Submit Testimonial"
              className="border-gray-300 focus:border-teal-300 focus:ring-teal-200 text-base h-12"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              Text displayed on the submit button
            </p>
          </div>

          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg p-4 flex items-start gap-3">
            <div className="text-teal-600 bg-white rounded-full p-1 shadow-sm mt-0.5">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-teal-900">Pro Tip</h4>
              <p className="text-xs text-teal-800 mt-0.5">
                To receive better testimonials, ask specific questions that
                encourage detailed responses rather than yes/no answers.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default observer(FormTestimonialQuestion);
