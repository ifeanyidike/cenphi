import React, { useEffect, useState } from "react";
import { getAuth, applyActionCode, sendEmailVerification } from "firebase/auth";
import { CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import Navbar from "@/components/nav";
import Footer from "@/components/custom/footer";
import { FirebaseErrorHandler } from "@/services/error";
import { authStore } from "@/stores/authStore";
import { observer } from "mobx-react-lite";

// Verification states
type VerificationStatus = "loading" | "success" | "error";

type Props = {
  oobCode: string | null;
  mode: "verifyEmail";
};

const EmailVerificationPage: React.FC<Props> = observer((props) => {
  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(5);
  const auth = getAuth();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // const actionCode = new URLSearchParams(window.location.search).get(
        //   "oobCode"
        // );
        // const mode = new URLSearchParams(window.location.search).get("mode");

        if (!props.oobCode || props.mode !== "verifyEmail") {
          throw new Error("Invalid verification link");
        }

        await applyActionCode(auth, props.oobCode);
        const resp = await authStore.verifyEmail();

        if (resp?.error) {
          setStatus("error");
          setErrorMessage(resp.error);
          return;
        }

        // If successful, update status and trigger confetti
        setStatus("success");

        // Trigger confetti effect
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        // Start countdown for redirect
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              // Redirect to onboarding
              window.location.href = "/pricing?workflow=onboarding";
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      } catch (error) {
        setStatus("error");
        console.log("error", error);
        setErrorMessage(
          FirebaseErrorHandler.checkFirebaseErrorsAndThrow(error)
          // error instanceof Error ? error.message : "Verification failed"
        );
      }
    };

    verifyEmail();
  }, []);

  return (
    <div className=" bg-gradient-to-br from-indigo-100 via-white to-blue-100">
      <Navbar alwaysDarkText />
      <div className="flex items-center justify-center p-4 py-48">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="px-8 pt-8 pb-2">
              {/* <div className="flex justify-center mb-4 font-playball text-2xl">
                Cenphi
              </div> */}
              <h1 className="text-2xl font-bold text-center text-gray-800">
                Email Verification
              </h1>
            </div>

            <div className="p-8 pt-2">
              {status === "loading" && (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-16 w-16 text-blue-500 animate-spin mb-4" />
                  <p className="text-gray-600 text-center">
                    Verifying your email address...
                  </p>
                </div>
              )}

              {status === "success" && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-50"></div>
                    <CheckCircle className="h-16 w-16 text-green-500 relative z-10 mb-4" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    Email Verified Successfully!
                  </h2>
                  <p className="text-gray-600 text-center mb-6">
                    Thank you for verifying your email address.
                  </p>
                  <div className="bg-blue-50 rounded-lg p-4 w-full">
                    <p className="text-blue-800 text-center">
                      Redirecting to onboarding in{" "}
                      <span className="font-bold">{countdown}</span> seconds...
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      (window.location.href = "/pricing?workflow=onboarding")
                    }
                    className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    Go to Onboarding Now
                  </button>
                </div>
              )}

              {status === "error" && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="bg-red-50 p-4 rounded-full mb-4">
                    <AlertTriangle className="h-16 w-16 text-red-500" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    Verification Failed
                  </h2>
                  <p className="text-gray-600 text-center mb-6">
                    {errorMessage ||
                      "There was a problem verifying your email. The link may have expired or already been used."}
                  </p>
                  <div className="flex flex-col gap-3 w-full">
                    <button
                      onClick={() => {
                        if (auth.currentUser) {
                          sendEmailVerification(auth.currentUser);
                        }
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                      Resend Verification Email
                    </button>
                    <button
                      onClick={() => (window.location.href = "/support")}
                      className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                    >
                      Contact Support
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="px-8 py-4 bg-gray-50 border-t border-gray-100">
              <p className="text-sm text-gray-500 text-center">
                If you didn't request this verification, please ignore this
                email.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
});

export default EmailVerificationPage;
