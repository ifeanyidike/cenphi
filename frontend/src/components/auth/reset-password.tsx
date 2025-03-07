import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2Icon,
  MailIcon,
  LockIcon,
  KeyIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
} from "lucide-react";
import { AuthFormProps } from "./types";
import { FormInput } from "./auth-utlis";
import { getAuth } from "firebase/auth";
import { observer } from "mobx-react-lite";
import { authStore } from "@/stores/authStore";

// Request Password Reset Form
export const RequestResetForm = observer(
  ({
    className,
    onSubmit,
    isLoading,
    onBack,
    ...props
  }: AuthFormProps & { onBack?: () => void }) => {
    const [email, setEmail] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);
    const errors = authStore.errors;

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      await onSubmit({ email });
      setIsSubmitted(true);
    };

    if (isSubmitted) {
      return (
        <Card className="overflow-hidden z-10">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col items-center text-center gap-6">
              <div className="rounded-full bg-primary/10 p-3">
                <CheckCircleIcon className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl">Check your email</CardTitle>
                <p className="text-balance text-muted-foreground">
                  We've sent a password reset link to {email}. The link will
                  expire in 1 hour.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setIsSubmitted(false)}
              >
                Didn't receive the email? Try again
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {onBack && (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-fit -ml-2"
                  onClick={onBack}
                >
                  <ArrowLeftIcon className="mr-2 h-4 w-4" />
                  Back to login
                </Button>
              )}

              <div className="flex flex-col items-center text-center space-y-2">
                <div className="rounded-full bg-primary/10 p-3">
                  <KeyIcon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Reset your password</CardTitle>
                <p className="text-balance text-muted-foreground">
                  Enter your email address and we'll send you a link to reset
                  your password
                </p>
              </div>

              {errors.generic && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.generic.message}</AlertDescription>
                </Alert>
              )}

              <FormInput
                label="Email"
                id="email"
                type="email"
                icon={<MailIcon className="h-4 w-4" />}
                required
                error={errors?.email ? errors?.email.message : undefined}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Send Reset Link
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }
);

// Reset Password Form (after clicking email link)
export const ResetPasswordForm = observer(
  ({ className, onSubmit, isLoading, ...props }: AuthFormProps) => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const auth = getAuth();
    const user = auth.currentUser;
    const errors = authStore.errors;

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (password !== confirmPassword) {
        // You might want to handle this error through your error state
        return;
      }
      const token = await user?.getIdToken();
      await onSubmit({ password, confirmPassword, token });
      setIsSuccess(true);
    };

    if (isSuccess) {
      return (
        <Card className="overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col items-center text-center gap-6">
              <div className="rounded-full bg-primary/10 p-3">
                <CheckCircleIcon className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl">
                  Password reset successful
                </CardTitle>
                <p className="text-balance text-muted-foreground">
                  Your password has been successfully reset. You can now login
                  with your new password.
                </p>
              </div>
              <Button
                type="button"
                className="w-full"
                onClick={() => (window.location.href = "/login")}
              >
                Return to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="rounded-full bg-primary/10 p-3">
                  <LockIcon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Reset your password</CardTitle>
                <p className="text-balance text-muted-foreground">
                  Please enter your new password below
                </p>
              </div>

              {errors?.generic && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.generic.message}</AlertDescription>
                </Alert>
              )}

              <FormInput
                label="New Password"
                id="password"
                type="password"
                icon={<LockIcon className="h-4 w-4" />}
                required
                error={errors.password ? errors.password.message : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <FormInput
                label="Confirm New Password"
                id="confirmPassword"
                type="password"
                icon={<LockIcon className="h-4 w-4" />}
                required
                error={
                  errors.confirmPassword
                    ? errors.confirmPassword.message
                    : undefined
                }
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Reset Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }
);
