// stores/rootStore.ts

import { makeAutoObservable, runInAction } from "mobx";
import { TestimonialManager } from "./managers/testimonial";
import { authStore } from "@/stores/authStore";
import { Workspace } from "@/types/testimonial";

/**
 * The WorkspaceOrchestrator class handles the orchestration of workspace-related
 * operations such as retrieving authentication tokens and updating workspace details.
 * It integrates with member and testimonial managers to manage associated data.
 */
export class WorkspaceOrchestrator {
  public server = import.meta.env.VITE_API_URL + "/workspaces";
  public ID: string | null = null;
  public workspace: Workspace | null = null;
  public testimonialManager: TestimonialManager;
  private workspaceFetchPromise: Promise<boolean> | null = null;

  /**
   * Constructs a new WorkspaceOrchestrator instance.
   * Initializes testimonial manager and makes the instance observable.
   */
  constructor() {
    this.testimonialManager = new TestimonialManager();

    makeAutoObservable(this);
  }

  /**
   * Updates workspace details using the provided partial workspace data.
   *
   * @param updates - Partial workspace data to update the existing workspace.
   * @returns A promise that resolves to a boolean indicating whether the update was successful.
   * @throws Error if the user is not authorized, the workspace does not exist, or the request fails.
   */
  async update(updates: Partial<Workspace>) {
    const { token } = await authStore.getToken();

    if (!this.workspace?.id) throw new Error("Workspace does not exist");

    const response = await fetch(`${this.server}/${this.workspace.id}`, {
      method: "PUT",
      body: JSON.stringify({
        ...updates,
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const respJSON = await response.text();
    console.log("respJSON", respJSON);
    if (!response.ok) {
      throw new Error("Unauthorized request");
    }
    console.log("response", response.ok);
    return response.ok;
  }

  async getWorkspaceData() {
    // If a fetch is already in progress, return that promise to prevent duplicate requests
    if (this.workspaceFetchPromise) {
      console.log(
        "⏳ Workspace fetch already in progress, returning existing promise"
      );
      return this.workspaceFetchPromise;
    }

    // If workspace is already loaded, return true immediately
    if (this.workspace?.id) {
      console.log("✅ Workspace already loaded:", this.workspace.id);
      return true;
    }

    // Create new fetch promise
    this.workspaceFetchPromise = this._fetchWorkspaceData();

    try {
      const result = await this.workspaceFetchPromise;
      return result;
    } finally {
      // Clear the promise after fetch completes (success or failure)
      this.workspaceFetchPromise = null;
    }
  }

  private async _fetchWorkspaceData(): Promise<boolean> {
    try {
      const { token } = await authStore.getToken();
      if (!token) return false;

      console.log("🔄 Fetching workspace data...");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/workspace`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Workspace data received:", data.id);
        if (data.id) {
          const { testimonials, ...workspace } = data;
          runInAction(() => {
            workspaceHub.workspace = workspace;
            // Only set testimonials if not already loaded to prevent race condition
            if (
              !workspaceHub.testimonialManager.testimonials ||
              workspaceHub.testimonialManager.testimonials.length === 0
            ) {
              workspaceHub.testimonialManager.testimonials = testimonials || [];
            }
          });

          return true;
        }
      } else if (response.status === 404) {
        // User doesn't have a workspace yet - this is expected for new users
        console.log(
          "ℹ️  No workspace found for user - user needs to complete onboarding"
        );
        return false;
      } else {
        console.error(
          "❌ Failed to fetch workspace:",
          response.status,
          response.statusText
        );
        return false;
      }
    } catch (error) {
      console.error("❌ Error checking workspace:", error);
      return false;
    }
    return false;
  }

  async checkUserExists() {
    try {
      const { token } = await authStore.getToken();
      if (!token) return;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/user`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.id) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error checking workspace:", error);
    }
  }

  async setupOnboarding(companyName: string, websiteUrl: string) {
    const { token, currentUser } = await authStore.getToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    // Get user email and name from Firebase Auth
    const userEmail = currentUser.email;
    const userName = currentUser.displayName || "";

    if (!userEmail) {
      throw new Error("User email is required for onboarding");
    }

    const workspace_id = crypto.randomUUID();
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/onboarding/setup`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firebase_uid: currentUser.uid,
          email: userEmail,
          name: userName,
          workspace: {
            plan: "essentials",
            workspace_id,
            name: companyName, // Use company name directly, without appending " Workspace"
            website_url: websiteUrl || "",
            // Brand context extraction will happen in background if website provided
          },
          team_member: {
            role: "owner",
          },
        }),
      }
    );
    console.log("workspace_id", workspace_id);
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || "Failed to create workspace");
    }

    const data = await response.json();
    if (data.id) {
      console.log("data", data);
      const { testimonials, ...workspace } = data;
      runInAction(() => {
        workspaceHub.workspace = workspace;
        workspaceHub.testimonialManager.testimonials = testimonials || [];
      });

      return data.id;
    }
  }
}

export const workspaceHub = new WorkspaceOrchestrator();
