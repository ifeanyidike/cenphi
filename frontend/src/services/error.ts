export interface AuthError {
  field?: string;
  message: string;
  code?: string;
}

interface ErrorMapping {
  field?: string;
  message: string;
}

export type AuthErrorField =
  | "name"
  | "email"
  | "password"
  | "confirmPassword"
  | "generic";
export type AuthErrors = Record<AuthErrorField, AuthError | undefined>;

const AUTH_ERROR_MAPPINGS: Record<string, ErrorMapping> = {
  // Email-related errors
  "auth/email-already-in-use": {
    field: "email",
    message: "Email already in use. Please sign in or use a different email.",
  },
  "auth/invalid-email": {
    field: "email",
    message: "Invalid email format. Please enter a valid email address.",
  },
  "auth/user-not-found": {
    field: "email",
    message: "Email not found. Please sign up or use a different email.",
  },

  // Password-related errors
  "auth/wrong-password": {
    field: "password",
    message: "Incorrect email or password. Please try again.",
  },
  "auth/weak-password": {
    field: "password",
    message:
      "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
  },
  "auth/requires-recent-login": {
    message:
      "This operation is sensitive and requires recent authentication. Please log in again before retrying.",
  },

  // Account-related errors
  "auth/user-disabled": {
    message: "This account has been disabled. Please contact support for help.",
  },
  "auth/user-token-expired": {
    message: "Your session has expired. Please sign in again.",
  },
  "auth/too-many-requests": {
    message:
      "Too many unsuccessful attempts. Please try again later or reset your password.",
  },

  // Social auth errors
  "auth/account-exists-with-different-credential": {
    message:
      "An account already exists with the same email address but different sign-in credentials. Try signing in with a different method.",
  },
  "auth/popup-blocked": {
    message:
      "Sign-in popup was blocked by your browser. Please enable popups or try again.",
  },
  "auth/popup-closed-by-user": {
    message: "Sign-in popup was closed. Please try again.",
  },
  "auth/cancelled-popup-request": {
    message: "The previous sign-in attempt was cancelled. Please try again.",
  },
  "auth/operation-not-allowed": {
    message: "This sign-in method is not enabled. Please contact support.",
  },

  // Network errors
  "auth/network-request-failed": {
    message:
      "Network error occurred. Please check your internet connection and try again.",
  },
  "auth/timeout": {
    message: "The request timed out. Please try again.",
  },

  // Reset password errors
  "auth/expired-action-code": {
    message: "The password reset link has expired. Please request a new one.",
  },
  "auth/invalid-action-code": {
    message:
      "The action code is invalid. Please request a new one or try again.",
  },

  // Other errors
  "auth/internal-error": {
    message: "An internal error occurred. Please try again later.",
  },
  "auth/invalid-credential": {
    message: "Invalid username or password. Please try again.",
  },
};

export class FirebaseErrorHandler {
  static formatError(error: any): AuthError {
    // Handle non-Firebase errors
    if (!error.code) {
      return {
        message: "An unexpected error occurred. Please try again later.",
        code: "unknown-error",
      };
    }

    // Get the error mapping or use default
    const errorMapping = AUTH_ERROR_MAPPINGS[error.code] || {
      message:
        "An error occurred while processing your request. Please try again later.",
    };

    return {
      field: errorMapping.field,
      message: errorMapping.message,
      code: error.code,
    };
  }

  static checkFirebaseErrorsAndThrow(error: any): never {
    const formattedError = this.formatError(error);
    // You can add logging here if needed
    // console.error('Firebase Auth Error:', {
    //   originalError: error,
    //   formattedError
    // });
    throw formattedError;
  }

  // Helper method to validate password strength
  static validatePassword(password: string): string | null {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return "Password must be at least 8 characters long.";
    }
    if (!hasUpperCase) {
      return "Password must contain at least one uppercase letter.";
    }
    if (!hasLowerCase) {
      return "Password must contain at least one lowercase letter.";
    }
    if (!hasNumbers) {
      return "Password must contain at least one number.";
    }
    if (!hasSpecialChar) {
      return "Password must contain at least one special character.";
    }

    return null;
  }

  static validateEmail(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }
    return true;
  }
}
