// stores/authStateManager.ts
import { auth } from "@/config/firebase";
import { User } from "firebase/auth";

export class AuthStateManager {
  private authReady = false;
  private currentUser: User | null = null;
  private authPromise: Promise<User | null> | null = null;

  constructor() {
    this.initializeAuthState();
  }

  private initializeAuthState() {
    this.authPromise = new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        this.currentUser = user;
        this.authReady = true;
        unsubscribe();
        resolve(user);
      });
    });
  }

  async getCurrentUser(): Promise<User | null> {
    if (this.authReady) {
      return this.currentUser;
    }
    return this.authPromise;
  }

  async getToken(): Promise<{ token: string; currentUser: User }> {
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
}

export const authStateManager = new AuthStateManager();
