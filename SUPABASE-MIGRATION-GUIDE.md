# ArchPlan Supabase Migration Guide

This document outlines the migration from MongoDB to Supabase for the ArchPlan application.

## Overview

The ArchPlan application has been migrated from MongoDB to Supabase for the following reasons:

1. **Simplified Authentication**: Supabase provides built-in authentication with JWT tokens, eliminating the need for custom JWT implementation.
2. **SQL Database**: Supabase uses PostgreSQL, providing robust relational database capabilities.
3. **File Storage**: Supabase offers integrated file storage, replacing the need for GridFS.
4. **Real-time Capabilities**: Supabase provides real-time subscriptions for data changes.

## Environment Variables

The following environment variables need to be set for the application to work with Supabase:

```
SUPABASE_URL=https://your-supabase-project-url.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Database Setup

The database schema has been defined in `supabase-setup.sql`. This script creates the necessary tables, indexes, and functions for the application to work with Supabase.

To set up the database:

1. Create a new Supabase project
2. Run the SQL script in the Supabase SQL editor
3. Configure the Row Level Security (RLS) policies for the tables

## Authentication

Authentication has been migrated from custom JWT implementation to Supabase Auth:

- **Sign Up**: Uses `supabase.auth.signUp`
- **Sign In**: Uses `supabase.auth.signInWithPassword`
- **Sign Out**: Uses `supabase.auth.signOut`
- **Token Verification**: Uses `supabase.auth.getUser`

## API Changes

The API endpoints have been updated to work with Supabase:

- **User Routes**: Updated to use Supabase Auth and the `app_users` table
- **Admin Routes**: Updated to use Supabase for user management
- **Plan Routes**: Updated to use Supabase for plan management

## Client-Side Changes

The client-side code needs to be updated to work with Supabase:

1. Install the Supabase client: `npm install @supabase/supabase-js`
2. Initialize the Supabase client with the URL and anon key
3. Update authentication flows to use Supabase Auth
4. Update data fetching to use Supabase queries

## Testing

After migration, test the following functionality:

1. User registration and login
2. User profile retrieval
3. Admin user management
4. Plan creation, retrieval, and search

## Troubleshooting

If you encounter issues with the migration:

1. Check that the environment variables are set correctly
2. Verify that the database tables have been created
3. Check the Supabase dashboard for any errors
4. Review the server logs for detailed error messages