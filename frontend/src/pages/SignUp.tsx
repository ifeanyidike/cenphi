// Signup.jsx
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { authStore } from "@/stores/authStore";
import { SignUpForm } from "../components/auth/signup-form";

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
      alert("Passwords don't match!");
      return;
    }

    try {
      console.log("name", name);
      await authStore.signup(email, password);
      navigate("/dashboard");
    } catch (error) {
      console.error("Signup error:", error);
    }
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-5xl">
        <SignUpForm
          isLoading={authStore.loading}
          error={authStore.error}
          onSubmit={(data) => handleSubmit(data)}
        />
      </div>
    </div>
  );
});
