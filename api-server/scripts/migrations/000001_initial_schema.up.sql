-- ----------------------------------
-- UP MIGRATION: 000001_initial_schema.up.sql
-- ----------------------------------

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Domains
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'uuid_pk') THEN
    CREATE DOMAIN uuid_pk AS UUID DEFAULT uuid_generate_v4() NOT NULL;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ts_tz') THEN
    CREATE DOMAIN ts_tz AS TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL;
  END IF;
END$$;

-- Trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- PostgreSQL ENUMs for type safety and performance
CREATE TYPE content_type AS ENUM ('video', 'text');
CREATE TYPE content_status AS ENUM ('draft', 'processing', 'approved', 'published', 'failed');
CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE social_platform AS ENUM ('linkedin'); -- MVP: LinkedIn only, easy to extend
CREATE TYPE post_status AS ENUM ('draft', 'scheduled', 'published', 'failed');
CREATE TYPE oauth_status AS ENUM ('connected', 'expired', 'revoked', 'error');
CREATE TYPE collection_method AS ENUM ('widget', 'form', 'email', 'dashboard_import', 'drive_import');

-- Users
CREATE TABLE users (
  id uuid_pk PRIMARY KEY,
  firebase_uid VARCHAR(128) NOT NULL UNIQUE,
  email CITEXT NOT NULL UNIQUE,
  email_verified BOOLEAN DEFAULT FALSE,
  name VARCHAR(255),
  settings JSONB DEFAULT '{}',
  last_active_at TIMESTAMPTZ,
  created_at ts_tz,
  updated_at ts_tz
);
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_email ON users(email);

-- Workspaces
CREATE TABLE workspaces (
  id uuid_pk PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  website_url VARCHAR(255),
  plan VARCHAR(50) DEFAULT 'essentials',

  settings JSONB DEFAULT '{}',
  brand_context JSONB DEFAULT '{}',
  
  -- Stats
  total_testimonials INTEGER DEFAULT 0,

  created_at ts_tz,
  updated_at ts_tz
);
CREATE TRIGGER trg_workspaces_updated BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_workspaces_plan ON workspaces(plan);

-- Team Members
CREATE TABLE team_members (
  id uuid_pk PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'viewer',
  permissions JSONB DEFAULT '{}',
  created_at ts_tz,
  updated_at ts_tz,
  UNIQUE(workspace_id, user_id)
);
CREATE TRIGGER trg_team_members_updated BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_team_members_workspace ON team_members(workspace_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);

-- Testimonials
CREATE TABLE testimonials (
  id uuid_pk PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Author information
  author_name VARCHAR(255),
  author_email CITEXT,
  author_company VARCHAR(255),
  author_title VARCHAR(255),
  author_avatar_url TEXT,

  -- Content
  type content_type NOT NULL DEFAULT 'text',
  status content_status DEFAULT 'draft',
  format VARCHAR(100), -- the video format
  content TEXT, -- text input OR full transcript from video
  media_url TEXT,
  transcript_segments JSONB DEFAULT '[]', -- Timestamped segments for video/audio processing
  
  -- Collection metadata
  collection_method collection_method DEFAULT 'widget', -- widget, email_link, dashboard_import, drive_import
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  metadata JSONB DEFAULT '{}', -- email campaign details, import source, etc.
  
  -- Processing
  processing_status job_status DEFAULT 'pending',
  processing_metadata JSONB DEFAULT '{}',

  tags TEXT[] DEFAULT '{}',
  created_at ts_tz,
  updated_at ts_tz
);
CREATE TRIGGER trg_testimonials_updated BEFORE UPDATE ON testimonials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_testimonials_workspace ON testimonials(workspace_id);
CREATE INDEX idx_testimonials_status ON testimonials(status);
CREATE INDEX idx_testimonials_type ON testimonials(type);
CREATE INDEX idx_testimonials_tags ON testimonials USING gin(tags);
CREATE INDEX idx_testimonials_content_trgm ON testimonials USING gin(content gin_trgm_ops);
CREATE INDEX idx_testimonials_collection_method ON testimonials(collection_method);
CREATE INDEX idx_testimonials_rating ON testimonials(rating);

