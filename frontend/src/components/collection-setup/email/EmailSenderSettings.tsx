import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Mail,
  CheckCircle,
  Users,
  UserCircle,
  X,
  Info,
  Laptop,
  Save,
  ChevronRight,
  Zap,
  RefreshCw,
  Edit,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CollectionSettings } from "@/types/setup";
import { defaultSettings } from "../defaultSettings";

// Animation variants
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

interface EmailSenderSettingsProps {
  settings: CollectionSettings["email"];
  onUpdateSettings: (field: string, value: string) => void;
}

const EmailSenderSettings: React.FC<EmailSenderSettingsProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [senderMode, setSenderMode] = useState<"company" | "personal">(
    "company"
  );
  const [showSignatureEditor, setShowSignatureEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  // const [signatureTemplate, setSignatureTemplate] = useState("minimal");
  const [verificationStatus] = useState<"verified" | "pending" | "none">(
    "verified"
  );

  const signatureText =
    settings.signatureText ||
    `Best regards,\n${settings.senderName}\nCustomer Success`;

  // Function to handle avatar upload
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === "string") {
          // setSenderAvatar(event.target.result);
          onUpdateSettings("companyLogo", event.target.result);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Function to remove avatar
  const handleRemoveAvatar = () => {
    onUpdateSettings("companyLogo", "");
  };

  // Function for email domain validation
  const validateEmailDomain = (email: string) => {
    const domain = email.split("@")[1];
    return domain && (domain.includes(".") || domain === "localhost");
  };

  // Helper to get verification badge
  const getVerificationBadge = () => {
    if (verificationStatus === "verified") {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          <span>Verified</span>
        </Badge>
      );
    } else if (verificationStatus === "pending") {
      return (
        <Badge className="bg-amber-100 text-amber-800 border-amber-200 flex items-center gap-1">
          <RefreshCw className="h-3 w-3" />
          <span>Pending</span>
        </Badge>
      );
    }
    return null;
  };

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Email Sender Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Email Sender Settings</CardTitle>
          <CardDescription>
            Configure how your email appears to recipients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sender Type Selection */}
          <div className="space-y-4">
            <Label>Sender Type</Label>
            <RadioGroup
              value={senderMode}
              onValueChange={(value) =>
                setSenderMode(value as "company" | "personal")
              }
              className="grid grid-cols-2 gap-4"
            >
              <div
                className={cn(
                  "flex items-start space-x-3 rounded-lg border p-4 cursor-pointer transition-all",
                  senderMode === "company"
                    ? "border-blue-200 bg-blue-50"
                    : "hover:bg-gray-50"
                )}
              >
                <RadioGroupItem value="company" id="company" className="mt-1" />
                <div className="space-y-1.5">
                  <Label htmlFor="company" className="text-base cursor-pointer">
                    Company
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Send emails from your company name to maintain brand
                    consistency
                  </p>
                </div>
              </div>

              <div
                className={cn(
                  "flex items-start space-x-3 rounded-lg border p-4 cursor-pointer transition-all",
                  senderMode === "personal"
                    ? "border-blue-200 bg-blue-50"
                    : "hover:bg-gray-50"
                )}
              >
                <RadioGroupItem
                  value="personal"
                  id="personal"
                  className="mt-1"
                />
                <div className="space-y-1.5">
                  <Label
                    htmlFor="personal"
                    className="text-base cursor-pointer"
                  >
                    Personal
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Send from a team member's name for a more personal approach
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Sender Information */}
          <div className="space-y-4">
            <h3 className="text-base font-medium">Sender Information</h3>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-4 lg:col-span-2">
                <div className="space-y-3">
                  <Label htmlFor="sender-name">
                    {senderMode === "company" ? "Company Name" : "Sender Name"}
                  </Label>
                  <Input
                    id="sender-name"
                    placeholder={
                      senderMode === "company" ? "Your Company" : "John Smith"
                    }
                    value={settings.senderName}
                    onChange={(e) =>
                      onUpdateSettings("senderName", e.target.value)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    This name will appear in the "From" field of the email
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sender-email">From Email Address</Label>
                    {getVerificationBadge()}
                  </div>
                  <Input
                    id="sender-email"
                    placeholder="hello@yourcompany.com"
                    value={settings.senderEmail}
                    onChange={(e) =>
                      onUpdateSettings("senderEmail", e.target.value)
                    }
                    className={
                      !validateEmailDomain(settings.senderEmail) &&
                      settings.senderEmail
                        ? "border-red-300"
                        : ""
                    }
                  />
                  {!validateEmailDomain(settings.senderEmail) &&
                  settings.senderEmail ? (
                    <p className="text-xs text-red-500">
                      Please enter a valid email address
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      This email address must be verified to send emails
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="reply-to">Reply-To Email Address</Label>
                  <Input
                    id="reply-to"
                    placeholder="support@yourcompany.com"
                    value={settings.replyToEmail}
                    onChange={(e) =>
                      onUpdateSettings("replyToEmail", e.target.value)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Replies to your emails will go to this address
                  </p>
                </div>
              </div>

              {/* Sender Avatar/Logo Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>
                    {senderMode === "company"
                      ? "Company Logo"
                      : "Sender Avatar"}
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-slate-500"
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-xs">
                          Images in emails improve engagement by up to 30%.
                          Recommended size: 100x100px.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg border-gray-200 text-center">
                  {settings.companyLogo ? (
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        <AvatarImage
                          src={settings.companyLogo}
                          alt={settings.senderEmail}
                        />
                        <AvatarFallback>
                          {settings.senderEmail.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={handleRemoveAvatar}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="mx-auto rounded-full bg-gray-100 h-24 w-24 flex items-center justify-center text-gray-400">
                        {senderMode === "company" ? (
                          <Users className="h-12 w-12" />
                        ) : (
                          <UserCircle className="h-12 w-12" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label
                          htmlFor="avatar-upload"
                          className="text-sm font-medium cursor-pointer text-blue-600 hover:text-blue-700"
                        >
                          Upload {senderMode === "company" ? "logo" : "avatar"}
                        </Label>
                        <p className="text-xs text-gray-500">
                          SVG, PNG, JPG (max. 1MB)
                        </p>
                        <Input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarUpload}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {senderMode === "personal" && (
                  <div className="space-y-2 mt-2">
                    <Label htmlFor="sender-title">Sender Title</Label>
                    <Input
                      id="sender-title"
                      placeholder="Customer Success Manager"
                    />
                    <p className="text-xs text-muted-foreground">
                      Job title to display under the sender's name
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Email Signature */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium">Email Signature</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSignatureEditor(true)}
              >
                <Edit className="h-4 w-4 mr-1.5" />
                Edit Signature
              </Button>
            </div>

            <div className="p-4 border rounded-lg bg-gray-50">
              <div className="bg-white p-4 border rounded-lg">
                <div className="space-y-3">
                  <p className="text-sm">Best regards,</p>
                  <div className="flex items-center gap-3">
                    {settings.companyLogo ? (
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={settings.companyLogo}
                          alt={settings.senderName}
                        />
                        <AvatarFallback>
                          {settings.senderName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        {settings.senderName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{settings.senderName}</p>
                      <p className="text-xs text-gray-500">
                        {senderMode === "personal"
                          ? "Customer Success Manager"
                          : ""}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(true)}
              >
                <Laptop className="h-4 w-4 mr-1.5" />
                Preview in Email
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6 flex justify-between">
          <Button
            variant="outline"
            className="flex items-center gap-1.5"
            onClick={() => {
              onUpdateSettings(
                "companyLogo",
                defaultSettings.email.companyLogo || ""
              );
              onUpdateSettings("senderName", defaultSettings.email.senderName);
              onUpdateSettings(
                "senderEmail",
                defaultSettings.email.senderEmail
              );
              onUpdateSettings(
                "replyToEmail",
                defaultSettings.email.replyToEmail
              );
              onUpdateSettings(
                "signatureText",
                defaultSettings.email.signatureText || ""
              );
              onUpdateSettings("senderType", defaultSettings.email.senderType);
              onUpdateSettings(
                "signatureTemplate",
                defaultSettings.email.signatureTemplate
              );
            }}
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reset to Default</span>
          </Button>
          <Button className="flex items-center gap-1.5">
            <Save className="h-4 w-4" />
            <span>Save Settings</span>
          </Button>
        </CardFooter>
      </Card>

      {/* Best Practices and Tips */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-blue-100 rounded-lg text-blue-700 flex-shrink-0 mt-0.5">
              <Zap className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-blue-900">
                Email Sender Best Practices
              </h3>
              <p className="text-sm text-blue-700">
                Follow these tips to improve deliverability and engagement:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                <div className="bg-white p-4 rounded-lg border border-blue-100 space-y-2">
                  <h4 className="font-medium text-sm text-gray-900 flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    Use a Human Name
                  </h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• 22% higher open rates</li>
                    <li>• Builds personal connection</li>
                    <li>• Avoids spam filters</li>
                  </ul>
                </div>

                <div className="bg-white p-4 rounded-lg border border-blue-100 space-y-2">
                  <h4 className="font-medium text-sm text-gray-900 flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    Verify Email Domain
                  </h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Improves deliverability</li>
                    <li>• Set up SPF and DKIM</li>
                    <li>• Use branded domain</li>
                  </ul>
                </div>

                <div className="bg-white p-4 rounded-lg border border-blue-100 space-y-2">
                  <h4 className="font-medium text-sm text-gray-900 flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    Clear Reply Path
                  </h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Monitor reply-to inbox</li>
                    <li>• Quick response to replies</li>
                    <li>• Builds customer trust</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Signature Editor Dialog */}
      <Dialog open={showSignatureEditor} onOpenChange={setShowSignatureEditor}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Email Signature Editor</DialogTitle>
            <DialogDescription>
              Customize the signature that appears at the bottom of your emails
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-base font-medium">Signature Style</h3>

                <div className="space-y-3">
                  <Label>Template</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {["minimal", "standard", "branded", "social"].map(
                      (template) => (
                        <div
                          key={template}
                          className={cn(
                            "border rounded-lg p-3 cursor-pointer transition-all",
                            settings.signatureTemplate === template
                              ? "border-blue-200 bg-blue-50"
                              : "hover:border-gray-300"
                          )}
                          onClick={() =>
                            onUpdateSettings("signatureTemplate", template)
                          }
                        >
                          <p className="font-medium text-sm capitalize mb-1">
                            {template}
                          </p>
                          <div className="h-12 bg-gray-100 rounded-md flex items-center justify-center">
                            <div className="w-full p-1">
                              <div className="h-2 w-16 bg-gray-200 rounded-full mx-auto mb-1"></div>
                              <div className="h-2 w-10 bg-gray-200 rounded-full mx-auto"></div>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="signature-text">Custom Text</Label>
                  <Textarea
                    id="signature-text"
                    value={signatureText}
                    onChange={(e) =>
                      onUpdateSettings("signatureText", e.target.value)
                    }
                    rows={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the text you want to appear in your signature
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="include-logo">Include Logo/Avatar</Label>
                    <Switch id="include-logo" checked={true} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Display your logo or avatar in the email signature
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="include-social">Include Social Links</Label>
                    <Switch
                      id="include-social"
                      checked={settings.signatureTemplate === "social"}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Add social media links to your signature
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-medium">Preview</h3>

                <div className="border rounded-lg p-4 bg-white">
                  <div className="space-y-3">
                    <p className="text-sm">{signatureText?.split("\n")[0]}</p>
                    <div className="flex items-center gap-3">
                      {settings.companyLogo ? (
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={settings.companyLogo}
                            alt={settings.senderName}
                          />
                          <AvatarFallback>
                            {settings.senderName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          {settings.senderName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{settings.senderName}</p>
                        <p className="text-xs text-gray-500">
                          {signatureText?.split("\n").slice(1).join(" · ")}
                        </p>
                      </div>
                    </div>

                    {settings.signatureTemplate === "social" && (
                      <div className="flex gap-2 mt-2">
                        {["twitter", "linkedin", "facebook"].map((social) => (
                          <div
                            key={social}
                            className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center"
                          >
                            <div className="w-3 h-3 bg-gray-400 rounded-sm"></div>
                          </div>
                        ))}
                      </div>
                    )}

                    {settings.signatureTemplate === "branded" && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-400">
                          www.yourcompany.com
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700">
                      Email signatures should be concise and professional.
                      Include only essential contact details to avoid spam
                      filters and maintain a clean appearance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSignatureEditor(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => setShowSignatureEditor(false)}>
              Apply Signature
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              Preview how your email will appear to recipients
            </DialogDescription>
          </DialogHeader>

          <div className="bg-gray-100 p-4 rounded-lg max-h-[60vh] overflow-auto">
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="border-b px-4 py-2 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">
                      From: {settings.senderName} &lt;{settings.senderEmail}&gt;
                    </p>
                    <p className="text-xs text-gray-500">
                      To: john.doe@example.com
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  Preview
                </Badge>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">
                    Share Your Experience with Our Product
                  </h2>

                  <p className="text-gray-700">Hello John,</p>

                  <p className="text-gray-700">
                    Thank you for choosing our product. We'd love to hear about
                    your experience! Your feedback helps us improve and assists
                    other customers in making informed decisions.
                  </p>

                  <div className="py-4">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Share Your Feedback{" "}
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>

                  <p className="text-gray-700">
                    It will only take a minute of your time and would be
                    incredibly valuable to us.
                  </p>

                  <p className="text-gray-700">Thank you for your support!</p>

                  <div className="pt-4 border-t mt-6">
                    <div className="space-y-3">
                      <p className="text-sm">Best regards,</p>
                      <div className="flex items-center gap-3">
                        {settings.companyLogo ? (
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={settings.companyLogo}
                              alt={settings.senderName}
                            />
                            <AvatarFallback>
                              {settings.senderName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            {settings.senderName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{settings.senderName}</p>
                          <p className="text-xs text-gray-500">
                            {senderMode === "personal"
                              ? "Customer Success Manager"
                              : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowPreview(false)}>Close Preview</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default EmailSenderSettings;
