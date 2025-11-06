import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  CheckCircle,
  ArrowRight,
  RefreshCcw,
  AlertCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { authStore } from "@/stores/authStore";
import { sendEmailVerification } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import SimpleModalPortal from "@/utils/SimpleModalPortal";

const VerifyEmailPending = observer(() => {
  const navigate = useNavigate();
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [showNotVerifiedModal, setShowNotVerifiedModal] = useState(false);

  useEffect(() => {
    if (authStore.user?.email) {
      setEmail(authStore.user.email);
    } else {
      // No user, redirect to signup
      navigate("/signup", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown(resendCooldown - 1),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (!authStore.user || resendCooldown > 0) return;

    try {
      await sendEmailVerification(authStore.user);
      setResendSuccess(true);
      setResendCooldown(60); // 60 second cooldown
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to resend verification email:", error);
    }
  };

  const handleCheckVerification = async () => {
    if (!authStore.user) return;

    await authStore.user.reload();
    if (authStore.user.emailVerified) {
      // Email verified, proceed to onboarding
      navigate("/onboarding", { replace: true });
    } else {
      // Not verified yet
      setShowNotVerifiedModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto relative"
          >
            <Mail className="w-8 h-8 text-white" strokeWidth={1.5} />
          </motion.div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-xl font-semibold text-gray-900">
              Verify your email
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed">
              We've sent a verification link to
            </p>
            <p className="text-sm font-medium text-gray-900">{email}</p>
          </div>

          {/* Instructions */}
          <div className="space-y-3 py-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-start gap-3"
            >
              <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-indigo-600">1</span>
              </div>
              <p className="text-sm text-gray-600">
                Check your inbox for an email from Cenphi
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-start gap-3"
            >
              <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-indigo-600">2</span>
              </div>
              <p className="text-sm text-gray-600">
                Click the verification link in the email
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-start gap-3"
            >
              <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-indigo-600">3</span>
              </div>
              <p className="text-sm text-gray-600">
                You'll be redirected to complete your setup
              </p>
            </motion.div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <Button
              onClick={handleCheckVerification}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 h-11 text-sm font-medium rounded-lg transition-all duration-200"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              I've verified my email
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-gray-500">or</span>
              </div>
            </div>

            <Button
              onClick={handleResendEmail}
              disabled={resendCooldown > 0}
              variant="outline"
              className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 h-11 text-sm font-medium rounded-lg transition-all duration-200"
            >
              <RefreshCcw
                className={`w-4 h-4 mr-2 ${resendCooldown > 0 ? "animate-spin" : ""}`}
              />
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : resendSuccess
                  ? "Email sent!"
                  : "Resend verification email"}
            </Button>
          </div>

          {/* Footer Note */}
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center leading-relaxed">
              Can't find the email? Check your spam folder or{" "}
              <button
                onClick={handleResendEmail}
                disabled={resendCooldown > 0}
                className="text-indigo-600 hover:text-indigo-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                request a new one
              </button>
            </p>
          </div>
        </div>

        {/* Help */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-center"
        >
          <p className="text-xs text-gray-500">
            Need help?{" "}
            <a
              href="mailto:support@cenphi.io"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Contact support
            </a>
          </p>
        </motion.div>
      </motion.div>

      {/* Not Verified Modal */}
      <SimpleModalPortal
        isOpen={showNotVerifiedModal}
        onClose={() => setShowNotVerifiedModal(false)}
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <h2 className="text-base font-semibold text-gray-900">
                Email Not Verified
              </h2>
            </div>
            <button
              onClick={() => setShowNotVerifiedModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5">
            <p className="text-sm text-gray-600 leading-relaxed">
              Your email hasn't been verified yet. Please check your inbox for{" "}
              <span className="font-medium text-gray-900">{email}</span> and
              click the verification link.
            </p>
            <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
              <p className="text-xs text-indigo-700">
                💡 Don't forget to check your spam folder if you can't find the
                email.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 bg-gray-50">
            <Button
              variant="outline"
              onClick={() => setShowNotVerifiedModal(false)}
              className="text-gray-700 border-gray-300 hover:bg-gray-100 h-9 px-4 text-sm"
            >
              Got it
            </Button>
            <Button
              onClick={() => {
                setShowNotVerifiedModal(false);
                handleResendEmail();
              }}
              disabled={resendCooldown > 0}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-9 px-4 text-sm"
            >
              Resend Email
            </Button>
          </div>
        </div>
      </SimpleModalPortal>
    </div>
  );
});

export default VerifyEmailPending;
