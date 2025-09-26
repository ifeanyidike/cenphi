import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Mail,
  User,
  ArrowRight,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { authStore, SocialProvider } from "@/stores/authStore";
import { useNavigate } from "react-router-dom";

interface SignupFormProps {
  isLoading: boolean;
  onSubmit: (data: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => Promise<void>;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface SocialProviderConfig {
  id: SocialProvider;
  name: string;
  bgColor: string;
  hoverColor: string;
  textColor: string;
  borderColor: string;
  icon: React.ReactNode;
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const AppleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
  </svg>
);

const socialProviders: SocialProviderConfig[] = [
  {
    id: "google",
    name: "Google",
    bgColor: "bg-white",
    hoverColor: "hover:bg-gray-50",
    textColor: "text-gray-700",
    borderColor: "border-gray-200",
    icon: <GoogleIcon />,
  },
  {
    id: "facebook",
    name: "Facebook",
    bgColor: "bg-[#1877F2]",
    hoverColor: "hover:bg-[#166FE5]",
    textColor: "text-white",
    borderColor: "border-[#1877F2]",
    icon: <FacebookIcon />,
  },
  {
    id: "apple",
    name: "Apple",
    bgColor: "bg-black",
    hoverColor: "hover:bg-gray-900",
    textColor: "text-white",
    borderColor: "border-black",
    icon: <AppleIcon />,
  },
];

const passwordRequirements = [
  {
    id: "length",
    label: "8+ characters",
    test: (pwd: string) => pwd.length >= 8,
  },
  {
    id: "uppercase",
    label: "Uppercase",
    test: (pwd: string) => /[A-Z]/.test(pwd),
  },
  {
    id: "lowercase",
    label: "Lowercase",
    test: (pwd: string) => /[a-z]/.test(pwd),
  },
  { id: "number", label: "Number", test: (pwd: string) => /\d/.test(pwd) },
];

// Enhanced error message component
const ErrorMessage = ({
  message,
  className = "",
}: {
  message?: string;
  className?: string;
}) => (
  <AnimatePresence>
    {message && (
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={`flex items-center gap-2 text-sm text-red-600 font-medium ${className}`}
      >
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <span>{message}</span>
      </motion.div>
    )}
  </AnimatePresence>
);

// Enhanced input field component
const InputField = ({
  id,
  type,
  label,
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder,
  error,
  disabled,
  icon,
  rightElement,
  required = false,
}: {
  id: string;
  type: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder: string;
  error?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  required?: boolean;
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="flex items-center gap-1 text-xs font-semibold text-gray-700 tracking-wide uppercase"
      >
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            setFocused(true);
            onFocus?.();
          }}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          className={`
            block w-full px-4 py-3.5 text-sm border rounded-2xl
            focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-200
            ${
              error
                ? "border-red-300 focus:border-red-400 focus:ring-red-400/20 bg-red-50/30"
                : focused
                  ? "border-blue-400 focus:border-blue-500 focus:ring-blue-500/20 bg-white shadow-sm"
                  : "border-gray-200 focus:border-gray-400 focus:ring-gray-400/20 bg-white hover:border-gray-300"
            }
            placeholder-gray-400 font-light
            ${rightElement ? "pr-12" : icon ? "pr-10" : ""}
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
          placeholder={placeholder}
          disabled={disabled}
        />
        {icon && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <div
              className={`transition-colors duration-200 ${focused ? "text-blue-500" : "text-gray-400"}`}
            >
              {icon}
            </div>
          </div>
        )}
        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      <ErrorMessage message={error} />
    </div>
  );
};

export const SignUpForm: React.FC<SignupFormProps> = observer(
  ({ isLoading, onSubmit }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<FormData>({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formErrors, setFormErrors] = useState<Partial<FormData>>({});
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const validateForm = (): boolean => {
      const errors: Partial<FormData> = {};

      if (!formData.name.trim()) {
        errors.name = "Name is required";
      } else if (formData.name.trim().length < 2) {
        errors.name = "Name must be at least 2 characters";
      }

      if (!formData.email.trim()) {
        errors.email = "Email is required";
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = "Please enter a valid email";
      }

      if (!formData.password) {
        errors.password = "Password is required";
      } else if (!isPasswordValid(formData.password)) {
        errors.password = "Password does not meet requirements";
      }

      if (!formData.confirmPassword) {
        errors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
      }

      setFormErrors(errors);
      return Object.keys(errors).length === 0;
    };

    const isPasswordValid = (password: string): boolean => {
      return passwordRequirements.every((req) => req.test(password));
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateForm() || isLoading) return;

      setFormErrors({});
      await onSubmit(formData);
    };

    const handleSocialLogin = async (provider: SocialProvider) => {
      if (isLoading) return;
      try {
        const creds = await authStore.socialLoginPopup(provider);
        if (creds) {
          navigate("/onboarding", { replace: true });
        }
      } catch (error) {
        console.error(`${provider} login failed:`, error);
      }
    };

    const handleInputChange = (field: keyof FormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Clear local form errors
      if (formErrors[field]) {
        setFormErrors((prev) => ({ ...prev, [field]: undefined }));
      }

      // Clear authStore errors when user starts typing
      authStore.clearFieldError(field as any);
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-6">
        <div className="w-full max-w-[460px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
          >
            {/* Header */}
            <div className="px-10 pt-10 pb-8 text-center border-b border-gray-100/50">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-2xl font-bold text-gray-900 tracking-tight mb-2"
              >
                Create your account
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-sm text-gray-600 font-light mb-3"
              >
                Start recording testimonials in seconds
              </motion.p>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="inline-flex items-center px-3 py-1 bg-green-100 rounded-full"
              >
                <Check className="w-3 h-3 text-green-600 mr-1" />
                <span className="text-xs text-green-700 font-medium">
                  No credit card required
                </span>
              </motion.div>
            </div>

            {/* Social Login Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="px-10 pt-8 pb-6"
            >
              <div className="space-y-3">
                {socialProviders.map((provider, index) => (
                  <motion.button
                    key={provider.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSocialLogin(provider.id)}
                    disabled={isLoading}
                    className={`
                      w-full ${provider.bgColor} ${provider.hoverColor} ${provider.textColor}
                      border ${provider.borderColor} rounded-2xl px-4 py-3.5 flex items-center justify-center
                      transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                      font-medium text-sm shadow-sm hover:shadow-md group relative overflow-hidden
                    `}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <span className="mr-3 relative z-10">{provider.icon}</span>
                    <span className="relative z-10">
                      Continue with {provider.name}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="px-10 py-4"
            >
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-4 bg-white text-gray-500 font-medium">
                    or create with email
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Form */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.5 }}
              onSubmit={handleSubmit}
              className="px-10 pb-10 space-y-5"
            >
              {/* Name Field */}
              <InputField
                id="name"
                type="text"
                label="Full Name"
                value={formData.name}
                onChange={(value) => handleInputChange("name", value)}
                onFocus={() => setFocusedField("name")}
                onBlur={() => setFocusedField(null)}
                placeholder="Enter your full name"
                error={formErrors.name}
                disabled={isLoading}
                icon={<User className="h-4 w-4" />}
                required
              />

              {/* Email Field */}
              <InputField
                id="email"
                type="email"
                label="Email Address"
                value={formData.email}
                onChange={(value) => handleInputChange("email", value)}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                placeholder="Enter your email address"
                error={formErrors.email || authStore.errors.email?.message}
                disabled={isLoading}
                icon={<Mail className="h-4 w-4" />}
                required
              />

              {/* Password Field */}
              <div className="space-y-2">
                <InputField
                  id="password"
                  type={showPassword ? "text" : "password"}
                  label="Password"
                  value={formData.password}
                  onChange={(value) => handleInputChange("password", value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Create a secure password"
                  error={
                    formErrors.password || authStore.errors.password?.message
                  }
                  disabled={isLoading}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                      disabled={isLoading}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                  required
                />

                {/* Password Requirements */}
                <AnimatePresence>
                  {(focusedField === "password" || formData.password) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-100"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        {passwordRequirements.map((req, index) => {
                          const isValid = req.test(formData.password);
                          return (
                            <motion.div
                              key={req.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1, duration: 0.3 }}
                              className="flex items-center text-xs"
                            >
                              <div
                                className={`w-4 h-4 rounded-full mr-2 flex items-center justify-center transition-all duration-200 ${
                                  isValid
                                    ? "bg-green-100 border border-green-200"
                                    : "bg-gray-100 border border-gray-200"
                                }`}
                              >
                                {isValid && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <Check className="h-2.5 w-2.5 text-green-600" />
                                  </motion.div>
                                )}
                              </div>
                              <span
                                className={`font-medium transition-colors duration-200 ${
                                  isValid ? "text-green-700" : "text-gray-600"
                                }`}
                              >
                                {req.label}
                              </span>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Confirm Password Field */}
              <InputField
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                label="Confirm Password"
                value={formData.confirmPassword}
                onChange={(value) =>
                  handleInputChange("confirmPassword", value)
                }
                placeholder="Confirm your password"
                error={
                  formErrors.confirmPassword ||
                  authStore.errors.confirmPassword?.message
                }
                disabled={isLoading}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    disabled={isLoading}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
                required
              />

              {/* Generic Error */}
              <AnimatePresence>
                {authStore.errors.generic && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 bg-red-50 border border-red-200 rounded-2xl"
                  >
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                      <p className="text-sm text-red-700 font-medium">
                        {authStore.errors.generic.message}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.button
                whileHover={!isLoading ? { scale: 1.02, y: -1 } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
                type="submit"
                disabled={isLoading}
                className="
                  w-full bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 
                  text-white font-semibold py-4 px-4 rounded-2xl transition-all duration-300 
                  flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed 
                  shadow-lg hover:shadow-xl text-sm tracking-wide mt-8 group relative overflow-hidden
                "
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-5 h-5"
                  >
                    <Loader2 className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <div className="flex items-center gap-2 relative z-10">
                    <span>Create Account</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                )}
              </motion.button>
            </motion.form>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3, duration: 0.5 }}
              className="px-10 py-6 bg-gray-50/50 border-t border-gray-100/50 text-center"
            >
              <p className="text-sm text-gray-600 font-light">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="text-gray-900 hover:text-black font-semibold transition-colors hover:underline"
                >
                  Sign in
                </a>
              </p>
            </motion.div>
          </motion.div>

          {/* Trust Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.5 }}
            className="mt-8 text-center"
          >
            <div className="inline-flex items-center px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-white/40 hover:bg-white/80 transition-all duration-300">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 bg-green-500 rounded-full mr-2"
              ></motion.div>
              <span className="text-xs text-gray-600 font-medium">
                Enterprise-grade security
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }
);
