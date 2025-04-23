import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import {
  TestimonialFormat,
  FormatOption,
  CollectionMethod,
} from "@/types/setup";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import FormatIcon from "./FormatIcon";

interface AddFormatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeMethod: CollectionMethod;
  existingFormats: FormatOption[];
  onAddFormat: (format: FormatOption) => void;
}

const AddFormatDialog: React.FC<AddFormatDialogProps> = ({
  open,
  onOpenChange,
  //   activeMethod,
  existingFormats,
  onAddFormat,
}) => {
  const [selectedFormat, setSelectedFormat] =
    useState<TestimonialFormat>("text");

  const handleAddFormat = () => {
    onAddFormat({
      type: selectedFormat,
      enabled: true,
    });
    onOpenChange(false);
  };

  const allFormatTypes: TestimonialFormat[] = [
    "video",
    "audio",
    "text",
    "image",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Testimonial Format</DialogTitle>
          <DialogDescription>
            Select which format you want to add to your collection methods.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-4">
          {allFormatTypes.map((format) => {
            const isAdded = existingFormats.some((f) => f.type === format);

            return (
              <div
                key={format}
                className={`p-4 rounded-lg border flex flex-col items-center gap-3 transition-colors cursor-pointer ${
                  isAdded
                    ? "bg-gray-100 border-gray-300"
                    : selectedFormat === format
                      ? "bg-blue-50 border-blue-200"
                      : "hover:border-blue-300"
                }`}
                onClick={() => {
                  if (!isAdded) {
                    setSelectedFormat(format);
                  }
                }}
              >
                <div
                  className={`p-3 rounded-full ${
                    isAdded
                      ? "bg-gray-200"
                      : selectedFormat === format
                        ? "bg-blue-100"
                        : "bg-gray-100"
                  }`}
                >
                  <FormatIcon format={format} />
                </div>
                <span className="capitalize">{format}</span>
                {isAdded && (
                  <Badge variant="outline" className="bg-gray-200">
                    Already Added
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAddFormat}
            disabled={existingFormats.some((f) => f.type === selectedFormat)}
          >
            Add Format
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default observer(AddFormatDialog);
