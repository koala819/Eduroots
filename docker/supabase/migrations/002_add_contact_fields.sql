-- docker/supabase/migrations/002_add_contact_fields.sql
-- Migration 002: add contact fields
-- Date: 2025-07-09

-- add contact fields
ALTER TABLE education.users
ADD COLUMN IF NOT EXISTS secondary_phone TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT;

-- add index for search
CREATE INDEX IF NOT EXISTS idx_users_secondary_phone ON education.users(secondary_phone);
CREATE INDEX IF NOT EXISTS idx_users_whatsapp_phone ON education.users(whatsapp_phone);

-- comment on the table
COMMENT ON COLUMN education.users.secondary_phone IS 'secondary phone for divorced parents';
COMMENT ON COLUMN education.users.whatsapp_phone IS 'WhatsApp phone (can be primary, secondary or other)';
