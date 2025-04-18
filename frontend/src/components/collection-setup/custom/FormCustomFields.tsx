import React, { useState, FC } from "react";
import { motion, AnimatePresence, MotionValue } from "framer-motion";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FormInput,
  Plus,
  Trash2,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  PlusCircle,
  X,
  GripVertical,
  Sparkles,
  Wand2,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Import component for drag-and-drop functionality
//@ts-expect-error dnd has been defined
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { CollectionSettings, CustomSettings } from "@/types/setup";
import {
  FieldTypeIcon,
  fieldTypeOptions,
  floatAnimation,
  glowPulse,
  itemVariants,
  listItemVariants,
  standardFieldOptions,
} from "./constants";
import { observer } from "mobx-react-lite";

type FormCustomFieldsProps = {
  handleMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  getCustomFormFields: () => NonNullable<
    CustomSettings["customForm"]
  >["fields"];
  onNestedSettingsChange: <
    U extends keyof CollectionSettings["custom"],
    F extends keyof NonNullable<CollectionSettings["custom"][U]>,
  >(
    parentField: U,
    field: F,
    value: NonNullable<CollectionSettings["custom"][U]>[F]
  ) => void;
  setShowFieldDialog: React.Dispatch<React.SetStateAction<boolean>>;
  setShowFieldTemplates: React.Dispatch<React.SetStateAction<boolean>>;
  handleRemoveField: (fieldName: string) => void;
};
const FormCustomFields: FC<FormCustomFieldsProps> = ({
  handleMouseMove,
  rotateX,
  rotateY,
  getCustomFormFields,
  onNestedSettingsChange,
  setShowFieldDialog,
  setShowFieldTemplates,
  handleRemoveField,
}) => {
  const [, setIsFieldBeingDragged] = useState<boolean>(false);
  const [showAiSuggestions, setShowAiSuggestions] = useState<boolean>(false);

  // Simulate AI suggestions
  const getAiSuggestions = () => {
    setShowAiSuggestions(true);
    // In a real implementation, this would call an API
  };

  // Handle field reordering via drag and drop
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const fields = Array.from(getCustomFormFields());
    const customFields = fields.filter(
      (field) => !standardFieldOptions.some((std) => std.id === field.name)
    );

    const [reorderedItem] = customFields.splice(result.source.index, 1);
    customFields.splice(result.destination.index, 0, reorderedItem);

    // Rebuild the complete fields array
    const standardFields = fields.filter((field) =>
      standardFieldOptions.some((std) => std.id === field.name)
    );

    onNestedSettingsChange("customForm", "fields", [
      ...standardFields,
      ...customFields,
    ]);
  };

  // Handler for updating custom field requirements
  const toggleFieldRequired = (fieldName: string) => {
    const updatedFields = getCustomFormFields().map((field) => {
      if (field.name === fieldName) {
        return { ...field, required: !field.required };
      }
      return field;
    });
    onNestedSettingsChange("customForm", "fields", updatedFields);
  };

  // Handler for moving a field up or down
  const moveField = (fieldName: string, direction: "up" | "down") => {
    const fields = [...getCustomFormFields()];
    const index = fields.findIndex((field) => field.name === fieldName);
    if (index === -1) return;

    if (direction === "up" && index > 0) {
      const temp = fields[index];
      fields[index] = fields[index - 1];
      fields[index - 1] = temp;
    } else if (direction === "down" && index < fields.length - 1) {
      const temp = fields[index];
      fields[index] = fields[index + 1];
      fields[index + 1] = temp;
    }

    onNestedSettingsChange("customForm", "fields", fields);
  };

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
        <CardHeader className="bg-gradient-to-r from-indigo-50 via-purple-50 to-violet-50 px-6 py-5 border-b">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <FormInput className="w-4 h-4" />
                </div>
                <CardTitle className="text-gray-900">Custom Fields</CardTitle>
              </div>
              <CardDescription className="mt-1">
                Add custom fields to collect additional information
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <motion.div
                variants={floatAnimation}
                initial="initial"
                animate="animate"
              >
                <Button
                  onClick={getAiSuggestions}
                  className="gap-1.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-md"
                >
                  <Wand2 className="h-4 w-4" />
                  <span>AI Suggest</span>
                </Button>
              </motion.div>

              <Button
                onClick={() => setShowFieldDialog(true)}
                className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
              >
                <Plus className="h-4 w-4" />
                <span>Add Field</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <AnimatePresence>
            {getCustomFormFields().filter(
              (field) =>
                !standardFieldOptions.some((std) => std.id === field.name)
            ).length > 0 ? (
              <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <DragDropContext
                  onDragStart={() => setIsFieldBeingDragged(true)}
                  onDragEnd={handleDragEnd}
                >
                  <Droppable droppableId="custom-fields">
                    {(provided: any) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="divide-y"
                      >
                        {getCustomFormFields()
                          .filter(
                            (field) =>
                              !standardFieldOptions.some(
                                (std) => std.id === field.name
                              )
                          )
                          .map((field, index) => (
                            <Draggable
                              key={field.name}
                              draggableId={field.name}
                              index={index}
                            >
                              {(provided: any, snapshot: any) => (
                                <motion.div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  variants={listItemVariants}
                                  initial="hidden"
                                  animate={
                                    snapshot.isDragging ? "drag" : "visible"
                                  }
                                  exit="exit"
                                  className={cn(
                                    "flex items-center justify-between p-5 group transition-all",
                                    snapshot.isDragging
                                      ? "bg-indigo-50 rounded-lg shadow-md z-50"
                                      : "hover:bg-gray-50"
                                  )}
                                  style={{
                                    ...provided.draggableProps.style,
                                  }}
                                >
                                  <div className="flex items-center gap-4">
                                    <div
                                      {...provided.dragHandleProps}
                                      className="text-gray-400 cursor-move hover:text-indigo-600 transition-colors"
                                    >
                                      <GripVertical className="h-5 w-5" />
                                    </div>

                                    <div className="p-2.5 rounded-md bg-indigo-50">
                                      <FieldTypeIcon
                                        type={field.type}
                                        className="h-5 w-5 text-indigo-600"
                                      />
                                    </div>

                                    <div>
                                      <div className="font-medium text-gray-900 flex items-center gap-2 text-[15px]">
                                        {field.label}
                                        {field.required && (
                                          <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-0">
                                            Required
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-3 mt-1">
                                        <Badge
                                          variant="outline"
                                          className="text-xs bg-gray-50 text-gray-600 border-gray-200 px-2 py-0"
                                        >
                                          {fieldTypeOptions.find(
                                            (t) => t.value === field.type
                                          )?.label || field.type}
                                        </Badge>
                                        <span className="text-xs text-gray-400">
                                          ID: {field.name}
                                        </span>
                                        {field.placeholder && (
                                          <span className="text-xs text-gray-400 truncate max-w-[200px]">
                                            Placeholder: "{field.placeholder}"
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center">
                                    <div className="hidden group-hover:flex bg-white shadow-lg border rounded-lg overflow-hidden p-1">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
                                              onClick={() =>
                                                toggleFieldRequired(field.name)
                                              }
                                            >
                                              {field.required ? (
                                                <CheckCircle2 className="h-4 w-4" />
                                              ) : (
                                                <svg
                                                  viewBox="0 0 24 24"
                                                  className="h-4 w-4"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  strokeWidth="2"
                                                >
                                                  <circle
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                  />
                                                </svg>
                                              )}
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent side="bottom">
                                            <p>
                                              {field.required
                                                ? "Make optional"
                                                : "Make required"}
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>

                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
                                              onClick={() =>
                                                moveField(field.name, "up")
                                              }
                                              disabled={index === 0}
                                            >
                                              <ArrowUp className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent side="bottom">
                                            <p>Move up</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>

                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
                                              onClick={() =>
                                                moveField(field.name, "down")
                                              }
                                              disabled={
                                                index ===
                                                getCustomFormFields().filter(
                                                  (f) =>
                                                    !standardFieldOptions.some(
                                                      (std) => std.id === f.name
                                                    )
                                                ).length -
                                                  1
                                              }
                                            >
                                              <ArrowDown className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent side="bottom">
                                            <p>Move down</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>

                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                                              onClick={() =>
                                                handleRemoveField(field.name)
                                              }
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent side="bottom">
                                            <p>Remove field</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>

                                    <span className="ml-4 group-hover:hidden">
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          "text-sm font-normal px-3 py-1",
                                          field.required
                                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                            : "bg-gray-50 text-gray-500 border-gray-200"
                                        )}
                                      >
                                        {field.required
                                          ? "Required"
                                          : "Optional"}
                                      </Badge>
                                    </span>
                                  </div>
                                </motion.div>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>

                {/* AI suggestions */}
                <AnimatePresence>
                  {showAiSuggestions && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-5 border-t bg-gradient-to-r from-indigo-50/50 to-violet-50/50"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-sm">
                          <Sparkles className="h-5 w-5" />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                              AI Suggestions
                              <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-0">
                                Beta
                              </Badge>
                            </h3>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-gray-600"
                              onClick={() => setShowAiSuggestions(false)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          <p className="text-gray-600 mt-1 mb-4">
                            Based on your industry and use case, consider adding
                            these fields:
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white rounded-lg border border-indigo-100 p-4 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-md bg-indigo-50">
                                  <FormInput className="h-4 w-4 text-indigo-600" />
                                </div>
                                <h4 className="font-medium text-gray-900">
                                  Feedback Category
                                </h4>
                              </div>
                              <p className="text-sm text-gray-500 mb-3">
                                A dropdown for customers to categorize their
                                feedback (e.g., Product, Service, Support)
                              </p>
                              <Button
                                size="sm"
                                className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
                              >
                                <Plus className="h-3.5 w-3.5 mr-1.5" />
                                Add This Field
                              </Button>
                            </div>

                            <div className="bg-white rounded-lg border border-indigo-100 p-4 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-md bg-indigo-50">
                                  <Calendar className="h-4 w-4 text-indigo-600" />
                                </div>
                                <h4 className="font-medium text-gray-900">
                                  Usage Duration
                                </h4>
                              </div>
                              <p className="text-sm text-gray-500 mb-3">
                                How long the customer has been using your
                                product or service
                              </p>
                              <Button
                                size="sm"
                                className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
                              >
                                <Plus className="h-3.5 w-3.5 mr-1.5" />
                                Add This Field
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
                className="p-12 text-center"
              >
                <motion.div
                  className="mx-auto rounded-full h-16 w-16 flex items-center justify-center bg-indigo-50 mb-4"
                  variants={glowPulse}
                  initial="initial"
                  animate="animate"
                >
                  <FormInput className="h-8 w-8 text-indigo-400" />
                </motion.div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No custom fields yet
                </h3>
                <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                  Add custom fields to collect specific information tailored to
                  your needs. You can create your own or use field templates.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => setShowFieldTemplates(true)}
                    className="gap-1.5 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-md"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Use Templates</span>
                  </Button>
                  <Button
                    onClick={() => setShowFieldDialog(true)}
                    className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Create Custom Field</span>
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default observer(FormCustomFields);
