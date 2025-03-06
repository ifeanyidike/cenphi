// Login.jsx
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { authStore } from "@/stores/authStore";
import { LoginForm } from "../components/auth/login-form";
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
      if (!(await authStore.login(email, password))) return;
      navigate("/");
    } catch (error: any) {
      authStore.setError(error);
      console.error("Login error:", error);
    }
  };

  return (
    <div>
      <LoginForm
        isLoading={authStore.loading}
        error={authStore.error}
        onSubmit={(data) => handleSubmit(data)}
      />
      <Footer />
    </div>
  );
});
