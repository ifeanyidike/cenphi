// repositories/managers/memberManager.ts

import { MemberDataParams } from "@/types/member";
import { makeAutoObservable, runInAction } from "mobx";
import { WorkspaceOrchestrator } from "../workspace_hub";

/**
 * Manages member-related operations, including fetching and storing member data.
 * This manager utilizes the WorkspaceOrchestrator for authentication and API interactions.
 */
export class MemberManager {
  private server = import.meta.env.VITE_API_URL + "/team-member";
  public member: MemberDataParams | null = null;
  public loadingMembers = true;
  private workspaceOrchestrator: WorkspaceOrchestrator;

  constructor(workspaceOrchestrator: WorkspaceOrchestrator) {
    this.workspaceOrchestrator = workspaceOrchestrator;
    makeAutoObservable(this);
  }

  /**
   * Fetches a member's data using the provided UID or, if omitted, the current user's UID.
   *
   * @param uid - (Optional) The UID of the member to retrieve. If not provided, uses the current user's UID.
   * @returns A promise that resolves to the member data.
   * @throws Will throw an error if the request fails or the member data cannot be retrieved.
   */
  getUser = async (uid?: string) => {
    const { token, currentUser } = await this.workspaceOrchestrator.getToken();
    const id = uid ?? currentUser.uid;
    this.loadingMembers = true;

    try {
      const response = await fetch(`${this.server}/firebase_uid/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const member = (await response.json()) as MemberDataParams;
        console.log("member", member);
        runInAction(() => {
          this.member = member;
          this.loadingMembers = false;
        });
        return member;
      }

      console.log("response", await response.json());
      throw new Error("could not get user");
    } catch (error) {
      console.error("Error fetching members:", error);
      throw error;
    } finally {
      runInAction(() => {
        this.loadingMembers = false;
      });
    }
  };
}
