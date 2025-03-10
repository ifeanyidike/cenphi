// import { useState } from "react";
// import { cn } from "@/lib/utils";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardTitle } from "@/components/ui/card";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import {
//   Loader2Icon,
//   UserIcon,
//   MailIcon,
//   LockIcon,
//   ArrowLeftIcon,
// } from "lucide-react";
// import { FormInput } from "./auth-utlis";
// import { AuthFormProps } from "./types";
// import { authStore } from "@/stores/authStore";

// export function SignUpForm({
//   className,
//   onSubmit,
//   isLoading,
//   error,
//   onBack,
//   ...props
// }: AuthFormProps & { onBack?: () => void }) {
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     await onSubmit({ name, email, password, confirmPassword });
//   };

//   return (
//     <div className={cn("flex flex-col gap-6", className)} {...props}>
//       <Card className="overflow-hidden">
//         <CardContent className="grid p-0 md:grid-cols-2">
//           <form onSubmit={handleSubmit} className="p-6 md:p-8">
//             <div className="flex flex-col gap-6">
//               {onBack && (
//                 <Button
//                   type="button"
//                   variant="ghost"
//                   className="w-fit -ml-2"
//                   onClick={onBack}
//                 >
//                   <ArrowLeftIcon className="mr-2 h-4 w-4" />
//                   Back to login
//                 </Button>
//               )}

//               <div className="flex flex-col items-center text-center space-y-2">
//                 <div className="rounded-full bg-primary/10 p-3">
//                   <UserIcon className="h-6 w-6 text-primary" />
//                 </div>
//                 <CardTitle className="text-2xl">Create an account</CardTitle>
//                 <p className="text-balance text-muted-foreground">
//                   Enter your details to get started with Acme Inc
//                 </p>
//               </div>

//               {error?.message && !error.field && (
//                 <Alert variant="destructive">
//                   <AlertDescription>{error.message}</AlertDescription>
//                 </Alert>
//               )}

//               <FormInput
//                 label="Full Name"
//                 id="name"
//                 icon={<UserIcon className="h-4 w-4" />}
//                 required
//                 error={error?.field === "name" ? error.message : undefined}
//                 value={name}
//                 onChange={(e) => setName(e.target.value)}
//               />

//               <FormInput
//                 label="Email"
//                 id="email"
//                 type="email"
//                 icon={<MailIcon className="h-4 w-4" />}
//                 required
//                 error={error?.field === "email" ? error.message : undefined}
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//               />

//               <FormInput
//                 label="Password"
//                 id="password"
//                 type="password"
//                 icon={<LockIcon className="h-4 w-4" />}
//                 required
//                 error={error?.field === "password" ? error.message : undefined}
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//               />

//               <FormInput
//                 label="Confirm Password"
//                 id="confirmPassword"
//                 type="password"
//                 icon={<LockIcon className="h-4 w-4" />}
//                 required
//                 error={
//                   error?.field === "confirmPassword" ? error.message : undefined
//                 }
//                 value={confirmPassword}
//                 onChange={(e) => setConfirmPassword(e.target.value)}
//               />

//               <Button type="submit" className="w-full" disabled={isLoading}>
//                 {isLoading ? (
//                   <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
//                 ) : null}
//                 Create Account
//               </Button>

//               <div className="relative text-center text-sm">
//                 <div className="absolute inset-0 flex items-center">
//                   <span className="w-full border-t" />
//                 </div>
//                 <span className="relative bg-background px-2 text-muted-foreground">
//                   Or continue with
//                 </span>
//               </div>

