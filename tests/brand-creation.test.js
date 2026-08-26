const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const patchSource = fs.readFileSync(path.join(root, "supabase/patch_secure_brand_creation.sql"), "utf8");
const rollbackSource = fs.readFileSync(path.join(root, "supabase/rollback_secure_brand_creation.sql"), "utf8");

test("frontend creates brands only through the authoritative RPC", () => {
  assert.match(appSource, /supabaseClient\.rpc\("create_brand"/);
  assert.doesNotMatch(appSource, /\.from\("brands"\)\s*\.insert\(/s);
  assert.match(appSource, /new Set\(\["admin", "directora", "cuentas", "ejecutivo"\]\)/);
  assert.match(appSource, /!dataState\.clientsReady \|\| !dataState\.brandsReady/);
});

test("RPC is authenticated, fail-closed, and uses a safe search path", () => {
  assert.match(patchSource, /security definer\s+set search_path = ''/i);
  assert.match(patchSource, /actor_id uuid := auth\.uid\(\)/i);
  assert.match(patchSource, /profile\.is_active is true/i);
  assert.match(patchSource, /actor_role not in \('admin', 'directora', 'cuentas', 'ejecutivo'\)/i);
  assert.match(
    patchSource,
    /revoke all on function public\.create_brand\(text, uuid, text\)[\s\S]*from public, anon, authenticated/i,
  );
  assert.match(
    patchSource,
    /grant execute on function public\.create_brand\(text, uuid, text\)[\s\S]*to authenticated/i,
  );
});

test("RPC validates client and all canonical duplicate identities", () => {
  assert.match(patchSource, /from public\.clients client[\s\S]*client\.id = target_client_id/i);
  assert.match(patchSource, /Ya existe una marca con ese nombre/);
  assert.match(patchSource, /El slug generado ya existe/);
  assert.match(patchSource, /El código % ya está en uso/);
  assert.match(patchSource, /pg_advisory_xact_lock/i);
});

test("cuentas and ejecutivo creators receive one actor-scoped membership", () => {
  assert.match(
    patchSource,
    /if actor_role in \('cuentas', 'ejecutivo'\) then[\s\S]*insert into public\.brand_memberships/i,
  );
  assert.match(patchSource, /values \(actor_id, created_brand\.id, actor_role::public\.app_role\)/i);
  assert.doesNotMatch(patchSource, /target_user_id|target_role|created_by/i);
  assert.doesNotMatch(patchSource, /insert into public\.brand_notification_recipients/i);
  assert.match(patchSource, /^begin;[\s\S]*commit;\s*$/i);
});

test("admin and directora do not receive automatic memberships", () => {
  assert.doesNotMatch(patchSource, /actor_role in \([^)]*'admin'[^)]*\)[\s\S]*insert into public\.brand_memberships/i);
  assert.doesNotMatch(patchSource, /actor_role in \([^)]*'directora'[^)]*\)[\s\S]*insert into public\.brand_memberships/i);
});

test("rollback removes only the RPC and never business data", () => {
  assert.match(rollbackSource, /drop function if exists public\.create_brand\(text, uuid, text\)/i);
  assert.doesNotMatch(rollbackSource, /delete\s+from|truncate|drop\s+table/i);
});
