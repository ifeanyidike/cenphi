import { makeAutoObservable, runInAction } from "mobx";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
  onAuthStateChanged,
  User,
  verifyPasswordResetCode,
  confirmPasswordReset,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  UserCredential,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { auth } from "../config/firebase";
import {
  AuthError,
  AuthErrorField,
  AuthErrors,
  FirebaseErrorHandler,
} from "@/services/error";

export type SocialProvider = "google" | "apple" | "facebook";

/**
 * AuthStore handles all authentication-related operations including user sign-up,
 * login, logout, social login via popup or redirect, password reset, and email verification.
 * It maintains the current user's state along with loading and error statuses.
 */
class AuthStore {
  public user: User | null = null;
  public loading: boolean = true;
  public errors: AuthErrors = {} as AuthErrors;
  private server = import.meta.env.VITE_API_URL;

  private providers = {
    google: new GoogleAuthProvider(),
    apple: new OAuthProvider("apple.com"),
    facebook: new FacebookAuthProvider(),
  };

  constructor() {
    makeAutoObservable(this);
    // Set up auth state listener
    onAuthStateChanged(auth, (user) => {
      console.log("onAuthStateChanged triggered", user);
      runInAction(() => {
        this.user = user;
        this.loading = false;
      });
    });

    // Configure Google provider
    this.providers.google.addScope("email");
    this.providers.google.addScope("profile");

    // Configure Apple provider
    this.providers.apple.addScope("email");
    this.providers.apple.addScope("name");

    // Configure Facebook provider
    this.providers.facebook.addScope("email");
    this.providers.facebook.addScope("public_profile");

    // Check for redirect result on init
    this.handleRedirectResult();
  }

  private setLoading(status: boolean) {
    this.loading = status;
  }

  public setError(error?: AuthError) {
    if (error?.field) {
      this.errors[error.field as AuthErrorField] = error;
    } else {
      this.errors["generic"] = error;
    }
  }

  public clearError(key: string) {
    delete this.errors[key as AuthErrorField];
  }

  public clearFieldError(field: AuthErrorField) {
    delete this.errors[field];
  }

  public clearAllErrors() {
    this.errors = {} as AuthErrors;
  }

  /**
   * Processes the redirect result after a social login.
   * If a valid result is found, updates the user state and registers the user.
   *
   * @returns {Promise<void>}
   * @throws An error if processing the redirect result fails.
   */
  private async handleRedirectResult(): Promise<void> {
    try {
      const result = await getRedirectResult(auth);
      if (result) {
        this.user = result.user;
        await this.registerUser(
          result,
          this.user.displayName || "",
          this.user.email!
        );
        console.log("registration successful redirect....");

        // Check if user has workspace and redirect accordingly
        await this.redirectAfterSocialLogin();
      }
    } catch (error: any) {
      const formattedError = FirebaseErrorHandler.formatError(error);
      this.setError(formattedError);
      console.error("Redirect result error:", formattedError);
      throw error;
    }
  }

