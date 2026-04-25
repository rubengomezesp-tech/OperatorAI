/**
 * Operator AI — Premium Composer
 * Phase 1.4 / Feature Flag
 *
 * Centralized control for the Composer V2 pipeline.
 * Default OFF — must be explicitly enabled per env or per user.
 */

export interface ComposerFlagContext {
  /** User org_id for per-org rollout */
  orgId?: string;
  /** User tier — agency tier gets V2 first */
  tier?: 'free' | 'pro' | 'agency';
  /** Manual override (e.g. URL param ?composer=v2 in dev) */
  override?: 'on' | 'off';
}

/**
 * Decide whether Composer V2 is enabled for this request.
 *
 * Priority order:
 *  1. Manual override (URL param, header, etc.)
 *  2. Per-org allowlist (env COMPOSER_V2_ORGS=org1,org2)
 *  3. Per-tier rollout (env COMPOSER_V2_TIERS=agency)
 *  4. Global flag (env COMPOSER_V2_ENABLED=true)
 *  5. Default OFF
 */
export function isComposerV2Enabled(ctx: ComposerFlagContext = {}): boolean {
  // 1. Manual override
  if (ctx.override === 'on') return true;
  if (ctx.override === 'off') return false;

  // 2. Per-org allowlist
  const allowedOrgs = (process.env.COMPOSER_V2_ORGS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (ctx.orgId && allowedOrgs.includes(ctx.orgId)) return true;

  // 3. Per-tier rollout
  const allowedTiers = (process.env.COMPOSER_V2_TIERS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (ctx.tier && allowedTiers.includes(ctx.tier)) return true;

  // 4. Global flag
  if (process.env.COMPOSER_V2_ENABLED === 'true') return true;

  // 5. Default
  return false;
}

/**
 * Diagnostic helper — explains why the flag is on/off.
 * Useful for debugging in logs.
 */
export function explainFlagDecision(ctx: ComposerFlagContext = {}): string {
  if (ctx.override === 'on') return 'enabled: manual override';
  if (ctx.override === 'off') return 'disabled: manual override';

  const allowedOrgs = (process.env.COMPOSER_V2_ORGS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  if (ctx.orgId && allowedOrgs.includes(ctx.orgId)) {
    return `enabled: org ${ctx.orgId} in allowlist`;
  }

  const allowedTiers = (process.env.COMPOSER_V2_TIERS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  if (ctx.tier && allowedTiers.includes(ctx.tier)) {
    return `enabled: tier ${ctx.tier} in rollout`;
  }

  if (process.env.COMPOSER_V2_ENABLED === 'true') {
    return 'enabled: global flag';
  }

  return 'disabled: default';
}
