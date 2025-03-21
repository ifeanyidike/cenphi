// repositories/WorkspaceRepository.ts

import { auth } from "@/config/firebase";
import { Workspace } from "@/types/workspace";
import { makeAutoObservable, observable } from "mobx";
import { MemberManager } from "./managers/member";
import { TestimonialManager } from "./managers/testimonial";

/**
 * The WorkspaceOrchestrator class handles the orchestration of workspace-related
 * operations such as retrieving authentication tokens and updating workspace details.
 * It integrates with member and testimonial managers to manage associated data.
 */
export class WorkspaceOrchestrator {
  public server = import.meta.env.VITE_API_URL + "/workspaces";

  public memberManager: MemberManager;

  public testimonialManager: TestimonialManager;

  /**
   * Constructs a new WorkspaceOrchestrator instance.
   * Initializes member and testimonial managers and makes the instance observable.
   */
  constructor() {
    this.memberManager = new MemberManager(this);
    this.testimonialManager = new TestimonialManager(this);

    makeAutoObservable(this, {
      memberManager: observable.ref,
      testimonialManager: observable.ref,
    });
  }

  /**
   * Retrieves the current authenticated user's token and details.
   *
   * @returns A promise that resolves to an object containing the token and the current user.
   * @throws Error if the user is not authenticated or token is not available.
   */
  public async getToken() {
    const currentUser = auth.currentUser;
    const token = await currentUser?.getIdToken();
    if (!currentUser?.uid || !token)
      throw new Error("Token not found, Unauthorized!");
    return { token, currentUser };
  }

  /**
   * Updates workspace details using the provided partial workspace data.
   *
   * @param updates - Partial workspace data to update the existing workspace.
   * @returns A promise that resolves to a boolean indicating whether the update was successful.
   * @throws Error if the user is not authorized, the workspace does not exist, or the request fails.
   */
  async update(updates: Partial<Workspace>) {
    const { token, currentUser } = await this.getToken();

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
}

export const workspaceHub = new WorkspaceOrchestrator();
