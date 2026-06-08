-- Lumen Workspace base schema
-- Scope: agency workspace, client portal, content approvals, Canva assets.
-- No publishing jobs are included in this phase.

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
  CREATE TYPE content_status AS ENUM (
    'draft',
    'internal_review',
    'client_review',
    'changes_requested',
    'approved',
    'completed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE content_stage AS ENUM (
    'concept',
    'final',
    'scheduled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE comment_visibility AS ENUM ('internal', 'client');
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
  email TEXT NOT NULL,
  avatar_url TEXT,
  role app_role NOT NULL DEFAULT 'creativo',
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  color_primary TEXT DEFAULT '#18345d',
  color_secondary TEXT DEFAULT '#2f9a68',
  platforms TEXT[] NOT NULL DEFAULT '{}',
  services TEXT[] NOT NULL DEFAULT '{}',
  posts_per_month INTEGER DEFAULT 10,
  canva_folder_url TEXT,
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

CREATE TABLE IF NOT EXISTS module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  module_key TEXT NOT NULL,
  can_view BOOLEAN DEFAULT true,
  can_manage BOOLEAN DEFAULT false,
  UNIQUE (role, module_key)
);

CREATE TABLE IF NOT EXISTS brand_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  handle TEXT,
  profile_url TEXT,
  objective TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS brand_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('logo', 'template', 'brand_kit', 'reference', 'legal', 'other')),
  title TEXT NOT NULL,
  file_url TEXT,
  external_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS brand_ai_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE UNIQUE,
  provider TEXT NOT NULL DEFAULT 'gemini',
  model TEXT NOT NULL DEFAULT 'gemini-1.5-pro',
  temperature NUMERIC DEFAULT 0.7,
  tone_of_voice TEXT,
  target_audience TEXT,
  approved_phrases TEXT,
  banned_phrases TEXT,
  system_prompt TEXT,
  example_outputs TEXT,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS brand_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status content_status NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id UUID REFERENCES content_calendars(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  platform TEXT NOT NULL,
  format TEXT NOT NULL,
  pillar TEXT,
  caption TEXT,
  visual_brief TEXT,
  stage content_stage NOT NULL DEFAULT 'concept',
  scheduled_at TIMESTAMPTZ,
  status content_status NOT NULL DEFAULT 'draft',
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  work_order_id UUID,
  production_id UUID,
  approved_asset_version_id UUID,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  visibility comment_visibility NOT NULL DEFAULT 'internal',
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (content_item_id, version_number)
);

CREATE TABLE IF NOT EXISTS approval_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('calendar', 'content_item', 'asset_version')),
  entity_id UUID NOT NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('submitted', 'approved', 'changes_requested', 'revoked')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS guest_magic_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  content_calendar_id UUID REFERENCES content_calendars(id) ON DELETE CASCADE,
  email TEXT,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS canva_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  content_item_id UUID REFERENCES content_items(id) ON DELETE SET NULL,
  canva_design_id TEXT,
  canva_edit_url TEXT NOT NULL,
  title TEXT NOT NULL,
  last_synced_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS asset_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  content_item_id UUID REFERENCES content_items(id) ON DELETE SET NULL,
  canva_design_id UUID REFERENCES canva_designs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  file_url TEXT,
  thumbnail_url TEXT,
  file_type TEXT,
  version_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_design', 'ready', 'approved', 'archived')),
  is_approved_snapshot BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS report_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'csv',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC,
  dimensions JSONB,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  title TEXT NOT NULL,
  pdf_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'client_visible', 'archived')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  linked_content_item_id UUID REFERENCES content_items(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'in_review', 'completed')),
  category TEXT NOT NULL DEFAULT 'diseno',
  due_date DATE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notify_on_email BOOLEAN DEFAULT true,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS work_order_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS work_order_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (work_order_id, user_id)
);

CREATE TABLE IF NOT EXISTS work_order_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
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
  notification_type TEXT NOT NULL CHECK (notification_type IN ('assignment', 'deadline_24h', 'overdue', 'weekly_digest', 'daily_digest')),
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

ALTER TABLE content_items
  DROP CONSTRAINT IF EXISTS content_items_approved_asset_version_id_fkey;

