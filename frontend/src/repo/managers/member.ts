// repositories/managers/memberManager.ts

import { MemberDataParams } from "@/types/member";
import { makeAutoObservable, runInAction } from "mobx";
import { WorkspaceOrchestrator } from "../workspace_hub";
import axios from "axios";
import { authStateManager } from "./auth_state_manager";

/**
 * Manages member-related operations, including fetching and storing member data.
 * This manager utilizes the WorkspaceOrchestrator for authentication and API interactions.
 */
export class MemberManager {
  private server = import.meta.env.VITE_API_URL + "/team-member";
  public member: MemberDataParams | null = null;
  public loadingMembers = true;
  private workspaceOrchestrator: WorkspaceOrchestrator;

  private fetchPromise: Promise<MemberDataParams> | null = null;
  private lastFetchUid: string | null = null;

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
  async getUser(uid?: string): Promise<MemberDataParams | null> {
    const { token, currentUser } = await authStateManager.getToken();
    const id = uid ?? currentUser.uid;

    // PREVENT CONCURRENT CALLS FOR SAME UID
    if (this.fetchPromise && this.lastFetchUid === id) {
      console.log("🔄 Returning existing promise for UID:", id);
      return this.fetchPromise;
    }

    // If we already have this member, return it immediately
    if (
      this.member &&
      this.member.firebase_uid === id &&
      !this.loadingMembers
    ) {
      console.log("✅ Returning cached member for UID:", id);
      return this.member;
    }

    console.log("🚀 Starting new fetch for UID:", id);
    this.lastFetchUid = id;

    // CREATE PROMISE AND STORE IT
    this.fetchPromise = this.performFetch(id, token);

    try {
      const member = await this.fetchPromise;
      return member;
    } finally {
      // CLEAR PROMISE WHEN DONE
      this.fetchPromise = null;
      this.lastFetchUid = null;
    }
  }

  private async performFetch(
    id: string,
    token: string
  ): Promise<MemberDataParams> {
    runInAction(() => {
      this.loadingMembers = true;
    });

    try {
      console.log("📡 Making API request for UID:", id);
      // const response = await fetch(`${this.server}/firebase_uid/${id}`, {
      //   method: "GET",
      //   headers: {
      //     "Content-Type": "application/json",
      //     Authorization: `Bearer ${token}`,
      //   },
      // });
      const response = await axios.get(`${this.server}/firebase_uid/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if ((response.status = 200)) {
        // const member = (await response.json()) as MemberDataParams;
        const member = response.data;
        console.log("✅ Member fetched successfully");

        runInAction(() => {
          this.member = member;
          this.loadingMembers = false;
        });

        return member;
      }

      throw new Error("Could not get user");
    } catch (error) {
      runInAction(() => {
        this.loadingMembers = false;
      });
      throw error;
    }
  }
}
