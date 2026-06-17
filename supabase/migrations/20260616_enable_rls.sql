-- ============================================================
-- OmniGuard — RLS Final Fix
-- ============================================================
-- Paste this into: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── STEP 1: Nuke EVERY policy on our 5 tables dynamically ────
-- This works regardless of policy names — nothing survives.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('profiles','user_vaults','payload_logs','training_data','scammers')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END;
$$;

-- ── STEP 2: Make sure RLS is ON ───────────────────────────────
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_vaults   ENABLE ROW LEVEL SECURITY;
ALTER TABLE payload_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE scammers      ENABLE ROW LEVEL SECURITY;

-- ── STEP 2b: Revoke anon privileges on sensitive tables to force 401/403 ──
REVOKE ALL ON profiles FROM anon;
REVOKE ALL ON user_vaults FROM anon;
REVOKE ALL ON payload_logs FROM anon;
REVOKE ALL ON training_data FROM anon;


-- ── STEP 3: Recreate correct policies ─────────────────────────

-- profiles: owner-only read/write
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- user_vaults: owner-only CRUD
CREATE POLICY "vaults_select_own" ON user_vaults
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "vaults_insert_own" ON user_vaults
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "vaults_delete_own" ON user_vaults
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- scammers: public read, auth-only write
CREATE POLICY "scammers_public_read" ON scammers
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "scammers_auth_insert" ON scammers
  FOR INSERT TO authenticated WITH CHECK (true);

-- payload_logs: auth-only insert + select
CREATE POLICY "payload_logs_auth_insert" ON payload_logs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "payload_logs_select_own" ON payload_logs
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- training_data: auth-only insert, no public select
CREATE POLICY "training_insert_auth" ON training_data
  FOR INSERT TO authenticated WITH CHECK (true);

-- ── STEP 4: Verify ────────────────────────────────────────────
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles','user_vaults','scammers','payload_logs','training_data')
ORDER BY tablename, cmd, policyname;
