# Repa - Class Management Platform

<div align="center">

**Your Class. Managed Beautifully.**

A modern, AI-powered platform for class representatives to seamlessly organize events, track attendance, manage timetables, and keep their class connected.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)

</div>

## ✨ Features

### For Representatives
- **Event Management** - Create, manage, and share events with poster uploads
- **Smart Reminders** - Schedule automated reminders for upcoming events
- **Live Timetables** - Post and manage live class schedules with AI-powered parsing
- **Student Directory** - Quick access to student information with intelligent search
- **Event Sharing** - Share events via native share API or copy links
- **AI Validation** - Automatic event detail validation and suggestions
- **Analytics Dashboard** - Track engagement, attendance, and event participation

### For Students
- **Event Registration** - Easy registration with fuzzy name matching
- **Public Event View** - Browse and register for upcoming events
- **Student Search** - Find roll numbers and student information quickly
- **Timetable Access** - View live class schedules

## 🚀 Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Query** - Data fetching and caching
- **Wouter** - Routing
- **shadcn/ui** - UI components
- **Lucide React** - Icons

### Backend
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Drizzle ORM** - Database ORM
- **PostgreSQL** - Database (optional, in-memory storage available)
- **Express Session** - Authentication
- **Zod** - Schema validation

### AI & Integrations
- **OpenAI GPT-4o** - Timetable parsing and AI features
- **Image Processing** - Poster uploads and management
- **Attendance Analysis Service** - Python service with PaddleOCR and Sentence-BERT for leave letter analysis
- **Razorpay** - Payment gateway integration

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Python 3.8+** (for attendance analysis service)
- **PostgreSQL** (optional - app works with in-memory storage for testing)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/francisanto/Repa.git
   cd Repa
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Create a .env file
   DATABASE_URL=postgresql://user:password@localhost:5432/repa
   SESSION_SECRET=your-secret-key-here
   PORT=5000
   
   # Attendance Analysis Service (Python)
   ATTENDANCE_SERVICE_URL=http://localhost:5001
   
   # Razorpay Payment Gateway (Test Mode)
   # Copy .env.example to .env and update with your keys
   RAZORPAY_KEY_ID=rzp_test_S80fwkNsAjSEZ6
   RAZORPAY_KEY_SECRET=O59kU61NKA7YRlkZoKrBOt33
   ```
   
   See [RAZORPAY_SETUP.md](./RAZORPAY_SETUP.md) for detailed Razorpay configuration.

4. **Database Setup** (Optional)
   ```bash
   # Push schema to database
   npm run db:push
   ```

5. **Setup Attendance Analysis Service** (Required for leave letter analysis)
   ```bash
   cd attendance-service
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python app.py
   ```
   
   See [attendance-service/README.md](./attendance-service/README.md) for detailed setup.

## 🎯 Usage

### Development Mode

1. **Start the Attendance Analysis Service** (in a separate terminal):
   ```bash
   cd attendance-service
   python app.py
   # Or use: ./start.sh (Linux/Mac) or start.bat (Windows)
   ```

2. **Start the Express.js server**:
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5000`

### Production Mode

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the server**
   ```bash
   npm start
   ```

### Storage Modes

The app supports two storage modes:

1. **In-Memory Storage** (Default)
   - No database required
   - Perfect for testing and development
   - Data resets on server restart
   - Configured in `server/storage.ts`

2. **Database Storage**
   - Requires PostgreSQL
   - Persistent data storage
   - Set `DATABASE_URL` environment variable
   - Change storage in `server/storage.ts` to `DatabaseStorage`

## 📁 Project Structure

```
Repa/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Page components
│   │   └── lib/           # Utilities
│   └── public/            # Static assets
├── server/                 # Backend Express application
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Storage abstraction
│   ├── memory-storage.ts  # In-memory storage implementation
│   └── replit_integrations/ # Integrations
├── shared/                 # Shared code between client and server
│   ├── schema.ts          # Database schema
│   └── routes.ts          # API route definitions
└── script/                 # Build scripts
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new representative
- `POST /api/auth/login` - Login representative
- `POST /api/auth/logout` - Logout
- `GET /api/auth/user` - Get current user

### Students
- `GET /api/students` - List students (with search/batch filters)
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `POST /api/students/bulk` - Bulk create students
- `POST /api/students/import-sheets` - Import from Google Sheets

### Events
- `GET /api/events` - List all events
- `GET /api/events/:id` - Get event by ID
- `POST /api/events` - Create event

### Registrations
- `POST /api/registrations` - Register for event (with fuzzy name matching)
- `GET /api/registrations` - List registrations (with optional eventId filter)

### Timetables
- `GET /api/timetables` - List all timetables
- `POST /api/timetables/upload` - Upload timetable image (AI-parsed)

### Leave Letters & Attendance Analysis
- `POST /api/leave-letters/upload` - Upload leave letter (OCR extraction)
- `POST /api/leave-letters/analyze` - Analyze multiple leave letters (clustering & anomaly detection)
- `GET /api/leave-letters` - List all leave letters
- `POST /api/attendance/upload` - Upload attendance sheet

## 🎨 Features in Detail

### Event Management
- Create events with title, description, date, location
- Upload event posters/images
- Set payment requirements and amounts
- Schedule reminders for events
- Share events via native share API
- AI-powered event validation

### Smart Student Search
- Fuzzy name matching using multiple algorithms:
  - Jaro-Winkler similarity
  - Levenshtein distance
  - Exact and partial matching
- Search by name or roll number
- Batch filtering

### AI-Powered Timetables
- Upload timetable images
- GPT-4o extracts structured data
- Interactive timetable view
- Live timetable indicators
- Class reminders

### Authentication
- Simple ID/password authentication
- Session-based auth
- Auto-login after registration
- Secure password storage (ready for bcrypt)

## 🎨 Design System

The app uses a consistent design system with:
- **Color Theme**: Blue to Cyan gradients (`primary` → `cyan-500`)
- **Typography**: Outfit (headings) + Inter (body)
- **Components**: shadcn/ui component library
- **Animations**: Framer Motion for smooth transitions
- **Responsive**: Mobile-first design

## 🧪 Testing

The app includes in-memory storage for testing without a database:

```typescript
// server/storage.ts
import { MemoryStorage } from "./memory-storage";
export const storage = new MemoryStorage();
```

All data is stored in memory and resets on server restart, making it perfect for:
- Development
- Testing
- Demos
- Quick prototyping

## 🔒 Security Notes

- **Passwords**: Currently stored in plain text for simplicity. In production, use bcrypt:
  ```typescript
  import bcrypt from "bcrypt";
  password: await bcrypt.hash(password, 10)
  ```
- **Sessions**: Use secure, random `SESSION_SECRET` in production
- **CORS**: Configure appropriately for production
- **HTTPS**: Use HTTPS in production environments

## 🚧 Development

### Type Checking
```bash
npm run check
```

### Database Migrations
```bash
npm run db:push
```

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

<div align="center">

**Built with ❤️ for class representatives**

[Report Bug](https://github.com/francisanto/Repa/issues) · [Request Feature](https://github.com/francisanto/Repa/issues)

</div>

