import React, { useState, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FormInput,
  Plus,
  Trash2,
  User,
  Settings2,
  CheckCircle2,
  CheckIcon,
  PanelRight,
  List,
  LayoutGrid,
  EyeIcon,
  Sparkles,
  Save,
  HelpCircle,
  RotateCw,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Import component for drag-and-drop functionality
import { CollectionSettings, CustomSettings } from "@/types/setup";
import {
  containerVariants,
  fieldTemplateOptions,
  FieldTypeIcon,
  fieldTypeOptions,
  // floatAnimation,
  getFormLayoutIcon,
  itemVariants,
  standardFieldOptions,
} from "./constants";
import FormTestimonialQuestion from "./FormTestimonialQuestion";
import FormPreview from "./FormPreview";
import { observer } from "mobx-react-lite";
// import FormCustomFields from "./FormCustomFields";

// Types

interface PageFormSettingsProps {
  settings: CollectionSettings["custom"];
  onSettingsChange: (
    field: keyof CollectionSettings["custom"],
    value: any
  ) => void;
  onNestedSettingsChange: <
    U extends keyof CollectionSettings["custom"],
    F extends keyof NonNullable<CollectionSettings["custom"][U]>,
  >(
    parentField: U,
    field: F,
    value: NonNullable<CollectionSettings["custom"][U]>[F]
  ) => void;
}

const PageFormSettings: React.FC<PageFormSettingsProps> = ({
  settings,
  // onSettingsChange,
  onNestedSettingsChange,
}) => {
  const [showFieldDialog, setShowFieldDialog] = useState<boolean>(false);
  const [newField, setNewField] = useState<{
    name: string;
    type: string;
    label: string;
    placeholder: string;
    required: boolean;
  }>({
    name: "",
    type: "text",
    label: "",
    placeholder: "",
    required: false,
  });
  const [duplicateNameError, setDuplicateNameError] = useState<boolean>(false);

  const [showSuccessIndicator, setShowSuccessIndicator] =
    useState<boolean>(false);
  const [showFieldTemplates, setShowFieldTemplates] = useState<boolean>(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Motion values for interactive UI elements
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 40, stiffness: 400 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  // Rotation values for card hover effect
  const rotateX = useTransform(springY, [0, 300], [2, -2]);
  const rotateY = useTransform(springX, [0, 300], [-2, 2]);

  // Extract custom form fields from settings
  const getCustomFormFields = (): NonNullable<
    CustomSettings["customForm"]
  >["fields"] => {
    return settings.customForm?.fields || [];
  };

  // Check for duplicate field name
  useEffect(() => {
    if (newField.name) {
      const isDuplicate = getCustomFormFields().some(
        (field) => field.name === newField.name
      );
      setDuplicateNameError(isDuplicate);
    } else {
      setDuplicateNameError(false);
    }
  }, [newField.name, settings.customForm?.fields]);

  // Handler for adding a custom field
  const handleAddCustomField = () => {
    if (!newField.name || !newField.label || duplicateNameError) return;

    const updatedFields = [
      ...(settings.customForm?.fields || []),
      {
        name: newField.name,
        type: newField.type as any,
        label: newField.label,
        placeholder: newField.placeholder,
        required: newField.required,
      },
    ];

    onNestedSettingsChange("customForm", "fields", updatedFields);
    setShowFieldDialog(false);
    setNewField({
      name: "",
      type: "text",
      label: "",
      placeholder: "",
      required: false,
    });
  };

  // Handler for removing a custom field
  const handleRemoveField = (fieldName: string) => {
    const updatedFields = getCustomFormFields().filter(
      (field) => field.name !== fieldName
    );
    onNestedSettingsChange("customForm", "fields", updatedFields);
  };

  // Update form layout
  const handleUpdateFormLayout = (
    layout: "vertical" | "horizontal" | "grid"
  ) => {
    onNestedSettingsChange("customForm", "layout", layout);
  };

  const getStandardFieldStatus = (fieldId: string) => {
    const isUsed = getCustomFormFields().some((f) => f.name === fieldId);
    return fieldId === "name" || fieldId === "email"
      ? "required"
      : isUsed
        ? "enabled"
        : "disabled";
  };

  const toggleStandardField = (
    fieldId: string,
    fieldLabel: string,
    fieldType: string,
    required: boolean
  ) => {
    const isUsed = getCustomFormFields().some((f) => f.name === fieldId);

    if (isUsed) {
      // Remove field
      handleRemoveField(fieldId);
    } else {
      // Add standard field
      const updatedFields = [
        ...getCustomFormFields(),
        {
          name: fieldId,
          type: fieldType,
          label: fieldLabel,
          required: required,
        },
      ];

      onNestedSettingsChange("customForm", "fields", updatedFields);
    }
  };

  // Track mouse position for 3D card effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  // Helper function for creating a field from a template
  const addFieldFromTemplate = (template: (typeof fieldTemplateOptions)[0]) => {
    const currentFields = [...getCustomFormFields()];

    // Filter out fields that would cause name conflicts
    const newFields = template.fields.filter(
      (templateField) =>
        !currentFields.some(
          (existingField) => existingField.name === templateField.name
        )
    );

    if (newFields.length > 0) {
      onNestedSettingsChange("customForm", "fields", [
        ...currentFields,
        ...newFields,
      ]);

      // Show success indicator
      setShowSuccessIndicator(true);
      setTimeout(() => setShowSuccessIndicator(false), 2000);
    }

    setShowFieldTemplates(false);
  };

  // Scroll preview into view if needed
  const scrollToPreview = () => {
    if (previewRef.current) {
      if (window.innerWidth < 1280) {
        // Only scroll on smaller screens
        previewRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  // Save form configuration
  const saveConfiguration = () => {
    setShowSuccessIndicator(true);
    setTimeout(() => setShowSuccessIndicator(false), 2000);
    // In a real implementation, this would persist the configuration
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 max-w-6xl mx-auto relative"
    >
      {/* Success indicator - fixed position */}
      <AnimatePresence>
        {showSuccessIndicator && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-6 right-6 z-50 bg-emerald-50 border border-emerald-200 shadow-lg rounded-lg px-4 py-3 flex items-center gap-3"
          >
            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-medium text-emerald-800">Success!</h4>
              <p className="text-sm text-emerald-600">
                Changes saved successfully
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with actions */}
      <motion.div variants={itemVariants} className="flex flex-col">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Form Configuration
              </h1>
              <Badge className="bg-blue-100 text-blue-700 border-0">Beta</Badge>
            </div>
            <p className="text-gray-500 mt-1">
              Design the perfect form to collect powerful testimonials
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* <motion.div
              variants={floatAnimation}
              initial="initial"
              animate="animate"
            >
              <Button
                onClick={() => setShowFieldTemplates(true)}
                variant="outline"
                className="gap-1.5 border-violet-200 text-violet-700 hover:bg-violet-50 hover:text-violet-800 hover:border-violet-300"
              >
                <Sparkles className="h-4 w-4" />
                <span>Templates</span>
              </Button>
            </motion.div> */}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 hover:border-indigo-300"
                >
                  {getFormLayoutIcon(settings.customForm?.layout)}
                  <span className="hidden sm:inline">
                    {settings.customForm?.layout === "horizontal"
                      ? "Horizontal Layout"
                      : settings.customForm?.layout === "grid"
                        ? "Grid Layout"
                        : "Vertical Layout"}
                  </span>
                  <span className="sm:hidden">Layout</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Form Layout</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleUpdateFormLayout("vertical")}
                  className="flex gap-2"
                >
                  <List className="h-4 w-4" />
                  <span>Vertical Layout</span>
                  {settings.customForm?.layout === "vertical" && (
                    <CheckIcon className="h-4 w-4 ml-auto" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleUpdateFormLayout("horizontal")}
                  className="flex gap-2"
                >
                  <PanelRight className="h-4 w-4" />
                  <span>Horizontal Layout</span>
                  {settings.customForm?.layout === "horizontal" && (
                    <CheckIcon className="h-4 w-4 ml-auto" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleUpdateFormLayout("grid")}
                  className="flex gap-2"
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span>Grid Layout</span>
                  {settings.customForm?.layout === "grid" && (
                    <CheckIcon className="h-4 w-4 ml-auto" />
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              onClick={saveConfiguration}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
            >
              <Save className="h-4 w-4" />
              <span>Save</span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Field Templates Dialog */}
      <Dialog open={showFieldTemplates} onOpenChange={setShowFieldTemplates}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="px-6 py-5 bg-gradient-to-r from-violet-50 to-fuchsia-50 border-b">
            <DialogTitle className="text-gray-900 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-violet-600" />
              Field Templates
            </DialogTitle>
            <DialogDescription>
              Quickly add common field combinations to your form
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {fieldTemplateOptions.map((template) => (
                <motion.div
                  key={template.id}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
                  }}
                  className="relative overflow-hidden rounded-xl border border-violet-100 p-5 bg-gradient-to-br from-white to-violet-50/30 shadow-sm"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/20 rounded-bl-[90px]" />

                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {template.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    {template.fields.map((field) => (
                      <div
                        key={field.name}
                        className="flex items-center gap-2 text-sm"
                      >
                        <FieldTypeIcon
                          type={field.type}
                          className="h-3.5 w-3.5 text-violet-500"
                        />
                        <span>{field.label}</span>
                        {field.required && (
                          <Badge className="bg-violet-100 text-violet-700 text-[10px] h-4 px-1">
                            Required
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => addFieldFromTemplate(template)}
                    className="w-full bg-violet-100 hover:bg-violet-200 text-violet-700 border border-violet-200"
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    <span>Add These Fields</span>
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>

          <DialogFooter className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <span>
                Templates include field names, types and required settings
              </span>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFieldTemplates(false)}
              className="border-gray-300"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        <motion.div
          variants={itemVariants}
          className="col-span-1 xl:col-span-3 space-y-8"
        >
          {/* Standard Fields */}
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
              <CardHeader className="bg-gradient-to-r from-blue-50 to-sky-50 px-6 py-5 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <User className="w-4 h-4" />
                      </div>
                      <CardTitle className="text-gray-900">
                        Contact Information
                      </CardTitle>
                    </div>
                    <CardDescription className="mt-1">
                      Standard fields for collecting contact details
                    </CardDescription>
                  </div>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer transition-colors">
                          <HelpCircle className="h-4 w-4" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <p>
                          These are standard contact fields. Name and Email are
                          always required, others are optional and can be
                          enabled as needed.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="divide-y">
                  {standardFieldOptions.map((field) => {
                    const status = getStandardFieldStatus(field.id);
                    const IconComponent = field.icon;

                    return (
                      <motion.div
                        key={field.id}
                        whileHover={{
                          backgroundColor:
                            status === "enabled"
                              ? "rgba(239, 246, 255, 0.8)"
                              : "rgba(249, 250, 251, 0.8)",
                        }}
                        className={cn(
                          "flex items-center justify-between p-5 transition-colors",
                          status === "enabled" && "bg-blue-50/50"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              "p-2.5 rounded-md",
                              status === "disabled"
                                ? "bg-gray-100 text-gray-400"
                                : status === "required"
                                  ? "bg-blue-100 text-blue-600"
                                  : "bg-blue-50 text-blue-600"
                            )}
                          >
                            <IconComponent className="h-5 w-5" />
                          </div>

                          <div>
                            <div className="font-medium text-gray-900 flex items-center gap-2 text-[15px]">
                              {field.label}
                              {status === "required" && (
                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0">
                                  Required
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-0.5">
                              {field.type === "text"
                                ? "Text input"
                                : field.type === "email"
                                  ? "Email address"
                                  : field.type === "url"
                                    ? "Website URL"
                                    : field.type}
                            </p>
                          </div>
                        </div>

                        <div>
                          {status === "required" ? (
                            <Badge
                              variant="outline"
                              className="text-sm font-normal bg-gray-50 text-gray-500 border-gray-200 px-3 py-1"
                            >
                              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-blue-500" />
                              Always included
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant={
                                status === "enabled" ? "default" : "outline"
                              }
                              className={
                                status === "enabled"
                                  ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600 px-4 py-2 h-auto"
                                  : "border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 h-auto"
                              }
                              onClick={() =>
                                toggleStandardField(
                                  field.id,
                                  field.label,
                                  field.type,
                                  field.required
                                )
                              }
                            >
                              {status === "enabled" ? (
                                <>
                                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                                  Enabled
                                </>
                              ) : (
                                <>
                                  <Plus className="mr-1.5 h-4 w-4" />
                                  Enable
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Custom Fields */}
          {/* <FormCustomFields
            getCustomFormFields={getCustomFormFields}
            handleMouseMove={handleMouseMove}
            handleRemoveField={handleRemoveField}
            onNestedSettingsChange={onNestedSettingsChange}
            rotateX={rotateX}
            rotateY={rotateY}
            setShowFieldDialog={setShowFieldDialog}
            setShowFieldTemplates={setShowFieldTemplates}
          /> */}

          {/* Testimonial Question */}
          <FormTestimonialQuestion
            handleMouseMove={handleMouseMove}
            onNestedSettingsChange={onNestedSettingsChange}
            rotateX={rotateX}
            rotateY={rotateY}
            scrollToPreview={scrollToPreview}
            settings={settings}
          />
        </motion.div>

        {/* Form Preview */}
        <FormPreview settings={settings} previewRef={previewRef} />
      </div>

      {/* Add Custom Field Dialog */}
      <Dialog open={showFieldDialog} onOpenChange={setShowFieldDialog}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden rounded-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500"></div>

          <Tabs defaultValue="basic" className="w-full">
            <div className="flex justify-between items-center px-6 pt-6 pb-2">
              <DialogTitle className="text-gray-900 flex items-center gap-2 text-xl">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 w-8 h-8 rounded-full flex items-center justify-center text-white">
                  <Plus className="w-5 h-5" />
                </div>
                <span>Add Custom Field</span>
              </DialogTitle>

              <TabsList className="bg-slate-100 p-1 rounded-lg">
                <TabsTrigger
                  value="basic"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-1.5 h-8 px-3"
                >
                  <FormInput className="h-3.5 w-3.5" />
                  <span className="text-xs">Basic</span>
                </TabsTrigger>
                <TabsTrigger
                  value="advanced"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-1.5 h-8 px-3"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  <span className="text-xs">Advanced</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <DialogDescription className="px-6 pb-0 mt-1">
              Create a new field to collect additional information from your
              customers
            </DialogDescription>

            <TabsContent value="basic" className="p-0 mt-0">
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="field-label"
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
                          d="M7 8H17M7 12H17M7 16H13M3 19H21C22.1046 19 23 18.1046 23 17V7C23 5.89543 22.1046 5 21 5H3C1.89543 5 1 5.89543 1 7V17C1 18.1046 1.89543 19 3 19Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Field Label <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="field-label"
                      value={newField.label}
                      onChange={(e) => {
                        setNewField({
                          ...newField,
                          label: e.target.value,
                          name: e.target.value
                            .toLowerCase()
                            .replace(/\s+/g, "_")
                            .replace(/[^a-z0-9_]/g, ""),
                        });
                      }}
                      placeholder="e.g. Your Industry"
                      className="border-gray-300 focus:border-indigo-300 focus:ring-indigo-200 text-base h-12"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      Label shown to users on the form
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="field-name"
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
                          d="M17 7L7 17M7 7L17 17"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Field ID <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="field-name"
                      value={newField.name}
                      onChange={(e) =>
                        setNewField({
                          ...newField,
                          name: e.target.value
                            .replace(/\s+/g, "_")
                            .replace(/[^a-z0-9_]/g, ""),
                        })
                      }
                      placeholder="e.g. industry, feedback_type"
                      className={cn(
                        "border-gray-300 focus:border-indigo-300 focus:ring-indigo-200 text-base h-12",
                        duplicateNameError &&
                          "border-red-300 focus:border-red-300 focus:ring-red-200"
                      )}
                    />
                    <p
                      className={cn(
                        "text-xs flex items-center gap-1.5 mt-1.5",
                        duplicateNameError ? "text-red-500" : "text-gray-500"
                      )}
                    >
                      {duplicateNameError ? (
                        <>
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          This field ID is already in use. Please use a unique
                          ID.
                        </>
                      ) : (
                        "Internal field identifier (no spaces or special characters)"
                      )}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="field-type"
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
                          d="M4 5.5H20M4 18.5H20M8 12H16"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Field Type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={newField.type}
                      onValueChange={(value) =>
                        setNewField({ ...newField, type: value })
                      }
                    >
                      <SelectTrigger
                        id="field-type"
                        className="border-gray-300 focus:border-indigo-300 focus:ring-indigo-200 h-12"
                      >
                        <SelectValue placeholder="Select field type" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-2">
                          <h4 className="mb-2 font-medium text-sm text-gray-500">
                            Input Types
                          </h4>
                          <div className="grid grid-cols-2 gap-1">
                            {fieldTypeOptions.slice(0, 4).map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                                className="gap-2 h-9"
                              >
                                <div className="flex items-center gap-2">
                                  <FieldTypeIcon
                                    type={option.value}
                                    className="h-4 w-4 text-indigo-500"
                                  />
                                  <span>{option.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </div>

                          <Separator className="my-2" />

                          <h4 className="mb-2 font-medium text-sm text-gray-500">
                            Special Types
                          </h4>
                          <div className="grid grid-cols-2 gap-1">
                            {fieldTypeOptions.slice(4).map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                                className="gap-2 h-9"
                              >
                                <div className="flex items-center gap-2">
                                  <FieldTypeIcon
                                    type={option.value}
                                    className="h-4 w-4 text-indigo-500"
                                  />
                                  <span>{option.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                        </div>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1.5">
                      Type of input field to display
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="field-placeholder"
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
                          d="M13 16H12v-6h-1M12 6h.01"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                      Placeholder Text
                    </Label>
                    <Input
                      id="field-placeholder"
                      value={newField.placeholder}
                      onChange={(e) =>
                        setNewField({
                          ...newField,
                          placeholder: e.target.value,
                        })
                      }
                      placeholder="e.g. Select your industry"
                      className="border-gray-300 focus:border-indigo-300 focus:ring-indigo-200 text-base h-12"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      Placeholder text shown in the input
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl p-4 flex items-center gap-3 border border-indigo-100">
                  <input
                    type="checkbox"
                    id="required-field"
                    checked={newField.required}
                    onChange={(e) =>
                      setNewField({ ...newField, required: e.target.checked })
                    }
                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <Label
                    htmlFor="required-field"
                    className="text-gray-800 cursor-pointer"
                  >
                    <span className="font-medium">This field is required</span>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Users must complete this field to submit the form
                    </p>
                  </Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="p-0 mt-0">
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-gray-800">Field Width</Label>
                    <Select defaultValue="full">
                      <SelectTrigger className="border-gray-300 focus:border-indigo-300 focus:ring-indigo-200">
                        <SelectValue placeholder="Select field width" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Width</SelectItem>
                        <SelectItem value="half">Half Width</SelectItem>
                        <SelectItem value="third">Third Width</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1.5">
                      Control how much space this field takes up
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-800">Field Visibility</Label>
                    <Select defaultValue="always">
                      <SelectTrigger className="border-gray-300 focus:border-indigo-300 focus:ring-indigo-200">
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="always">Always Visible</SelectItem>
                        <SelectItem value="conditional">
                          Conditional (Pro)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1.5">
                      Control when this field is shown to users
                    </p>
                  </div>
                </div>

                {newField.type === "select" && (
                  <div className="space-y-3 pt-2">
                    <Label className="text-gray-800">Dropdown Options</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border">
                        <div className="flex-1">
                          <Input
                            placeholder="Option 1"
                            className="border-gray-300 focus:border-indigo-300 focus:ring-indigo-200"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border">
                        <div className="flex-1">
                          <Input
                            placeholder="Option 2"
                            className="border-gray-300 focus:border-indigo-300 focus:ring-indigo-200"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Add Option
                    </Button>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <Label className="text-gray-800">Input Validation</Label>
                  <Select defaultValue="none">
                    <SelectTrigger className="border-gray-300 focus:border-indigo-300 focus:ring-indigo-200">
                      <SelectValue placeholder="Select validation type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Validation</SelectItem>
                      <SelectItem value="email">Email Format</SelectItem>
                      <SelectItem value="number">Numbers Only</SelectItem>
                      <SelectItem value="url">URL Format</SelectItem>
                      <SelectItem value="regex">
                        Custom Pattern (Pro)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1.5">
                    Add validation rules to ensure correct input format
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-800">Help Text</Label>
                    <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-0">
                      Optional
                    </Badge>
                  </div>
                  <Textarea
                    placeholder="Enter additional instructions or help text for this field"
                    className="resize-none border-gray-300 focus:border-indigo-300 focus:ring-indigo-200"
                    rows={2}
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    Additional instructions shown below the field
                  </p>
                </div>

                <div className="pt-4 space-y-2">
                  <h4 className="text-sm font-medium text-gray-800">
                    Premium Field Features
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-start gap-2 opacity-60">
                      <input
                        type="checkbox"
                        id="conditional-logic"
                        disabled
                        className="h-4 w-4 mt-1 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <div>
                        <Label
                          htmlFor="conditional-logic"
                          className="text-gray-800 cursor-pointer"
                        >
                          Conditional Logic
                        </Label>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Show/hide based on other fields
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 opacity-60">
                      <input
                        type="checkbox"
                        id="field-calculations"
                        disabled
                        className="h-4 w-4 mt-1 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <div>
                        <Label
                          htmlFor="field-calculations"
                          className="text-gray-800 cursor-pointer"
                        >
                          Field Calculations
                        </Label>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Calculate values from other fields
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 16v-4M12 8h.01M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Advanced features are available on Pro plans.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowFieldDialog(false)}
                className="border-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                Cancel
              </Button>

              <div className="h-4 w-px bg-gray-300"></div>

              <Button
                variant="ghost"
                className="border-0 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 gap-1.5"
                onClick={() => {
                  setNewField({
                    name: "",
                    type: "text",
                    label: "",
                    placeholder: "",
                    required: false,
                  });
                }}
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </Button>
            </div>

            <Button
              onClick={handleAddCustomField}
              disabled={!newField.name || !newField.label || duplicateNameError}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 min-w-[120px]"
            >
              <Plus className="h-4 w-4" />
              <span>Add Field</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating action buttons for mobile */}
      <div className="fixed right-6 bottom-6 z-30 flex flex-col gap-3 xl:hidden">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={scrollToPreview}
            className="rounded-full h-12 w-12 p-0 bg-violet-600 hover:bg-violet-700 text-white shadow-lg"
          >
            <EyeIcon className="h-5 w-5" />
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={saveConfiguration}
            className="rounded-full h-14 w-14 p-0 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg"
          >
            <Save className="h-6 w-6" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default observer(PageFormSettings);
