-- Migration: Add user_id column to document_jobs and create users table
-- Run this if the backend fails to auto-create the column on existing tables.
-- Usage: psql -U brodoc_user -d brodoc_db -f migration_add_auth.sql

-- Create users table if not exists
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(320) NOT NULL UNIQUE,
    hashed_password VARCHAR(1024) NOT NULL,
    full_name VARCHAR(256) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_users_email ON users (email);
CREATE INDEX IF NOT EXISTS ix_users_id ON users (id);

-- Add user_id column to document_jobs if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='document_jobs' AND column_name='user_id'
    ) THEN
        ALTER TABLE document_jobs ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
        CREATE INDEX ix_document_jobs_user_id ON document_jobs (user_id);
    END IF;
END $$;
