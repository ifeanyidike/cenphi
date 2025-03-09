import { makeAutoObservable } from "mobx";

class WorkspaceStore {
  //   private server = import.meta.env.VITE_API_URL;
  constructor() {
    makeAutoObservable(this);
  }
}

export const workspaceStore = new WorkspaceStore();
