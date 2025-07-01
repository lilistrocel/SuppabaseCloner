# Supabase Data Cloner

A tool to clone data from one Supabase instance to another.

## Setup

1. Make sure you have Node.js installed on your system
2. Install dependencies:
   ```
   npm install
   ```

## Configuration

- The Supabase URLs and API keys are configured in `supabase-config.js`
- Tables to clone are listed in `supabase_tables.txt`
- Views to clone are listed in `supabase_views.txt`

## Testing Connection

Before cloning all data, it's recommended to test your connection and permissions:

```
npm test
```

This will:
1. Test connectivity to both Supabase instances
2. Attempt to read from the source
3. Attempt to write a test record to the destination
4. Clean up the test record

## Running the Cloner

```
npm start
```

## Features

- **Pagination**: Processes data in small batches to avoid timeouts
- **Retry Logic**: Automatically retries failed operations with exponential backoff
- **Error Resilience**: Continues processing even if individual tables or records fail
- **Progress Reporting**: Shows detailed progress during cloning
- **Small Batch Inserts**: Breaks large datasets into manageable chunks

## Notes

- Uses the source anon key for reading data and the destination service key for writing data
- Views are handled by creating tables with the same data in the destination database
- For extremely large tables, you may need to adjust the `PAGE_SIZE` and `CHUNK_SIZE` values in the script

## Troubleshooting

If you encounter issues with the improved script, you can try the legacy version:

```
npm run start:legacy
```

### Common Issues

- **Fetch Failed Error**: This is typically a network connectivity issue. The improved script handles this with retries.
- **Permission Denied**: Make sure your source anon key has read access and your destination service key has write access.
- **Rate Limiting**: If you hit rate limits, the script will automatically retry with backoff. 