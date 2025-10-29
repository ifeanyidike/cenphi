import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { authStore } from "@/stores/authStore";
import { SignUpForm } from "@/components/auth/SignupForm";
import Footer from "@/components/custom/footer";

export const Signup = observer(() => {
  const navigate = useNavigate();

  const handleSubmit = async ({
    name,
    email,
    password,
    confirmPassword,
  }: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    // Clear any previous errors
    authStore.clearAllErrors();

    // Validate password confirmation on client side
    if (password !== confirmPassword) {
      authStore.setError({
        field: "confirmPassword",
        message: "Passwords do not match",
      });
      return;
    }

    try {
      const result = await authStore.signup(name, email, password);
      if (result) {
        // Redirect to verification pending page after successful email/password signup
        // Email verification was already sent in authStore.signup()
        navigate("/verify-email-pending", { replace: true });
      }
    } catch (error) {
      // Error is already handled in authStore.signup()
      console.error("Signup error:", error);
    }
  };

  return (
    <main>
      <SignUpForm
        isLoading={authStore.loading}
        onSubmit={(data) => handleSubmit(data)}
      />
      <Footer />
    </main>
  );
});
