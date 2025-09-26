import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { authStore } from "@/stores/authStore";
import { LoginForm } from "@/components/auth/LoginForm";
import Footer from "@/components/custom/footer";

export const Login = observer(() => {
  const navigate = useNavigate();

  const handleSubmit = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    try {
      const result = await authStore.login(email, password);
      console.log("result", result);
      if (result) {
        // Redirect to onboarding on successful login
        navigate("/dashboard", { replace: true });
      }
    } catch (error: any) {
      // Error is already handled in authStore.login()
      console.error("Login error:", error);
    }
  };

  return (
    <div>
      <LoginForm
        isLoading={authStore.loading}
        onSubmit={(data) => handleSubmit(data)}
      />
      <Footer />
    </div>
  );
});
