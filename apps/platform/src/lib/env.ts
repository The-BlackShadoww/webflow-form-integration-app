/**
 * Strict env validation — throws if a required var is missing at *runtime*.
 *
 * Validation is skipped during `next build` (Next.js sets NEXT_PHASE to
 * "phase-production-build" while collecting page data, importing every
 * route handler — the prod env isn't available there). It still fires the
 * moment the server actually starts serving requests.
 */
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

function req(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) {
    if (isBuildPhase) return ""; // tolerated during build only
    throw new Error(`[env] Missing required env var: ${name}`);
  }
  return v;
}

function opt(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v : undefined;
}

export const env = {
  // NODE_ENV is set automatically by Next.js (dev/build/start) — don't put it in .env files
  NODE_ENV: process.env.NODE_ENV ?? "development",
  DATABASE_URL: req("DATABASE_URL"),
  JWT_SECRET: req("JWT_SECRET"),
  DASHBOARD_URL: req("DASHBOARD_URL"),

  WEBFLOW_CLIENT_ID: req("WEBFLOW_CLIENT_ID"),
  WEBFLOW_CLIENT_SECRET: req("WEBFLOW_CLIENT_SECRET"),
  WEBFLOW_REDIRECT_URL: req("WEBFLOW_REDIRECT_URL"),
  WEBFLOW_SCOPES: req("WEBFLOW_SCOPES"),

  FORM_SUBMISSION_URL: req("FORM_SUBMISSION_URL"),

  MOCK_PROVIDERS: opt("MOCK_PROVIDERS") === "true",
  DEV_BYPASS_LICENSE: opt("DEV_BYPASS_LICENSE") === "true",
  // Master toggle for verbose server logs across any environment (dev/staging/prod).
  // Read live via getter so Railway env var flips don't need a restart.
  get DEV_LOGS() { return process.env.DEV_LOGS === "true"; },

  ADMIN_API_BASE_URL: req("ADMIN_API_BASE_URL"),
  APP_NAME: req("APP_NAME"),
  FEEDBACK_API_URL: req("FEEDBACK_API_URL"),
  SUPPORT_EMAIL: req("SUPPORT_EMAIL"),

  GETRESPONSE_CLIENT_ID: opt("GETRESPONSE_CLIENT_ID"),
  GETRESPONSE_CLIENT_SECRET: opt("GETRESPONSE_CLIENT_SECRET"),
  GETRESPONSE_REDIRECT_URI: opt("GETRESPONSE_REDIRECT_URI"),

  NOTION_CLIENT_ID: opt("NOTION_CLIENT_ID"),
  NOTION_CLIENT_SECRET: opt("NOTION_CLIENT_SECRET"),
  NOTION_REDIRECT_URI: opt("NOTION_REDIRECT_URI"),

  DISCORD_CLIENT_ID: opt("DISCORD_CLIENT_ID"),
  DISCORD_CLIENT_SECRET: opt("DISCORD_CLIENT_SECRET"),
  DISCORD_REDIRECT_URI: opt("DISCORD_REDIRECT_URI"),
  DISCORD_SCOPES: req("DISCORD_SCOPES"),

  HUBSPOT_CLIENT_ID: opt("HUBSPOT_CLIENT_ID"),
  HUBSPOT_CLIENT_SECRET: opt("HUBSPOT_CLIENT_SECRET"),
  HUBSPOT_REDIRECT_URI: opt("HUBSPOT_REDIRECT_URI"),
  HUBSPOT_SCOPES: req("HUBSPOT_SCOPES"),

  SLACK_CLIENT_ID: opt("SLACK_CLIENT_ID"),
  SLACK_CLIENT_SECRET: opt("SLACK_CLIENT_SECRET"),
  SLACK_REDIRECT_URI: opt("SLACK_REDIRECT_URI"),
  SLACK_SCOPES: req("SLACK_SCOPES"),

  GOOGLE_CLIENT_ID: opt("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: opt("GOOGLE_CLIENT_SECRET"),
  GOOGLE_REDIRECT_URI: opt("GOOGLE_REDIRECT_URI"),
  GOOGLE_SCOPES: req("GOOGLE_SCOPES"),

  AIRTABLE_CLIENT_ID: opt("AIRTABLE_CLIENT_ID"),
  AIRTABLE_CLIENT_SECRET: opt("AIRTABLE_CLIENT_SECRET"),
  AIRTABLE_REDIRECT_URI: opt("AIRTABLE_REDIRECT_URI"),
  AIRTABLE_SCOPES: req("AIRTABLE_SCOPES"),

  CC_CLIENT_ID: opt("CC_CLIENT_ID"),
  CC_CLIENT_SECRET: opt("CC_CLIENT_SECRET"),
  CC_REDIRECT_URI: opt("CC_REDIRECT_URI"),
  CC_SCOPES: req("CC_SCOPES"),
} as const;
