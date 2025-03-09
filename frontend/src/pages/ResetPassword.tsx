// src/pages/ResetPassword.tsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { authStore } from "@/stores/authStore";
import {
  RequestResetForm,
  ResetPasswordForm,
} from "@/components/auth/reset-password";
import Navbar from "@/components/nav";
import Footer from "@/components/custom/footer";

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
    } catch (error: any) {
      console.log("password reset error", error.message);
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
      />
    );
  }

  return (
    <div className="min-h-svh flex flex-col">
      <img
        src="/media/img/telling-story.jpg"
        className="max-h-96 max-sm:mt-16"
      />
      <Navbar alwaysDarkText={true} />

      <div className="w-full max-w-sm md:max-w-xl mx-auto py-8 xl:py-20 2xl:py-24">
        {actionCode && !email ? (
          <div>Verifying reset link...</div>
        ) : actionCode && email ? (
          <ResetPasswordForm
            onSubmit={handlePasswordReset}
            isLoading={authStore.loading}
          />
        ) : (
          <RequestResetForm
            onSubmit={handleRequestReset}
            isLoading={authStore.loading}
            onBack={() => navigate("/login")}
          />
        )}
      </div>
      <Footer />
    </div>
  );
});

export default ResetPasswordPage;
