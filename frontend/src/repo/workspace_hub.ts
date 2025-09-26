// stores/rootStore.ts

import { makeAutoObservable, observable, runInAction } from "mobx";
import { MemberManager } from "./managers/member";
import { TestimonialManager } from "./managers/testimonial";
import { AIStudioManager } from "./managers/ai_studio_manager";
import { ServiceLineageManager } from "./managers/service_lineage_manager";
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
  public memberManager: MemberManager;
  public workspace: Workspace | null = null;

  public testimonialManager: TestimonialManager;
  aiStudioManager: AIStudioManager;
  serviceLineageManager: ServiceLineageManager;

  /**
   * Constructs a new WorkspaceOrchestrator instance.
   * Initializes member and testimonial managers and makes the instance observable.
   */
  constructor() {
    this.memberManager = new MemberManager(this);
    this.testimonialManager = new TestimonialManager(this);
    this.aiStudioManager = new AIStudioManager();
    this.serviceLineageManager = new ServiceLineageManager();

    makeAutoObservable(this, {
      memberManager: observable.ref,
      testimonialManager: observable.ref,
      aiStudioManager: observable.ref,
      serviceLineageManager: observable.ref,
    });
  }

  /**
   * Updates workspace details using the provided partial workspace data.
   *
   * @param updates - Partial workspace data to update the existing workspace.
   * @returns A promise that resolves to a boolean indicating whether the update was successful.
   * @throws Error if the user is not authorized, the workspace does not exist, or the request fails.
   */
  async update(updates: Partial<Workspace>) {
    const { token, currentUser } = await authStore.getToken();

    let member = this.memberManager.member;
    if (!member) {
      member = await this.memberManager.getUser(currentUser?.uid);
    }

    if (!member?.workspace_id) throw new Error("Workspace does not exist");

    const response = await fetch(`${this.server}/${member.workspace_id}`, {
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
    try {
      const { token } = await authStore.getToken();
      if (!token) return;

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
        console.log("data", data);
        if (data.id) {
          const { testimonials, ...workspace } = data;
          runInAction(() => {
            workspaceHub.workspace = workspace;
            workspaceHub.testimonialManager.testimonials = testimonials || [];
          });

          return true;
        }
      }
    } catch (error) {
      console.error("Error checking workspace:", error);
    }
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
          workspace: {
            plan: "essentials",
            workspace_id,
            name: `${companyName} Workspace`,
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
