import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import {
  FaFacebookF,
  FaGoogle,
  FaApple,
  FaEyeSlash,
  FaEye,
} from "react-icons/fa";
import { AuthFormProps } from "./types";
import { authStore, SocialProvider } from "@/stores/authStore";
import Navbar from "../nav";
import { cn } from "@/lib/utils";
import { observer } from "mobx-react-lite";
import { useLocation, useNavigate } from "react-router-dom";
import { auth } from "@/config/firebase";

export const LoginForm = observer(
  ({ className, onSubmit, isLoading, ...props }: AuthFormProps) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();
    const from = location.state?.from || { pathname: "/dashboard", search: "" };
    const redirectUrl = `${from.pathname}${from.search}`;

    useEffect(() => {
      auth.currentUser?.reload();
    }, []);

    // Local validation errors for email and password
    // const [validationErrors, setValidationErrors] = useState({
    //   email: "",
    //   password: "",
    // });

    const [activeField, setActiveField] = useState<string | null>(null);
    const [animationComplete, setAnimationComplete] = useState(false);
    const emailRef = useRef<HTMLInputElement>(null);
    const controls = useAnimation();
    const errors = authStore.errors;

    useEffect(() => {
      // Initial entrance animation sequence
      const sequence = async () => {
        await controls.start({
          opacity: 1,
          y: 0,
          transition: { duration: 1.5, ease: [0.22, 1, 0.36, 1] },
        });
        setAnimationComplete(true);
      };

      sequence();

      // Canvas particle animation
      const canvas = document.getElementById(
        "particleCanvas"
      ) as HTMLCanvasElement;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
          const particles: any[] = [];
          const particleCount = 30;

          for (let i = 0; i < particleCount; i++) {
            particles.push({
              x: Math.random() * canvas.width,
              y: Math.random() * canvas.height,
              radius: Math.random() * 2 + 0.5,
              color: `rgba(255, 255, 255, ${Math.random() * 0.12 + 0.03})`,
              speedX: Math.random() * 0.6 - 0.3,
              speedY: Math.random() * 0.6 - 0.3,
            });
          }

          const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < particleCount; i++) {
              const p = particles[i];
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
              ctx.fillStyle = p.color;
              ctx.fill();
              p.x += p.speedX;
              p.y += p.speedY;
              if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
              if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
            }
            // Draw connecting lines
            for (let i = 0; i < particleCount; i++) {
              for (let j = i; j < particleCount; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 120) {
                  ctx.beginPath();
                  ctx.strokeStyle = `rgba(255, 255, 255, ${
                    0.05 * (1 - distance / 120)
                  })`;
                  ctx.lineWidth = 0.5;
                  ctx.moveTo(particles[i].x, particles[i].y);
                  ctx.lineTo(particles[j].x, particles[j].y);
                  ctx.stroke();
                }
              }
            }
            requestAnimationFrame(animate);
          };

          animate();
        }
      }

      const handleResize = () => {
        if (canvas) {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
        }
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, [controls]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      // Reset previous validation errors
      authStore.clearAllErrors();
      let valid = true;

      // Email validations
      if (!email) {
        authStore.setError({ field: "email", message: "Email is required" });

        valid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        authStore.setError({
          field: "email",
          message: "Please enter a valid email address.",
        });
        valid = false;
      }

      // Password validations
      if (!password) {
        authStore.setError({
          field: "password",
          message: "Password is required.",
        });
        valid = false;
      }

      if (!valid) {
        return;
      }

      const result = await onSubmit({ email, password });
      if (result) navigate(redirectUrl, { replace: true });
    };

    async function onSocialLogin(provider: string) {
      const cred = await authStore.socialLoginPopup(provider as SocialProvider);
      if (cred) {
        navigate(redirectUrl, { replace: true });
      }
    }

    const focusInput = (field: string) => {
      setActiveField(field);
      if (field === "email" && emailRef.current) {
        emailRef.current.focus();
      }
    };

    const backgroundVariants = {
      default: { filter: "hue-rotate(0deg)" },
      email: { filter: "hue-rotate(15deg)" },
      password: { filter: "hue-rotate(30deg)" },
    };

    return (
      <div
        className={cn(
          "relative py-12 w-full overflow-hidden bg-black text-white",
          className
        )}
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('/media/img/team-meeting.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        {...props}
      >
        <Navbar className="dark" />
        {/* Animated background canvas */}
        <canvas id="particleCanvas" className="absolute inset-0 z-0"></canvas>

        {/* Background gradient */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-950/50 via-slate-900/60 to-purple-950/70 z-0 opacity-70"
          animate={activeField ? activeField : "default"}
          variants={backgroundVariants}
          transition={{ duration: 1.5 }}
        />

        {/* Background graphic elements */}
        <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden">
          <motion.div
            className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-r from-violet-600/20 to-transparent blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, 15, 0], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-[50%] -right-[20%] w-[70%] h-[70%] rounded-full bg-gradient-to-l from-indigo-700/20 to-transparent blur-3xl"
            animate={{
              x: [0, -40, 0],
              y: [0, -20, 0],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex items-center justify-center px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={controls}
            className="relative w-full max-w-md"
          >
            {/* Logo and branding */}
            <div className="mb-12 text-center">
              <AnimatePresence>
                {animationComplete && (
                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="text-2xl font-light tracking-wide text-white sm:text-3xl"
                  >
                    Welcome <span className="font-medium">Back!</span>
                  </motion.h1>
                )}
              </AnimatePresence>
            </div>

            {/* Login Form Card */}
            <div className="backdrop-blur-md bg-white/[0.05] rounded-2xl p-1 shadow-[0_0_20px_rgba(119,81,255,0.15)] overflow-hidden">
              <div className="relative rounded-xl p-6 sm:p-8">
                <div className="flex justify-center mb-5">
                  <TypewriterText />
                </div>
                <div className="absolute -inset-px rounded-xl border border-white/10 z-0"></div>
                {errors?.generic && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.generic.message}
                  </p>
                )}
                <AnimatePresence>
                  {animationComplete && (
                    <motion.form
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.8, delay: 0.8 }}
                      onSubmit={handleSubmit}
                      className="relative z-10 space-y-6"
                    >
                      <div className="space-y-5">
                        {/* Email field */}
                        <motion.div
                          whileTap={{ scale: 0.99 }}
                          onClick={() => focusInput("email")}
                          className={`relative rounded-xl transition-all duration-300 ${
                            activeField === "email"
                              ? "bg-white/10 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                              : "bg-white/5 hover:bg-white/8"
                          }`}
                        >
                          <div className="flex overflow-hidden rounded-xl">
                            <div
                              className={`flex items-center justify-center w-12 transition-colors duration-300 ${
                                activeField === "email"
                                  ? "text-violet-400"
                                  : "text-white/50"
                              }`}
                            >
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M2.5 6.66669L9.0755 10.7667C9.63533 11.1266 10.3647 11.1266 10.9245 10.7667L17.5 6.66669M4.16667 15.8334H15.8333C16.7538 15.8334 17.5 15.0872 17.5 14.1667V5.83335C17.5 4.91288 16.7538 4.16669 15.8333 4.16669H4.16667C3.24619 4.16669 2.5 4.91288 2.5 5.83335V14.1667C2.5 15.0872 3.24619 15.8334 4.16667 15.8334Z"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                            <input
                              ref={emailRef}
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              onFocus={() => setActiveField("email")}
                              onBlur={() => setActiveField(null)}
                              placeholder="Email address"
                              className="w-full bg-transparent py-3 px-2 text-sm outline-none placeholder:text-white/40"
                              required
                            />
                          </div>
                          {errors.email && (
                            <p className="text-red-500 text-xs mt-1 ml-2">
                              {errors.email.message}
                            </p>
                          )}
                          <AnimatePresence>
                            {activeField === "email" && (
                              <motion.div
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: "100%", opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                className="absolute bottom-0 left-0 h-px bg-gradient-to-r from-violet-500 to-fuchsia-500"
                              />
                            )}
                          </AnimatePresence>
                        </motion.div>

                        {/* Password field */}
                        <motion.div
                          whileTap={{ scale: 0.99 }}
                          onClick={() => focusInput("password")}
                          className={`relative rounded-xl transition-all duration-300 ${
                            activeField === "password"
                              ? "bg-white/10 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                              : "bg-white/5 hover:bg-white/8"
                          }`}
                        >
                          <div className="flex overflow-hidden rounded-xl">
                            <div
                              className={`flex items-center justify-center w-12 transition-colors duration-300 ${
                                activeField === "password"
                                  ? "text-violet-400"
                                  : "text-white/50"
                              }`}
                            >
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M13.3333 7.50001V5.83334C13.3333 3.99239 11.8409 2.50001 9.99998 2.50001C8.15903 2.50001 6.66665 3.99239 6.66665 5.83334V7.50001M9.99998 12.5V14.1667M5.83331 17.5H14.1666C15.0871 17.5 15.8333 16.7538 15.8333 15.8333V9.16667C15.8333 8.24619 15.0871 7.50001 14.1666 7.50001H5.83331C4.91284 7.50001 4.16665 8.24619 4.16665 9.16667V15.8333C4.16665 16.7538 4.91284 17.5 5.83331 17.5Z"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </div>
                            <div className="flex items-center w-full">
                              <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setActiveField("password")}
                                onBlur={() => setActiveField(null)}
                                placeholder="Password"
                                className="w-full bg-transparent py-3 px-2 text-sm outline-none placeholder:text-white/40"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="mr-2 focus:outline-none"
                                aria-label="Toggle password visibility"
                              >
                                {showPassword ? (
                                  <FaEyeSlash className="text-white/60" />
                                ) : (
                                  <FaEye className="text-white/60" />
                                )}
                              </button>
                            </div>
                          </div>
                          {errors.password && (
                            <p className="text-red-500 text-xs mt-1 ml-2">
                              {errors.password.message}
                            </p>
                          )}
                          <AnimatePresence>
                            {activeField === "password" && (
                              <motion.div
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: "100%", opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                className="absolute bottom-0 left-0 h-px bg-gradient-to-r from-violet-500 to-fuchsia-500"
                              />
                            )}
                          </AnimatePresence>
                        </motion.div>
                      </div>

                      {/* Forgot password */}
                      <div className="flex justify-end">
                        <motion.a
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          href="/reset-password"
                          className="text-xs font-light text-white/60 transition-colors hover:text-white"
                        >
                          Forgot password?
                        </motion.a>
                      </div>

                      {/* Sign in button */}
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        whileHover={{
                          scale: 1.01,
                          boxShadow: "0 0 25px rgba(168, 85, 247, 0.35)",
                        }}
                        className={`group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-800 to-purple-800 py-3 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                          isLoading ? "opacity-90" : ""
                        }`}
                        disabled={isLoading}
                        type="submit"
                      >
                        <span
                          className="absolute inset-0 h-full w-full bg-gradient-to-r from-violet-400/0 via-violet-400/40 to-violet-400/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                          style={{ transform: "translateX(-100%)" }}
                        />
                        <div className="relative z-10 flex items-center justify-center space-x-2">
                          {isLoading ? (
                            <>
                              <svg
                                className="h-4 w-4 animate-spin text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              <span>Signing in...</span>
                            </>
                          ) : (
                            <>
                              <span>Sign in</span>
                              <svg
                                className="h-4 w-4 group-hover:translate-x-1 transition-transform"
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M3.33334 8.00001H12.6667M12.6667 8.00001L8.00001 3.33334M12.6667 8.00001L8.00001 12.6667"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </>
                          )}
                        </div>
                      </motion.button>

                      {/* Divider */}
                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center">
                          <span className="bg-transparent px-4 text-xs text-white/40">
                            or continue with
                          </span>
                        </div>
                      </div>

                      {/* Social logins */}
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          {
                            icon: <FaGoogle className="h-4 w-4" />,
                            name: "google",
                          },
                          {
                            icon: <FaApple className="h-4 w-4" />,
                            name: "apple",
                          },
                          {
                            icon: <FaFacebookF className="h-4 w-4" />,
                            name: "facebook",
                          },
                        ].map((social, index) => (
                          <motion.button
                            key={index}
                            type="button"
                            whileHover={{
                              y: -2,
                              backgroundColor: "rgba(255, 255, 255, 0.08)",
                            }}
                            whileTap={{ scale: 0.97 }}
                            className="group flex h-11 items-center justify-center rounded-xl bg-white/5 transition-all duration-300 hover:shadow-lg"
                            onClick={() => onSocialLogin(social.name)}
                          >
                            <span className="sr-only">
                              Sign in with {social.name}
                            </span>
                            {social.icon}
                            <motion.span
                              initial={{ width: 0, opacity: 0 }}
                              whileHover={{
                                width: "auto",
                                opacity: 1,
                                marginLeft: 8,
                              }}
                              className="overflow-hidden whitespace-nowrap text-xs font-light"
                            >
                              {social.name}
                            </motion.span>
                          </motion.button>
                        ))}
                      </div>

                      {/* Sign up link */}
                      <div className="mt-8 text-center text-sm text-white/60">
                        <span>Don't have an account? </span>
                        <motion.a
                          whileHover={{
                            color: "#fff",
                            textShadow: "0 0 8px rgba(167, 139, 250, 0.5)",
                          }}
                          href="/signup"
                          className="font-medium text-violet-400 transition-all hover:underline"
                        >
                          Create one
                        </motion.a>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Bottom decorative bar */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "40%" }}
              transition={{
                delay: 1.2,
                duration: 1.5,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mx-auto mt-8 h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent"
            />
          </motion.div>
        </div>

        {/* Additional style for glow effects */}
        <style>{`
        .drop-shadow-glow {
          filter: drop-shadow(0 0 10px rgba(167, 139, 250, 0.5));
        }
        @keyframes pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 5px rgba(167, 139, 250, 0.3)); }
          50% { filter: drop-shadow(0 0 15px rgba(167, 139, 250, 0.6)); }
        }
        .pulse-glow {
          animation: pulse-glow 4s infinite;
        }
      `}</style>
      </div>
    );
  }
);

// export default LoginPage;

const TypewriterText = () => {
  const text = "Cenphi.io";

  return (
    <AnimatePresence>
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 1.0 }}
        className="text-4xl font-light tracking-wide text-white sm:text-3xl font-playball mb-3 drop-shadow-glow "
        style={{
          textShadow: "0 0 8px rgba(167, 139, 250, 0.9)",
        }}
      >
        {text.split("").map((char, index) => (
          <motion.span
            key={index}
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            transition={{
              duration: 0.3,
              delay: index * 0.3,
            }}
          >
            {char}
          </motion.span>
        ))}
      </motion.h1>
    </AnimatePresence>
  );
};
