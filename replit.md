# Repa - Class Management Platform

## Overview

Repa is a modern, AI-powered platform designed for class representatives to manage their class effectively. The platform enables representatives to organize events, track attendance, manage timetables, and maintain a student directory. Students can browse public events, register for them, and access timetable information.

The application follows a full-stack TypeScript architecture with a React frontend and Express.js backend, using Drizzle ORM for database operations with PostgreSQL.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state, caching, and data fetching
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Animations**: Framer Motion for smooth UI transitions
- **Form Handling**: React Hook Form with Zod validation

The frontend lives in `client/src/` with pages in `pages/`, reusable components in `components/`, and custom hooks in `hooks/`. Path aliases are configured: `@/` maps to `client/src/`, `@shared/` maps to `shared/`.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Session Management**: Express Session with connect-pg-simple for PostgreSQL session storage
- **Storage Pattern**: Interface-based storage (`IStorage`) with two implementations:
  - `DatabaseStorage`: Uses PostgreSQL via Drizzle
  - `MemoryStorage`: In-memory fallback when no database URL is set

The backend lives in `server/` with routes defined in `routes.ts`, database connection in `db.ts`, and storage abstraction in `storage.ts`.

### Shared Code
Located in `shared/`, contains:
- `schema.ts`: Drizzle table definitions and Zod validation schemas
- `routes.ts`: API contract definitions with typed request/response schemas
- `models/`: Auth and chat model definitions

### Authentication System
Custom authentication using representative ID and password (not Replit Auth). Sessions stored in PostgreSQL. Auth state managed client-side via React Query.

### Key Data Models
- **Students**: Name, roll number, email, phone, batch
- **Events**: Title, description, date, location, payment info, poster, reminders
- **Registrations**: Links students to events with payment status
- **Timetables**: Batch-based schedules with AI-powered parsing
- **Representatives**: Authentication credentials for class reps

### AI Integrations
Located in `server/replit_integrations/`:
- **Chat**: OpenAI-powered chat functionality
- **Audio**: Voice recording, text-to-speech, speech-to-text
- **Image**: Image generation via OpenAI
- **Batch**: Rate-limited batch processing utilities

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database operations
- **connect-pg-simple**: Session storage in PostgreSQL

### AI Services
- **OpenAI API**: Used via Replit AI Integrations for:
  - Chat completions
  - Image generation (gpt-image-1)
  - Speech-to-text and text-to-speech
- Environment variables: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`

### Payment Integration
- **Razorpay**: Payment gateway integration (frontend component exists, backend order creation endpoint)
- Environment variables: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`

### Frontend Libraries
- **react-confetti**: Celebration effects on successful payments
- **date-fns**: Date formatting and manipulation
- **Lucide React**: Icon library
- **cmdk**: Command menu component

### Build & Development
- **Vite**: Development server and production bundler
- **esbuild**: Server-side bundling for production
- **tsx**: TypeScript execution for development

### Scripts
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run db:push`: Push schema changes to database