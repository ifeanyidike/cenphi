import { auth } from "@/config/firebase";
import { Workspace } from "@/types/workspace";
import { makeAutoObservable, observable } from "mobx";
import { MembersManager } from "./managers/memberManager";
import { TestimonialManager } from "./managers/testimonialManager";

export class WorkspaceRepository {
  public server = import.meta.env.VITE_API_URL + "/workspaces";
  public membersManager: MembersManager;
  public testimonialManager: TestimonialManager;

  constructor() {
    this.membersManager = new MembersManager(this);
    this.testimonialManager = new TestimonialManager(this);

    makeAutoObservable(this, {
      membersManager: observable.ref,
      testimonialManager: observable.ref,
    });
  }

  public async getFirebaseToken() {
    const currentUser = auth.currentUser;
    const token = await currentUser?.getIdToken();
    if (!currentUser?.uid || !token)
      throw new Error("Token not found, Unauthorized!");
    return { token, currentUser };
  }

  async update(updates: Partial<Workspace>) {
    const { token, currentUser } = await this.getFirebaseToken();

    let member = this.membersManager.member;
    if (!member) {
      member = await this.membersManager.getUser(currentUser?.uid);
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

export const workspaceRepo = new WorkspaceRepository();
