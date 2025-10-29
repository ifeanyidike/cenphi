import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Copy,
  Check,
  Link,
  Mail,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { workspaceHub } from "@/repo/workspace_hub";
import { observer } from "mobx-react-lite";

interface CollectLinkShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CollectLinkShareModal: React.FC<CollectLinkShareModalProps> = observer(({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const workspaceId = workspaceHub.workspace?.id;
  const collectUrl = `${window.location.origin}/collect?workspace_id=${workspaceId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(collectUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const shareToEmail = () => {
    const subject = encodeURIComponent("Share Your Experience");
    const body = encodeURIComponent(
      `Hi,\n\nWe'd appreciate your feedback. Please share your experience here:\n${collectUrl}\n\nThank you!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  const shareToWhatsApp = () => {
    const message = encodeURIComponent(
      `Please share your experience: ${collectUrl}`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
          className="bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center space-x-2.5">
              <div className="w-6 h-6 bg-gray-50 rounded-md flex items-center justify-center">
                <Link className="h-3 w-3 text-gray-500" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900">
                Share Link
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-6 h-6 rounded-md hover:bg-gray-50 flex items-center justify-center transition-colors"
            >
              <X className="h-3.5 w-3.5 text-gray-400" />
            </button>
          </div>

          <div className="px-5 py-4 space-y-4">
            {/* Link Section */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                Collection URL
              </label>
              <div className="flex items-center space-x-2 p-2.5 bg-gray-25 border border-gray-100 rounded-lg">
                <code className="flex-1 text-xs text-gray-700 font-mono leading-relaxed break-all">
                  {collectUrl}
                </code>
                <Button
                  onClick={handleCopyLink}
                  size="sm"
                  variant={copied ? "default" : "outline"}
                  className={`shrink-0 h-7 px-2.5 text-xs ${
                    copied
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                      : "border-gray-200 text-gray-600 hover:bg-gray-25"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Done
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Share Options */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                Share
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={shareToEmail}
                  variant="outline"
                  size="sm"
                  className="flex items-center justify-center space-x-1.5 py-2 h-8 border-gray-200 hover:bg-gray-25 text-xs"
                >
                  <Mail className="h-3 w-3 text-gray-500" />
                  <span className="text-gray-600">Email</span>
                </Button>

                <Button
                  onClick={shareToWhatsApp}
                  variant="outline"
                  size="sm"
                  className="flex items-center justify-center space-x-1.5 py-2 h-8 border-gray-200 hover:bg-gray-25 text-xs"
                >
                  <MessageSquare className="h-3 w-3 text-gray-500" />
                  <span className="text-gray-600">WhatsApp</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 bg-gray-25 border-t border-gray-50">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs text-gray-500 hover:text-gray-700 h-7 px-2"
            >
              Close
            </Button>
            <Button
              onClick={() => window.open(collectUrl, "_blank")}
              size="sm"
              className="bg-gray-900 hover:bg-gray-800 text-white text-xs h-7 px-3"
            >
              <ExternalLink className="h-3 w-3 mr-1.5" />
              Preview
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

export default CollectLinkShareModal;
