import { Plan } from "./workspace";

type MemberRole = "owner" | "admin" | "viewer" | "editor";

type Member = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: MemberRole;
  settings: Record<string, any>;
  permissions: Record<string, any>;
  created_at: Date;
};

export type MemberDataParams = {
  name: string;
  email: string;
  firebase_uid: string;
  email_verified: string;
  workspace_name: string;
  workspace_plan: Plan;
  website_url: string;
  industry: string;
} & Member;