ALTER TABLE content_items
  ADD CONSTRAINT content_items_approved_asset_version_id_fkey
  FOREIGN KEY (approved_asset_version_id)
  REFERENCES asset_versions(id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_brands_client_id ON brands(client_id);
CREATE INDEX IF NOT EXISTS idx_brand_memberships_user_id ON brand_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_memberships_brand_id ON brand_memberships(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_channels_brand_id ON brand_channels(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_assets_brand_id ON brand_assets(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_audit_log_brand_id ON brand_audit_log(brand_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_calendars_brand_period ON content_calendars(brand_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_content_items_brand_status ON content_items(brand_id, status);
CREATE INDEX IF NOT EXISTS idx_content_items_brand_stage ON content_items(brand_id, stage);
CREATE INDEX IF NOT EXISTS idx_content_items_scheduled_at ON content_items(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_content_comments_item_visibility ON content_comments(content_item_id, visibility);
CREATE INDEX IF NOT EXISTS idx_asset_versions_content_item ON asset_versions(content_item_id);
CREATE INDEX IF NOT EXISTS idx_guest_magic_links_brand_calendar ON guest_magic_links(brand_id, content_calendar_id);
CREATE INDEX IF NOT EXISTS idx_report_snapshots_brand_period ON report_snapshots(brand_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_work_orders_brand_status ON work_orders(brand_id, status);
CREATE INDEX IF NOT EXISTS idx_work_orders_assigned_due ON work_orders(assigned_to, due_date);
CREATE INDEX IF NOT EXISTS idx_work_orders_archived_at ON work_orders(archived_at);
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
  SELECT role FROM profiles WHERE id = auth.uid();
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

DROP TRIGGER IF EXISTS trg_brand_channels_updated_at ON brand_channels;
CREATE TRIGGER trg_brand_channels_updated_at
BEFORE UPDATE ON brand_channels
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_brand_ai_config_updated_at ON brand_ai_config;
CREATE TRIGGER trg_brand_ai_config_updated_at
BEFORE UPDATE ON brand_ai_config
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_content_calendars_updated_at ON content_calendars;
CREATE TRIGGER trg_content_calendars_updated_at
BEFORE UPDATE ON content_calendars
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_content_items_updated_at ON content_items;
CREATE TRIGGER trg_content_items_updated_at
BEFORE UPDATE ON content_items
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_canva_designs_updated_at ON canva_designs;
CREATE TRIGGER trg_canva_designs_updated_at
BEFORE UPDATE ON canva_designs
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
ALTER TABLE module_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_magic_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE canva_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_digest_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients_select_by_role" ON clients;
DROP POLICY IF EXISTS "clients_manage_admin_directora" ON clients;
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_manage_admin_directora" ON profiles;
DROP POLICY IF EXISTS "brands_select_members" ON brands;
DROP POLICY IF EXISTS "brands_manage_admin_directora" ON brands;
DROP POLICY IF EXISTS "brand_memberships_select_related" ON brand_memberships;
DROP POLICY IF EXISTS "brand_memberships_manage_admin_directora" ON brand_memberships;
DROP POLICY IF EXISTS "module_permissions_select_all_authenticated" ON module_permissions;
DROP POLICY IF EXISTS "module_permissions_manage_admin" ON module_permissions;
DROP POLICY IF EXISTS "brand_channels_select_brand_access" ON brand_channels;
DROP POLICY IF EXISTS "brand_channels_internal_manage" ON brand_channels;
DROP POLICY IF EXISTS "brand_assets_select_brand_access" ON brand_assets;
DROP POLICY IF EXISTS "brand_assets_internal_manage" ON brand_assets;
DROP POLICY IF EXISTS "brand_ai_config_internal_select" ON brand_ai_config;
DROP POLICY IF EXISTS "brand_ai_config_internal_manage" ON brand_ai_config;
DROP POLICY IF EXISTS "brand_audit_log_internal_select" ON brand_audit_log;
DROP POLICY IF EXISTS "brand_audit_log_internal_insert" ON brand_audit_log;
DROP POLICY IF EXISTS "content_calendars_brand_access" ON content_calendars;
DROP POLICY IF EXISTS "content_calendars_internal_manage" ON content_calendars;
DROP POLICY IF EXISTS "content_items_brand_access" ON content_items;
DROP POLICY IF EXISTS "content_items_internal_manage" ON content_items;
DROP POLICY IF EXISTS "content_comments_select_visibility" ON content_comments;
DROP POLICY IF EXISTS "content_comments_insert_brand_access" ON content_comments;
DROP POLICY IF EXISTS "content_versions_internal_only" ON content_versions;
DROP POLICY IF EXISTS "content_versions_internal_manage" ON content_versions;
DROP POLICY IF EXISTS "approval_events_select_brand_access" ON approval_events;
DROP POLICY IF EXISTS "approval_events_insert_brand_access" ON approval_events;
DROP POLICY IF EXISTS "guest_magic_links_internal_manage" ON guest_magic_links;
DROP POLICY IF EXISTS "canva_designs_internal_select" ON canva_designs;
DROP POLICY IF EXISTS "canva_designs_internal_manage" ON canva_designs;
DROP POLICY IF EXISTS "asset_versions_brand_access" ON asset_versions;
DROP POLICY IF EXISTS "asset_versions_internal_manage" ON asset_versions;
DROP POLICY IF EXISTS "report_snapshots_brand_access" ON report_snapshots;
DROP POLICY IF EXISTS "report_snapshots_internal_manage" ON report_snapshots;
DROP POLICY IF EXISTS "reports_brand_access" ON reports;
DROP POLICY IF EXISTS "reports_internal_manage" ON reports;
DROP POLICY IF EXISTS "work_orders_brand_access" ON work_orders;
DROP POLICY IF EXISTS "work_orders_internal_manage" ON work_orders;
DROP POLICY IF EXISTS "work_order_comments_brand_access" ON work_order_comments;
DROP POLICY IF EXISTS "work_order_comments_internal_manage" ON work_order_comments;
DROP POLICY IF EXISTS "work_order_assignees_brand_access" ON work_order_assignees;
DROP POLICY IF EXISTS "work_order_assignees_internal_manage" ON work_order_assignees;
DROP POLICY IF EXISTS "work_order_files_brand_access" ON work_order_files;
DROP POLICY IF EXISTS "work_order_files_internal_manage" ON work_order_files;
DROP POLICY IF EXISTS "work_order_activity_brand_access" ON work_order_activity;
DROP POLICY IF EXISTS "work_order_activity_internal_insert" ON work_order_activity;
DROP POLICY IF EXISTS "notification_rules_internal_select" ON notification_rules;
DROP POLICY IF EXISTS "notification_rules_admin_manage" ON notification_rules;
DROP POLICY IF EXISTS "email_notifications_internal_select" ON email_notifications;
DROP POLICY IF EXISTS "email_notifications_admin_manage" ON email_notifications;
DROP POLICY IF EXISTS "weekly_digest_runs_internal_select" ON weekly_digest_runs;
DROP POLICY IF EXISTS "weekly_digest_runs_admin_manage" ON weekly_digest_runs;

CREATE POLICY "clients_select_by_role"
ON clients FOR SELECT
USING (
  current_app_role() IN ('admin', 'directora')
  OR id = (SELECT client_id FROM profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "clients_manage_admin_directora"
ON clients FOR ALL
USING (current_app_role() IN ('admin', 'directora'))
WITH CHECK (current_app_role() IN ('admin', 'directora'));

CREATE POLICY "profiles_select_own_or_admin"
ON profiles FOR SELECT
USING (
  id = auth.uid()
  OR current_app_role() IN ('admin', 'directora')
);

CREATE POLICY "profiles_manage_admin_directora"
ON profiles FOR ALL
USING (current_app_role() IN ('admin', 'directora'))
WITH CHECK (current_app_role() IN ('admin', 'directora'));

CREATE POLICY "brands_select_members"
ON brands FOR SELECT
USING (can_access_brand(id));

CREATE POLICY "brands_manage_admin_directora"
ON brands FOR ALL
USING (current_app_role() IN ('admin', 'directora'))
WITH CHECK (current_app_role() IN ('admin', 'directora'));

CREATE POLICY "brand_memberships_select_related"
ON brand_memberships FOR SELECT
USING (
  user_id = auth.uid()
  OR current_app_role() IN ('admin', 'directora')
);

CREATE POLICY "brand_memberships_manage_admin_directora"
ON brand_memberships FOR ALL
USING (current_app_role() IN ('admin', 'directora'))
WITH CHECK (current_app_role() IN ('admin', 'directora'));

CREATE POLICY "module_permissions_select_all_authenticated"
ON module_permissions FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "module_permissions_manage_admin"
ON module_permissions FOR ALL
USING (current_app_role() = 'admin')
WITH CHECK (current_app_role() = 'admin');

CREATE POLICY "brand_channels_select_brand_access"
ON brand_channels FOR SELECT
USING (can_access_brand(brand_id));

CREATE POLICY "brand_channels_internal_manage"
ON brand_channels FOR ALL
USING (can_access_brand(brand_id) AND current_app_role() <> 'cliente')
WITH CHECK (can_access_brand(brand_id) AND current_app_role() <> 'cliente');

CREATE POLICY "brand_assets_select_brand_access"
ON brand_assets FOR SELECT
USING (
  can_access_brand(brand_id)
  AND current_app_role() <> 'cliente'
);

CREATE POLICY "brand_assets_internal_manage"
ON brand_assets FOR ALL
USING (can_access_brand(brand_id) AND current_app_role() <> 'cliente')
WITH CHECK (can_access_brand(brand_id) AND current_app_role() <> 'cliente');

CREATE POLICY "brand_ai_config_internal_select"
ON brand_ai_config FOR SELECT
USING (can_access_brand(brand_id) AND current_app_role() <> 'cliente');

CREATE POLICY "brand_ai_config_internal_manage"
ON brand_ai_config FOR ALL
USING (can_access_brand(brand_id) AND current_app_role() IN ('admin', 'directora', 'creativo'))
WITH CHECK (can_access_brand(brand_id) AND current_app_role() IN ('admin', 'directora', 'creativo'));

CREATE POLICY "brand_audit_log_internal_select"
ON brand_audit_log FOR SELECT
USING (can_access_brand(brand_id) AND current_app_role() <> 'cliente');

CREATE POLICY "brand_audit_log_internal_insert"
ON brand_audit_log FOR INSERT
WITH CHECK (can_access_brand(brand_id) AND current_app_role() <> 'cliente');

CREATE POLICY "content_calendars_brand_access"
ON content_calendars FOR SELECT
USING (can_access_brand(brand_id));

CREATE POLICY "content_calendars_internal_manage"
ON content_calendars FOR ALL
USING (can_access_brand(brand_id) AND current_app_role() <> 'cliente')
WITH CHECK (can_access_brand(brand_id) AND current_app_role() <> 'cliente');

CREATE POLICY "content_items_brand_access"
ON content_items FOR SELECT
USING (can_access_brand(brand_id));

CREATE POLICY "content_items_internal_manage"
ON content_items FOR ALL
USING (can_access_brand(brand_id) AND current_app_role() <> 'cliente')
WITH CHECK (can_access_brand(brand_id) AND current_app_role() <> 'cliente');

CREATE POLICY "content_comments_select_visibility"
ON content_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM content_items ci
    WHERE ci.id = content_comments.content_item_id
    AND can_access_brand(ci.brand_id)
  )
  AND (
    current_app_role() <> 'cliente'
    OR visibility = 'client'
  )
);

CREATE POLICY "content_comments_insert_brand_access"
ON content_comments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM content_items ci
    WHERE ci.id = content_comments.content_item_id
    AND can_access_brand(ci.brand_id)
  )
  AND (
    current_app_role() <> 'cliente'
    OR visibility = 'client'
  )
);

CREATE POLICY "content_versions_internal_only"
ON content_versions FOR SELECT
USING (
  current_app_role() <> 'cliente'
  AND EXISTS (
    SELECT 1 FROM content_items ci
    WHERE ci.id = content_versions.content_item_id
    AND can_access_brand(ci.brand_id)
  )
);

CREATE POLICY "content_versions_internal_manage"
ON content_versions FOR ALL
USING (
  current_app_role() <> 'cliente'
  AND EXISTS (
    SELECT 1 FROM content_items ci
    WHERE ci.id = content_versions.content_item_id
    AND can_access_brand(ci.brand_id)
  )
)
WITH CHECK (
  current_app_role() <> 'cliente'
  AND EXISTS (
    SELECT 1 FROM content_items ci
    WHERE ci.id = content_versions.content_item_id
    AND can_access_brand(ci.brand_id)
  )
);

CREATE POLICY "approval_events_select_brand_access"
ON approval_events FOR SELECT
USING (can_access_brand(brand_id));

CREATE POLICY "approval_events_insert_brand_access"
ON approval_events FOR INSERT
WITH CHECK (can_access_brand(brand_id));

CREATE POLICY "guest_magic_links_internal_manage"
ON guest_magic_links FOR ALL
USING (can_access_brand(brand_id) AND current_app_role() <> 'cliente')
WITH CHECK (can_access_brand(brand_id) AND current_app_role() <> 'cliente');

CREATE POLICY "canva_designs_internal_select"
ON canva_designs FOR SELECT
USING (can_access_brand(brand_id) AND current_app_role() <> 'cliente');

CREATE POLICY "canva_designs_internal_manage"
ON canva_designs FOR ALL
USING (can_access_brand(brand_id) AND current_app_role() <> 'cliente')
WITH CHECK (can_access_brand(brand_id) AND current_app_role() <> 'cliente');

CREATE POLICY "asset_versions_brand_access"
ON asset_versions FOR SELECT
USING (
  can_access_brand(brand_id)
  AND (
    current_app_role() <> 'cliente'
    OR is_approved_snapshot = true
    OR status IN ('ready', 'approved')
  )
);

CREATE POLICY "asset_versions_internal_manage"
ON asset_versions FOR ALL
USING (can_access_brand(brand_id) AND current_app_role() <> 'cliente')
WITH CHECK (can_access_brand(brand_id) AND current_app_role() <> 'cliente');

CREATE POLICY "report_snapshots_brand_access"
ON report_snapshots FOR SELECT
USING (can_access_brand(brand_id));

CREATE POLICY "report_snapshots_internal_manage"
ON report_snapshots FOR ALL
USING (can_access_brand(brand_id) AND current_app_role() <> 'cliente')
WITH CHECK (can_access_brand(brand_id) AND current_app_role() <> 'cliente');

CREATE POLICY "reports_brand_access"
ON reports FOR SELECT
USING (
  can_access_brand(brand_id)
  AND (
    current_app_role() <> 'cliente'
    OR status = 'client_visible'
  )
);

CREATE POLICY "reports_internal_manage"
ON reports FOR ALL
USING (can_access_brand(brand_id) AND current_app_role() <> 'cliente')
WITH CHECK (can_access_brand(brand_id) AND current_app_role() <> 'cliente');

CREATE POLICY "work_orders_brand_access"
ON work_orders FOR SELECT
USING (can_access_brand(brand_id) AND current_app_role() <> 'cliente');

CREATE POLICY "work_orders_internal_manage"
ON work_orders FOR ALL
USING (can_access_brand(brand_id) AND current_app_role() <> 'cliente')
WITH CHECK (can_access_brand(brand_id) AND current_app_role() <> 'cliente');

CREATE POLICY "work_order_comments_brand_access"
ON work_order_comments FOR SELECT
USING (
  current_app_role() <> 'cliente'
  AND EXISTS (
    SELECT 1 FROM work_orders wo
    WHERE wo.id = work_order_comments.work_order_id
    AND can_access_brand(wo.brand_id)
  )
);

CREATE POLICY "work_order_comments_internal_manage"
ON work_order_comments FOR ALL
USING (
  current_app_role() <> 'cliente'
  AND EXISTS (
    SELECT 1 FROM work_orders wo
    WHERE wo.id = work_order_comments.work_order_id
    AND can_access_brand(wo.brand_id)
  )
)
WITH CHECK (
  current_app_role() <> 'cliente'
  AND EXISTS (
    SELECT 1 FROM work_orders wo
    WHERE wo.id = work_order_comments.work_order_id
    AND can_access_brand(wo.brand_id)
  )
);

CREATE POLICY "work_order_assignees_brand_access"
ON work_order_assignees FOR SELECT
USING (
  current_app_role() <> 'cliente'
  AND EXISTS (
    SELECT 1 FROM work_orders wo
    WHERE wo.id = work_order_assignees.work_order_id
    AND can_access_brand(wo.brand_id)
  )
);

CREATE POLICY "work_order_assignees_internal_manage"
ON work_order_assignees FOR ALL
USING (
  current_app_role() <> 'cliente'
  AND EXISTS (
    SELECT 1 FROM work_orders wo
    WHERE wo.id = work_order_assignees.work_order_id
    AND can_access_brand(wo.brand_id)
  )
)
WITH CHECK (
  current_app_role() <> 'cliente'
  AND EXISTS (
    SELECT 1 FROM work_orders wo
    WHERE wo.id = work_order_assignees.work_order_id
    AND can_access_brand(wo.brand_id)
  )
);

CREATE POLICY "work_order_files_brand_access"
ON work_order_files FOR SELECT
USING (
  current_app_role() <> 'cliente'
  AND EXISTS (
    SELECT 1 FROM work_orders wo
    WHERE wo.id = work_order_files.work_order_id
    AND can_access_brand(wo.brand_id)
  )
);

CREATE POLICY "work_order_files_internal_manage"
ON work_order_files FOR ALL
USING (
  current_app_role() <> 'cliente'
  AND EXISTS (
    SELECT 1 FROM work_orders wo
    WHERE wo.id = work_order_files.work_order_id
    AND can_access_brand(wo.brand_id)
  )
)
WITH CHECK (
  current_app_role() <> 'cliente'
  AND EXISTS (
    SELECT 1 FROM work_orders wo
    WHERE wo.id = work_order_files.work_order_id
    AND can_access_brand(wo.brand_id)
  )
);

CREATE POLICY "work_order_activity_brand_access"
ON work_order_activity FOR SELECT
USING (
  current_app_role() <> 'cliente'
  AND EXISTS (
    SELECT 1 FROM work_orders wo
    WHERE wo.id = work_order_activity.work_order_id
    AND can_access_brand(wo.brand_id)
  )
);

CREATE POLICY "work_order_activity_internal_insert"
ON work_order_activity FOR INSERT
WITH CHECK (
  current_app_role() <> 'cliente'
  AND EXISTS (
    SELECT 1 FROM work_orders wo
    WHERE wo.id = work_order_activity.work_order_id
    AND can_access_brand(wo.brand_id)
  )
);

CREATE POLICY "notification_rules_internal_select"
ON notification_rules FOR SELECT
USING (current_app_role() <> 'cliente');

CREATE POLICY "notification_rules_admin_manage"
ON notification_rules FOR ALL
USING (current_app_role() IN ('admin', 'directora'))
WITH CHECK (current_app_role() IN ('admin', 'directora'));

CREATE POLICY "email_notifications_internal_select"
ON email_notifications FOR SELECT
USING (can_access_brand(brand_id) AND current_app_role() <> 'cliente');

CREATE POLICY "email_notifications_admin_manage"
ON email_notifications FOR ALL
USING (can_access_brand(brand_id) AND current_app_role() IN ('admin', 'directora'))
WITH CHECK (can_access_brand(brand_id) AND current_app_role() IN ('admin', 'directora'));

CREATE POLICY "weekly_digest_runs_internal_select"
ON weekly_digest_runs FOR SELECT
USING (current_app_role() <> 'cliente');

CREATE POLICY "weekly_digest_runs_admin_manage"
ON weekly_digest_runs FOR ALL
USING (current_app_role() IN ('admin', 'directora'))
WITH CHECK (current_app_role() IN ('admin', 'directora'));

INSERT INTO module_permissions (role, module_key, can_view, can_manage) VALUES
  ('admin', 'dashboard', true, true),
  ('admin', 'brand-config', true, true),
  ('admin', 'work-orders', true, true),
  ('admin', 'notifications', true, true),
  ('admin', 'productions', true, true),
  ('admin', 'content', true, true),
  ('admin', 'assets', true, true),
  ('admin', 'copywriting', true, true),
  ('admin', 'creativity', true, true),
  ('admin', 'reports', true, true),
  ('admin', 'team', true, true),
  ('admin', 'client-portal', true, true),
  ('admin', 'roadmap', true, true),
  ('admin', 'settings', true, true),
  ('directora', 'dashboard', true, true),
  ('directora', 'brand-config', true, true),
  ('directora', 'work-orders', true, true),
  ('directora', 'notifications', true, true),
  ('directora', 'productions', true, true),
  ('directora', 'content', true, true),
  ('directora', 'assets', true, true),
  ('directora', 'copywriting', true, true),
  ('directora', 'creativity', true, true),
  ('directora', 'reports', true, true),
  ('directora', 'team', true, true),
  ('directora', 'client-portal', true, true),
  ('directora', 'roadmap', true, true),
  ('directora', 'settings', true, true),
  ('cuentas', 'dashboard', true, false),
  ('cuentas', 'brand-config', true, false),
  ('cuentas', 'work-orders', true, true),
  ('cuentas', 'notifications', true, false),
  ('cuentas', 'team', true, false),
  ('cuentas', 'content', true, false),
  ('cuentas', 'reports', true, false),
  ('medios', 'dashboard', true, false),
  ('medios', 'brand-config', true, false),
  ('medios', 'work-orders', true, true),
  ('medios', 'notifications', true, false),
  ('medios', 'reports', true, true),
  ('medios', 'content', true, false),
  ('editor', 'dashboard', true, false),
  ('editor', 'brand-config', true, false),
  ('editor', 'work-orders', true, true),
  ('editor', 'content', true, true),
  ('editor', 'assets', true, true),
  ('editor', 'copywriting', true, false),
  ('editor', 'creativity', true, false),
  ('generador', 'dashboard', true, false),
  ('generador', 'brand-config', true, false),
  ('generador', 'work-orders', true, true),
  ('generador', 'copywriting', true, true),
  ('generador', 'creativity', true, true),
  ('generador', 'content', true, true),
  ('operaciones', 'dashboard', true, true),
  ('operaciones', 'brand-config', true, false),
  ('operaciones', 'work-orders', true, true),
  ('operaciones', 'notifications', true, true),
  ('operaciones', 'team', true, false),
  ('operaciones', 'productions', true, true),
  ('ejecutivo', 'dashboard', true, false),
  ('ejecutivo', 'brand-config', true, false),
  ('ejecutivo', 'work-orders', true, true),
  ('ejecutivo', 'notifications', true, false),
  ('ejecutivo', 'team', true, false),
  ('ejecutivo', 'reports', true, false),
  ('creativo', 'dashboard', true, false),
  ('creativo', 'brand-config', true, true),
  ('creativo', 'work-orders', true, true),
  ('creativo', 'notifications', true, false),
  ('creativo', 'productions', true, false),
  ('creativo', 'content', true, true),
  ('creativo', 'assets', true, false),
  ('creativo', 'copywriting', true, true),
  ('creativo', 'creativity', true, true),
  ('creativo', 'reports', true, false),
  ('disenador', 'dashboard', true, false),
  ('disenador', 'brand-config', true, false),
  ('disenador', 'work-orders', true, true),
  ('disenador', 'notifications', true, false),
  ('disenador', 'productions', true, false),
  ('disenador', 'content', true, false),
  ('disenador', 'assets', true, true),
  ('community', 'dashboard', true, false),
  ('community', 'brand-config', true, false),
  ('community', 'work-orders', true, true),
  ('community', 'notifications', true, false),
  ('community', 'content', true, true),
  ('community', 'reports', true, false),
  ('pauta', 'dashboard', true, false),
  ('pauta', 'brand-config', true, false),
  ('pauta', 'notifications', true, false),
  ('pauta', 'reports', true, true),
  ('pauta', 'content', true, false),
  ('cliente', 'client-portal', true, false),
  ('cliente', 'reports', true, false)
ON CONFLICT (role, module_key) DO UPDATE SET
  can_view = EXCLUDED.can_view,
  can_manage = EXCLUDED.can_manage;

INSERT INTO notification_rules (rule_key, title, channel, recipients, is_enabled) VALUES
  ('assignment', 'Asignacion de OT', 'email,in_app', 'assigned_user', true),
  ('deadline_24h', 'Deadline en 24h', 'email', 'assigned_user,direccion', true),
  ('overdue', 'OT vencida', 'email,in_app', 'assigned_user,created_by,direccion', true),
  ('weekly_digest', 'Digest lunes 8am', 'email', 'internal_team', true),
  ('daily_activity_digest', 'Resumen diario de actividad', 'email', 'work_order_assignees,created_by', true)
ON CONFLICT (rule_key) DO UPDATE SET
  title = EXCLUDED.title,
  channel = EXCLUDED.channel,
  recipients = EXCLUDED.recipients,
  is_enabled = EXCLUDED.is_enabled;