-- Testimonial Artifacts for all AI processing results
CREATE TABLE testimonial_artifacts (
  id uuid_pk PRIMARY KEY,
  testimonial_id UUID REFERENCES testimonials(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Processing identification
  processing_type TEXT NOT NULL, -- sentiment_analysis, highlight_extraction, content_generation, etc.
  result_category TEXT NOT NULL, -- analysis, content, optimization, enhancement, clipping
  
  -- Content storage (flexible for different result types)
  text_content TEXT, -- translated text, polished text, generated content
  data JSONB DEFAULT '{}', -- sentiment scores, highlights array, emotions, business_recommendations
  asset_url TEXT, -- video URLs, audio URLs, enhanced media
  
  -- Context and metadata
  content_type TEXT, -- case_study, white_paper, sales_deck, video, audio, etc.
  platform VARCHAR(256), -- linkedin, facebook, twitter, instagram (for platform-specific optimizations)
  format VARCHAR(50), -- mp4, wav, jpg, etc.
  
  -- User interaction
  is_user_saved BOOLEAN DEFAULT false, -- whether user explicitly saved streamed content
  is_streamed BOOLEAN DEFAULT false, -- whether this was delivered via streaming
  
  -- Processing metadata
  processing_metadata JSONB DEFAULT '{}', -- job details, quality settings, etc.
  
  created_at ts_tz,
  updated_at ts_tz
);

CREATE TRIGGER trg_testimonial_artifacts_updated BEFORE UPDATE ON testimonial_artifacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_testimonial_artifacts_testimonial ON testimonial_artifacts(testimonial_id);
CREATE INDEX idx_testimonial_artifacts_type ON testimonial_artifacts(processing_type);
CREATE INDEX idx_testimonial_artifacts_category ON testimonial_artifacts(result_category);
CREATE INDEX idx_testimonial_artifacts_platform ON testimonial_artifacts(platform);
CREATE INDEX idx_testimonial_artifacts_saved ON testimonial_artifacts(is_user_saved);
CREATE INDEX idx_testimonial_artifacts_content_type ON testimonial_artifacts(content_type);


-- Social Media Accounts
CREATE TABLE social_accounts (
    id uuid_pk PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform social_platform NOT NULL,
    
    -- OAuth credentials
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    
    -- Platform identification
    platform_user_id VARCHAR(255) NOT NULL,
    platform_username VARCHAR(255), -- Important for Twitter, Instagram handles
    platform_email VARCHAR(255),
    account_name VARCHAR(255),
    account_type VARCHAR(50), -- 'personal', 'business', 'page' - needed for Facebook/Instagram
    
    -- Essential metadata for different platforms
    platform_data JSONB DEFAULT '{}', -- Platform-specific data (page IDs, etc.)
    permissions TEXT[], -- Scopes/permissions for the account
    
    -- Status and error tracking
    status oauth_status DEFAULT 'connected',
    last_error TEXT, -- Simple error message for UI
    last_sync_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(workspace_id, platform, platform_user_id)
);
CREATE TRIGGER trg_social_accounts_updated BEFORE UPDATE ON social_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_social_accounts_workspace ON social_accounts(workspace_id);
CREATE INDEX idx_social_accounts_status ON social_accounts(status);
CREATE INDEX idx_social_accounts_user ON social_accounts(user_id);
CREATE INDEX idx_social_accounts_platform ON social_accounts(platform);

-- Social Media Posts
CREATE TABLE social_posts (
    id uuid_pk PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    testimonial_id UUID REFERENCES testimonials(id) ON DELETE SET NULL,
    social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
    
    -- Content with media support
    content TEXT NOT NULL,
    post_type VARCHAR(50) DEFAULT 'text',
    media_urls TEXT[], -- Essential for Instagram, Facebook, future platforms
    hashtags TEXT[],
    
    -- Platform posting data
    platform social_platform NOT NULL, -- Denormalized for easier querying
    platform_post_id VARCHAR(255), -- Platform's post ID after publishing
    platform_url TEXT, -- Direct link to post (good for analytics)
    
    -- Scheduling and status
    status post_status DEFAULT 'draft',
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    
    -- Basic metrics (enough for most needs)
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0, -- Important for LinkedIn, Facebook
    
    -- Platform-specific metadata
    platform_data JSONB DEFAULT '{}', -- Platform-specific response data
    
    -- Error handling and retry logic
    error_details JSONB, -- Structured error info for debugging
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Performance tracking
    last_metrics_sync TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER trg_social_posts_updated BEFORE UPDATE ON social_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_social_posts_workspace ON social_posts(workspace_id);
CREATE INDEX idx_social_posts_testimonial ON social_posts(testimonial_id);
CREATE INDEX idx_social_posts_account ON social_posts(social_account_id);
CREATE INDEX idx_social_posts_scheduled_at ON social_posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_social_posts_status ON social_posts(status);
CREATE INDEX idx_social_posts_platform ON social_posts(platform);
CREATE INDEX idx_social_posts_published_at ON social_posts(published_at);

CREATE TABLE jobs (
  id uuid_pk PRIMARY KEY,
  job_type TEXT NOT NULL, -- sentiment_analysis, publish_post, story_mode, etc.
  
  -- Specific foreign keys for main entities (null if not applicable)
  testimonial_id UUID REFERENCES testimonials(id) ON DELETE CASCADE,
  social_post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Job execution
  status job_status DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  scheduled_at ts_tz, -- When to execute (for immediate jobs, same as created_at)
  
  -- Job data
  payload JSONB DEFAULT '{}',
  result JSONB DEFAULT '{}',
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  created_at ts_tz,
  updated_at ts_tz
);
CREATE TRIGGER trg_jobs_updated BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_type ON jobs(job_type);
CREATE INDEX idx_jobs_priority ON jobs(priority);
CREATE INDEX idx_jobs_scheduled ON jobs(scheduled_at) WHERE status = 'pending';
CREATE INDEX idx_jobs_retry ON jobs(retry_count, status) WHERE status = 'failed';
CREATE INDEX idx_jobs_testimonial ON jobs(testimonial_id) WHERE testimonial_id IS NOT NULL;
CREATE INDEX idx_jobs_social_post ON jobs(social_post_id) WHERE social_post_id IS NOT NULL;
CREATE INDEX idx_jobs_workspace ON jobs(workspace_id) WHERE workspace_id IS NOT NULL;

-- Email requests for testimonial collection
CREATE TABLE email_requests (
  id uuid_pk PRIMARY KEY,
  workspace_id UUID NOT NULL, -- Reference to your existing workspaces table
  
  -- Recipient information
  contact_name VARCHAR(255) NOT NULL,
  contact_email CITEXT NOT NULL,
  company_name VARCHAR(255),
  
  -- Email content
  subject TEXT NOT NULL,
  custom_message TEXT,
  template_name VARCHAR(100) DEFAULT 'testimonial_request',
  
  -- Collection URL
  collection_url TEXT NOT NULL, -- Where user clicks to submit testimonial
  
  -- Tracking
  tracking_token VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'opened', 'clicked', 'responded', 'failed'
  
  -- Timestamps
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  
  -- Provider data
  provider_message_id VARCHAR(255), -- Brevo/provider message ID
  provider_response JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_email_requests_updated BEFORE UPDATE ON email_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_email_requests_workspace ON email_requests(workspace_id);
CREATE INDEX idx_email_requests_email ON email_requests(contact_email);
CREATE INDEX idx_email_requests_status ON email_requests(status);

-- Email logs for delivery tracking
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_request_id UUID REFERENCES email_requests(id) ON DELETE CASCADE,
  
  -- Provider details
  provider VARCHAR(100) NOT NULL, -- 'brevo', 'sendgrid', etc.
  provider_message_id VARCHAR(255),
  
  -- Simple status tracking
  status VARCHAR(50) NOT NULL, -- 'sent', 'failed'
  event_type VARCHAR(50), -- 'sent', 'failed' - keep it simple
  
  -- Error handling
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_email_logs_updated BEFORE UPDATE ON email_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_email_logs_request ON email_logs(email_request_id);
CREATE INDEX idx_email_logs_provider_message ON email_logs(provider_message_id);

-- Email Templates table (for your template system)
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT NOT NULL,
  variables JSONB DEFAULT '[]', -- Array of required variables
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


CREATE TRIGGER trg_email_templates_updated BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_email_templates_name ON email_templates(name);



CREATE TABLE google_drive_accounts (
    id uuid_pk PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- OAuth tokens
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_type VARCHAR(50) DEFAULT 'Bearer',
    expires_at TIMESTAMPTZ,
    
    -- Account info
    account_email VARCHAR(255),
    account_name VARCHAR(255),
    
    -- Status
    status VARCHAR(50) DEFAULT 'connected',
    last_error TEXT,
    
    created_at ts_tz,
    updated_at ts_tz,
    
    UNIQUE(workspace_id, user_id)
);

CREATE TRIGGER trg_google_drive_accounts_updated BEFORE UPDATE ON google_drive_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();   
CREATE INDEX idx_google_drive_accounts_workspace ON google_drive_accounts(workspace_id);
CREATE INDEX idx_google_drive_accounts_user ON google_drive_accounts(user_id);
CREATE INDEX idx_google_drive_accounts_status ON google_drive_accounts(status);