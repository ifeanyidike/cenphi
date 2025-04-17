import React from "react";
import { observer } from "mobx-react-lite";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CollectionMethod } from "@/types/setup";
import { itemVariants } from "@/utils/helpers";
import MethodIcon from "./common/MethodIcon";

interface MethodTabsProps {
  activeMethod: CollectionMethod;
  onMethodChange: (value: CollectionMethod) => void;
  methodEnabled: Record<CollectionMethod, boolean>;
  onToggleMethod: (method: CollectionMethod, enabled: boolean) => void;
}

const MethodTabs: React.FC<MethodTabsProps> = ({
  activeMethod,
  onMethodChange,
  methodEnabled,
  onToggleMethod,
}) => {
  const methodLabels: Record<CollectionMethod, string> = {
    website: "Website Widget",
    email: "Email Campaigns",
    chat: "Chat Integration",
    social: "Social Media",
    custom: "Custom Pages",
  };

  const methodDescriptions: Record<CollectionMethod, string> = {
    website: "Collect testimonials directly from your website visitors.",
    email: "Send email campaigns to collect testimonials from customers.",
    chat: "Prompt customers to give testimonials during or after chat sessions.",
    social: "Gather testimonials from social media platforms.",
    custom: "Create dedicated testimonial collection pages.",
  };

  return (
    <motion.div variants={itemVariants}>
      <Tabs
        defaultValue="website"
        value={activeMethod}
        onValueChange={(value) => onMethodChange(value as CollectionMethod)}
      >
        <div className="mb-8 border-b">
          <div className="flex items-center justify-between">
            <TabsList className="h-14 p-0 bg-transparent">
              {(Object.keys(methodLabels) as CollectionMethod[]).map(
                (method) => (
                  <TabsTrigger
                    key={method}
                    value={method}
                    className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none h-14 rounded-none px-4"
                  >
                    <MethodIcon method={method} className="mr-2 h-5 w-5" />
                    {methodLabels[method]}
                  </TabsTrigger>
                )
              )}
            </TabsList>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Enable</span>
              <Switch
                checked={methodEnabled[activeMethod]}
                onCheckedChange={(enabled) =>
                  onToggleMethod(activeMethod, enabled)
                }
              />
            </div>
          </div>
        </div>

        <div className="mt-6 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MethodIcon method={activeMethod} />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {methodLabels[activeMethod]}
              </h2>
              <p className="text-sm text-gray-500">
                {methodDescriptions[activeMethod]}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={
              methodEnabled[activeMethod]
                ? "bg-green-100 text-green-700 border-green-200"
                : "bg-gray-100 text-gray-700 border-gray-200"
            }
          >
            {methodEnabled[activeMethod] ? "Enabled" : "Disabled"}
          </Badge>
        </div>
      </Tabs>
    </motion.div>
  );
};

export default observer(MethodTabs);
