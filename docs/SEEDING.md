# Database Seeding (Production)

This guide explains how database seeding works in production.

## 🎉 Automatic Seeding

**The database is automatically seeded on every Railway deployment!**

When you push code:
1. Railway builds the Docker image
2. Runs database migrations (`prisma migrate deploy`)
3. **Automatically runs the seed script** (`npm run db:seed`)
4. Starts the application

The seed script is **idempotent** (safe to run multiple times):
- ✅ Users, sports, and categories use `upsert()` - won't create duplicates
- ✅ Teams and exercises are only created if the database is empty
- ✅ Existing data is preserved on re-deployment

**No manual action needed!** Just push to Railway and your database will be seeded.

## Manual Seeding (Optional)

If you need to manually seed (for testing or troubleshooting):

```bash
./scripts/seed-production.sh https://your-railway-app.railway.app
```

Replace `https://your-railway-app.railway.app` with your actual Railway URL.

## What Gets Seeded

The seed script (`prisma/seed.ts`) creates:

### 1. **Sports**
- Volleyball 🏐
- Beach Volleyball 🏖️

### 2. **Exercise Categories**
- Warm-up
- Technical
- Tactical
- Physical
- Cool-down
- Game Play

### 3. **Users**
- Admin user (kltalsma@gmail.com) with ADMIN role
- Maarten (trainer) with TRAINER role
- Multiple test players
- All with password: `password123`

### 4. **Teams**
- OPM Heerenveen teams (D2, D3, D4, etc.)
- With team members and roles (COACH, TRAINER, PLAYER)

### 5. **Exercises**
- 50+ volleyball exercises
- With categories, difficulty levels, durations
- Public and private exercises

### 6. **Training Plans (Workouts)**
- Multiple complete training sessions
- With exercises linked and ordered
- Various durations (60-120 minutes)

### 7. **Scheduled Training Sessions**
- Upcoming training sessions
- With attendance tracking
- Location and duration info

## Safety Features

The seed script uses **upsert** operations:
- ✅ Will NOT delete existing data
- ✅ Will NOT duplicate data (uses unique constraints)
- ✅ Will update existing records with same identifiers
- ✅ Safe to run multiple times

## Manual Seed via API

You can also seed via the web interface:

1. **Login as admin** to your production app
2. **Navigate to**: `https://your-app.railway.app/api/seed`
3. **Send POST request** (use Postman or curl):

```bash
curl -X POST https://your-app.railway.app/api/seed
```

## What the Seed Script Does

1. **Runs migrations** (`npx prisma migrate deploy`)
2. **Executes seed script** (`npm run db:seed`)
3. **Creates all test data** using Prisma upserts
4. **Returns success/error response**

## Expected Output

```json
{
  "success": true,
  "message": "Database migrated and seeded successfully"
}
```

## If Something Goes Wrong

If seeding fails:

1. **Check Railway logs** for detailed error messages
2. **Verify DATABASE_URL** is set in Railway environment variables
3. **Ensure migrations ran successfully** first
4. **Check Prisma schema** matches production database

### Common Issues

**"Migration not found"**
- Run migrations first: `npx prisma migrate deploy`
- Or let the seed script do it automatically

**"Unique constraint violation"**
- Data already exists - this is normal
- Seed script will skip existing records

**"Connection timeout"**
- Railway database might be sleeping
- Try again in 30 seconds

## Alternative: Manual Database Copy

If you prefer to copy your entire local database:

### Option 1: SQLite Export/Import (if using SQLite)

```bash
# On local machine - export data
sqlite3 prisma/dev.db .dump > backup.sql

# On production - import data (requires Railway CLI)
railway run sqlite3 database.db < backup.sql
```

### Option 2: PostgreSQL Export/Import (if using PostgreSQL)

```bash
# Export local database
pg_dump $LOCAL_DATABASE_URL > backup.sql

# Import to Railway (requires Railway CLI)
railway run psql $DATABASE_URL < backup.sql
```

## Verifying Seed Success

After seeding, verify by:

1. **Login to production** with admin credentials
2. **Check teams page** - should see OPM Heerenveen teams
3. **Check exercises page** - should see 50+ exercises
4. **Check workouts page** - should see training plans
5. **Check dashboard** - should see statistics

## Test Credentials

After seeding, you can login with:

- **Admin**: `kltalsma@gmail.com` / `password123`
- **Trainer**: `maarten.opm@gmail.com` / `password123`
- **Players**: Various test accounts (see seed.ts)

## Production vs Development

**Development Database** (local):
- File: `prisma/dev.db` (SQLite)
- Auto-seeded during development

**Production Database** (Railway):
- Managed PostgreSQL database
- Must be manually seeded using this script
- Separate from local data

---

**Created**: 2025-11-21  
**Location**: `docs/SEEDING.md`
