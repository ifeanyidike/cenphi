-- Add content folders system for organizing AI-generated artifacts

-- Content folders table - folders/categories for organizing artifacts
CREATE TABLE IF NOT EXISTS content_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

    -- Folder metadata
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Hex color code (e.g., '#3B82F6')
    icon VARCHAR(50), -- Icon name from lucide-react (e.g., 'folder', 'star')

    -- Organization
    is_default BOOLEAN DEFAULT false, -- Mark default folder (e.g., 'Uncategorized')
    sort_order INTEGER DEFAULT 0, -- For custom ordering

    -- Stats (denormalized for performance)
    item_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT check_color_format CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$')
);

CREATE TRIGGER trg_content_folders_updated
    BEFORE UPDATE ON content_folders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_content_folders_workspace ON content_folders(workspace_id);
CREATE INDEX idx_content_folders_default ON content_folders(workspace_id, is_default) WHERE is_default = true;
CREATE INDEX idx_content_folders_sort ON content_folders(workspace_id, sort_order);

-- Folder items table - many-to-many relationship between folders and artifacts
CREATE TABLE IF NOT EXISTS folder_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id UUID NOT NULL REFERENCES content_folders(id) ON DELETE CASCADE,
    artifact_id UUID NOT NULL REFERENCES testimonial_artifacts(id) ON DELETE CASCADE,

    -- Timestamps
    added_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- Constraints - each artifact can only be in a folder once
    CONSTRAINT unique_folder_item UNIQUE (folder_id, artifact_id)
);

CREATE INDEX idx_folder_items_folder ON folder_items(folder_id);
CREATE INDEX idx_folder_items_artifact ON folder_items(artifact_id);
CREATE INDEX idx_folder_items_added ON folder_items(added_at);

-- Function to update folder item count
CREATE OR REPLACE FUNCTION update_folder_item_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE content_folders
        SET item_count = item_count + 1
        WHERE id = NEW.folder_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE content_folders
        SET item_count = item_count - 1
        WHERE id = OLD.folder_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update item counts
CREATE TRIGGER trg_folder_items_count_insert
    AFTER INSERT ON folder_items
    FOR EACH ROW
    EXECUTE FUNCTION update_folder_item_count();

CREATE TRIGGER trg_folder_items_count_delete
    AFTER DELETE ON folder_items
    FOR EACH ROW
    EXECUTE FUNCTION update_folder_item_count();

-- Create default "Uncategorized" folder for each existing workspace
INSERT INTO content_folders (workspace_id, name, description, color, icon, is_default, sort_order)
SELECT
    id as workspace_id,
    'Uncategorized' as name,
    'Default folder for uncategorized content' as description,
    '#94A3B8' as color,
    'folder' as icon,
    true as is_default,
    0 as sort_order
FROM workspaces
ON CONFLICT DO NOTHING;

COMMENT ON TABLE content_folders IS 'Folders for organizing AI-generated content artifacts';
COMMENT ON TABLE folder_items IS 'Many-to-many relationship between folders and artifacts';
COMMENT ON FUNCTION update_folder_item_count() IS 'Automatically maintains item_count in content_folders table';
