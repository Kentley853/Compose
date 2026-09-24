-- ==============================================================================
-- COMPOSE AI - COMPANY ARCHITECTURAL STUDIO SUPABASE INITIALIZATION MIGRATION
-- Migration: 20260923000000_init_compose_ai.sql
-- Description: Sets up permanent company projects table, project_files metadata
--              tracking, and private project-files storage bucket.
-- ==============================================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  project_name TEXT NOT NULL,
  project_code TEXT DEFAULT 'PRJ-001',
  description TEXT DEFAULT '',
  project_type TEXT DEFAULT 'Single-family residential',
  project_stage TEXT DEFAULT 'Schematic design',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived', 'completed')),
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

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON public.projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_code ON public.projects(project_code);

-- Automatic updated_at trigger
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

-- Enable Row Level Security (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Company Dashboard RLS Policies (Allow access to company workspace via anon & authenticated clients)
CREATE POLICY "Allow read company projects"
  ON public.projects FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow insert company projects"
  ON public.projects FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update company projects"
  ON public.projects FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete company projects"
  ON public.projects FOR DELETE
  TO anon, authenticated
  USING (true);

-- 3. Create project_files metadata table
CREATE TABLE IF NOT EXISTS public.project_files (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT DEFAULT 'Other',
  file_size TEXT DEFAULT '0 KB',
  size_bytes BIGINT DEFAULT 0,
  storage_path TEXT NOT NULL,
  category TEXT DEFAULT 'Other',
  description TEXT DEFAULT '',
  upload_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON public.project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_created_at ON public.project_files(created_at DESC);

ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read company project files"
  ON public.project_files FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow insert company project files"
  ON public.project_files FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update company project files"
  ON public.project_files FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete company project files"
  ON public.project_files FOR DELETE
  TO anon, authenticated
  USING (true);

-- 4. Supabase Storage Configuration: private 'project-files' bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-files',
  'project-files',
  false,
  26214400, -- 25MB max per file
  ARRAY[
    -- Documents
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    -- Drawings & CAD
    'application/acad',
    'application/x-acad',
    'application/autocad_dwg',
    'image/x-dwg',
    'application/dwg',
    'application/x-dwg',
    'application/dxf',
    'image/vnd.dxf',
    'application/x-dxf',
    'application/octet-stream',
    -- 3D Models
    'model/gltf-binary',
    'model/gltf+json',
    'model/obj',
    'text/plain',
    -- Images
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/svg+xml'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 26214400;

-- Storage Policies for project-files bucket
CREATE POLICY "Allow select on project-files"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'project-files');

CREATE POLICY "Allow insert on project-files"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'project-files');

CREATE POLICY "Allow update on project-files"
  ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'project-files');

CREATE POLICY "Allow delete on project-files"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'project-files');
