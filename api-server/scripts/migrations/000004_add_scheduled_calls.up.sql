-- Migration to add scheduled calls support
-- This allows proper scheduling of voice testimonial calls

CREATE TABLE scheduled_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    testimonial_id UUID NOT NULL REFERENCES testimonials(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

    -- Call details
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50) NOT NULL,
    company VARCHAR(255),

    -- Scheduling information
    scheduled_at TIMESTAMPTZ NOT NULL,
    timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
    preferred_call_time VARCHAR(100),

    -- Call configuration
    provider VARCHAR(20) NOT NULL DEFAULT 'vapi', -- 'vapi' or 'twilio'
    additional_notes TEXT,

    -- Status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'failed', 'cancelled'
    call_id VARCHAR(255), -- Vapi call ID or Twilio call SID
    attempt_count INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    executed_at TIMESTAMPTZ,

    -- Metadata for additional information
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for scheduled calls
CREATE INDEX idx_scheduled_calls_testimonial ON scheduled_calls(testimonial_id);
CREATE INDEX idx_scheduled_calls_workspace ON scheduled_calls(workspace_id);
CREATE INDEX idx_scheduled_calls_scheduled_at ON scheduled_calls(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_scheduled_calls_status ON scheduled_calls(status);
CREATE INDEX idx_scheduled_calls_phone ON scheduled_calls(customer_phone);
CREATE INDEX idx_scheduled_calls_provider ON scheduled_calls(provider);

-- Composite index for scheduler queries
CREATE INDEX idx_scheduled_calls_pending ON scheduled_calls(scheduled_at, status)
    WHERE status = 'scheduled';

-- Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_scheduled_calls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic updated_at
CREATE TRIGGER trigger_scheduled_calls_updated_at
    BEFORE UPDATE ON scheduled_calls
    FOR EACH ROW
    EXECUTE FUNCTION update_scheduled_calls_updated_at();