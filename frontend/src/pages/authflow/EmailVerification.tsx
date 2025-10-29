import React, { useEffect, useState } from "react";
import { getAuth, applyActionCode, sendEmailVerification } from "firebase/auth";
import { CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/custom/footer";
import { authStore } from "@/stores/authStore";
import { observer } from "mobx-react-lite";
import Navbar from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Verification states
type VerificationStatus = "loading" | "success" | "error";

type Props = {
  oobCode: string | null;
  mode: "verifyEmail";
};

const EmailVerificationPage: React.FC<Props> = observer((props) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(5);
  const auth = getAuth();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        if (!props.oobCode || props.mode !== "verifyEmail") {
          throw new Error("Invalid verification link");
        }

        // Apply the email verification code (works even if not logged in)
        // This will throw if the code is already used, expired, or invalid
        await applyActionCode(auth, props.oobCode);

        // If we reach here, the code was successfully applied
        // Check if user is currently logged in
        const currentUser = auth.currentUser;

        if (currentUser) {
          // User is logged in - reload to update emailVerified status
          await currentUser.reload();

          // Call backend to verify email
          const resp = await authStore.verifyEmail();
          if (resp?.error) {
            setStatus("error");
            setErrorMessage(resp.error);
            return;
          }
        }

        // Verification successful - code was valid and applied
        setStatus("success");

        // Start countdown for redirect
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              // If user is logged in, go to onboarding
              // If not logged in, go to login page
              if (auth.currentUser) {
                navigate("/onboarding");
              } else {
                navigate("/login", {
                  state: {
                    message: "Email verified! Please log in to continue.",
                  },
                });
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      } catch (error: any) {
        console.log("Verification error:", error);
        setStatus("error");

        // Handle different error codes
        if (error.code === "auth/invalid-action-code") {
          setErrorMessage(
            "This verification link has expired, already been used, or is invalid. Please request a new verification email."
          );
        } else if (error.code === "auth/expired-action-code") {
          setErrorMessage(
            "This verification link has expired. Please request a new verification email."
          );
        } else {
          const errorMsg =
            error instanceof Error ? error.message : "Verification failed";
          setErrorMessage(errorMsg);
        }
      }
    };

    verifyEmail();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center px-4 py-24">
        <div className="w-full max-w-md">
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h1 className="text-lg font-medium text-gray-900 mb-1">
                  Email Verification
                </h1>
                <p className="text-sm text-gray-600">
                  Please wait while we verify your email address
                </p>
              </div>

              {status === "loading" && (
                <div className="flex flex-col items-center py-6">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <Loader2 className="h-4 w-4 text-gray-600 animate-spin" />
                  </div>
                  <p className="text-sm text-gray-600">
                    Verifying your email address...
                  </p>
                </div>
              )}

              {status === "success" && (
                <div className="text-center">
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <h2 className="text-base font-medium text-gray-900 mb-2">
                    Email Verified
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Your email has been successfully verified.
                  </p>

                  <div className="bg-gray-50 rounded-md p-3 mb-4">
                    <p className="text-xs text-gray-700">
                      {auth.currentUser ? (
                        <>
                          Redirecting to onboarding in{" "}
                          <span className="font-medium">{countdown}</span>{" "}
                          seconds
                        </>
                      ) : (
                        <>
                          Redirecting to login in{" "}
                          <span className="font-medium">{countdown}</span>{" "}
                          seconds
                        </>
                      )}
                    </p>
                  </div>

                  <Button
                    onClick={() => {
                      if (auth.currentUser) {
                        navigate("/onboarding");
                      } else {
                        navigate("/login", {
                          state: {
                            message:
                              "Email verified! Please log in to continue.",
                          },
                        });
                      }
                    }}
                    className="w-full text-sm h-9"
                  >
                    {auth.currentUser
                      ? "Continue to Onboarding"
                      : "Continue to Login"}
                  </Button>
                </div>
              )}

              {status === "error" && (
                <div className="text-center">
                  <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                  <h2 className="text-base font-medium text-gray-900 mb-2">
                    Verification Failed
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    {errorMessage ||
                      "The verification link may have expired or already been used."}
                  </p>

                  <div className="space-y-2">
                    <Button
                      onClick={() => {
                        if (auth.currentUser) {
                          sendEmailVerification(auth.currentUser);
                        }
                      }}
                      className="w-full text-sm h-9"
                    >
                      Resend Verification Email
                    </Button>
                    <Button
                      onClick={() => navigate("/support")}
                      variant="outline"
                      className="w-full text-sm h-9"
                    >
                      Contact Support
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-xs text-gray-500 text-center mt-4">
            If you didn't request this verification, you can safely ignore this.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
});

export default EmailVerificationPage;