  /**
   * Initiates a social login using a popup window.
   * Configures provider-specific parameters, attempts sign-in, and registers the user.
   *
   * @param provider - The social provider to use (e.g., "google", "apple", or "facebook").
   * @returns A promise that resolves to the user credentials on successful login.
   * @throws An error if the login fails, with a fallback to redirect if the popup is blocked.
   */
  async socialLoginPopup(provider: SocialProvider) {
    try {
      this.setLoading(true);
      this.setError();

      const authProvider = this.providers[provider];

      if (provider === "apple") {
        // Apple specific configuration
        (authProvider as OAuthProvider).setCustomParameters({
          locale: navigator.language || "en",
          state: Math.random().toString(36).substring(2, 15),
        });
      } else {
        // Force re-authentication for other providers
        authProvider.setCustomParameters({
          prompt: "select_account",
        });
      }

      const creds = await signInWithPopup(auth, authProvider);
      this.user = creds.user;

      await this.registerUser(
        creds,
        creds.user.displayName!,
        creds.user.email!
      );
      console.log("registration successful redirect in social login....");

      // Check if user has workspace and redirect accordingly
      await this.redirectAfterSocialLogin();
      return creds;
    } catch (error: any) {
      const formattedError = FirebaseErrorHandler.formatError(error);
      this.setError(formattedError);
      console.error("Social login popup error:", formattedError);

      // If popup was blocked, try redirect method
      if (error.code === "auth/popup-blocked") {
        return this.socialLoginRedirect(provider);
      }

      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Initiates a social login via redirect.
   * Configures provider-specific parameters and starts the redirect-based sign-in process.
   *
   * @param provider - The social provider to use.
   * @returns A promise that resolves when the redirect process is initiated.
   * @throws An error if the login redirect fails.
   */
  async socialLoginRedirect(provider: SocialProvider) {
    try {
      this.setLoading(true);
      this.setError();

      const authProvider = this.providers[provider];

      if (provider === "apple") {
        // Apple specific configuration
        (authProvider as OAuthProvider).setCustomParameters({
          locale: navigator.language || "en",
          state: Math.random().toString(36).substring(2, 15),
        });
      } else {
        // Force re-authentication for other providers
        authProvider.setCustomParameters({
          prompt: "select_account",
        });
      }

      await signInWithRedirect(auth, authProvider);
    } catch (error: any) {
      const formattedError = FirebaseErrorHandler.formatError(error);
      this.setError(formattedError);
      console.error("Social login redirect error:", formattedError);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Registers a user with the backend using credentials from a social login or sign-up.
   *
   * @param cred - The user credentials returned from Firebase authentication.
   * @param name - The user's display name.
   * @param email - The user's email address.
   * @returns A promise that resolves to the backend registration result.
   */
  private async registerUser(
    cred: UserCredential,
    name: string,
    email: string,
    isEmailPassword = false
  ) {
    try {
      const response = await fetch(`${this.server}/users/register`, {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          email_verified: cred.user.emailVerified,
          firebase_uid: cred.user.uid,
        }),
      });

      if (!response.ok) {
        if (isEmailPassword || response.status != 409) {
          console.log("response.status", response.statusText);
          this.setError({
            message: response.statusText,
          });
        }
        return false;
      }
      const result = await response.json();
      console.log("result", result);
      return true;
    } catch (error: any) {
      this.setError({
        message: error.message,
      });
    }
  }

  /**
   * Signs up a new user using email and password.
   * Validates inputs, creates the user in Firebase, sends an email verification,
   * and registers the user with the backend.
   *
   * @param name - The new user's display name.
   * @param email - The new user's email address.
   * @param password - The new user's password.
   * @returns A promise that resolves to the user credentials.
   * @throws An error if the sign-up process fails.
   */
  public async signup(name: string, email: string, password: string) {
    try {
      this.setLoading(true);
      this.setError();

      const isValid = FirebaseErrorHandler.validateEmail(email);
      if (!isValid) {
        this.setError({
          field: "email",
          message: "Invalid email format. Please enter a valid email address.",
        });
        return;
      }

      const passwordError = FirebaseErrorHandler.validatePassword(password);
      if (passwordError) {
        this.setError({
          field: "password",
          message: passwordError,
        });
        return;
      }

      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      console.log("credential", cred);
      sendEmailVerification(cred.user);

      await this.registerUser(cred, name, email, true);
      return cred;
    } catch (error: any) {
      const formattedError = FirebaseErrorHandler.formatError(error);
      this.setError(formattedError);
      console.error("Signup error:", formattedError);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Logs in a user with email and password.
   * Validates the email format and attempts sign-in with Firebase.
   *
   * @param email - The user's email address.
   * @param password - The user's password.
   * @returns A promise that resolves to the user credentials.
   * @throws An error if the login process fails.
   */
  public async login(email: string, password: string) {
    try {
      this.setLoading(true);
      this.setError();
      const isValid = FirebaseErrorHandler.validateEmail(email);
      if (!isValid) {
        this.setError({
          field: "email",
          message: "Invalid email format. Please enter a valid email address.",
        });
        return;
      }

      const cred = await signInWithEmailAndPassword(auth, email, password);

      return cred;
    } catch (error: any) {
      const formattedError = FirebaseErrorHandler.formatError(error);
      this.setError(formattedError);
      console.error("Login error:", formattedError);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Logs out the current user.
   *
   * @returns A promise that resolves when the user is successfully signed out.
   * @throws An error if the logout process fails.
   */
  public async logout() {
    try {
      this.setLoading(true);
      this.setError();
      await signOut(auth);
    } catch (error: any) {
      const formattedError = FirebaseErrorHandler.formatError(error);
      this.setError(formattedError);
      console.error("Logout error:", formattedError);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Sends a password reset email to the specified email address.
   *
   * @param email - The email address to send the password reset link to.
   * @returns A promise that resolves with a success message.
   * @throws An error if the request fails or the email format is invalid.
   */
  public async requestPasswordReset(email: string) {
    try {
      this.setLoading(true);
      this.setError();

      const isValid = FirebaseErrorHandler.validateEmail(email);
      if (!isValid) {
        this.setError({
          field: "email",
          message: "Invalid email format. Please enter a valid email address.",
        });
        return;
      }

      await sendPasswordResetEmail(auth, email);
      return "Password reset email sent successfully.";
    } catch (error: any) {
      const formattedError = FirebaseErrorHandler.formatError(error);
      this.setError(formattedError);
      console.error("Password reset request error:", formattedError);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Verifies a password reset code and retrieves the associated email.
   *
   * @param actionCode - The password reset action code.
   * @returns A promise that resolves to the email associated with the reset code.
   * @throws An error if the code is invalid or expired.
   */
  async verifyResetCode(actionCode: string) {
    try {
      this.setLoading(true);
      this.setError();
      const email = await verifyPasswordResetCode(auth, actionCode);
      return email;
    } catch (error: any) {
      console.log("error", error?.message);
      this.setError({
        message: "Invalid or expired reset link",
      });
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Completes the password reset process by setting a new password.
   *
   * @param actionCode - The password reset action code.
   * @param newPassword - The new password to set.
   * @returns A promise that resolves when the password has been successfully updated.
   * @throws An error if the password reset process fails.
   */
  async completePasswordReset(actionCode: string, newPassword: string) {
    try {
      this.setLoading(true);
      this.setError();
      await confirmPasswordReset(auth, actionCode, newPassword);
    } catch (error: any) {
      this.setError({
        field: "password",
        message: error.message || "Failed to reset password",
      });
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Updates the current user's email address.
   *
   * @param newEmail - The new email address to update to.
   * @returns A promise that resolves when the email has been successfully updated.
   * @throws An error if the update process fails or if no user is logged in.
   */
  public async updateUserEmail(newEmail: string) {
    try {
      if (!auth.currentUser) throw new Error("You must be logged in to update");
      this.setLoading(true);
      this.setError();
      await updateEmail(auth.currentUser, newEmail);
    } catch (error: any) {
      this.setError(error.message);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Updates the current user's password.
   *
   * @param newPassword - The new password to set.
   * @returns A promise that resolves when the password has been successfully updated.
   * @throws An error if the update process fails or if no user is logged in.
   */
  public async updateUserPassword(newPassword: string) {
    try {
      if (!auth.currentUser) throw new Error("You must be logged in to update");
      this.setLoading(true);
      this.setError();
      await updatePassword(auth.currentUser, newPassword);
    } catch (error: any) {
      this.setError(error.message);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Indicates whether a user is currently authenticated.
   *
   * @returns True if the user is authenticated, false otherwise.
   */
  get isAuthenticated() {
    return !!this.user;
  }

  /**
   * Provides a fallback name based on the user's display name or email.
   *
   * @returns A two-character string derived from the user's name or email, or an empty string if unavailable.
   */
  get fallbackName() {
    if (!this.user) return "";
    const displayname = this.user?.displayName;
    const email = this.user?.email;
    if (displayname) {
      return displayname[0] + displayname[1];
    } else if (email) {
      return email[0] + email[1];
    }
  }

  /**
   * Retrieves the current authenticated user from the store or Firebase.
   *
   * @returns The current user if available, otherwise the Firebase current user.
   */
  get currentUser() {
    return this.user || auth.currentUser;
  }

  /**
   * Verifies the current user's email by updating the backend.
   *
   * @returns A promise that resolves to an object indicating success or containing an error message.
   */
  async verifyEmail() {
    if (!this.user?.uid) return { error: "Invalid user" };

    const token = await this.user?.getIdToken();

    if (!token) return { error: "Token not found, Unauthorized!" };

    try {
      const response = await fetch(`${this.server}/users/${this.user?.uid}`, {
        method: "PUT",
        body: JSON.stringify({ email_verified: true }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        return { error: "Unauthorized user! verification failed." };
      }

      if (response.ok) {
        return { success: true };
      }
    } catch (error: any) {
      return { error: error.message };
    }
  }

  /**
   * Clear errors for specific fields when user starts typing
   * This should be called from form input handlers
  //  */
  // public clearFieldError(field: AuthErrorField) {
  //   if (this.errors[field]) {
  //     delete this.errors[field];
  //   }
  //   // Also clear generic errors when user interacts with form
  //   if (this.errors.generic && field !== "generic") {
  //     delete this.errors.generic;
  //   }
  // }

  /**
   * Check if there are any errors
   */
  public get hasErrors(): boolean {
    return Object.keys(this.errors).length > 0;
  }

  /**
   * Get error message for a specific field
   */
  public getErrorMessage(field: AuthErrorField): string | undefined {
    return this.errors[field]?.message;
  }

  /**
   * Get current user with proper waiting for auth state
   */
  public async getCurrentUser(): Promise<User | null> {
    // If auth is still loading, wait for it to complete
    if (this.loading) {
      return new Promise((resolve) => {
        const checkAuth = () => {
          if (!this.loading) {
            resolve(this.user);
          } else {
            // Check again in 100ms
            setTimeout(checkAuth, 100);
          }
        };
        checkAuth();
      });
    }
    return this.user;
  }

  /**
   * Get Firebase token for API calls
   */
  public async getToken(): Promise<{ token: string; currentUser: User }> {
    const currentUser = await this.getCurrentUser();

    if (!currentUser) {
      throw new Error("No current user found");
    }

    const token = await currentUser.getIdToken();

    if (!token) {
      throw new Error("Could not get Firebase token");
    }

    return { token, currentUser };
  }

  /**
   * Check if user has workspace and redirect accordingly after social login
   * New users → /onboarding
   * Existing users with workspace → /dashboard
   */
  private async redirectAfterSocialLogin(): Promise<void> {
    try {
      // Dynamically import to avoid circular dependency
      const { workspaceHub } = await import("@/repo/workspace_hub");

      // Check if user has workspace
      const hasWorkspace = await workspaceHub.getWorkspaceData();

      if (hasWorkspace) {
        // Existing user with workspace → go to dashboard
        window.location.href = "/dashboard";
      } else {
        // New user without workspace → go to onboarding
        window.location.href = "/onboarding";
      }
    } catch (error) {
      console.error("Error checking workspace after social login:", error);
      // Default to onboarding if check fails
      window.location.href = "/onboarding";
    }
  }
}

export const authStore = new AuthStore();
