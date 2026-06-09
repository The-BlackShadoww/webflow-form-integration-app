# Notion Form Integration App

This repository contains the Next.js application that integrates Webflow forms exclusively with Notion.

## Local Setup Guide

Follow these steps to get the project up and running locally.

### 1. Prerequisites
- **Node.js**: v20 or higher
- **Package Manager**: pnpm (`npm install -g pnpm`)
- **Database**: PostgreSQL (Ensure you have a local instance running or use Docker)

### 2. Install Dependencies
In the root directory, run:
```bash
pnpm install
```

### 3. Environment Variables & License Bypass
1. Navigate to `apps/platform/` and ensure you have an `.env` file (copied from `.env.example`).
2. Set your `DATABASE_URL` to point to your local PostgreSQL instance:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/notion_forms"
   ```
3. **License Bypass**: For local development and testing, ensure the following variable is set to `true`. This will mock a successful response from the license verification logic without modifying the actual production license checking process:
   ```env
   DEV_BYPASS_LICENSE="true"
   ```

### 4. Database Migration
Once your PostgreSQL database is running and the `.env` is configured, push the schema to your database:
```bash
pnpm --filter platform db:push
```

### 5. Notion Integration Requirements
To test Notion locally, you will need to create a private integration (or public OAuth app) in Notion:
1. Go to [Notion Developers](https://www.notion.so/my-integrations).
2. Click **New integration**.
3. Under **Capabilities**, ensure you have `Read`, `Update`, and `Insert` content permissions.
4. If building an OAuth flow for testing, configure the **Redirect URI** to `http://localhost:3000/api/auth/notion/callback`.
5. Copy the **Client ID** and **Client Secret** (or Internal Integration Token) and place them in your `.env` file:
   ```env
   NOTION_CLIENT_ID="your_client_id"
   NOTION_CLIENT_SECRET="your_client_secret"
   ```

### 6. Start the Development Server
From the root directory, start Turborepo's dev script:
```bash
pnpm dev
```
The platform app will now be accessible at `http://localhost:3000`.
