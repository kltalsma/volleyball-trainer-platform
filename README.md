# Volleyball Trainer Platform

A modern, fast web application for volleyball trainers to create training sessions, manage exercises, and organize teams. Built as a faster alternative to yoursportplanner.com.

## Features

- **Exercise Library** - Create and search through exercises with visual diagrams
- **Workout Builder** - Combine exercises into complete training sessions
- **Team Management** - Manage teams, players, and track attendance
- **Training Schedule** - Plan and schedule training sessions
- **Multi-sport Support** - Volleyball, beach volleyball, soccer, basketball
- **Mobile Responsive** - Works seamlessly on desktop, tablet, and mobile
- **Fast Performance** - Built with Next.js 14+ for optimal speed

## Tech Stack

- **Frontend**: Next.js 16 with React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL 16 (Docker)
- **ORM**: Prisma
- **Cache**: Redis (Docker)
- **Authentication**: NextAuth.js (planned)

## Database Schema

The platform includes comprehensive models for:
- Users & Authentication (Trainers, Players, Admins)
- Sports & Categories
- Teams & Team Members
- Exercises (with difficulty levels, categories, diagrams)
- Workouts/Training Plans
- Training Sessions & Attendance Tracking

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Git

### Installation

1. Install dependencies
```bash
npm install
```

2. Copy environment variables
```bash
cp .env.example .env.local
```

3. Start Docker containers (PostgreSQL & Redis)
```bash
docker-compose up -d
```

4. Run database migrations
```bash
DATABASE_URL="postgresql://volleyball:volleyball_dev_password@localhost:5432/volleyball_trainer" npx prisma migrate dev
```

5. Seed the database with initial data
```bash
DATABASE_URL="postgresql://volleyball:volleyball_dev_password@localhost:5432/volleyball_trainer" npx prisma db seed
```

6. Start the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:seed` - Seed database with initial data

## Docker Services

The project uses Docker Compose for local development:

- **PostgreSQL** - Database on port 5432
- **Redis** - Cache on port 6379

### Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
DATABASE_URL="postgresql://volleyball:volleyball_dev_password@localhost:5432/volleyball_trainer" npx prisma migrate dev
DATABASE_URL="postgresql://volleyball:volleyball_dev_password@localhost:5432/volleyball_trainer" npx prisma db seed
```

## Database Management

### Prisma Commands

```bash
# Create a new migration
DATABASE_URL="postgresql://volleyball:volleyball_dev_password@localhost:5432/volleyball_trainer" npx prisma migrate dev --name your_migration_name

# View database in Prisma Studio
DATABASE_URL="postgresql://volleyball:volleyball_dev_password@localhost:5432/volleyball_trainer" npx prisma studio

# Reset database
DATABASE_URL="postgresql://volleyball:volleyball_dev_password@localhost:5432/volleyball_trainer" npx prisma migrate reset

# Generate Prisma Client
npx prisma generate
```

## Project Structure

```
volleyball-trainer-platform/
├── src/
│   ├── app/              # Next.js 14+ app directory
│   ├── components/       # React components
│   └── lib/             # Utilities and helpers
├── prisma/
│   ├── schema.prisma    # Database schema
│   ├── migrations/      # Database migrations
│   └── seed.ts         # Seed data script
├── public/             # Static assets
├── docker-compose.yml  # Docker services configuration
└── .env.local         # Environment variables (not committed)
```

## Environment Variables

Required environment variables (see `.env.example`):

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `NEXTAUTH_URL` - Application URL
- `NEXTAUTH_SECRET` - Secret for NextAuth.js
- `NODE_ENV` - Environment (development/production)

## Development Roadmap

### Phase 1: Foundation ✅
- [x] Project setup with Next.js, TypeScript, Tailwind
- [x] Docker configuration for PostgreSQL and Redis
- [x] Database schema design with Prisma
- [x] Initial seed data for sports and categories

### Phase 2: Authentication (Next)
- [ ] NextAuth.js setup
- [ ] User registration and login
- [ ] Password hashing with bcrypt
- [ ] Protected routes

### Phase 3: Exercise Management
- [ ] Exercise CRUD operations
- [ ] Exercise search and filtering
- [ ] Drawing tool for exercise diagrams
- [ ] Exercise categories and tags
- [ ] Public/private exercise sharing

### Phase 4: Workout Builder
- [ ] Workout CRUD operations
- [ ] Drag-and-drop exercise ordering
- [ ] Duration and timing management
- [ ] Workout templates

### Phase 5: Team Management
- [ ] Team creation and management
- [ ] Player roster management
- [ ] Training session scheduling
- [ ] Attendance tracking

### Phase 6: Polish & Performance
- [ ] Mobile UI optimization
- [ ] Performance optimization with Redis caching
- [ ] Search optimization
- [ ] Image upload for exercises
- [ ] Video integration

## Comparison with YourSportPlanner

### Advantages of this platform:
- **Faster Performance** - Modern Next.js architecture with server-side rendering
- **Better UX** - Clean, modern interface with Tailwind CSS
- **Type Safety** - Full TypeScript implementation
- **Modern Stack** - Latest React, Next.js, and Prisma
- **Offline-first Ready** - Architecture prepared for PWA features
- **Better Mobile Experience** - Responsive design from the ground up

### Planned Features:
- Real-time collaboration
- Advanced analytics
- Video exercise demonstrations
- Custom exercise templates
- Export training plans to PDF
- Team communication features

