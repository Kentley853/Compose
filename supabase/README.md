# Compose AI — Supabase Database & Storage Setup Guide

This document describes the Supabase PostgreSQL database tables, Row Level Security (RLS) policies, and Storage configuration for the **Compose AI** application.

---

## 1. Environment Variables

Configure the following in your environment (`.env` locally, or Environment Variables settings in Vercel / Cloud Run):

```bash
# Supabase Project URL (found in Settings -> API)
VITE_SUPABASE_URL="https://xyzcompany.supabase.co"

# Supabase Public Anonymous Key (found in Settings -> API)
VITE_SUPABASE_ANON_KEY="eyJhbGciOi..."

# n8n Automation Webhook Endpoint (for completed project submissions & Google Sheets sync)
VITE_N8N_SUBMIT_WEBHOOK_URL="https://droppflowwsystems.app.n8n.cloud/webhook/compose-submit"
```

> **Security Note:** Never provide `SUPABASE_SERVICE_ROLE_KEY` in the client code. All client-side operations use the public `anon` key, with access strictly restricted by PostgreSQL Row Level Security (RLS) policies.

---

## 2. PostgreSQL Tables

### `public.projects`
Contains full architectural state, site constraints, room schedules, CAD layers, 3D parameters, compliance check results, and bill of quantities.

| Column | Type | Description |
|---|---|---|
| `id` | `UUID PRIMARY KEY` | Auto-generated project identifier |
| `user_id` | `UUID NOT NULL` | Foreign key to `auth.users(id)` |
| `project_name` | `TEXT NOT NULL` | Title of the architectural project |
| `description` | `TEXT` | Architectural brief or description |
| `project_type` | `TEXT` | Residential, Commercial, Renovation, etc. |
| `project_stage` | `TEXT` | Early concept, Schematic, etc. |
| `status` | `TEXT` | `'active'`, `'draft'`, or `'archived'` |
| `client_information` | `JSONB` | Client contact details, names, phone |
| `site_information` | `JSONB` | Coordinates, dimensions, setbacks, zoning |
| `building_requirements`| `JSONB` | Target area, floors, bedrooms, budget |
| `design_preferences` | `JSONB` | Materiality, roof type, aesthetics |
| `room_program` | `JSONB` | Room schedule, daylight, areas |
| `floor_plan_data` | `JSONB` | 2D CAD coordinates, layout alternatives |
| `model_3d_data` | `JSONB` | 3D volumetric massing & mesh settings |
| `compliance_results` | `JSONB` | Statutory and setback screening checks |
| `boq_data` | `JSONB` | Itemized bill of quantities with USD rates |
| `created_at` | `TIMESTAMPTZ` | Timestamp when project was created |
| `updated_at` | `TIMESTAMPTZ` | Auto-updated on every modification |

### `public.project_files`
Tracks metadata for uploaded surveys, drawings, images, and CAD files.

| Column | Type | Description |
|---|---|---|
| `id` | `UUID PRIMARY KEY` | Auto-generated file record ID |
| `project_id` | `UUID NOT NULL` | Reference to `projects(id)` |
| `user_id` | `UUID NOT NULL` | Reference to `auth.users(id)` |
| `file_name` | `TEXT NOT NULL` | Original filename |
| `file_type` | `TEXT` | Category / MIME type |
| `category` | `TEXT` | Site Plan, Survey, Sketch, BOQ, etc. |
| `size_bytes` | `BIGINT` | File size in bytes |
| `size_formatted` | `TEXT` | Human-readable size (e.g. `2.4 MB`) |
| `storage_path` | `TEXT NOT NULL` | Path in private `project-files` bucket |
| `created_at` | `TIMESTAMPTZ` | Upload timestamp |

---

## 3. Storage Bucket: `project-files`

- **Bucket ID:** `project-files`
- **Visibility:** Private (`public = false`)
- **Max File Size:** 25MB (`26214400` bytes)
- **Folder Structure:** `${user_id}/${project_id}/files/${filename}`
- **Access:** Direct public access is disabled; downloads are served via expiring Signed URLs (`createSignedUrl(storagePath, 3600)`).

---

## 4. Row Level Security (RLS)

All tables and the `project-files` storage bucket enforce RLS so that users can only ever access their own data:

- `SELECT`: `auth.uid() = user_id`
- `INSERT`: `auth.uid() = user_id`
- `UPDATE`: `auth.uid() = user_id`
- `DELETE`: `auth.uid() = user_id`
- Storage: `auth.uid()::text = (storage.foldername(name))[1]`

---

## 5. Applying the Migration

1. Open your Supabase Dashboard (`https://supabase.com/dashboard/project/<your-project-id>`).
2. Navigate to **SQL Editor** on the left menu.
3. Paste the contents of `supabase/migrations/20260923000000_init_compose_ai.sql`.
4. Click **Run**.
