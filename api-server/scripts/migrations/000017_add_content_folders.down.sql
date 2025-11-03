-- Drop content folders system

DROP TRIGGER IF EXISTS trg_folder_items_count_delete ON folder_items;
DROP TRIGGER IF EXISTS trg_folder_items_count_insert ON folder_items;
DROP FUNCTION IF EXISTS update_folder_item_count();
DROP TABLE IF EXISTS folder_items CASCADE;
DROP TABLE IF EXISTS content_folders CASCADE;
