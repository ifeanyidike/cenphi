// src/pages/ResetPassword.tsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { authStore } from "@/stores/authStore";
import {
  RequestResetForm,
  ResetPasswordForm,
} from "@/components/auth/reset-password";

const ResetPasswordPage = observer(() => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const actionCode = searchParams.get("oobCode");

  useEffect(() => {
    if (actionCode) {
      verifyResetCode();
    }
  }, [actionCode]);

  const verifyResetCode = async () => {
    try {
      const emailFromCode = await authStore.verifyResetCode(actionCode!);
      setEmail(emailFromCode || null);
    } catch (error) {
      // Invalid code will show error through store
      navigate("/reset-password", { replace: true });
    }
  };

  const handleRequestReset = async ({ email }: { email: string }) => {
    await authStore.requestPasswordReset(email);
  };

  const handlePasswordReset = async ({
    password,
    confirmPassword,
  }: {
    password: string;
    confirmPassword: string;
  }) => {
    if (password !== confirmPassword) {
      authStore.setError({
        field: "confirmPassword",
        message: "Passwords do not match",
      });
      return;
    }

    if (actionCode) {
      await authStore.completePasswordReset(actionCode, password);
    }
  };

  if (actionCode && !email) {
    return <div>Verifying reset link...</div>;
  }

  if (actionCode && email) {
    return (
      <ResetPasswordForm
        onSubmit={handlePasswordReset}
        isLoading={authStore.loading}
        error={authStore.error}
      />
    );
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-xl">
        <RequestResetForm
          onSubmit={handleRequestReset}
          isLoading={authStore.loading}
          error={authStore.error}
          onBack={() => navigate("/login")}
        />
      </div>
    </div>
  );
});

export default ResetPasswordPage;
