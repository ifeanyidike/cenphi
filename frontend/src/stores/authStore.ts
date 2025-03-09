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

class AuthStore {
  public user: User | null = null;
  public loading: boolean = false;
  // public error: AuthError | undefined = undefined;
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
    if (error?.field) {
      this.errors[error.field as AuthErrorField] = error;
    } else {
      this.errors["generic"] = error;
    }
  }

  public clearError(key: string) {
    delete this.errors[key as AuthErrorField];
  }
  public clearAllErrors() {
    this.errors = {} as AuthErrors;
  }

  // private async handleCredential(credential: UserCredential) {
  //   runInAction(() => {
  //     this.user = credential.user;
  //   });

  //   // Handle Apple specific data if available
  //   // if (credential.providerId === "apple.com") {
  //   //   const displayName = credential.user.displayName;
  //   //   if (displayName) {
  //   //     console.log("displayName: ", displayName);
  //   //     // Store the display name as Apple doesn't send it in subsequent logins
  //   //     // You might want to store this in your database
  //   //   }
  //   // }

  //   return credential;
  // }

  private async handleRedirectResult() {
    try {
      const result = await getRedirectResult(auth);
      if (result) {
        this.user = result.user;
        this.registerUser(
          result,
          this.user.displayName || "",
          this.user.email!
        );
        // await this.handleCredential(result);
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

      const creds = await signInWithPopup(auth, authProvider);
      this.user = creds.user;

      await this.registerUser(
        creds,
        creds.user.displayName!,
        creds.user.email!
      );
      return creds;
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

  private async registerUser(
    cred: UserCredential,
    name: string,
    email: string
  ) {
    try {
      const response = await fetch(`${this.server}/users/register`, {
        method: "POST",
        body: JSON.stringify({
          id: crypto.randomUUID(),
          name,
          email,
          email_verified: cred.user.emailVerified,
          firebase_uid: cred.user.uid,
        }),
      });

      if (!response.ok) {
        console.log("response.status", response.statusText);
        this.setError({
          message: response.statusText,
        });
        return;
      }
      const result = await response.json();
      console.log("result", result);
      return result;
    } catch (error: any) {
      this.setError({
        message: error.message,
      });
    }
  }

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

      await this.registerUser(cred, name, email);
      return cred;
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

      return cred;
    } catch (error: any) {
      console.error("login error", error);
      this.setError(FirebaseErrorHandler.checkFirebaseErrorsAndThrow(error));
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

  get currentUser() {
    return this.user || auth.currentUser;
  }
}

export const authStore = new AuthStore();
