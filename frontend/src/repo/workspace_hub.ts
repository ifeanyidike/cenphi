// // stores/rootStore.ts

// import { TestimonialStore } from "./managers/testimonial";
// import { AnalysisStore } from "./managers/AnalysisStore";
// import { UIStore } from "./managers/UIStore";
// import { WidgetStore } from "./managers/WidgetStore";
// import { VideoEditorStore } from "./managers/videoEditorStore";
// import { AudioEditorStore } from "./managers/audioEditorStore";
// import { TextEditorStore } from "./managers/textEditorStore";

// export class RootStore {
//   testimonialStore: TestimonialStore;
//   analysisStore: AnalysisStore;
//   uiStore: UIStore;
//   widgetStore: WidgetStore;
//   videoEditorStore: VideoEditorStore;
//   audioEditorStore: AudioEditorStore;
//   textEditorStore: TextEditorStore;

//   constructor() {
//     this.testimonialStore = new TestimonialStore();
//     this.analysisStore = new AnalysisStore();
//     this.uiStore = new UIStore();
//     this.widgetStore = new WidgetStore();
//     this.videoEditorStore = new VideoEditorStore();
//     this.audioEditorStore = new AudioEditorStore();
//     this.textEditorStore = new TextEditorStore();
//   }
// }

// // Create a single instance of the root store
// export const rootStore = new RootStore();

// repositories/WorkspaceRepository.ts
import { auth } from "@/config/firebase";
import { Workspace } from "@/types/workspace";
import { makeAutoObservable, observable } from "mobx";
import { MemberManager } from "./managers/member";
import { TestimonialManager } from "./managers/testimonial";
import { AnalysisManager } from "./managers/analysis";
import { UIManager } from "./managers/ui_manager";
import { WidgetManager } from "./managers/widget";
import { VideoEditorManager } from "./managers/video_editor";
import { AudioEditorManager } from "./managers/audio_editor";
import { TextEditorManager } from "./managers/text_editor";
import { ImageEditorManager } from "./managers/image_editor";

/**
 * The WorkspaceOrchestrator class handles the orchestration of workspace-related
 * operations such as retrieving authentication tokens and updating workspace details.
 * It integrates with member and testimonial managers to manage associated data.
 */
export class WorkspaceOrchestrator {
  public server = import.meta.env.VITE_API_URL + "/workspaces";

  public memberManager: MemberManager;

  public testimonialManager: TestimonialManager;
  analysisManager: AnalysisManager;
  uiManager: UIManager;
  widgetManager: WidgetManager;
  videoEditorManager: VideoEditorManager;
  audioEditorManager: AudioEditorManager;
  textEditorManager: TextEditorManager;
  imageEditorManager: ImageEditorManager;

  /**
   * Constructs a new WorkspaceOrchestrator instance.
   * Initializes member and testimonial managers and makes the instance observable.
   */
  constructor() {
    this.memberManager = new MemberManager(this);
    this.testimonialManager = new TestimonialManager(this);
    this.analysisManager = new AnalysisManager();
    this.uiManager = new UIManager();
    this.widgetManager = new WidgetManager();
    this.videoEditorManager = new VideoEditorManager();
    this.audioEditorManager = new AudioEditorManager();
    this.textEditorManager = new TextEditorManager();
    this.imageEditorManager = new ImageEditorManager();

    makeAutoObservable(this, {
      memberManager: observable.ref,
      testimonialManager: observable.ref,
      analysisManager: observable.ref,
      uiManager: observable.ref,
      widgetManager: observable.ref,
      videoEditorManager: observable.ref,
      audioEditorManager: observable.ref,
      textEditorManager: observable.ref,
      imageEditorManager: observable.ref,
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
