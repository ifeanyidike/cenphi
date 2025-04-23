import React from "react";
import { observer } from "mobx-react-lite";
import { motion } from "framer-motion";
import { CheckCircle, Loader, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { itemVariants } from "@/utils/helpers";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  description: string;
  onSave: () => Promise<void>;
  isLoading: boolean;
  isSaved: boolean;
  areSettingsChanged: boolean;
}

const Header: React.FC<HeaderProps> = ({
  title,
  description,
  onSave,
  isLoading,
  isSaved,
  areSettingsChanged,
}) => {
  return (
    <motion.div
      variants={itemVariants}
      className="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 text-base text-gray-500">{description}</p>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={onSave}
          disabled={isLoading || isSaved}
          className={cn(
            "transition-all",
            !areSettingsChanged && "bg-green-600 hover:bg-green-700"
          )}
        >
          {isLoading ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : isSaved ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Saved
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

export default observer(Header);
