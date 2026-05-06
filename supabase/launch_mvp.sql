-- Lumen Workspace MVP launch schema
-- Scope: internal launch for dashboard, work orders, team, files and email notifications.
-- Keep content, Canva, reports and client portal outside release 1.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  CREATE TYPE app_role AS ENUM (
    'admin',
    'directora',
    'cuentas',
    'medios',
    'creativo',
    'disenador',
    'editor',
    'generador',
    'community',
    'pauta',
    'operaciones',
    'ejecutivo',
    'cliente'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE work_order_status AS ENUM (
    'new',
    'in_progress',
    'in_review',
    'completed',
    'client_approved',
    'scheduled',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE work_order_priority AS ENUM ('high', 'medium', 'low');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE email_notification_type AS ENUM (
    'assignment',
    'comment',
    'status_change',
    'deadline_24h',
    'overdue',
    'weekly_digest'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  primary_contact_name TEXT,
  primary_contact_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  role app_role NOT NULL DEFAULT 'creativo',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  color_primary TEXT DEFAULT '#18345d',
  platforms TEXT[] NOT NULL DEFAULT '{}',
  services TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS brand_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, brand_id)
);

CREATE TABLE IF NOT EXISTS work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority work_order_priority NOT NULL DEFAULT 'medium',
  status work_order_status NOT NULL DEFAULT 'new',
  category TEXT NOT NULL DEFAULT 'diseno',
  due_date DATE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notify_on_email BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS work_order_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (work_order_id, user_id)
);

CREATE TABLE IF NOT EXISTS work_order_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS work_order_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
  storage_bucket TEXT NOT NULL DEFAULT 'work-order-files',
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS work_order_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  recipients TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
  recipient_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  notification_type email_notification_type NOT NULL,
  subject TEXT NOT NULL,
  html_body TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed', 'cancelled')),
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  provider_message_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS weekly_digest_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date DATE NOT NULL,
  subject TEXT NOT NULL DEFAULT 'Lumen Workspace - estatus semanal de proyectos',
  recipients_count INTEGER DEFAULT 0,
  open_orders_count INTEGER DEFAULT 0,
  overdue_orders_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'queued', 'sent', 'failed')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_brands_client_id ON brands(client_id);
