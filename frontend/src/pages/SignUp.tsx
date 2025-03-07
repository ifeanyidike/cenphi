// Signup.jsx
import { observer } from "mobx-react-lite";
import { authStore } from "@/stores/authStore";
import { SignUpForm } from "../components/auth/SignupForm";
import Footer from "@/components/custom/footer";

export const Signup = observer(() => {
  // const navigate = useNavigate();

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
      return await authStore.signup(name, email, password);
      // navigate("/dashboard");
    } catch (error) {
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
