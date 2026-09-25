# Compose AI - Supabase Database & Storage Setup

This directory contains the database schema, RLS policies, and storage bucket configuration for the **Compose AI** private company architectural dashboard.

## 1. Run the Migration in Supabase

1. Open your [Supabase Project Dashboard](https://supabase.com/dashboard).
2. Select your project.
3. In the left navigation, click **SQL Editor**.
4. Click **New Query**, paste `supabase/migrations/20260923000000_init_compose_ai.sql`, and click **Run**.
5. Paste `supabase/migrations/20260925000000_user_owned_rls.sql` and run that too. It adds `user_id` and replaces the open policies with owner-only policies.

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
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_N8N_SUBMIT_WEBHOOK_URL=
VITE_AUTH_GOOGLE_ENABLED=
VITE_AUTH_GITHUB_ENABLED=
```

Use the publishable anon key only. Do not put the service-role key in Vercel frontend variables or in Git.

Optional server-only variable for the Express proxy, if you do not want the webhook read from the Vite variable:

```bash
N8N_SUBMIT_WEBHOOK_URL=
```

### Authentication providers

Email and password work without extra providers. In Supabase Auth, set the site URL to the deployed origin and add these redirect URLs:

- `http://localhost:3000/dashboard`
- `http://localhost:3000/reset-password`
- `https://<your-vercel-domain>/dashboard`
- `https://<your-vercel-domain>/reset-password`

Show Google or GitHub buttons only after enabling those providers in Supabase and setting `VITE_AUTH_GOOGLE_ENABLED=true` or `VITE_AUTH_GITHUB_ENABLED=true`.

Rows created before `user_id` existed are hidden by the new policies. Recreate them while signed in, or backfill `user_id` manually.
