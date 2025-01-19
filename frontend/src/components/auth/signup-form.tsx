import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2Icon,
  UserIcon,
  MailIcon,
  LockIcon,
  ArrowLeftIcon,
} from "lucide-react";
import { FormInput } from "./auth-utlis";
import { AuthFormProps } from "./types";
import { authStore } from "@/stores/authStore";

export function SignUpForm({
  className,
  onSubmit,
  isLoading,
  error,
  onBack,
  ...props
}: AuthFormProps & { onBack?: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ name, email, password, confirmPassword });
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
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
                  <UserIcon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Create an account</CardTitle>
                <p className="text-balance text-muted-foreground">
                  Enter your details to get started with Acme Inc
                </p>
              </div>

              {error?.message && !error.field && (
                <Alert variant="destructive">
                  <AlertDescription>{error.message}</AlertDescription>
                </Alert>
              )}

              <FormInput
                label="Full Name"
                id="name"
                icon={<UserIcon className="h-4 w-4" />}
                required
                error={error?.field === "name" ? error.message : undefined}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <FormInput
                label="Email"
                id="email"
                type="email"
                icon={<MailIcon className="h-4 w-4" />}
                required
                error={error?.field === "email" ? error.message : undefined}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <FormInput
                label="Password"
                id="password"
                type="password"
                icon={<LockIcon className="h-4 w-4" />}
                required
                error={error?.field === "password" ? error.message : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <FormInput
                label="Confirm Password"
                id="confirmPassword"
                type="password"
                icon={<LockIcon className="h-4 w-4" />}
                required
                error={
                  error?.field === "confirmPassword" ? error.message : undefined
                }
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Create Account
              </Button>

              <div className="relative text-center text-sm">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <span className="relative bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => authStore.socialLoginPopup("apple")}
                >
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09z"
                      fill="currentColor"
                    />
                  </svg>
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => authStore.socialLoginPopup("google")}
                >
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => authStore.socialLoginPopup("facebook")}
                >
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93z"
                      fill="currentColor"
                    />
                  </svg>
                </Button>
              </div>

              <div className="text-center text-sm">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="font-medium text-primary hover:underline"
                >
                  Sign in
                </a>
              </div>
            </div>
          </form>
          <div className="relative hidden bg-muted md:block">
            <img
              src="/media/custom/stat-shown.jpg"
              alt="Auth background"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-background/20" />
          </div>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-muted-foreground">
        By creating an account, you agree to our{" "}
        <a href="#" className="underline underline-offset-4 hover:text-primary">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="underline underline-offset-4 hover:text-primary">
          Privacy Policy
        </a>
        .
      </div>
    </div>
  );
}
