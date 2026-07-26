/**
 * One-time identity claim: merge a single eligible legacy public.users row
 * into auth.users.id via public.claim_user_identity (single DB transaction).
 *
 * Feature flag: IDENTITY_CLAIM_V1 (default on). Set to "0" / "false" to disable.
 */

"use strict";

function identityClaimEnabled() {
  const v = String(process.env.IDENTITY_CLAIM_V1 || "1").trim().toLowerCase();
  return v !== "0" && v !== "false" && v !== "off";
}

function normalizeEmail(email) {
  return email != null ? String(email).trim().toLowerCase() : "";
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} authUserId
 * @param {string|null|undefined} email
 * @param {{ mergeReason?: string, onInvalidate?: (legacyId: string, authId: string) => void }} [opts]
 * @returns {Promise<{ ok: boolean, code?: string, merged?: boolean, reason?: string, error?: string, result?: object }>}
 */
async function claimUserIdentity(supabase, authUserId, email, opts) {
  opts = opts || {};
  if (!identityClaimEnabled()) {
    return { ok: true, code: "disabled", merged: false };
  }
  if (!supabase || !authUserId) {
    return { ok: false, code: "invalid_input" };
  }
  const em = normalizeEmail(email);
  if (!em) {
    return { ok: true, code: "no_email", merged: false };
  }

  try {
    const { data, error } = await supabase.rpc("claim_user_identity", {
      p_auth_user_id: authUserId,
      p_email: em,
      p_merge_reason: opts.mergeReason || "email_claim_v1",
    });

    if (error) {
      console.error("[identity-claim] RPC error:", error.message, error.code || "");
      return { ok: false, code: "failed", error: error.message };
    }

    const result = data && typeof data === "object" ? data : {};
    if (result.ok === false && result.code === "failed") {
      console.error(
        "[identity-claim] merge failed (rolled back):",
        result.error || "",
        "auth=",
        authUserId,
        "email=",
        em
      );
      return { ok: false, code: "failed", error: result.error || "merge failed", result };
    }

    if (result.ok === false && result.code === "conflict") {
      console.warn(
        "[identity-claim] conflict (no auto-merge):",
        result.reason || "",
        "auth=",
        authUserId,
        "email=",
        em
      );
      return { ok: false, code: "conflict", reason: result.reason, result };
    }

    if (result.merged && result.legacy_user_id && typeof opts.onInvalidate === "function") {
      try {
        opts.onInvalidate(String(result.legacy_user_id), String(authUserId));
      } catch (e) {
        console.warn("[identity-claim] onInvalidate:", e && e.message);
      }
    }

    if (result.merged) {
      console.log(
        "[identity-claim] ✅ merged legacy",
        result.legacy_user_id,
        "→",
        authUserId,
        "plan=",
        result.plan,
        "credits=",
        result.credits
      );
    }

    return {
      ok: result.ok !== false,
      code: result.code || (result.merged ? "merged" : "noop"),
      merged: !!result.merged,
      result,
    };
  } catch (e) {
    console.error("[identity-claim] exception:", e && e.message);
    return { ok: false, code: "failed", error: (e && e.message) || String(e) };
  }
}

/**
 * If public.users row is soft-merged, return canonical id.
 * @param {{ id: string, identity_status?: string, merged_into?: string|null }|null} row
 */
function resolveCanonicalUserId(row) {
  if (!row || !row.id) return null;
  if (row.identity_status === "merged" && row.merged_into) {
    return String(row.merged_into);
  }
  return String(row.id);
}

module.exports = {
  identityClaimEnabled,
  normalizeEmail,
  claimUserIdentity,
  resolveCanonicalUserId,
};
