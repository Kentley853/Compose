-- Compose AI ownership migration
-- Restrict projects, file metadata, and storage objects to the signed-in user.
-- Apply this in the Supabase SQL editor after 20260923000000_init_compose_ai.sql.

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.project_files
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_project_files_user_id ON public.project_files(user_id);

DROP POLICY IF EXISTS "Allow read company projects" ON public.projects;
DROP POLICY IF EXISTS "Allow insert company projects" ON public.projects;
DROP POLICY IF EXISTS "Allow update company projects" ON public.projects;
DROP POLICY IF EXISTS "Allow delete company projects" ON public.projects;

DROP POLICY IF EXISTS "Allow read company project files" ON public.project_files;
DROP POLICY IF EXISTS "Allow insert company project files" ON public.project_files;
DROP POLICY IF EXISTS "Allow update company project files" ON public.project_files;
DROP POLICY IF EXISTS "Allow delete company project files" ON public.project_files;

DROP POLICY IF EXISTS "Allow select on project-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow insert on project-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow update on project-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete on project-files" ON storage.objects;

CREATE POLICY "Users read own projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own projects"
  ON public.projects FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users read own project files"
  ON public.project_files FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own project files"
  ON public.project_files FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own project files"
  ON public.project_files FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own project files"
  ON public.project_files FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users read own storage objects"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'project-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users insert own storage objects"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'project-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users update own storage objects"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'project-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'project-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users delete own storage objects"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'project-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
