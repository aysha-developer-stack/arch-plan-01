# ArchPlan - Full Stack Application

This project has been restructured into separate frontend and backend folders for better organization and development workflow.

## Project Structure

```
ArchPlan/
├── frontend/           # React + Vite frontend application
│   ├── client/        # React source code
│   ├── package.json   # Frontend dependencies
│   ├── vite.config.ts # Vite configuration
│   ├── tailwind.config.ts
│   └── ...
├── backend/           # Express.js backend application
│   ├── server/        # Server source code
│   ├── shared/        # Shared utilities
│   ├── package.json   # Backend dependencies
│   ├── drizzle.config.ts
│   └── ...
└── README.md
```

## Development Setup

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```
The frontend will run on `http://localhost:3001`

### Backend Development
```bash
cd backend
npm install
npm run dev
```
The backend will run on `http://localhost:3001` (or PORT from environment)

## Production Build

### Build Frontend
```bash
cd frontend
npm run build
```
This builds the frontend and outputs to `../backend/dist/public/`

### Build & Start Backend
```bash
cd backend
npm run build
npm start
```

## Key Features

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **Backend**: Express.js + TypeScript + MongoDB + Authentication
- **Shared**: Common utilities and types between frontend and backend
- **Production Ready**: Optimized builds and Railway deployment support

## Environment Variables

Make sure to set up your environment variables in the backend folder:
- Copy `.env.example` to `.env` in the backend directory
- Configure your MongoDB connection and other required variables

## Scripts

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Backend Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:push` - Push database schema changes
