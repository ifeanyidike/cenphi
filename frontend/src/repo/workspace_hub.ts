// repositories/WorkspaceRepository.ts
import { auth } from "@/config/firebase";
import { Workspace } from "@/types/workspace";
import { makeAutoObservable, observable } from "mobx";
import { MemberManager } from "./managers/member";
import { TestimonialManager } from "./managers/testimonial";

export class WorkspaceOrchestrator {
  public server = import.meta.env.VITE_API_URL + "/workspaces";
  public memberManager: MemberManager;
  public testimonialManager: TestimonialManager;

  constructor() {
    this.memberManager = new MemberManager(this);
    this.testimonialManager = new TestimonialManager(this);

    makeAutoObservable(this, {
      memberManager: observable.ref,
      testimonialManager: observable.ref,
    });
  }

  public async getToken() {
    const currentUser = auth.currentUser;
    const token = await currentUser?.getIdToken();
    if (!currentUser?.uid || !token)
      throw new Error("Token not found, Unauthorized!");
    return { token, currentUser };
  }

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
