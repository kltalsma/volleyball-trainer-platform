# Deployment Guide - Volleyball Trainer Platform

This guide covers deploying your volleyball trainer platform for testing with coaches and trainers.

## Option 1: Self-Hosting on Sirius Server (Recommended)

### Prerequisites
- Docker and Docker Compose installed on Sirius server
- Domain name or public IP access
- SSL certificate (Let's Encrypt recommended)

### Steps

1. **Clone the repository** on your Sirius server:
   ```bash
   git clone <your-repo-url>
   cd volleyball-trainer-platform
   ```

2. **Create production environment file**:
   ```bash
   cp .env.production.template .env.production.local
   ```
   
   Edit `.env.production.local`:
   ```env
   DATABASE_URL="postgresql://volleyball:volleyball_secure_password@postgres:5432/volleyball_trainer"
   NEXTAUTH_URL="https://your-domain.com"
   NEXTAUTH_SECRET="your-super-secret-jwt-secret-here"
   ```

3. **Deploy with Docker**:
   ```bash
   # For production deployment
   docker-compose --profile production up -d
   
   # Check logs
   docker-compose logs -f app
   ```

4. **Run database migrations**:
   ```bash
   docker-compose exec app npx prisma migrate deploy
   docker-compose exec app npx prisma db seed
   ```

5. **Set up reverse proxy** (nginx example):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       return 301 https://$server_name$request_uri;
   }
   
   server {
       listen 443 ssl;
       server_name your-domain.com;
       
       ssl_certificate /path/to/certificate.crt;
       ssl_certificate_key /path/to/private.key;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## Option 2: Free Hosting on Vercel

### Prerequisites
- Vercel account (free tier)
- PostgreSQL database (Supabase/Neon/PlanetScale free tier)

### Steps

1. **Set up database** (using Supabase as example):
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Get connection string from Settings > Database

2. **Deploy to Vercel**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login and deploy
   vercel login
   vercel --prod
   ```

3. **Configure environment variables** in Vercel dashboard:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NEXTAUTH_URL`: Your Vercel app URL
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`

4. **Run migrations**:
   ```bash
   # From your local machine
   npx prisma migrate deploy --schema=./prisma/schema.prisma
   npx prisma db seed
   ```

---

## Option 3: Railway (Alternative Free Hosting)

1. **Connect GitHub repo** to Railway
2. **Add PostgreSQL service**
3. **Set environment variables**:
   - `DATABASE_URL`: Railway provides this automatically
   - `NEXTAUTH_URL`: Your Railway app URL
   - `NEXTAUTH_SECRET`: Generate secure secret

---

## Creating Test Users

### Option A: Admin Panel (if you're ADMIN)
1. Login as admin
2. Go to Teams > Add members
3. Add coaches/trainers with email addresses

### Option B: Database Direct
```sql
-- Create a coach user
INSERT INTO "User" (id, email, name, password, role) 
VALUES 
  (gen_random_uuid(), 'coach@example.com', 'Test Coach', '$2a$10$...', 'TRAINER');
```

### Option C: Registration Links
Send coaches the registration URL: `https://your-domain.com/register`

---

## Test Data

Your app already includes:
- ✅ **45 exercises** from 3 coaches (mix of public/private)
- ✅ **462 training sessions** (full season schedule)
- ✅ **11 teams** with realistic data
- ✅ **4,410 attendance records**

---

## Monitoring & Maintenance

### Docker Deployment
```bash
# View logs
docker-compose logs -f

# Update application
git pull
docker-compose build app
docker-compose --profile production up -d

# Backup database
docker-compose exec postgres pg_dump -U volleyball volleyball_trainer > backup.sql
```

### Vercel Deployment
- Automatic deployments on git push
- Monitor via Vercel dashboard
- View logs in Vercel Functions tab

---

## Invitation Email Template

```
Subject: Test the New Volleyball Training Platform

Hi [Coach Name],

You're invited to test our new volleyball training platform! 

🏐 **Features:**
- Create and manage training sessions
- Track player attendance  
- Exercise library with drills
- Team management tools

🔗 **Access:** https://your-domain.com
📧 **Register with:** your-email@domain.com

This is a test environment with sample data. Feel free to explore all features and provide feedback!

Best regards,
[Your Name]
```

---

## Next Steps

1. Choose your deployment option
2. Follow the setup steps
3. Test the deployment yourself
4. Create accounts for coaches
5. Send invitation emails
6. Gather feedback for improvements

Need help? Check the logs or contact [your-contact].