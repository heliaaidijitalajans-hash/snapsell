/**
 * Batch identity claim for existing production users.
 *
 * Prerequisites: apply supabase/migrations/009_user_identity_claim.sql
 * Usage: node scripts/batch-identity-claim.js
 *
 * For each auth user with an email, calls public.claim_user_identity.
 * Auto-merge only when gates pass; otherwise conflicts are logged in DB.
 */
"use strict";

require("dotenv").config();
const { createServiceClient } = require("../lib/supabase");
const { claimUserIdentity } = require("../lib/identityClaim");

async function main() {
  const supabase = createServiceClient();
  let page = 1;
  const perPage = 200;
  let merged = 0;
  let conflicts = 0;
  let noop = 0;
  let failed = 0;

  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = (data && data.users) || [];
    if (!users.length) break;

    for (const u of users) {
      const email = u.email;
      if (!email) continue;
      const res = await claimUserIdentity(supabase, u.id, email, {
        mergeReason: "batch_migration_v1",
      });
      if (res.merged) merged += 1;
      else if (res.code === "conflict") conflicts += 1;
      else if (res.code === "failed") failed += 1;
      else noop += 1;
    }

    if (users.length < perPage) break;
    page += 1;
  }

  console.log(JSON.stringify({ merged, conflicts, failed, noop }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
