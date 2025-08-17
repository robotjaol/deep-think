# Deep-Think Supabase Setup

This directory contains the database schema, migrations, and configuration for the Deep-Think crisis decision training platform.

## Prerequisites

1. Install the Supabase CLI:

   ```bash
   npm install -g supabase
   ```

2. Create a Supabase project at [supabase.com](https://supabase.com)

3. Set up your environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Local Development Setup

1. Initialize Supabase locally:

   ```bash
   supabase init
   ```

2. Start the local Supabase stack:

   ```bash
   supabase start
   ```

3. Run the migrations:

   ```bash
   supabase db reset
   ```

4. (Optional) Load seed data:
   ```bash
   supabase db reset --with-seed
   ```

## Production Deployment

1. Link your local project to your Supabase project:

   ```bash
   supabase link --project-ref your-project-ref
   ```

2. Push migrations to production:

   ```bash
   supabase db push
   ```

3. (Optional) Load seed data in production:
   ```bash
   supabase db reset --db-url "your-production-db-url" --with-seed
   ```

## Database Schema

### Tables

- **users**: User account information (extends Supabase auth.users)
- **user_profiles**: User preferences and training statistics
- **scenarios**: Crisis scenario configurations and metadata
- **training_sessions**: Individual training session records
- **decisions**: User decisions made during training sessions
- **learning_resources**: Curated learning materials and resources

### Security

All tables have Row Level Security (RLS) enabled with policies that ensure:

- Users can only access their own data
- Scenarios are publicly readable but only editable by creators
- Learning resources are publicly readable by authenticated users
- Training sessions and decisions are private to each user

### Functions

- `handle_new_user()`: Automatically creates user profile when user signs up
- `update_user_stats()`: Updates user statistics after completing a scenario
- `get_user_training_stats()`: Retrieves comprehensive user training statistics
- `get_scenario_stats()`: Retrieves scenario usage and performance statistics

## Auth Configuration

The platform uses Supabase Auth with the following settings:

- Email/password authentication enabled
- Email confirmations disabled for development (enable in production)
- JWT tokens expire after 1 hour
- Refresh token rotation enabled
- New user signups enabled

## Monitoring and Maintenance

1. Monitor database performance through the Supabase dashboard
2. Review RLS policies regularly for security
3. Update seed data as new scenarios are developed
4. Backup database regularly in production

## Troubleshooting

### Common Issues

1. **Migration fails**: Check that all dependencies are installed and Supabase CLI is up to date
2. **RLS policies blocking access**: Verify that `auth.uid()` matches the user ID in your application
3. **Seed data not loading**: Ensure the seed.sql file is in the correct location and syntax is valid

### Useful Commands

```bash
# Check migration status
supabase migration list

# Create a new migration
supabase migration new migration_name

# Reset local database
supabase db reset

# View local database
supabase db diff

# Generate TypeScript types
supabase gen types typescript --local > types/supabase.ts
```