//               <div className="grid grid-cols-3 gap-4">
//                 <Button
//                   variant="outline"
//                   className="w-full"
//                   onClick={() => authStore.socialLoginPopup("apple")}
//                 >
//                   <svg
//                     className="h-5 w-5"
//                     xmlns="http://www.w3.org/2000/svg"
//                     viewBox="0 0 24 24"
//                   >
//                     <path
//                       d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09z"
//                       fill="currentColor"
//                     />
//                   </svg>
//                 </Button>
//                 <Button
//                   variant="outline"
//                   className="w-full"
//                   onClick={() => authStore.socialLoginPopup("google")}
//                 >
//                   <svg
//                     className="h-5 w-5"
//                     xmlns="http://www.w3.org/2000/svg"
//                     viewBox="0 0 24 24"
//                   >
//                     <path
//                       d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
//                       fill="currentColor"
//                     />
//                   </svg>
//                 </Button>
//                 <Button
//                   variant="outline"
//                   className="w-full"
//                   onClick={() => authStore.socialLoginPopup("facebook")}
//                 >
//                   <svg
//                     className="h-5 w-5"
//                     xmlns="http://www.w3.org/2000/svg"
//                     viewBox="0 0 24 24"
//                   >
//                     <path
//                       d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93z"
//                       fill="currentColor"
//                     />
//                   </svg>
//                 </Button>
//               </div>

//               <div className="text-center text-sm">
//                 Already have an account?{" "}
//                 <a
//                   href="/login"
//                   className="font-medium text-primary hover:underline"
//                 >
//                   Sign in
//                 </a>
//               </div>
//             </div>
//           </form>
//           <div className="relative hidden bg-muted md:block">
//             <img
//               src="/media/custom/stat-shown.jpg"
//               alt="Auth background"
//               className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
//             />
//             <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-background/20" />
//           </div>
//         </CardContent>
//       </Card>
//       <div className="text-balance text-center text-xs text-muted-foreground">
//         By creating an account, you agree to our{" "}
//         <a href="#" className="underline underline-offset-4 hover:text-primary">
//           Terms of Service
//         </a>{" "}
//         and{" "}
//         <a href="#" className="underline underline-offset-4 hover:text-primary">
//           Privacy Policy
//         </a>
//         .
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useAnimation,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import { BsFacebook, BsArrowRight } from "react-icons/bs";
import { HiOutlineMail } from "react-icons/hi";
import { RiLockPasswordLine } from "react-icons/ri";
import { FiUser, FiEye, FiEyeOff } from "react-icons/fi";
import Navbar from "@/components/custom/nav";
import { AuthFormProps } from "./types";
import { authStore, SocialProvider } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import { observer } from "mobx-react-lite";
import { runInAction } from "mobx";
import { AuthErrorField } from "@/services/error";
import { useNavigate } from "react-router-dom";

