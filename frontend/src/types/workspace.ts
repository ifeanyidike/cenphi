export interface Workspace {
  id: string;
  name: string;
  userId: string;
  [key: string]: any;
}

export interface WorkspaceSettings {
  [key: string]: any;
}