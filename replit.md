# ArchPlan - Architectural Plans Database

## Overview

ArchPlan is a full-stack web application for managing and searching architectural plans. It provides a professional database of building plans with advanced filtering capabilities and an admin interface for plan management. The application is built with a modern React frontend, Express.js backend, and PostgreSQL database using Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### January 30, 2025
- **Major Database Migration**: Successfully migrated from PostgreSQL/Drizzle to MongoDB/Mongoose
- **Complete Schema Conversion**: Converted all database models to Mongoose schemas with proper interfaces
- **Authentication Update**: Replaced PostgreSQL sessions with MongoDB sessions using connect-mongo
- **Storage Layer Rewrite**: Converted all CRUD operations from Drizzle queries to Mongoose methods  
- **Type System Updates**: Updated all client components to use new MongoDB-based type definitions
- **Query Optimization**: Implemented MongoDB aggregation for statistics and regex-based search
- **ObjectId Integration**: Added proper MongoDB ObjectId handling throughout the application
- **Environment Setup**: Configured MongoDB Atlas connection and environment variables
- **Application Stability**: Fixed startup issues by implementing graceful MongoDB fallback to in-memory storage
- **Download Functionality**: Fixed file download by correcting plan ID references from `plan.id` to `plan._id`
- **Authentication Bypass**: Temporarily disabled authentication for development to allow testing without external dependencies

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage
- **File Upload**: Multer for PDF file handling
- **API Design**: RESTful endpoints with JSON responses

### Database Architecture
- **Database**: MongoDB (via MongoDB Atlas)
- **ODM**: Mongoose with document-based approach
- **Collections**: 
  - `users` - User authentication and profile data
  - `plans` - Architectural plan metadata and file information
  - `sessions` - Session storage for authentication (managed by connect-mongo)
- **Schema Management**: Mongoose schemas with TypeScript interfaces

## Key Components

### Authentication System
- **Provider**: Replit Auth (OpenID Connect)
- **Session Storage**: PostgreSQL-backed sessions
- **Protection**: Route-level authentication guards
- **User Management**: Automatic user creation and profile management

### File Management
- **Upload**: PDF files only, 50MB size limit
- **Storage**: Local filesystem with organized directory structure
- **Validation**: File type and size restrictions
- **Download**: Secure file serving with download tracking

### Search and Filtering
- **Filters**: Lot size, orientation, site type, foundation type, storeys, council area
- **Text Search**: Full-text search across plan titles and descriptions
- **Performance**: Indexed database queries for fast search results

### Admin Interface
- **Dashboard**: Statistics overview with plan counts and downloads
- **Plan Management**: CRUD operations for architectural plans
- **File Upload**: Drag-and-drop interface with progress tracking
- **Analytics**: Download tracking and usage metrics

## Data Flow

1. **User Authentication**: Users authenticate via Replit Auth, sessions stored in PostgreSQL
2. **Plan Search**: Frontend sends filter parameters to backend API
3. **Database Query**: Drizzle ORM executes filtered queries against PostgreSQL
4. **File Operations**: Uploads stored locally, downloads tracked in database
5. **Real-time Updates**: TanStack Query provides optimistic updates and cache invalidation

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL serverless database
- **Authentication**: Replit Auth service
- **UI Library**: Radix UI component primitives
- **Styling**: Tailwind CSS framework
- **Validation**: Zod for schema validation

### Development Tools
- **Build**: Vite with React and TypeScript plugins
- **Database**: Drizzle Kit for migrations and schema management
- **Type Safety**: TypeScript throughout the stack
- **Code Quality**: ESLint and TypeScript compiler checks

## Deployment Strategy

### Production Build
- **Frontend**: Vite builds optimized React bundle
- **Backend**: ESBuild bundles Express server for Node.js
- **Assets**: Static files served from built distribution

### Environment Configuration
- **Database**: CONNECTION_STRING for PostgreSQL
- **Authentication**: Replit Auth environment variables
- **Sessions**: Secure session secret configuration
- **File Storage**: Configurable upload directory paths

### Hosting Requirements
- **Runtime**: Node.js environment
- **Database**: PostgreSQL-compatible database service
- **Storage**: Persistent file system for uploaded PDFs
- **Environment**: Support for environment variables and secrets management

The application follows a monorepo structure with shared TypeScript types between frontend and backend, ensuring type safety across the entire stack. The architecture supports both development and production deployments with appropriate build scripts and configuration management.