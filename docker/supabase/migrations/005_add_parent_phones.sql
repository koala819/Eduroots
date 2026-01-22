-- Migration 005: add parent contact columns
-- Date: 2026-01-21

ALTER TABLE education.users
ADD COLUMN IF NOT EXISTS secondary_phone TEXT;

ALTER TABLE education.users
ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT;
