// Signup.jsx
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { authStore } from "@/stores/authStore";
import { SignUpForm } from "../components/auth/signup-form";
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
    if (password !== confirmPassword) {
      authStore.setError({
        field: "confirmPassword",
        message: "Passwords do not match",
      });
      return;
    }

    try {
      console.log("name", name);
      if (!(await authStore.signup(email, password))) return;
      navigate("/dashboard");
    } catch (error) {
      console.error("Signup error:", error);
    }
  };

  return (
    <main>
      <SignUpForm
        isLoading={authStore.loading}
        error={authStore.error}
        onSubmit={(data) => handleSubmit(data)}
      />
      <Footer />
    </main>
  );
});
