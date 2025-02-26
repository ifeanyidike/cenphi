import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

// Custom hook to detect desktop devices (adjust breakpoint as needed)
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);
  return isDesktop;
};

type MediaOption = "record" | "upload" | "transfer";

interface MediaOptionModalProps {
  onClose: () => void;
  onSelect: (option: MediaOption) => void;
  // Optionally you can pass a label (e.g. “Record Video” vs “Record Audio”)
  recordLabel?: string;
}

export default function MediaOptionModal({
  onClose,
  onSelect,
  recordLabel = "Record",
}: MediaOptionModalProps) {
  const [showQRCode, setShowQRCode] = useState(false);
  const isDesktop = useIsDesktop();

  const handleSelect = (option: MediaOption) => {
    if (option === "transfer") {
      // Instead of immediately calling onSelect, show the QR code view.
      setShowQRCode(true);
    } else {
      onSelect(option);
      onClose();
    }
  };

  const handleBack = () => {
    setShowQRCode(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-xl shadow-xl p-6 w-11/12 max-w-md relative"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.8 }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
          {!showQRCode ? (
            <div>
              <h3 className="text-xl font-semibold mb-4">Choose an option</h3>
              <div className="space-y-4">
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => handleSelect("record")}
                >
                  {recordLabel}
                </Button>
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => handleSelect("upload")}
                >
                  Upload from File
                </Button>
                {isDesktop && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleSelect("transfer")}
                  >
                    Transfer to Mobile
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">Transfer to Mobile</h3>
              <p className="text-gray-600 mb-4">
                Scan this QR code with your mobile device to continue on mobile.
              </p>
              <div className="flex justify-center mb-4">
                <QRCodeSVG value={window.location.href} size={180} />
              </div>
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
