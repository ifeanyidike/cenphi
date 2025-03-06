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
} from "firebase/auth";
import { auth } from "../config/firebase";
import { AuthError, FirebaseErrorHandler } from "@/services/error";

export type SocialProvider = "google" | "apple" | "facebook";

class AuthStore {
  public user: User | null = null;
  public loading: boolean = false;
  public error: AuthError | undefined = undefined;

  private providers = {
    google: new GoogleAuthProvider(),
    apple: new OAuthProvider("apple.com"),
    facebook: new FacebookAuthProvider(),
  };

  constructor() {
    makeAutoObservable(this);

    // Set up auth state listener
    onAuthStateChanged(auth, (user) => {
      runInAction(() => {
        this.user = user;
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
    this.error = error;
  }

  private async handleCredential(credential: UserCredential) {
    runInAction(() => {
      this.user = credential.user;
    });

    // Handle Apple specific data if available
    if (credential.providerId === "apple.com") {
      const displayName = credential.user.displayName;
      if (displayName) {
        console.log("displayName: ", displayName);
        // Store the display name as Apple doesn't send it in subsequent logins
        // You might want to store this in your database
      }
    }

    return credential.user;
  }

  private async handleRedirectResult() {
    try {
      const result = await getRedirectResult(auth);
      if (result) {
        await this.handleCredential(result);
      }
    } catch (error: any) {
      this.setError(FirebaseErrorHandler.checkFirebaseErrorsAndThrow(error));
      throw error;
    }
  }

  async socialLoginPopup(provider: SocialProvider) {
    try {
      this.setLoading(true);
      this.setError();

      const authProvider = this.providers[provider];

      if (provider === "apple") {
        // Apple specific configuration
        (authProvider as OAuthProvider).setCustomParameters({
          // Request user name and email on first sign-in
          locale: navigator.language || "en",
          state: Math.random().toString(36).substring(2, 15),
        });
      } else {
        // Force re-authentication for other providers
        authProvider.setCustomParameters({
          prompt: "select_account",
        });
      }

      const result = await signInWithPopup(auth, authProvider);
      return await this.handleCredential(result);
    } catch (error: any) {
      this.setError(FirebaseErrorHandler.checkFirebaseErrorsAndThrow(error));

      // If popup was blocked, try redirect method
      if (error.code === "auth/popup-blocked") {
        return this.socialLoginRedirect(provider);
      }

      throw error;
    } finally {
      this.setLoading(false);
    }
  }

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
      this.setError(FirebaseErrorHandler.checkFirebaseErrorsAndThrow(error));
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  public async signup(email: string, password: string) {
    try {
      this.setLoading(true);
      this.setError();

      const isValid = FirebaseErrorHandler.validateEmail(email);
      if (!isValid) {
        this.setError({
          field: "email",
          message: "Invalid email format. Please enter a valid email address.",
        });
        return false;
      }

      const passwordError = FirebaseErrorHandler.validatePassword(password);
      if (passwordError) {
        this.setError({
          field: "password",
          message: passwordError,
        });
        return false;
      }

      const cred = await createUserWithEmailAndPassword(auth, email, password);
      return true;
      console.log("signup cred", cred);
    } catch (error: any) {
      // Handle Firebase auth errors
      this.setError(FirebaseErrorHandler.checkFirebaseErrorsAndThrow(error));
    } finally {
      this.setLoading(false);
    }
  }

  public async login(email: string, password: string) {
    try {
      this.setLoading(true);
      this.setError();
      // Invalid email format. Please enter a valid email address.
      // this.validateEmailAndThrow(email);
      const isValid = FirebaseErrorHandler.validateEmail(email);
      if (!isValid) {
        this.setError({
          field: "email",
          message: "Invalid email format. Please enter a valid email address.",
        });
        return;
      }

      const cred = await signInWithEmailAndPassword(auth, email, password);
      return true;
      console.log("login cred", cred);
    } catch (error: any) {
      console.error("login error", error);
      this.setError(FirebaseErrorHandler.checkFirebaseErrorsAndThrow(error));
      return false;
    } finally {
      this.setLoading(false);
    }
  }

  public async logout() {
    try {
      this.setLoading(true);
      this.setError();
      await signOut(auth);
    } catch (error: any) {
      this.setError(FirebaseErrorHandler.checkFirebaseErrorsAndThrow(error));
    } finally {
      this.setLoading(false);
    }
  }

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
      this.setError(FirebaseErrorHandler.checkFirebaseErrorsAndThrow(error));
    } finally {
      this.setLoading(false);
    }
  }

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

  get isAuthenticated() {
    return !!this.user;
  }
}

export const authStore = new AuthStore();
