import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Mail,
  Upload,
  Send,
  CheckCircle,
  AlertCircle,
  Users,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Papa from "papaparse";
import { workspaceHub } from "@/repo/workspace_hub";
import { observer } from "mobx-react-lite";

interface TestimonialRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EmailData {
  email: string;
  name?: string;
}

const TestimonialRequestModal: React.FC<TestimonialRequestModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [mode, setMode] = useState<"single" | "csv">("single");
  const [singleEmail, setSingleEmail] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [emails, setEmails] = useState<EmailData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSingleEmailSubmit = async () => {
    if (!singleEmail.trim()) {
      setError("Please enter an email address");
      return;
    }

    if (!isValidEmail(singleEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      if (!workspaceHub.workspace?.id) {
        setError("No workspace found. Please refresh and try again.");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/mailing/testimonial-request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workspace_id: workspaceHub.workspace.id,
            contact_email: singleEmail.trim(),
            contact_name: "", // Will be set to default by backend
            company_name: "", // Will be set to default by backend
            template_name: "testimonial_request", // Default template
          }),
        }
      );

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          resetModal();
          onClose();
        }, 2000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to send testimonial request"
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send request. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a CSV file");
      return;
    }

    setCsvFile(file);
    setError("");
    setEmails([]); // Reset emails

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validEmails: EmailData[] = [];
        const invalidRows: string[] = [];

        if (results.data.length === 0) {
          setError("CSV file is empty or has no valid data");
          return;
        }

        // Check if CSV has required headers
        const headers = results.meta.fields || [];
        const hasEmailHeader = headers.some(
          (h) =>
            h && ["email", "Email", "EMAIL", "e-mail", "E-mail"].includes(h)
        );

        if (!hasEmailHeader) {
          setError(
            "CSV must contain an 'email' column. Expected format: email, name (optional)"
          );
          return;
        }

        results.data.forEach((row: any, index: number) => {
          const email =
            row.email ||
            row.Email ||
            row.EMAIL ||
            row["e-mail"] ||
            row["E-mail"];
          const name =
            row.name ||
            row.Name ||
            row.NAME ||
            row["full_name"] ||
            row["Full Name"];

          if (!email || !email.trim()) {
            invalidRows.push(`Row ${index + 2}: Missing email`);
            return;
          }

          if (!isValidEmail(email.trim())) {
            invalidRows.push(
              `Row ${index + 2}: Invalid email format (${email})`
            );
            return;
          }

          validEmails.push({
            email: email.trim(),
            name: name?.trim() || undefined,
          });
        });

        if (validEmails.length === 0) {
          setError(
            "No valid emails found in the CSV file. Please check the format and try again."
          );
          return;
        }

        if (invalidRows.length > 0) {
          setError(
            `Found ${invalidRows.length} invalid entries:\n${invalidRows.slice(0, 5).join("\n")}${invalidRows.length > 5 ? "\n..." : ""}`
          );
        }

        setEmails(validEmails);
      },
      error: () => {
        setError(
          "Failed to parse CSV file. Please ensure it's a valid CSV format with headers."
        );
      },
    });
  };

  const handleCsvSubmit = async () => {
    if (emails.length === 0) {
      setError("No valid emails found in the CSV file");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      if (!workspaceHub.workspace?.id) {
        setError("No workspace found. Please refresh and try again.");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/mailing/bulk-testimonial-request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workspace_id: workspaceHub.workspace.id,
            recipients: emails.map((e) => ({
              name: e.name || "Valued Customer",
              email: e.email,
              company: "Your Organization",
            })),
            template_name: "testimonial_request",
          }),
        }
      );

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          resetModal();
          onClose();
        }, 2000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to send testimonial requests"
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send requests. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const resetModal = () => {
    setMode("single");
    setSingleEmail("");
    setCsvFile(null);
    setEmails([]);
    setIsLoading(false);
    setSuccess(false);
    setError("");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Request Testimonials
                </h3>
                <p className="text-sm text-gray-500">
                  Send requests to your customers
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {success ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </motion.div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Requests Sent Successfully!
                </h4>
                <p className="text-gray-600 text-sm">
                  {mode === "single"
                    ? "Your testimonial request has been sent."
                    : `${emails.length} testimonial requests have been sent.`}
                </p>
              </motion.div>
            ) : (
              <>
                {/* Mode Selection */}
                <div className="flex bg-gray-50 rounded-lg p-1 mb-6">
                  <button
                    onClick={() => setMode("single")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md transition-all text-sm font-medium ${
                      mode === "single"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Mail className="h-4 w-4" />
                    Single Email
                  </button>
                  <button
                    onClick={() => setMode("csv")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md transition-all text-sm font-medium ${
                      mode === "csv"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Upload className="h-4 w-4" />
                    CSV Upload
                  </button>
                </div>

                {/* Single Email Mode */}
                {mode === "single" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer Email Address
                      </label>
                      <input
                        type="email"
                        value={singleEmail}
                        onChange={(e) => setSingleEmail(e.target.value)}
                        placeholder="customer@example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* CSV Upload Mode */}
                {mode === "csv" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload CSV File
                      </label>
                      <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-gray-300 transition-colors">
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleCsvUpload}
                          className="hidden"
                          id="csv-upload"
                        />
                        <label htmlFor="csv-upload" className="cursor-pointer">
                          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">
                            Click to upload CSV file
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Expected columns: email, name (optional)
                          </p>
                        </label>
                      </div>
                      {csvFile && (
                        <div className="mt-2 p-2 bg-gray-50 rounded-md">
                          <p className="text-sm text-gray-700">
                            <strong>File:</strong> {csvFile.name}
                          </p>
                          {emails.length > 0 && (
                            <p className="text-sm text-green-600">
                              <Users className="h-4 w-4 inline mr-1" />
                              {emails.length} valid emails found
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div className="whitespace-pre-line">{error}</div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={
                      mode === "single"
                        ? handleSingleEmailSubmit
                        : handleCsvSubmit
                    }
                    disabled={
                      isLoading ||
                      (mode === "single" && !singleEmail.trim()) ||
                      (mode === "csv" && emails.length === 0)
                    }
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="h-4 w-4 mr-2"
                      >
                        <Sparkles className="h-4 w-4" />
                      </motion.div>
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    {isLoading
                      ? "Sending..."
                      : mode === "single"
                        ? "Send Request"
                        : `Send ${emails.length} Requests`}
                  </Button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default observer(TestimonialRequestModal);
