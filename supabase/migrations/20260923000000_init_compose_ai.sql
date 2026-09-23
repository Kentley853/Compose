-- ==============================================================================
-- COMPOSE AI ARCHITECTURAL STUDIO - SUPABASE DATABASE INITIALIZATION MIGRATION
-- Migration: 20260923000000_init_compose_ai.sql
-- Description: Creates projects table, enables Row Level Security (RLS), sets up
--              project file tracking, and configures private project-files storage.
-- ==============================================================================

-- 1. Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  description TEXT DEFAULT '',
  project_type TEXT DEFAULT 'Single-family residential',
  project_stage TEXT DEFAULT 'Early concept',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  client_information JSONB NOT NULL DEFAULT '{}'::jsonb,
  site_information JSONB NOT NULL DEFAULT '{}'::jsonb,
  building_requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
  design_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  room_program JSONB NOT NULL DEFAULT '{}'::jsonb,
  floor_plan_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  model_3d_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  compliance_results JSONB NOT NULL DEFAULT '[]'::jsonb,
  boq_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for speedy queries by user and status
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON public.projects(updated_at DESC);

-- Automatic updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_projects_updated_at ON public.projects;
CREATE TRIGGER trigger_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 3. Row Level Security (RLS) on projects table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view only their own projects
CREATE POLICY "Users can view own projects"
  ON public.projects
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own projects
CREATE POLICY "Users can create own projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own projects
CREATE POLICY "Users can update own projects"
  ON public.projects
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own projects
CREATE POLICY "Users can delete own projects"
  ON public.projects
  FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Create project_files metadata table
CREATE TABLE IF NOT EXISTS public.project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT DEFAULT 'Other',
  category TEXT DEFAULT 'Other',
  size_bytes BIGINT DEFAULT 0,
  size_formatted TEXT DEFAULT '0 KB',
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON public.project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_user_id ON public.project_files(user_id);

ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project files"
  ON public.project_files
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own project files"
  ON public.project_files
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own project files"
  ON public.project_files
  FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Supabase Storage Configuration
-- Create private storage bucket for project documents and CAD assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-files',
  'project-files',
  false,
  26214400, -- 25MB max per file
  ARRAY[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/svg+xml',
    'application/acad',
    'application/x-acad',
    'application/autocad_dwg',
    'image/x-dwg',
    'application/dwg',
    'application/x-dwg',
    'application/dxf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'model/gltf-binary',
    'model/gltf+json',
    'application/octet-stream'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 26214400;

-- Storage RLS Policies: Folder structure is user_id/project_id/files/...
-- Ensure users can only read objects in their own user_id directory
CREATE POLICY "Users can read own project storage files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'project-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload own project storage files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'project-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own project storage files"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'project-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own project storage files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'project-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
