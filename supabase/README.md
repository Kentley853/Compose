# Compose AI - Supabase Database & Storage Setup

This directory contains the database schema, RLS policies, and storage bucket configuration for the **Compose AI** private company architectural dashboard.

## 1. Run the Migration in Supabase

1. Open your [Supabase Project Dashboard](https://supabase.com/dashboard).
2. Select your project: `ldygdpsmfmmcykooqplc`.
3. In the left navigation, click **SQL Editor**.
4. Click **New Query**, paste the contents of `supabase/migrations/20260923000000_init_compose_ai.sql`, and click **Run**.

## 2. Verify Database Tables

After running the SQL migration, the following tables will be created in the `public` schema:

- **`public.projects`**: Stores all architectural project data:
  - `id` (Text primary key)
  - `project_name` (Text)
  - `project_code` (Text)
  - `description` (Text)
  - `project_type` (Text)
  - `project_stage` (Text)
  - `status` (`'active'`, `'draft'`, `'archived'`, `'completed'`)
  - `client_information` (JSONB)
  - `site_information` (JSONB)
  - `building_requirements` (JSONB)
  - `design_preferences` (JSONB)
  - `room_program` (JSONB)
  - `floor_plan_data` (JSONB)
  - `model_3d_data` (JSONB)
  - `compliance_results` (JSONB)
  - `boq_data` (JSONB)
  - `created_at`, `updated_at` (Timestamptz)

- **`public.project_files`**: Stores file metadata for uploaded CAD, 3D, and design assets:
  - `id` (Text primary key)
  - `project_id` (Text references `public.projects(id)`)
  - `file_name` (Text)
  - `file_type` (Text)
  - `file_size` (Text)
  - `size_bytes` (Bigint)
  - `storage_path` (Text)
  - `category` (Text)
  - `description` (Text)
  - `upload_date` (Timestamptz)
  - `created_at` (Timestamptz)

- **`project-files` Storage Bucket**:
  - Private storage bucket for documents, drawings, 3D models, and images.
  - Max file upload size: 25MB.
  - Accessible via signed download URLs.

## 3. Environment Variables (Vercel & Local)

Add these environment variables to your Vercel project settings (**Settings** -> **Environment Variables**):

```bash
VITE_SUPABASE_URL=https://ldygdpsmfmmcykooqplc.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_hVSjr5ZpoR371c30r8FNAQ_HY3eKKyZ
VITE_N8N_SUBMIT_WEBHOOK_URL=https://droppflowwsystems.app.n8n.cloud/webhook/compose-submit
```
