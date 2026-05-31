-- =============================================
-- EstateFlow CRM - Row Level Security Policies
-- 002_rls_policies.sql
-- =============================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Helper function to get current user's org
-- =============================================
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin_or_manager()
RETURNS BOOLEAN AS $$
  SELECT role IN ('admin', 'sales_manager') FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- =============================================
-- Organizations - users can only see their org
-- =============================================
CREATE POLICY "org_select" ON organizations FOR SELECT
  USING (id = get_user_org_id());

-- =============================================
-- Users - see only org members
-- =============================================
CREATE POLICY "users_select_org" ON users FOR SELECT
  USING (organization_id = get_user_org_id());

CREATE POLICY "users_update_own" ON users FOR UPDATE
  USING (id = auth.uid() OR is_admin_or_manager());

CREATE POLICY "users_insert_admin" ON users FOR INSERT
  WITH CHECK (is_admin_or_manager());

-- =============================================
-- Leads - organization isolation + agent scope
-- =============================================
CREATE POLICY "leads_select" ON leads FOR SELECT
  USING (
    organization_id = get_user_org_id() AND (
      is_admin_or_manager() OR  -- managers see all
      assigned_to = auth.uid() OR  -- assigned agent
      created_by = auth.uid()  -- creator
    )
  );

CREATE POLICY "leads_insert" ON leads FOR INSERT
  WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "leads_update" ON leads FOR UPDATE
  USING (
    organization_id = get_user_org_id() AND (
      is_admin_or_manager() OR
      assigned_to = auth.uid()
    )
  );

CREATE POLICY "leads_delete" ON leads FOR DELETE
  USING (is_admin_or_manager() AND organization_id = get_user_org_id());

-- =============================================
-- Activities - organization isolation
-- =============================================
CREATE POLICY "activities_select" ON activities FOR SELECT
  USING (organization_id = get_user_org_id());

CREATE POLICY "activities_insert" ON activities FOR INSERT
  WITH CHECK (organization_id = get_user_org_id());

-- =============================================
-- Calls - organization isolation
-- =============================================
CREATE POLICY "calls_select" ON calls FOR SELECT
  USING (
    organization_id = get_user_org_id() AND (
      is_admin_or_manager() OR agent_id = auth.uid()
    )
  );

CREATE POLICY "calls_insert" ON calls FOR INSERT
  WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "calls_update" ON calls FOR UPDATE
  USING (
    organization_id = get_user_org_id() AND (
      is_admin_or_manager() OR agent_id = auth.uid()
    )
  );

-- =============================================
-- Messages
-- =============================================
CREATE POLICY "messages_select" ON messages FOR SELECT
  USING (
    organization_id = get_user_org_id() AND (
      is_admin_or_manager() OR user_id = auth.uid()
    )
  );

CREATE POLICY "messages_insert" ON messages FOR INSERT
  WITH CHECK (organization_id = get_user_org_id());

-- =============================================
-- Follow-Ups
-- =============================================
CREATE POLICY "follow_ups_select" ON follow_ups FOR SELECT
  USING (
    organization_id = get_user_org_id() AND (
      is_admin_or_manager() OR assigned_to = auth.uid()
    )
  );

CREATE POLICY "follow_ups_insert" ON follow_ups FOR INSERT
  WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "follow_ups_update" ON follow_ups FOR UPDATE
  USING (
    organization_id = get_user_org_id() AND (
      is_admin_or_manager() OR assigned_to = auth.uid()
    )
  );

-- =============================================
-- Properties - all org members can see
-- =============================================
CREATE POLICY "properties_select" ON properties FOR SELECT
  USING (organization_id = get_user_org_id());

CREATE POLICY "properties_insert" ON properties FOR INSERT
  WITH CHECK (
    organization_id = get_user_org_id() AND is_admin_or_manager()
  );

CREATE POLICY "properties_update" ON properties FOR UPDATE
  USING (
    organization_id = get_user_org_id() AND is_admin_or_manager()
  );

CREATE POLICY "properties_delete" ON properties FOR DELETE
  USING (
    organization_id = get_user_org_id() AND get_user_role() = 'admin'
  );

-- =============================================
-- Attendance
-- =============================================
CREATE POLICY "attendance_select" ON attendance FOR SELECT
  USING (
    organization_id = get_user_org_id() AND (
      is_admin_or_manager() OR user_id = auth.uid()
    )
  );

CREATE POLICY "attendance_insert" ON attendance FOR INSERT
  WITH CHECK (
    organization_id = get_user_org_id() AND user_id = auth.uid()
  );

CREATE POLICY "attendance_update" ON attendance FOR UPDATE
  USING (
    organization_id = get_user_org_id() AND (
      is_admin_or_manager() OR user_id = auth.uid()
    )
  );

-- =============================================
-- Social Posts
-- =============================================
CREATE POLICY "social_posts_select" ON social_posts FOR SELECT
  USING (organization_id = get_user_org_id());

CREATE POLICY "social_posts_insert" ON social_posts FOR INSERT
  WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "social_posts_update" ON social_posts FOR UPDATE
  USING (
    organization_id = get_user_org_id() AND (
      is_admin_or_manager() OR created_by = auth.uid()
    )
  );

-- =============================================
-- Tasks
-- =============================================
CREATE POLICY "tasks_select" ON tasks FOR SELECT
  USING (
    organization_id = get_user_org_id() AND (
      is_admin_or_manager() OR assigned_to = auth.uid()
    )
  );

CREATE POLICY "tasks_insert" ON tasks FOR INSERT
  WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "tasks_update" ON tasks FOR UPDATE
  USING (
    organization_id = get_user_org_id() AND (
      is_admin_or_manager() OR assigned_to = auth.uid()
    )
  );

-- =============================================
-- Notifications - user's own only
-- =============================================
CREATE POLICY "notifications_select" ON notifications FOR SELECT
  USING (user_id = auth.uid() AND organization_id = get_user_org_id());

CREATE POLICY "notifications_update" ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Service role bypass (for API routes using service key)
-- The service key bypasses RLS automatically
