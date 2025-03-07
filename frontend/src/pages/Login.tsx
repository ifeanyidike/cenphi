// Login.jsx
import { observer } from "mobx-react-lite";
import { authStore } from "@/stores/authStore";
import { LoginForm } from "../components/auth/LoginForm";
import Footer from "@/components/custom/footer";

export const Login = observer(() => {
  // const navigate = useNavigate();

  const handleSubmit = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    try {
      return await authStore.login(email, password);
    } catch (error: any) {
      authStore.setError(error);
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
