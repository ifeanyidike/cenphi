// src/components/collection-setup/email/EmailAdvancedSettings.tsx
import React from "react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ExternalLink,
  Lock,
  Shield,
  Zap,
  AlertCircle,
  CheckCircle2,
  Database,
  Server,
} from "lucide-react";
import { CollectionSettings } from "@/types/setup";

interface EmailAdvancedSettingsProps {
  advanced?: CollectionSettings["email"]["advanced"];
  onSettingsChange: (field: string, value: any) => void;
}

const EmailAdvancedSettings: React.FC<EmailAdvancedSettingsProps> = ({
  advanced = {
    esp: "native",
    espApiKey: "",
    unsubscribeLink: true,
    emailValidation: true,
  },
  onSettingsChange,
}) => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        when: "beforeChildren",
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-slate-900">
            Advanced Email Settings
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Configure email service provider integration and advanced options
          </p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="h-5 w-5 text-indigo-500" />
              Email Service Provider
            </CardTitle>
            <CardDescription>
              Select the service that will send your testimonial request emails
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {[
                { value: "native", label: "Native" },
                { value: "mailchimp", label: "Mailchimp" },
                { value: "sendgrid", label: "SendGrid" },
                { value: "ses", label: "Amazon SES" },
                { value: "mailgun", label: "Mailgun" },
              ].map((provider) => (
                <div
                  key={provider.value}
                  className={`border rounded-lg p-3 flex flex-col items-center gap-2 cursor-pointer transition-all ${
                    advanced.esp === provider.value
                      ? "border-indigo-200 bg-indigo-50/50 shadow-sm"
                      : "hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => onSettingsChange("esp", provider.value)}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center bg-white ${
                      advanced.esp === provider.value
                        ? "border-indigo-200 border"
                        : "border border-gray-100"
                    }`}
                  >
                    {provider.value === "native" && (
                      <Database className="h-6 w-6 text-indigo-500" />
                    )}
                    {provider.value === "mailchimp" && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 32 32"
                        className="h-6 w-6"
                      >
                        <path
                          fill="#FFE01B"
                          d="M27.996 14.816a3.084 3.084 0 0 0-1.117-1.925 2.578 2.578 0 0 0-1.712-2.78c.084-.084.084-.167.084-.251 0-.084-.084-.167-.168-.167-1.025.167-1.88.67-2.484 1.423a3.041 3.041 0 0 0-2.568-1.255 5.558 5.558 0 0 0-2.736.67c-.252-.502-.42-.92-.672-1.339-.084-.167-.252-.251-.42-.251-.084 0-.168.084-.252.168-.252.335-.252 1.17.168 2.61-.672.25-1.26.587-1.428.67-.756.335-.84.335-.84.67 0 .168.084.335.168.418.084.84.168.84.252.084a3.2 3.2 0 0 0 .756-.251c-.337 1.76-.169 3.447.42 4.117.336.335.757.586 1.261.586h.084c.504 0 .924-.335 1.26-.67.168-.251.252-.419.336-.67.084.335.084.67.168 1.005-.924.251-1.88.754-2.064 1.005 0 0 0 .083.084.083.084 0 .084 0 .168-.083.336-.084 1.596-.67 1.932-.755.084.251.168.503.168.67.084.167.168.335.168.502-.924.67-1.932 1.09-2.988 1.09-.084 0-.252.084-.252.168 0 0 0 .084.084.084.168 0 .336.084.504.084a3.31 3.31 0 0 0 2.232-1.09c.336.168.672.336.924.42 0 .083-.084.251-.084.419a.433.433 0 0 0 .42.419c.084 0 .168 0 .336-.084.168-.167.252-.503.252-1.34.756.168 1.428.168 2.232.084.084 0 .084-.084.084-.084 0-.084-.084-.084-.168-.084a4.985 4.985 0 0 1-1.88-.67c.252-.335.504-.67.672-.921.336-.67.672-1.34.756-2.024.672.838 1.428 1.256 2.4 1.256h.084c.756 0 1.428-.335 1.848-1.005.42-.586.588-1.34.42-2.107.588.251 1.008.67 1.26 1.173.168.335.168.754.168 1.173 0 1.088-.504 2.26-1.344 3.03a2.92 2.92 0 0 1-1.848.586h-.168c-.084 0-.084.084-.084.084s.084.084.168.084c2.316.251 4.364-1.173 4.952-3.28.168-.502.168-1.089.084-1.591z"
                        />
                        <path
                          fill="#EFAA0F"
                          d="M16.56 11.956c-.252.754-.42 1.675.42 2.345-3.156-.335-4.7-2.862-3.744-5.456-2.064.251-3.072 2.009-2.568 3.783-1.092-.251-1.512-1.423-1.008-2.595-2.988 1.005-2.82 5.959 1.344 7.214-.924-1.256-1.26-3.53-.672-5.04-.336 2.51.42 4.618 2.064 5.876 0-.754-.084-1.507 0-2.176-1.008 2.678.336 4.87 2.988 5.29-.42-.67-.756-1.591-.84-2.343.336.586.756 1.088 1.176 1.507.42 0 .84-.167 1.176-.251a.79.79 0 0 0 .672-.754c-.42.168-1.26 0-1.68-.42a.497.497 0 0 0 .42.168c.084 0 .252-.167.336-.335-2.484-.42-4.2-2.52-3.492-5.04-1.428 2.176-.168 4.954 2.568 5.876-.42-.586-.672-1.423-.672-2.176a4.61 4.61 0 0 0 .672 1.76c1.26.082 2.4-.42 3.072-1.257-1.26.503-2.568-.084-3.24-1.339-.336-.586-.42-1.34-.252-2.01a.744.744 0 0 0-.756-.587c-.084 0-.168 0-.336.084-.756.335-.588 1.507 0 2.43-.336-.252-.504-.67-.504-1.173 0-.251.084-.67.168-.92.084-.168 0-.336-.168-.42-.084 0-.168 0-.336.084-.168.251-.42.67-.42 1.173-.084 1.088.504 2.009 1.596 2.428-1.344-.503-2.064-1.844-1.764-3.279.084-.335.252-.754.42-1.089.84-.67.084-.67-.084-.586-.588.251-1.092.838-1.428 1.507-.336.754-.336 1.675 0 2.43-1.68-1.089-1.68-3.28 0-4.284.252-.168.504-.336.756-.42.084-.083.084-.167 0-.167-.42-.168-.924 0-1.344.168-1.68.67-2.484 2.51-1.932 4.117-.672-1.005-.756-2.177-.168-3.28.168-.334.42-.586.672-.838.084-.84.084-.167.084-.251 0-.084-.084-.084-.168-.084-.84.083-1.512.67-1.932 1.34-1.092 1.675-.672 3.95 1.008 5.122-1.176-1.005-1.68-2.51-1.26-3.95.168-.67.504-1.255.924-1.76.084-.84.084-.168 0-.168-.672-.167-1.428.084-1.932.502-1.848 1.843-1.26 5.122 1.344 6.38-1.176-.503-2.064-1.507-2.4-2.763-.252-.92-.168-1.925.252-2.845.084-.84.084-.168 0-.168-.756-.167-1.512.168-2.064.67-1.512 1.34-1.764 3.614-.504 5.29-2.988-1.926-3.24-5.792-.504-8.067l2.736-2.177c-3.66.587-8.108 7.381-3.828 12.27 1.596 1.76 3.996 2.595 6.312 2.428 4.28-.419 7.604-3.866 7.604-8.151 0-.084 0-.084-.084-.168l.084-.168c.084-.084.084-.167.084-.251 0-.168-.168-.252-.336-.252a.413.413 0 0 0-.42.252c-.168.167-.252.335-.336.586-.504-3.28-3.156-5.792-6.396-6.211l-2.82 2.176c3.072-.335 5.892 1.507 6.9 4.37 0-.503-.084-1.005-.252-1.424.168 0 .336-.084.42-.168a.339.339 0 0 0 .084-.335c-.084-.084-.168-.084-.252-.084h-.084c-.084 0-.168.084-.252.084-.252-.587-.588-1.173-1.008-1.591.084 0 .168-.084.252-.084a.339.339 0 0 0 .084-.335c-.084-.084-.168-.084-.252-.084h-.084c-.168 0-.252.083-.336.167-.42-.335-.84-.67-1.344-.922.084 0 .168-.083.252-.167a.339.339 0 0 0 .084-.335c-.084-.084-.168-.084-.252-.084-.168 0-.336.084-.42.167-1.092-.419-2.316-.586-3.576-.335-.084 0-.084 0-.084.084 0 0 0 .084.084.084 1.764.335 3.324 1.09 4.448 2.344-.924-.502-2.064-.754-3.156-.419-.084 0-.084.084-.084.084 0 .084 0 .084.084.084 1.344.335 2.4.838 3.24 1.76-.84-.168-1.68-.084-2.4.251 0 0-.084.084-.084.084 0 .084.084.084.084.084.672.167 1.344.419 1.932.755-.756-.084-1.68.251-2.232.838 0 0-.084.084 0 .167 0 0 .084.084.168.084.42 0 .84.084 1.176.167-2.148.42-3.324 2.343-2.652 4.284-.336-2.008.504-3.95 2.148-5.122.42-.335.84-.586 1.344-.837.084-.084.084-.168 0-.168-1.176-.335-2.4.084-3.324.754-1.848 1.34-2.4 3.866-1.428 5.876-3.744-1.843-3.408-6.883 0-8.235.42-.167.756-.251 1.176-.335.084 0 .084-.084.084-.168-.084-.083-.084-.167-.168-.167-1.68.167-3.072 1.173-3.744 2.679-.756 1.675-.504 3.614.672 5.122-2.316-1.507-2.988-4.451-1.596-6.797.084-.168.252-.335.336-.503.084-.83.084-.167 0-.167a2.71 2.71 0 0 0-2.232.838c-1.764 1.843-1.512 4.954.588 6.462-3.828-2.09-3.492-7.297.504-8.907 3.744-1.423 7.856.838 8.444 4.87a7.256 7.256 0 0 0-.168-2.847c.672.92 1.176 1.926 1.26 3.03.168-.754.336-1.507.504-2.177 0-.083-.084-.167-.168-.251 0-.084 0-.168.084-.335 0-.084 0-.167.084-.251 0-.168-.084-.335-.252-.335a.393.393 0 0 0-.42.251c-.084.335-.168.67-.252 1.09-.42-1.675-1.512-3.03-3.072-3.95.924.084 1.764.419 2.484 1.005.084.08.252.08.336-.084z"
                        />
                      </svg>
                    )}
                    {provider.value === "sendgrid" && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 256 256"
                        className="h-6 w-6"
                      >
                        <path
                          fill="#1A82E2"
                          d="M85.334 85.333H0V256h170.667V85.333z"
                        />
                        <path fill="#9DE1F9" d="M85.334 0v170.667H256V0z" />
                        <path
                          fill="#00B2E3"
                          d="M0 256h85.333v-85.333H0zm170.667-170.667H256V0h-85.333z"
                        />
                        <path
                          fill="#1A82E2"
                          d="M85.334 170.667h85.333V85.333H85.334z"
                        />
                      </svg>
                    )}
                    {provider.value === "ses" && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="h-6 w-6"
                      >
                        <path
                          fill="#FF9900"
                          d="M13.443 13.214v2.374c0 .14.112.253.252.255h2.428c.14-.002.252-.114.252-.255v-2.374a.254.254 0 0 0-.252-.254h-2.428a.252.252 0 0 0-.252.254zm4.741-10.88a.254.254 0 0 0-.252-.254h-2.428a.254.254 0 0 0-.252.254v2.374c0 .14.112.254.252.254h2.428c.14 0 .252-.114.252-.254zm0 5.44a.254.254 0 0 0-.252-.254h-2.428a.254.254 0 0 0-.252.254v2.373c0 .141.112.254.252.254h2.428c.14 0 .252-.113.252-.254zm0 5.44a.254.254 0 0 0-.252-.254h-2.428a.254.254 0 0 0-.252.254v2.374c0 .141.112.255.252.255h2.428c.14 0 .252-.114.252-.255zm.617-13.14h3.149c.14 0 .252.113.252.254v18.56c0 .141-.112.254-.252.254H5.567a.254.254 0 0 1-.252-.254V.328c0-.141.112-.254.252-.254h8.333v4.54c0 .141.113.254.252.254h4.649V.074zM5.952 21.998h3.1V2.034h-3.1zM8.186 7.8h-1.37a.253.253 0 0 0-.252.254v2.374c0 .14.112.254.252.254h1.37a.252.252 0 0 0 .252-.254V8.054a.254.254 0 0 0-.252-.254zm0 5.414h-1.37a.253.253 0 0 0-.252.254v2.374c0 .14.112.255.252.255h1.37a.252.252 0 0 0 .252-.255v-2.374a.254.254 0 0 0-.252-.254zm0-10.83h-1.37a.253.253 0 0 0-.252.254v2.374c0 .14.112.254.252.254h1.37a.252.252 0 0 0 .252-.254V2.638a.254.254 0 0 0-.252-.254zm0 16.244h-1.37a.253.253 0 0 0-.252.254v2.374c0 .14.112.255.252.255h1.37a.252.252 0 0 0 .252-.255v-2.374a.254.254 0 0 0-.252-.254z"
                        />
                      </svg>
                    )}
                    {provider.value === "mailgun" && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 32 32"
                        className="h-6 w-6"
                      >
                        <path
                          fill="#F0303F"
                          d="M25.025 12.939l-5.465 4.63H25.025v-4.63zm-9.313 4.63l6.279-5.321-.103-.045-8.623-3.818-6.709 6.003 9.156 3.181zM10.554 15.489l5.734-5.137-5.734 5.137zM7.064 15.251L15.997 7.144 5.939 10.886a.605.605 0 0 0-.384.734l1.509 3.631z"
                        />
                        <path
                          fill="#F0303F"
                          d="M26.123 7.836c-1.374-1.12-6.389-4.427-7.431-3.269l-2.692 2.999 9.715 4.209c.41.172.67.56.67.989v9.805h1.65a1.107 1.107 0 0 0 1.112-1.096V11.269c0-.5-.266-.965-.695-1.222l-2.329-1.387 2.207-4.142a.637.637 0 0 0-.029-.664.587.587 0 0 0-.202-.188.635.635 0 0 0-.483-.089l-.01.004-.01.004a.652.652 0 0 0-.278.141c-.71.64-.424.181-.424.181zM5.47 17.569l-2.31 2.269a1.252 1.252 0 0 0 0 1.806l4.371 4.187a1.25 1.25 0 0 0 .867.347 1.26 1.26 0 0 0 .867-.347l2.31-2.269-1.729-.601a1.226 1.226 0 0 1-.782-.748L5.47 17.57zM26.025 19.3H14.902L6.56 22.214l12.471 5.542a1.24 1.24 0 0 0 1.058-.061l11.061-6.574V20.403a1.11 1.11 0 0 0-1.112-1.096l-3.013-.007z"
                        />
                      </svg>
                    )}
                  </div>
                  <h4 className="font-medium text-sm text-center">
                    {provider.label}
                  </h4>
                  {advanced.esp === provider.value && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {advanced.esp && advanced.esp !== "native" && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="h-5 w-5 text-indigo-500" />
                {advanced.esp === "ses"
                  ? "Amazon SES"
                  : advanced.esp.charAt(0).toUpperCase() +
                    advanced.esp.slice(1)}{" "}
                Integration
              </CardTitle>
              <CardDescription>
                Connect your email service provider account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="esp-api-key" className="text-sm">
                  API Key
                </Label>
                <div className="relative">
                  <Input
                    id="esp-api-key"
                    type="password"
                    value={advanced.espApiKey || ""}
                    onChange={(e) =>
                      onSettingsChange("espApiKey", e.target.value)
                    }
                    placeholder={`Enter your ${advanced.esp} API key`}
                    className="pr-10"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  <a
                    href={`https://${advanced.esp}.com/docs`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    How to find your API key
                  </a>
                </p>
              </div>

              {/* Show extra fields based on ESP type */}
              {advanced.esp === "mailchimp" && (
                <div className="space-y-2">
                  <Label htmlFor="list-id" className="text-sm">
                    Audience ID (optional)
                  </Label>
                  <Input
                    id="list-id"
                    type="text"
                    value={advanced.listId || ""}
                    onChange={(e) => onSettingsChange("listId", e.target.value)}
                    placeholder="e.g., abc123def"
                  />
                </div>
              )}

              <div className="pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                  onClick={() => {
                    // In a real app, this would verify the API key
                    alert("Connection verified successfully!");
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Verify Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-500" />
              Email Compliance
            </CardTitle>
            <CardDescription>
              Settings to ensure email deliverability and compliance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="unsubscribe-link" className="text-sm">
                  Include Unsubscribe Link
                </Label>
                <p className="text-xs text-muted-foreground">
                  Required by anti-spam laws (CAN-SPAM, GDPR)
                </p>
              </div>
              <Switch
                id="unsubscribe-link"
                checked={advanced.unsubscribeLink !== false}
                onCheckedChange={(checked) =>
                  onSettingsChange("unsubscribeLink", checked)
                }
                disabled={true} // Required by law
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-validation" className="text-sm">
                  Email Validation
                </Label>
                <p className="text-xs text-muted-foreground">
                  Verify email addresses before sending to reduce bounces
                </p>
              </div>
              <Switch
                id="email-validation"
                checked={advanced.emailValidation !== false}
                onCheckedChange={(checked) =>
                  onSettingsChange("emailValidation", checked)
                }
              />
            </div>

            <div className="space-y-0.5 pt-2">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm">
                <div className="flex gap-3">
                  <Zap className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800 mb-1">
                      Automatic Email Analytics
                    </h4>
                    <p className="text-xs text-blue-700">
                      We automatically track email opens, clicks, and engagement
                      to help you optimize your testimonial collection. View
                      detailed analytics in the Analytics tab.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {advanced.esp === "native" && (
        <motion.div variants={itemVariants}>
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="p-5">
              <div className="flex gap-4">
                <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800 mb-1">
                    Email Sending Limits
                  </h4>
                  <p className="text-sm text-amber-700">
                    Using our native email service, you can send up to 2,000
                    testimonial request emails per month. For higher volume,
                    please connect an external email service provider.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 h-8 bg-white border-amber-200 text-amber-700 hover:bg-amber-100"
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    <span>Learn More</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default EmailAdvancedSettings;
