// id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
// name VARCHAR(255),
// website_url VARCHAR(255),
// industry VARCHAR(100),
// plan workspace_plan DEFAULT 'essentials',
// settings JSONB DEFAULT '{}',
// branding_settings JSONB DEFAULT '{}',
// custom_domain VARCHAR(255),
// analytics_settings JSONB DEFAULT '{}',
// integration_settings JSONB DEFAULT '{}',
// created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
// updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP

export type Plan =
  | "essentials"
  | "growth"
  | "accelerate"
  | "transform"
  | "enterprise";

export type Workspace = {
  id: string;
  name?: string;
  website_url?: string;
  plan: Plan;
  settings?: Record<string, any>;
  branding_settings?: Record<string, any>;
  analytics_settings?: Record<string, any>;
  integration_settings?: Record<string, any>;
  custom_domain?: string;
  created_at?: Date;
  updated_at?: Date;
};