CREATE INDEX IF NOT EXISTS idx_brand_memberships_user_id ON brand_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_memberships_brand_id ON brand_memberships(brand_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_brand_status ON work_orders(brand_id, status);
CREATE INDEX IF NOT EXISTS idx_work_orders_due_date ON work_orders(due_date);
CREATE INDEX IF NOT EXISTS idx_work_order_assignees_user ON work_order_assignees(user_id);
CREATE INDEX IF NOT EXISTS idx_work_order_assignees_order ON work_order_assignees(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_files_order ON work_order_files(work_order_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status_scheduled ON email_notifications(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_weekly_digest_runs_run_date ON weekly_digest_runs(run_date);

CREATE OR REPLACE FUNCTION current_app_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid() AND is_active = true;
$$;

CREATE OR REPLACE FUNCTION is_internal_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(current_app_role() <> 'cliente', false);
$$;

CREATE OR REPLACE FUNCTION can_access_brand(target_brand_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    current_app_role() IN ('admin', 'directora')
    OR EXISTS (
      SELECT 1
      FROM brand_memberships bm
      WHERE bm.user_id = auth.uid()
      AND bm.brand_id = target_brand_id
    );
$$;

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clients_updated_at ON clients;
CREATE TRIGGER trg_clients_updated_at
BEFORE UPDATE ON clients
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_brands_updated_at ON brands;
CREATE TRIGGER trg_brands_updated_at
BEFORE UPDATE ON brands
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_work_orders_updated_at ON work_orders;
CREATE TRIGGER trg_work_orders_updated_at
BEFORE UPDATE ON work_orders
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_notification_rules_updated_at ON notification_rules;
CREATE TRIGGER trg_notification_rules_updated_at
BEFORE UPDATE ON notification_rules
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_digest_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients_select_internal" ON clients;
DROP POLICY IF EXISTS "clients_manage_admin_directora" ON clients;
DROP POLICY IF EXISTS "profiles_select_internal_or_self" ON profiles;
DROP POLICY IF EXISTS "profiles_manage_admin_directora" ON profiles;
DROP POLICY IF EXISTS "brands_select_members" ON brands;
DROP POLICY IF EXISTS "brands_manage_admin_directora" ON brands;
DROP POLICY IF EXISTS "brand_memberships_select_related" ON brand_memberships;
DROP POLICY IF EXISTS "brand_memberships_manage_admin_directora" ON brand_memberships;
DROP POLICY IF EXISTS "work_orders_select_brand_access" ON work_orders;
DROP POLICY IF EXISTS "work_orders_manage_internal" ON work_orders;
DROP POLICY IF EXISTS "work_order_assignees_select_brand_access" ON work_order_assignees;
DROP POLICY IF EXISTS "work_order_assignees_manage_internal" ON work_order_assignees;
DROP POLICY IF EXISTS "work_order_comments_select_brand_access" ON work_order_comments;
DROP POLICY IF EXISTS "work_order_comments_manage_internal" ON work_order_comments;
DROP POLICY IF EXISTS "work_order_files_select_brand_access" ON work_order_files;
DROP POLICY IF EXISTS "work_order_files_manage_internal" ON work_order_files;
DROP POLICY IF EXISTS "work_order_activity_select_brand_access" ON work_order_activity;
DROP POLICY IF EXISTS "work_order_activity_insert_internal" ON work_order_activity;
DROP POLICY IF EXISTS "notification_rules_select_internal" ON notification_rules;
DROP POLICY IF EXISTS "notification_rules_manage_admin_directora" ON notification_rules;
DROP POLICY IF EXISTS "email_notifications_select_internal" ON email_notifications;
DROP POLICY IF EXISTS "email_notifications_manage_admin_directora" ON email_notifications;
DROP POLICY IF EXISTS "weekly_digest_runs_select_internal" ON weekly_digest_runs;
DROP POLICY IF EXISTS "weekly_digest_runs_manage_admin_directora" ON weekly_digest_runs;

CREATE POLICY "clients_select_internal"
ON clients FOR SELECT
TO authenticated
USING (is_internal_user());

CREATE POLICY "clients_manage_admin_directora"
ON clients FOR ALL
TO authenticated
USING (current_app_role() IN ('admin', 'directora'))
WITH CHECK (current_app_role() IN ('admin', 'directora'));

CREATE POLICY "profiles_select_internal_or_self"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid() OR is_internal_user());

CREATE POLICY "profiles_manage_admin_directora"
ON profiles FOR ALL
TO authenticated
USING (current_app_role() IN ('admin', 'directora'))
WITH CHECK (current_app_role() IN ('admin', 'directora'));

CREATE POLICY "brands_select_members"
ON brands FOR SELECT
TO authenticated
USING (can_access_brand(id) AND is_internal_user());

CREATE POLICY "brands_manage_admin_directora"
ON brands FOR ALL
TO authenticated
USING (current_app_role() IN ('admin', 'directora'))
WITH CHECK (current_app_role() IN ('admin', 'directora'));

CREATE POLICY "brand_memberships_select_related"
ON brand_memberships FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR current_app_role() IN ('admin', 'directora')
  OR (is_internal_user() AND can_access_brand(brand_id))
);

CREATE POLICY "brand_memberships_manage_admin_directora"
ON brand_memberships FOR ALL
TO authenticated
USING (current_app_role() IN ('admin', 'directora'))
WITH CHECK (current_app_role() IN ('admin', 'directora'));

CREATE POLICY "work_orders_select_brand_access"
ON work_orders FOR SELECT
TO authenticated
USING (can_access_brand(brand_id) AND is_internal_user());

CREATE POLICY "work_orders_manage_internal"
ON work_orders FOR ALL
TO authenticated
USING (can_access_brand(brand_id) AND is_internal_user())
WITH CHECK (can_access_brand(brand_id) AND is_internal_user());

CREATE POLICY "work_order_assignees_select_brand_access"
ON work_order_assignees FOR SELECT
TO authenticated
USING (
  is_internal_user()
  AND EXISTS (
    SELECT 1 FROM work_orders wo
    WHERE wo.id = work_order_assignees.work_order_id
    AND can_access_brand(wo.brand_id)
  )
);

CREATE POLICY "work_order_assignees_manage_internal"
ON work_order_assignees FOR ALL
TO authenticated
USING (
  is_internal_user()
  AND EXISTS (
    SELECT 1 FROM work_orders wo
    WHERE wo.id = work_order_assignees.work_order_id
    AND can_access_brand(wo.brand_id)
  )
)
WITH CHECK (
  is_internal_user()
  AND EXISTS (
    SELECT 1 FROM work_orders wo
    WHERE wo.id = work_order_assignees.work_order_id
    AND can_access_brand(wo.brand_id)
  )
);

CREATE POLICY "work_order_comments_select_brand_access"
ON work_order_comments FOR SELECT
TO authenticated
USING (
  is_internal_user()
  AND EXISTS (
    SELECT 1 FROM work_orders wo
    WHERE wo.id = work_order_comments.work_order_id
    AND can_access_brand(wo.brand_id)
  )
);

CREATE POLICY "work_order_comments_manage_internal"
ON work_order_comments FOR ALL
TO authenticated
USING (
  is_internal_user()
  AND EXISTS (
    SELECT 1 FROM work_orders wo
    WHERE wo.id = work_order_comments.work_order_id
    AND can_access_brand(wo.brand_id)
  )
)
WITH CHECK (
  is_internal_user()
  AND EXISTS (
    SELECT 1 FROM work_orders wo
    WHERE wo.id = work_order_comments.work_order_id
    AND can_access_brand(wo.brand_id)
  )
);

CREATE POLICY "work_order_files_select_brand_access"
ON work_order_files FOR SELECT
TO authenticated
USING (
  is_internal_user()
  AND EXISTS (
    SELECT 1 FROM work_orders wo
    WHERE wo.id = work_order_files.work_order_id
    AND can_access_brand(wo.brand_id)
  )
);

CREATE POLICY "work_order_files_manage_internal"
ON work_order_files FOR ALL
TO authenticated
USING (
  is_internal_user()
  AND EXISTS (
    SELECT 1 FROM work_orders wo
    WHERE wo.id = work_order_files.work_order_id
    AND can_access_brand(wo.brand_id)
  )
)
WITH CHECK (
  is_internal_user()
  AND EXISTS (
    SELECT 1 FROM work_orders wo
    WHERE wo.id = work_order_files.work_order_id
    AND can_access_brand(wo.brand_id)
  )
);

CREATE POLICY "work_order_activity_select_brand_access"
ON work_order_activity FOR SELECT
TO authenticated
USING (
  is_internal_user()
  AND EXISTS (
    SELECT 1 FROM work_orders wo
    WHERE wo.id = work_order_activity.work_order_id
    AND can_access_brand(wo.brand_id)
  )
);

CREATE POLICY "work_order_activity_insert_internal"
ON work_order_activity FOR INSERT
TO authenticated
WITH CHECK (
  is_internal_user()
  AND EXISTS (
    SELECT 1 FROM work_orders wo
    WHERE wo.id = work_order_activity.work_order_id
    AND can_access_brand(wo.brand_id)
  )
);

CREATE POLICY "notification_rules_select_internal"
ON notification_rules FOR SELECT
TO authenticated
USING (is_internal_user());

CREATE POLICY "notification_rules_manage_admin_directora"
ON notification_rules FOR ALL
TO authenticated
USING (current_app_role() IN ('admin', 'directora'))
WITH CHECK (current_app_role() IN ('admin', 'directora'));

CREATE POLICY "email_notifications_select_internal"
ON email_notifications FOR SELECT
TO authenticated
USING (
  is_internal_user()
  AND (
    recipient_user_id = auth.uid()
    OR current_app_role() IN ('admin', 'directora')
    OR brand_id IS NULL
    OR can_access_brand(brand_id)
  )
);

CREATE POLICY "email_notifications_manage_admin_directora"
ON email_notifications FOR ALL
TO authenticated
USING (current_app_role() IN ('admin', 'directora'))
WITH CHECK (current_app_role() IN ('admin', 'directora'));

CREATE POLICY "weekly_digest_runs_select_internal"
ON weekly_digest_runs FOR SELECT
TO authenticated
USING (is_internal_user());

CREATE POLICY "weekly_digest_runs_manage_admin_directora"
ON weekly_digest_runs FOR ALL
TO authenticated
USING (current_app_role() IN ('admin', 'directora'))
WITH CHECK (current_app_role() IN ('admin', 'directora'));

INSERT INTO notification_rules (rule_key, title, channel, recipients, is_enabled) VALUES
  ('assignment', 'Asignacion de OT', 'email,in_app', 'assigned_user', true),
  ('comment', 'Comentario en OT', 'email,in_app', 'assigned_users,created_by', true),
  ('status_change', 'Cambio de estado de OT', 'in_app', 'assigned_users,created_by', true),
  ('deadline_24h', 'Deadline en 24h', 'email', 'assigned_users,direccion', true),
  ('overdue', 'OT vencida', 'email,in_app', 'assigned_users,created_by,direccion', true),
  ('weekly_digest', 'Digest lunes 8am', 'email', 'internal_team', true)
ON CONFLICT (rule_key) DO UPDATE SET
  title = EXCLUDED.title,
  channel = EXCLUDED.channel,
  recipients = EXCLUDED.recipients,
  is_enabled = EXCLUDED.is_enabled;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('work-order-files', 'work-order-files', false, 52428800)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

DROP POLICY IF EXISTS "work_order_files_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "work_order_files_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "work_order_files_storage_update" ON storage.objects;
DROP POLICY IF EXISTS "work_order_files_storage_delete" ON storage.objects;

-- Store files as: {brand_uuid}/{work_order_uuid}/{filename}
CREATE POLICY "work_order_files_storage_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'work-order-files'
  AND public.is_internal_user()
  AND public.can_access_brand(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "work_order_files_storage_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'work-order-files'
  AND public.is_internal_user()
  AND public.can_access_brand(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "work_order_files_storage_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'work-order-files'
  AND public.is_internal_user()
  AND public.can_access_brand(((storage.foldername(name))[1])::uuid)
)
WITH CHECK (
  bucket_id = 'work-order-files'
  AND public.is_internal_user()
  AND public.can_access_brand(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "work_order_files_storage_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'work-order-files'
  AND public.current_app_role() IN ('admin', 'directora')
  AND public.can_access_brand(((storage.foldername(name))[1])::uuid)
);
