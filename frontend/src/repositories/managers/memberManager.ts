// repositories/managers/memberManager.ts
import { MemberDataParams } from "@/types/member";
import { WorkspaceRepository } from "../workspaceRepository";
import { makeAutoObservable, runInAction } from "mobx";

export class MembersManager {
  private server = import.meta.env.VITE_API_URL + "/team-member";
  public member: MemberDataParams | null = null;
  public loadingMembers = true;
  private workspaceRepository: WorkspaceRepository;

  constructor(workspaceRepository: WorkspaceRepository) {
    this.workspaceRepository = workspaceRepository;
    makeAutoObservable(this);
  }

  getUser = async (uid?: string) => {
    const { token, currentUser } = await this.workspaceRepository.getToken();

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
