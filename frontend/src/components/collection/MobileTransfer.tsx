import React, { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Smartphone,
  ArrowRight,
  Copy,
  CheckCircle2,
  ArrowUpRight,
  Shield,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { observer } from "mobx-react-lite";
import { collectionStore } from "@/stores/collectionStore";

const MobileTransfer: React.FC = observer(() => {
  const [transferUrl, setTransferUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [qrHovered, setQrHovered] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(true);
  const sessionId = collectionStore.sessionId;

  useEffect(() => {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/transfer/${sessionId}`;
    setTransferUrl(url);
    // Simulate QR code generation delay
    setTimeout(() => setIsGeneratingQR(false), 1500);
  }, [sessionId]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(transferUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        type: "spring",
        stiffness: 100,
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8  min-h-screen">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-12 rounded-[2.5rem] bg-white border border-gray-200 shadow-lg relative overflow-hidden"
      >
        {/* Background Gradient Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-200 via-blue-100 to-blue-50 opacity-50" />

        {/* Content Container */}
        <div className="relative z-10 text-center space-y-10">
          {/* Security Badge */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 border border-gray-300"
          >
            <Shield className="h-4 w-4 text-blue-700" />
            <span className="text-sm text-gray-800">
              End-to-end encrypted transfer
            </span>
          </motion.div>

          {/* Device Transfer Animation */}
          <motion.div variants={itemVariants} className="relative">
            <div className="flex items-center justify-center gap-8">
              <motion.div
                animate={{ y: [-2, 2, -2], rotate: [-1, 1, -1] }}
                transition={{
                  repeat: Infinity,
                  duration: 4,
                  ease: "easeInOut",
                }}
                className="p-6 rounded-2xl bg-gray-100 border border-gray-300"
              >
                <Smartphone className="h-10 w-10 text-gray-600" />
              </motion.div>

              <motion.div
                animate={{ x: [0, 10, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut",
                }}
                className="flex items-center gap-2"
              >
                <ArrowRight className="h-6 w-6 text-blue-700" />
                <ArrowRight className="h-6 w-6 text-blue-700 opacity-70" />
                <ArrowRight className="h-6 w-6 text-blue-700 opacity-40" />
              </motion.div>

              <motion.div
                animate={{ y: [-2, 2, -2], rotate: [1, -1, 1] }}
                transition={{
                  repeat: Infinity,
                  duration: 4,
                  ease: "easeInOut",
                }}
                className="p-6 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-500 border border-blue-500/20"
              >
                <Smartphone className="h-10 w-10 text-white" />
              </motion.div>
            </div>
          </motion.div>

          {/* Title and Description */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Continue on Mobile
            </h2>
            <p className="text-lg text-gray-600 max-w-md mx-auto">
              Scan the QR code or copy the link to seamlessly continue your
              session on your mobile device.
            </p>
          </motion.div>

          {/* QR Code Container */}
          <motion.div variants={itemVariants} className="flex justify-center">
            <motion.div
              whileHover={{ scale: 1.02 }}
              onHoverStart={() => setQrHovered(true)}
              onHoverEnd={() => setQrHovered(false)}
              className="relative p-8 rounded-3xl bg-white backdrop-blur-sm border border-gray-200 shadow-md"
            >
              <AnimatePresence>
                {isGeneratingQR && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-gray-50/80 rounded-3xl backdrop-blur-sm"
                  >
                    <Loader2 className="h-8 w-8 text-blue-700 animate-spin" />
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.div
                animate={{ scale: qrHovered ? 1.02 : 1 }}
                transition={{ duration: 0.2 }}
              >
                <QRCodeSVG
                  value={transferUrl}
                  size={280}
                  level="H"
                  includeMargin={true}
                  className="rounded-2xl"
                />
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <motion.button
              onClick={handleCopy}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-blue-700 hover:bg-blue-800 text-white transition-colors duration-200"
              aria-label="Copy transfer link"
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.div
                    key="check"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Copy className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
              <span className="font-medium">
                {copied ? "Copied!" : "Copy Link"}
              </span>
            </motion.button>

            <motion.a
              href={transferUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-gray-800 hover:bg-gray-900 text-white transition-colors duration-200"
              aria-label="Open transfer link in new tab"
            >
              <span className="font-medium">Open Link</span>
              <ArrowUpRight className="h-5 w-5" />
            </motion.a>
          </motion.div>

          {/* Session Info */}
          <motion.p variants={itemVariants} className="text-sm text-gray-500">
            Session ID: {sessionId.slice(0, 8)}...{sessionId.slice(-8)}
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
});

export default MobileTransfer;
