# Trending Entries Cleanup System

This system automatically manages trending entries lifecycle by removing old and inactive entries to keep the database clean and performant.

## Overview

The cleanup system consists of:

1. **Daily Cron Job** - Automatically runs at 2 AM every day
2. **Manual Cleanup Script** - Can be run on-demand
3. **Cleanup Service** - Reusable service for cleanup logic

## Automatic Cleanup (Cron Job)

The system automatically runs daily at 2:00 AM to clean up:

- Trending entries older than 24 hours (based on `createdAt` timestamp)
- Trending entries with `expires_at` field that has passed
- Trending entries marked as `is_active: false`

### Configuration

The cron job is configured in `config/server.ts`:

```javascript
cron: {
  enabled: true,
  tasks: {
    // Clean up old trending entries every day at 2 AM
    '0 2 * * *': async ({ strapi }) => {
      // Cleanup logic here
    },
  },
}
```

### Cron Schedule Format

- `0 2 * * *` = Every day at 2:00 AM
- Format: `minute hour day month dayOfWeek`

## Manual Cleanup

You can run the cleanup manually using:

```bash
# Make sure STRAPI_API_TOKEN is set in your .env file
npm run cleanup:trending
```

Or with inline token:

```bash
STRAPI_API_TOKEN=your_token_here npm run cleanup:trending
```

## Cleanup Logic

### 1. Time-based Cleanup

Removes entries that are:

- Older than 24 hours (based on `createdAt`)
- Have an `expires_at` timestamp that has passed

### 2. Status-based Cleanup

Removes entries that are:

- Marked as `is_active: false`

## Setting Expiration for New Entries

When creating new trending entries, you can set a custom expiration:

```javascript
const cleanupService = require('./src/services/trending-cleanup');

// Set expiration to 48 hours from now
await cleanupService.setExpirationForEntry(entryId, 48);
```

## Monitoring

The cleanup operations log detailed information:

- Number of entries found for cleanup
- Number of entries successfully deleted
- Any errors encountered during deletion
- Cutoff dates used for cleanup

## Database Schema

The trending entries schema includes these cleanup-related fields:

```json
{
  "expires_at": {
    "type": "datetime",
    "required": false
  },
  "is_active": {
    "type": "boolean",
    "default": true
  }
}
```

- `expires_at`: Optional explicit expiration datetime
- `is_active`: Boolean flag to mark entries for cleanup
- `createdAt`: Automatic Strapi timestamp (used for 24-hour rule)

## Environment Variables

Make sure to set these environment variables:

```env
# Required for manual cleanup script
STRAPI_API_TOKEN=your_strapi_api_token_here

# Optional - defaults to http://localhost:1337
STRAPI_URL=http://localhost:1337
```

## Troubleshooting

### Cron Job Not Running

1. Check if cron is enabled in `config/server.ts`
2. Check Strapi logs for cron execution messages
3. Verify the cron schedule format

### Manual Script Fails

1. Ensure `STRAPI_API_TOKEN` is set and valid
2. Check that Strapi is running and accessible
3. Verify the API token has delete permissions for trending entries

### Performance Considerations

- The cleanup processes entries in batches of 1000 to avoid memory issues
- Progress is logged every 10 deletions for large batches
- Failed deletions are logged but don't stop the overall process

## Customization

### Change Cleanup Schedule

Edit the cron pattern in `config/server.ts`:

```javascript
// Examples:
'0 3 * * *'     // 3 AM daily
'0 2 * * 0'     // 2 AM every Sunday
'0 */6 * * *'   // Every 6 hours
```

### Change Retention Period

Modify `CLEANUP_OLDER_THAN_HOURS` in `src/services/trending-cleanup.js`:

```javascript
const CLEANUP_OLDER_THAN_HOURS = 48; // Keep for 48 hours instead of 24
```
