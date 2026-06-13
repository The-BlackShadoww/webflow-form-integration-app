# Adding Third-Party Providers

This guide outlines the step-by-step process for re-enabling or adding new third-party integrations (like Google Sheets, Slack, Airtable, etc.) to the Form Integration App. 

Because we ported the core infrastructure from your original monolithic app, the underlying sync drivers and UI logic for most providers already exist in the codebase! You just need to "wire them up" and expose them to the frontend.

## 1. Register the Provider in the UI
The frontend Integrations page (`/sites/[siteId]/integrations`) dynamically generates its cards based on the `providers.ts` configuration file.

1. Open `apps/platform/src/features/integrations/providers.ts`.
2. Add your desired provider to the `providers` array.
3. Ensure `enabled: true` is set so it becomes clickable in the UI.

**Example for Slack:**
```typescript
{ 
  slug: "slack", 
  typeEnum: "SLACK", 
  name: "Slack", 
  authMode: "oauth", // or "api_key" depending on the app
  description: "Send form submissions to a Slack channel.", 
  enabled: true, 
  typeAliases: ["SLACKCONNECTION"] 
}
```

## 2. Update the Database Schema
The database uses a strict enum (`IntegrationType`) to validate integration types. If you add a new provider, you must tell the database about it.

1. Open `apps/platform/prisma/schema.prisma`.
2. Find the `IntegrationType` enum and add your provider's main type and connection type aliases.
```prisma
enum IntegrationType {
  WEBHOOK
  WEBHOOKCONNECTION
  NOTION
  NOTIONCONNECTION
  // Add new ones here:
  SLACK
  SLACKCONNECTION
  GOOGLESHEET
  GOOGLECONNECTION
}
```
3. Run `npx prisma db push` (for local development) or generate a new migration to apply this change to your database.

## 3. Register the Sync Driver
When a webhook arrives from Webflow, the backend dynamically looks up the correct "Driver" to format and send the data to the third-party service. The old drivers are already sitting in your codebase!

1. Open `apps/platform/src/lib/drivers/index.ts`.
2. Map your new `IntegrationType` to the corresponding driver.
```typescript
import { slackDriver } from "./slackDriver";
import { googleSheetDriver } from "./googleSheetDriver";

const registry: Partial<Record<IntegrationType, IntegrationDriver>> = {
  // ... existing Webhook & Notion drivers
  SLACK: slackDriver as IntegrationDriver,
  SLACKCONNECTION: slackDriver as IntegrationDriver,
  GOOGLESHEET: googleSheetDriver as IntegrationDriver,
  GOOGLECONNECTION: googleSheetDriver as IntegrationDriver,
};
```

## 4. Handle Authentication

How you handle authentication depends on the `authMode` you defined in `providers.ts` in Step 1.

### API Key / Webhook URL (`authMode: "api_key"` or `"webhook_url"`)
If your provider just needs an API Key (like OpenAI or an Airtable PAT), **you don't need to write any code**. The dynamic `connection-dialog.tsx` component will automatically render an API Key input field and securely save it to the database for you.

### OAuth (`authMode: "oauth"`)
If your provider requires an OAuth popup (like Google Sheets or Slack), you must build the backend routes to handle the OAuth handshake (just like we did for Notion).

Create two new API routes:
1. **Install Route:** `apps/platform/src/app/api/integrations/[provider]/install/route.ts`
   - *Purpose:* Verifies the current user's session token, constructs the state, and redirects the user to the provider's OAuth authorization page.
2. **Callback Route:** `apps/platform/src/app/api/integrations/[provider]/callback/route.ts`
   - *Purpose:* Exchanges the authorization code for an Access Token and saves it to the `IntegrationCredential` database table. Be sure to use the `closeOauthPopup()` helper to elegantly close the popup window when finished!

## 5. Implement Destination & Field Fetching (If applicable)

Some integrations require the user to pick a destination (e.g., "Which Slack Channel?") or map specific fields (e.g., "Which Google Sheet Columns?").

If your provider requires this, you need to implement the backend fetching logic so the mapping dialog dropdowns can populate:

1. **Destinations:** Open `apps/platform/src/app/api/dashboard/providers/[provider]/destinations/route.ts` and add a new `if (slug === 'slack')` block inside `fetchDestinations()` to query the provider's API for a list of channels, lists, or sheets.
2. **Fields:** Open `apps/platform/src/app/api/dashboard/providers/[provider]/fields/route.ts` and add a new block to query the provider's API for the available data fields (columns, custom fields, etc.) that the user can map Webflow data into.

Once you complete these 5 steps, your new third-party integration will be natively supported, fully styled using the existing design system, and ready for production!
