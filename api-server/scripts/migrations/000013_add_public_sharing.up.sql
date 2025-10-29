-- Add public sharing support for testimonials and artifacts

-- Public shares table - tracks public share links
CREATE TABLE IF NOT EXISTS public_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

    -- What is being shared (testimonial or artifact)
    share_type VARCHAR(50) NOT NULL CHECK (share_type IN ('testimonial', 'artifact')),
    testimonial_id UUID REFERENCES testimonials(id) ON DELETE CASCADE,
    artifact_id UUID REFERENCES testimonial_artifacts(id) ON DELETE CASCADE,

    -- Share configuration
    is_public BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    password_protected BOOLEAN DEFAULT false,
    password_hash TEXT,
    expires_at TIMESTAMPTZ,

    -- Branding/customization
    custom_branding JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT check_share_type_id CHECK (
        (share_type = 'testimonial' AND testimonial_id IS NOT NULL AND artifact_id IS NULL) OR
        (share_type = 'artifact' AND artifact_id IS NOT NULL AND testimonial_id IS NULL)
    )
);

CREATE TRIGGER trg_public_shares_updated
    BEFORE UPDATE ON public_shares
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_public_shares_workspace ON public_shares(workspace_id);
CREATE INDEX idx_public_shares_testimonial ON public_shares(testimonial_id) WHERE testimonial_id IS NOT NULL;
CREATE INDEX idx_public_shares_artifact ON public_shares(artifact_id) WHERE artifact_id IS NOT NULL;
CREATE INDEX idx_public_shares_active ON public_shares(is_active, expires_at);

-- Public share metrics table - aggregated counts
CREATE TABLE IF NOT EXISTS public_share_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_share_id UUID NOT NULL REFERENCES public_shares(id) ON DELETE CASCADE,

    -- Metrics
    view_count INTEGER NOT NULL DEFAULT 0,
    unique_visitor_count INTEGER NOT NULL DEFAULT 0,
    play_count INTEGER NOT NULL DEFAULT 0,
    download_count INTEGER NOT NULL DEFAULT 0,

    -- Link sharing metrics
    copy_link_count INTEGER NOT NULL DEFAULT 0,
    linkedin_share_count INTEGER NOT NULL DEFAULT 0,
    twitter_share_count INTEGER NOT NULL DEFAULT 0,
    facebook_share_count INTEGER NOT NULL DEFAULT 0,
    whatsapp_share_count INTEGER NOT NULL DEFAULT 0,
    email_share_count INTEGER NOT NULL DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- One metrics row per share
    CONSTRAINT unique_share_metrics UNIQUE (public_share_id)
);

CREATE TRIGGER trg_public_share_metrics_updated
    BEFORE UPDATE ON public_share_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_public_share_metrics_share ON public_share_metrics(public_share_id);

-- Public share events table - detailed event log
CREATE TABLE IF NOT EXISTS public_share_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_share_id UUID NOT NULL REFERENCES public_shares(id) ON DELETE CASCADE,

    -- Event details
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'view', 'play', 'download', 'copy_link',
        'share_linkedin', 'share_twitter', 'share_facebook',
        'share_whatsapp', 'share_email'
    )),

    -- Visitor tracking
    visitor_id UUID, -- Session-based identifier for unique visitor counting
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    country_code VARCHAR(2),
    city VARCHAR(100),

    -- Additional metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_public_share_events_share ON public_share_events(public_share_id);
CREATE INDEX idx_public_share_events_type ON public_share_events(event_type);
CREATE INDEX idx_public_share_events_visitor ON public_share_events(visitor_id);
CREATE INDEX idx_public_share_events_created ON public_share_events(created_at);

-- Function to increment metrics
CREATE OR REPLACE FUNCTION increment_public_share_metric(
    p_share_id UUID,
    p_event_type VARCHAR(50),
    p_visitor_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_column_name TEXT;
BEGIN
    -- Map event types to metric column names
    v_column_name := CASE p_event_type
        WHEN 'view' THEN 'view_count'
        WHEN 'play' THEN 'play_count'
        WHEN 'download' THEN 'download_count'
        WHEN 'copy_link' THEN 'copy_link_count'
        WHEN 'share_linkedin' THEN 'linkedin_share_count'
        WHEN 'share_twitter' THEN 'twitter_share_count'
        WHEN 'share_facebook' THEN 'facebook_share_count'
        WHEN 'share_whatsapp' THEN 'whatsapp_share_count'
        WHEN 'share_email' THEN 'email_share_count'
        ELSE NULL
    END;

    -- Increment the metric
    IF v_column_name IS NOT NULL THEN
        EXECUTE format('
            INSERT INTO public_share_metrics (public_share_id, %I)
            VALUES ($1, 1)
            ON CONFLICT (public_share_id)
            DO UPDATE SET %I = public_share_metrics.%I + 1
        ', v_column_name, v_column_name, v_column_name)
        USING p_share_id;
    END IF;

    -- Update unique visitor count for view events
    -- This is called AFTER event insertion, so we check if count = 1 (first time)
    IF p_event_type = 'view' AND p_visitor_id IS NOT NULL THEN
        -- Count existing events for this visitor (will be 1 if this is their first view)
        IF (SELECT COUNT(*) FROM public_share_events
            WHERE public_share_id = p_share_id
              AND event_type = 'view'
              AND visitor_id = p_visitor_id) = 1 THEN
            UPDATE public_share_metrics
            SET unique_visitor_count = unique_visitor_count + 1
            WHERE public_share_id = p_share_id;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public_shares IS 'Public sharing links for testimonials and artifacts';
COMMENT ON TABLE public_share_metrics IS 'Aggregated metrics for public shares';
COMMENT ON TABLE public_share_events IS 'Detailed event log for public share analytics';