export const SignUpForm: React.FC<AuthFormProps & { onBack?: () => void }> =
  observer(
    ({
      className,
      onSubmit,
      isLoading,
      // onBack,
      ...props
    }) => {
      const navigate = useNavigate();
      // Form state
      const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      const [step, setStep] = useState(0);
      const [showPassword, setShowPassword] = useState(false);
      const [showConfirmPassword, setShowConfirmPassword] = useState(false);
      // const [formErrors, setFormErrors] = useState<{ [key: string]: string }>(
      //   {}
      // );
      // const [isLoading, setIsLoading] = useState(false);

      // Refs for interactive elements
      const nameInputRef = useRef<HTMLInputElement>(null);
      const canvasRef = useRef<HTMLCanvasElement>(null);
      const errors = authStore.errors;

      // Mouse position for interactive effects
      const mouseX = useMotionValue(0);
      const mouseY = useMotionValue(0);
      const rotateX = useTransform(mouseY, [-300, 300], [10, -10]);
      const rotateY = useTransform(mouseX, [-300, 300], [-10, 10]);

      // Animation controls
      const controls = useAnimation();
      const inputControls = useAnimation();

      useEffect(() => {
        // Initialize canvas effect
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;

          class Particle {
            x: number;
            y: number;
            size: number;
            speedX: number;
            speedY: number;
            color: string;

            constructor() {
              this.x = Math.random() * canvas!.width;
              this.y = Math.random() * canvas!.height;
              this.size = Math.random() * 3 + 0.5;
              this.speedX = Math.random() * 0.5 - 0.25;
              this.speedY = Math.random() * 0.5 - 0.25;
              this.color = `rgba(${Math.floor(Math.random() * 100) + 155}, ${
                Math.floor(Math.random() * 100) + 155
              }, 255, ${Math.random() * 0.4 + 0.1})`;
            }

            update() {
              this.x += this.speedX;
              this.y += this.speedY;

              if (this.x > canvas!.width) this.x = 0;
              if (this.x < 0) this.x = canvas!.width;
              if (this.y > canvas!.height) this.y = 0;
              if (this.y < 0) this.y = canvas!.height;
            }

            draw() {
              if (!ctx) return;
              ctx.fillStyle = this.color;
              ctx.beginPath();
              ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
              ctx.fill();
            }
          }

          const particles: Particle[] = [];
          for (let i = 0; i < 70; i++) {
            particles.push(new Particle());
          }

          function animate() {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas!.width, canvas!.height);

            particles.forEach((particle) => {
              particle.update();
              particle.draw();
            });

            requestAnimationFrame(animate);
          }

          animate();
        }

        // Focus on name input when component mounts
        if (nameInputRef.current) {
          nameInputRef.current.focus();
        }

        // Start animations
        controls.start({ opacity: 1, scale: 1, x: 0 });
        inputControls.start({ opacity: 1, y: 0, x: 0 });
      }, [controls, inputControls]);

      // Mouse movement handler for 3D effect
      const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left - rect.width / 2);
        mouseY.set(e.clientY - rect.top - rect.height / 2);
      };

      // Form handlers
      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Clear error when typing
        if (authStore.errors[name as AuthErrorField]) {
          runInAction(() => {
            authStore.clearError(name);
          });
        }
        // if (formErrors[name]) {
        //   setFormErrors((prev) => ({ ...prev, [name]: "" }));
        // }
      };

      const validateStep = () => {
        // const errors: { [key: string]: string } = {};

        if (step === 0) {
          if (!formData.name.trim()) {
            authStore.setError({ field: "name", message: "Name is required!" });
          }
          if (!formData.email.trim()) {
            authStore.setError({
              field: "email",
              message: "Email is required!",
            });
          } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            authStore.setError({
              field: "email",
              message: "Please enter a valid email",
            });
          }
        } else if (step === 1) {
          if (!formData.password) {
            authStore.setError({
              field: "password",
              message: "Password is required",
            });
          } else if (formData.password.length < 8) {
            authStore.setError({
              field: "password",
              message: "Password must be at least 8 characters",
            });
          }

          if (!formData.confirmPassword) {
            authStore.setError({
              field: "confirmPassword",
              message: "Please confirm your password",
            });
          } else if (formData.confirmPassword !== formData.password) {
            authStore.setError({
              field: "confirmPassword",
              message: "Passwords don't match",
            });
          }
        }

        // setFormErrors(errors);
        //     authStore.setError({
        //       field?: string;
        // message: string;
        // code?: string;
        //     })
        // return Object.keys(errors).length === 0;
      };

      // const variants = {
      //   step1: { opacity: 1, x: 0, transition: { duration: 0.5 } },
      //   exitLeft: { opacity: 0, x: "100%", transition: { duration: 0.5 } },
      //   exitRight: { opacity: 0, x: "-100%", transition: { duration: 0.5 } },
      // };

      const handleNext = () => {
        validateStep();
        const hasError = Object.keys(authStore.errors).length;
        if (!hasError) {
          controls
            .start({ x: "-100%", opacity: 0, transition: { duration: 0.5 } })
            .then(() => {
              setStep(1);
              controls.set({ x: "100%" });
              controls.start({
                x: 0,
                opacity: 1,
                transition: { duration: 0.5 },
              });
            });
        }
      };

      const handleBack = () => {
        controls
          .start({ x: "100%", opacity: 0, transition: { duration: 0.5 } })
          .then(() => {
            setStep(0);
            controls.set({ x: "-100%" });
            controls.start({ x: 0, opacity: 1, transition: { duration: 0.5 } });
          });
      };

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        validateStep();
        const hasError = Object.keys(authStore.errors).length;
        if (!hasError) {
          // setIsLoading(true);
          // Simulate API call
          // await new Promise((resolve) => setTimeout(resolve, 2000));
          // // setIsLoading(false);
          // // Success animation
          // controls
          //   .start({ scale: 0.8, opacity: 0, transition: { duration: 0.5 } })
          //   .then(() => {
          //     setStep(2);
          //     controls.set({ scale: 1.2 });
          //     controls.start({
          //       scale: 1,
          //       opacity: 1,
          //       transition: { duration: 0.5, type: "spring" },
          //     });
          //   });
          const result = await onSubmit({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            confirmPassword: formData.confirmPassword,
          });
          if (result?.user?.emailVerified) return navigate("/dashboard");
          setStep(2);
        }
      };

      const handleSocialLogin = async (provider: SocialProvider) => {
        const cred = await authStore.socialLoginPopup(provider);
        if (cred?.user?.emailVerified) {
          return navigate("/dashboard");
        }
      };

      function getGeneralError() {
        const errors = authStore.errors;
        if (step === 0) {
          if (errors.generic || errors.password || errors.confirmPassword) {
            const err = (
              errors.generic ||
              errors.password ||
              errors.confirmPassword
            )?.message;
            return <p className="text-red-500 text-sm my-2">{err}</p>;
          }
        } else if (step === 1) {
          if (errors.generic || errors.name || errors.email) {
            const err = (errors.generic || errors.name || errors.email)
              ?.message;
            return <p className="text-red-500 text-sm my-2">{err}</p>;
          }
        }
      }

      return (
        <div
          className={cn(
            "min-h-screen py-20 w-full bg-black flex items-center justify-center p-4 overflow-hidden relative",
            className
          )}
          {...props}
        >
          {/* Ambient animated background */}
          <Navbar className="dark" />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none"
          />

          <motion.div
            className="absolute inset-0 w-full h-full"
            // style={{ scale: videoScale }}
          >
            <video
              autoPlay
              muted
              loop
              playsInline
              className="object-cover w-full h-full"
              style={{ filter: "brightness(0.8)" }}
            >
              <source src="/media/vids/customers-happy.mp4" type="video/mp4" />
            </video>

            <motion.div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.4) 100%)",
                // opacity: videoOpacity,
              }}
            />
          </motion.div>

          {/* Decorative rings */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full blur-3xl opacity-10 animate-pulse" />
          <div
            className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full blur-3xl opacity-10 animate-pulse"
            style={{ animationDelay: "1s" }}
          />

          {/* Decorative text */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl overflow-hidden pointer-events-none">
            <div className="opacity-15 whitespace-nowrap text-[20vw] font-black text-white tracking-tighter leading-none">
              CENPHI
            </div>
          </div>

          {/* Card container */}
          <motion.div
            className="relative z-10 w-full max-w-md"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
          >
            <motion.div
              className="relative overflow-hidden rounded-2xl shadow-2xl backdrop-blur-xl select-none"
              style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
                perspective: 1000,
              }}
              onMouseMove={handleMouseMove}
            >
              {/* Glassmorphism card */}
              <div className="relative border border-gray-800 rounded-2xl bg-gradient-to-br from-gray-900/95 via-gray-900/98 to-black/95 shadow-inner backdrop-blur-2xl">
                {/* Glowing border effect */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent opacity-50 blur-xl" />
                  <div className="absolute -inset-0.5 z-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 opacity-20 blur-md" />
                </div>

                {/* Inner content */}
                <div className="px-8 py-12 relative z-10">
                  <AnimatePresence mode="wait">
                    {step === 0 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: "-100%" }}
                        // animate={controls}
                        animate={{
                          opacity: 1,
                          x: 0,
                          transition: { duration: 0.5 },
                        }}
                        exit={{
                          opacity: 0,
                          x: "100%",
                          transition: { duration: 0.5 },
                        }}
                        className="space-y-6"
                      >
                        <motion.div
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="text-center"
                        >
                          <h1 className="text-4xl font-bold text-white tracking-tight">
                            <span className="inline-block">
                              <motion.span
                                className="inline-block"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                              >
                                Join
                              </motion.span>
                              <motion.span
                                className="inline-block ml-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-500 font-playball"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                              >
                                Cenphi
                              </motion.span>
                            </span>
                          </h1>

                          <motion.p
                            className="mt-3 text-gray-400 text-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                          >
                            Begin your journey to exclusivity
                          </motion.p>

                          {getGeneralError()}
                        </motion.div>

                        <div className="space-y-5">
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            // animate={inputControls}
                            animate={{
                              opacity: 1,
                              y: 0,
                              x: 0,
                              transition: { duration: 0.5 },
                            }}
                            transition={{ delay: 0.2 }}
                            className="space-y-1"
                          >
                            <div className="relative group">
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur-sm opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
                              <div className="relative flex items-center">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <FiUser className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                  ref={nameInputRef}
                                  type="text"
                                  name="name"
                                  value={formData.name}
                                  onChange={handleChange}
                                  placeholder="Full Name"
                                  className="block w-full pl-10 pr-3 py-4 bg-gray-800/40 rounded-lg border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                />
                              </div>
                              {errors?.name && (
                                <p className="text-red-500 text-xs mt-1">
                                  {errors?.name.message}
                                </p>
                              )}
                            </div>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            // animate={inputControls}
                            animate={{
                              opacity: 1,
                              y: 0,
                              x: 0,
                              transition: { duration: 0.5 },
                            }}
                            transition={{ delay: 0.4 }}
                            className="space-y-1"
                          >
                            <div className="relative group">
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur-sm opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
                              <div className="relative flex items-center">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <HiOutlineMail className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                  type="email"
                                  name="email"
                                  value={formData.email}
                                  onChange={handleChange}
                                  placeholder="Email Address"
                                  className="block w-full pl-10 pr-3 py-4 bg-gray-800/40 rounded-lg border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                />
                              </div>
                              {errors?.email && (
                                <p className="text-red-500 text-xs mt-1">
                                  {errors.email?.message}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        </div>

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6 }}
                          className="pt-4"
                        >
                          <motion.button
                            type="button"
                            onClick={handleNext}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="group w-full py-4 rounded-lg relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 transition-all duration-300" />
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white transition-opacity duration-300" />
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 blur-lg transition-opacity duration-300" />
                            <span className="relative flex items-center justify-center text-white font-medium tracking-wide">
                              Continue
                              <BsArrowRight className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                            </span>
                          </motion.button>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.8 }}
                          className="relative py-5"
                        >
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-800"></div>
                          </div>
                          <div className="relative flex justify-center">
                            <span className="px-4 bg-gradient-to-r from-black via-gray-900 to-black text-xs text-gray-500 uppercase tracking-widest">
                              Or Continue with
                            </span>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.0 }}
                          className="grid grid-cols-3 gap-4"
                        >
                          {[
                            {
                              icon: <FcGoogle className="h-5 w-5" />,
                              name: "google",
                            },
                            {
                              icon: (
                                <BsFacebook className="h-5 w-5 text-blue-500" />
                              ),
                              name: "facebook",
                            },
                            {
                              icon: <FaApple className="h-5 w-5 text-white" />,
                              name: "apple",
                            },
                          ].map((provider, idx) => (
                            <motion.button
                              key={idx}
                              type="button"
                              whileHover={{ y: -2, scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() =>
                                handleSocialLogin(
                                  provider.name as SocialProvider
                                )
                              }
                              className="relative group py-3 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-gray-600 transition-all duration-300"
                            >
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur-md transition-opacity duration-300" />
                              <span className="flex items-center justify-center">
                                {provider.icon}
                              </span>
                            </motion.button>
                          ))}
                        </motion.div>

                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.2 }}
                          className="text-center text-xs text-gray-500 mt-6"
                        >
                          Already a member?{" "}
                          <a
                            href="/login"
                            className="text-blue-400 hover:text-blue-300 transition-colors duration-300"
                          >
                            Sign in
                          </a>
                        </motion.p>
                      </motion.div>
                    )}

                    {step === 1 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: "100%" }}
                        // animate={controls}
                        animate={{
                          opacity: 1,
                          x: 0,
                          transition: { duration: 0.5 },
                        }}
                        exit={{
                          opacity: 0,
                          x: "-100%",
                          transition: { duration: 0.5 },
                        }}
                        className="space-y-6"
                      >
                        <motion.div
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-center"
                        >
                          <h1 className="text-4xl font-bold text-white tracking-tight">
                            <span className="inline-block">
                              <motion.span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-500">
                                Secure
                              </motion.span>
                              <motion.span className="inline-block ml-3">
                                Access
                              </motion.span>
                            </span>
                          </h1>
                          <motion.p className="mt-3 text-gray-400 text-sm">
                            Set your credentials
                          </motion.p>

                          {getGeneralError()}
                        </motion.div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="space-y-1"
                          >
                            <div className="relative group">
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur-sm opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
                              <div className="relative flex items-center">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <RiLockPasswordLine className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                  type={showPassword ? "text" : "password"}
                                  name="password"
                                  value={formData.password}
                                  onChange={handleChange}
                                  placeholder="Password"
                                  className="block w-full pl-10 pr-12 py-4 bg-gray-800/40 rounded-lg border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowPassword(!showPassword)
                                    }
                                    className="text-gray-500 hover:text-gray-300 focus:outline-none"
                                  >
                                    {showPassword ? (
                                      <FiEyeOff className="h-5 w-5" />
                                    ) : (
                                      <FiEye className="h-5 w-5" />
                                    )}
                                  </button>
                                </div>
                              </div>
                              {errors?.password && (
                                <p className="text-red-500 text-xs mt-1">
                                  {errors?.password.message}
                                </p>
                              )}
                            </div>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="space-y-1"
                          >
                            <div className="relative group">
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur-sm opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
                              <div className="relative flex items-center">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <RiLockPasswordLine className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                  type={
                                    showConfirmPassword ? "text" : "password"
                                  }
                                  name="confirmPassword"
                                  value={formData.confirmPassword}
                                  onChange={handleChange}
                                  placeholder="Confirm Password"
                                  className="block w-full pl-10 pr-12 py-4 bg-gray-800/40 rounded-lg border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowConfirmPassword(
                                        !showConfirmPassword
                                      )
                                    }
                                    className="text-gray-500 hover:text-gray-300 focus:outline-none"
                                  >
                                    {showConfirmPassword ? (
                                      <FiEyeOff className="h-5 w-5" />
                                    ) : (
                                      <FiEye className="h-5 w-5" />
                                    )}
                                  </button>
                                </div>
                              </div>
                              {errors?.confirmPassword && (
                                <p className="text-red-500 text-xs mt-1">
                                  {errors?.confirmPassword.message}
                                </p>
                              )}
                            </div>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="pt-4 flex space-x-4"
                          >
                            <motion.button
                              type="button"
                              onClick={handleBack}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="w-1/3 py-4 px-6 rounded-lg bg-gray-800/80 border border-gray-700 text-gray-300 hover:bg-gray-700/80 transition-all duration-300"
                            >
                              Back
                            </motion.button>
                            <motion.button
                              type="submit"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="group w-2/3 py-4 rounded-lg relative overflow-hidden"
                              disabled={isLoading}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 transition-all duration-300" />
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white transition-opacity duration-300" />
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 blur-lg transition-opacity duration-300" />
                              <span className="relative flex items-center justify-center text-white font-medium tracking-wide">
                                {isLoading ? (
                                  <svg
                                    className="animate-spin h-5 w-5 text-white"
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
                                ) : (
                                  <>
                                    Create Account
                                    <BsArrowRight className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                                  </>
                                )}
                              </span>
                            </motion.button>
                          </motion.div>
                        </form>

                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.8 }}
                          className="pt-4"
                        >
                          <div className="flex flex-col space-y-1">
                            <p className="text-xs text-gray-500">
                              Password strength:
                            </p>
                            <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                                initial={{ width: "0%" }}
                                animate={{
                                  width: formData.password
                                    ? formData.password.length < 5
                                      ? "20%"
                                      : formData.password.length < 8
                                      ? "40%"
                                      : formData.password.length < 10
                                      ? "60%"
                                      : formData.password.length < 12
                                      ? "80%"
                                      : "100%"
                                    : "0%",
                                }}
                                transition={{ duration: 0.3 }}
                              />
                            </div>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.0 }}
                          className="pt-2"
                        >
                          <p className="text-xs text-gray-500">
                            By creating an account, you agree to our{" "}
                            <a
                              href="#"
                              className="text-blue-400 hover:text-blue-300 transition-colors duration-300"
                            >
                              Terms of Service
                            </a>{" "}
                            and{" "}
                            <a
                              href="#"
                              className="text-blue-400 hover:text-blue-300 transition-colors duration-300"
                            >
                              Privacy Policy
                            </a>
                          </p>
                        </motion.div>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 1.2 }}
                        animate={{
                          opacity: 1,
                          x: 0,
                          transition: { duration: 0.5 },
                        }}
                        // animate={controls}
                        className="space-y-8 flex flex-col items-center justify-center py-10"
                      >
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.3, type: "spring" }}
                          className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
                        >
                          <svg
                            className="w-12 h-12 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </motion.div>

                        <div className="text-center space-y-3">
                          <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="text-2xl font-bold text-white"
                          >
                            Welcome to Cenphi
                          </motion.h2>

                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="text-gray-400 text-sm"
                          >
                            <p>Your account is successfully created!.</p>
                            <p>Please verify your email to continue.</p>
                          </motion.div>
                        </div>

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.9 }}
                        >
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="group py-4 px-8 rounded-lg relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 transition-all duration-300" />
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white transition-opacity duration-300" />
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 blur-lg transition-opacity duration-300" />
                            <span className="relative flex items-center justify-center text-white font-medium tracking-wide">
                              Continue
                              <BsArrowRight className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                            </span>
                          </motion.button>
                        </motion.div>

                        {/* Animated confetti effect */}
                        <motion.div
                          className="absolute inset-0 pointer-events-none"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          {Array.from({ length: 50 }).map((_, i) => {
                            const size = Math.random() * 10 + 5;
                            const xPos = Math.random() * 100;
                            const delay = Math.random() * 0.7;
                            const duration = Math.random() * 2 + 2;
                            const color = [
                              "bg-blue-500",
                              "bg-purple-500",
                              "bg-indigo-500",
                              "bg-cyan-500",
                              "bg-violet-500",
                              "bg-blue-400",
                            ][Math.floor(Math.random() * 6)];

                            return (
                              <motion.div
                                key={i}
                                className={`absolute w-2 h-2 rounded-full ${color}`}
                                style={{
                                  left: `${xPos}%`,
                                  width: size,
                                  height: size,
                                }}
                                initial={{
                                  y: -20,
                                  opacity: 0,
                                  rotate: Math.random() * 360,
                                }}
                                animate={{
                                  y: window.innerHeight,
                                  opacity: [0, 1, 1, 0],
                                  rotate: Math.random() * 720,
                                }}
                                transition={{
                                  duration: duration,
                                  delay: delay,
                                  ease: "easeOut",
                                  repeat: Infinity,
                                  repeatDelay: Math.random() * 5 + 5,
                                }}
                              />
                            );
                          })}
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Decorative dots */}
                <div className="absolute bottom-4 right-4 flex space-x-1">
                  <div
                    className={`h-1 w-8 rounded-full ${
                      step === 0 ? "bg-blue-500" : "bg-gray-700"
                    } transition-colors duration-300`}
                  />
                  <div
                    className={`h-1 w-8 rounded-full ${
                      step === 1 ? "bg-blue-500" : "bg-gray-700"
                    } transition-colors duration-300`}
                  />
                  <div
                    className={`h-1 w-8 rounded-full ${
                      step === 2 ? "bg-blue-500" : "bg-gray-700"
                    } transition-colors duration-300`}
                  />
                </div>
              </div>
            </motion.div>

            {/* Brand logo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
              className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 flex items-center space-x-2"
            >
              <span className="text-xs text-gray-600 uppercase tracking-widest">
                Powered by
              </span>
              <span className="text-sm text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 font-semibold">
                CENPHI
              </span>
            </motion.div>
          </motion.div>

          {/* Floating elements for visual interest */}
          <div className="absolute overflow-hidden inset-0 pointer-events-none">
            {Array.from({ length: 8 }).map((_, i) => {
              const size = Math.random() * 5 + 2;
              const xPos = Math.random() * 100;
              const yPos = Math.random() * 100;
              const delay = Math.random() * 10;
              const duration = Math.random() * 20 + 10;

              return (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-white opacity-20"
                  style={{
                    left: `${xPos}%`,
                    top: `${yPos}%`,
                    width: size,
                    height: size,
                  }}
                  animate={{
                    x: [0, Math.random() * 100 - 50],
                    y: [0, Math.random() * 100 - 50],
                    opacity: [0.2, 0.5, 0.2],
                  }}
                  transition={{
                    duration: duration,
                    delay: delay,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                />
              );
            })}
          </div>
        </div>
      );
    }
  );

export default SignUpForm;
