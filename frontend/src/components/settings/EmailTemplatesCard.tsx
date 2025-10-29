import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Edit, Save, Plus, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { workspaceHub } from "@/repo/workspace_hub";
import { observer } from "mobx-react-lite";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string;
  variables: string[];
  is_default: boolean;
  workspace_id?: string;
  created_at: string;
  updated_at: string;
}

const EmailTemplatesCard: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    if (!workspaceHub.workspace?.id) {
      console.warn("No workspace ID available for loading templates");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/mailing/workspaces/${workspaceHub.workspace.id}/templates`
      );

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to load templates");
      }
    } catch (error) {
      console.error("Failed to load email templates:", error);
      toast({
        title: "Failed to load templates",
        description: "Could not load email templates. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate || !workspaceHub.workspace?.id) {
      toast({
        title: "Cannot save template",
        description: "No workspace found or template data missing.",
        variant: "destructive",
      });
      return;
    }

    // Basic validation
    if (
      !editingTemplate.name.trim() ||
      !editingTemplate.subject.trim() ||
      !editingTemplate.html_content.trim()
    ) {
      toast({
        title: "Validation Error",
        description:
          "Please fill in all required fields: name, subject, and HTML content.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/mailing/workspaces/${workspaceHub.workspace.id}/templates`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editingTemplate),
        }
      );

      if (response.ok) {
        toast({
          title: "Template saved",
          description: "Email template has been saved successfully.",
        });
        setEditingTemplate(null);
        loadTemplates();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to save template");
      }
    } catch (error) {
      console.error("Failed to save template:", error);
      toast({
        title: "Failed to save template",
        description:
          error instanceof Error
            ? error.message
            : "Could not save email template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const createNewTemplate = () => {
    const newTemplate: EmailTemplate = {
      id: "",
      name: "new_template",
      subject: "Request for Your Testimonial",
      html_content:
        "<p>Hi {{contact_name}},</p>\n<p>We hope you're doing well! We'd love to feature your experience with {{company_name}} in our testimonials.</p>\n<p>Would you mind sharing a quick testimonial about your experience? It would mean a lot to us.</p>\n<p><a href=\"{{collection_url}}\">Share Your Testimonial</a></p>\n<p>Thank you!</p>",
      text_content:
        "Hi {{contact_name}},\n\nWe hope you're doing well! We'd love to feature your experience with {{company_name}} in our testimonials.\n\nWould you mind sharing a quick testimonial about your experience? It would mean a lot to us.\n\nShare your testimonial here: {{collection_url}}\n\nThank you!",
      variables: ["contact_name", "company_name", "collection_url"],
      is_default: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setEditingTemplate(newTemplate);
  };

  return (
    <div className="space-y-6">
      {/* Main Email Templates Card */}
      <div className="bg-white border border-gray-200 rounded-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                Email Templates
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Customize email templates for testimonial requests
              </p>
            </div>
            <Button
              onClick={createNewTemplate}
              size="sm"
              className="text-xs h-7"
            >
              <Plus className="h-3 w-3 mr-2" />
              New Template
            </Button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400 mr-2" />
              <span className="text-xs text-gray-600">
                Loading templates...
              </span>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-900 mb-2">
                No Templates Found
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Create your first email template to customize testimonial
                requests
              </p>
              <Button
                onClick={createNewTemplate}
                size="sm"
                className="text-xs h-7"
              >
                <Plus className="h-3 w-3 mr-2" />
                Create Template
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-100 rounded p-4 hover:border-gray-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-50 rounded border border-gray-200 flex items-center justify-center">
                        <Mail className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {template.name
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </div>
                        <div className="text-xs text-gray-500">
                          {template.subject}
                        </div>
                        {template.is_default && (
                          <div className="text-xs text-blue-600 font-medium">
                            Default Template
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => setEditingTemplate(template)}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                    >
                      <Edit className="h-3 w-3 mr-2" />
                      Edit
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Template Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-3xl mx-4 max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">
                {editingTemplate.id ? "Edit Template" : "Create Template"}
              </h3>
              <button
                onClick={() => setEditingTemplate(null)}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
              >
                <FileText className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={editingTemplate.name}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={editingTemplate.subject}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        subject: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  HTML Content
                </label>
                <textarea
                  value={editingTemplate.html_content}
                  onChange={(e) =>
                    setEditingTemplate({
                      ...editingTemplate,
                      html_content: e.target.value,
                    })
                  }
                  rows={8}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Text Content (Fallback)
                </label>
                <textarea
                  value={editingTemplate.text_content}
                  onChange={(e) =>
                    setEditingTemplate({
                      ...editingTemplate,
                      text_content: e.target.value,
                    })
                  }
                  rows={6}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs">
                <div className="font-medium text-blue-900 mb-1">
                  Available Variables:
                </div>
                <div className="text-blue-700 space-x-2">
                  <span>{`{contact_name}`}</span>
                  <span>{`{company_name}`}</span>
                  <span>{`{collection_url}`}</span>
                  <span>{`{custom_message}`}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setEditingTemplate(null)}
                size="sm"
                className="text-xs h-7"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveTemplate}
                disabled={
                  isSaving || !editingTemplate.name || !editingTemplate.subject
                }
                size="sm"
                className="text-xs h-7"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-3 w-3 mr-2" />
                    Save Template
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default observer(EmailTemplatesCard);
