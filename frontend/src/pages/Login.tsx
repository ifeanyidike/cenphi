// Login.jsx
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { authStore } from "@/stores/authStore";
import { LoginForm } from "../components/auth/login-form";

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
      await authStore.login(email, password);
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <LoginForm
          isLoading={authStore.loading}
          error={authStore.error}
          onSubmit={(data) => handleSubmit(data)}
        />
      </div>
    </div>
  );
});
