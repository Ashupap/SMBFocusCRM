# Overview

This is a comprehensive CRM (Customer Relationship Management) application built with a modern full-stack architecture. The system provides sales teams with tools to manage contacts, track deals through a sales pipeline, log activities, run email campaigns, and generate reports. It's designed for small to medium businesses looking to streamline their sales processes and improve customer relationship management.

The application features a React-based frontend with a clean, professional interface using shadcn/ui components, backed by an Express.js server with PostgreSQL database integration via Drizzle ORM. Authentication is handled through Replit's OIDC system, and the application includes email functionality via SendGrid.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for fast development and optimized builds

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured error handling
- **Session Management**: Express sessions with PostgreSQL storage
- **File Structure**: Monorepo structure with shared types between client and server

## Database Architecture
- **Database**: PostgreSQL with connection pooling via Neon serverless
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Code-first approach with TypeScript schema definitions
- **Migrations**: Drizzle Kit for database migrations

## Authentication & Authorization
- **Provider**: Replit OIDC (OpenID Connect) integration
- **Strategy**: Passport.js with OpenID Connect strategy
- **Session Storage**: PostgreSQL-backed sessions with configurable TTL
- **Security**: HTTP-only cookies with secure flags in production

## Data Models
The system manages five core entities:
- **Users**: Authentication and profile information
- **Companies**: Organization/account records with industry and contact details
- **Contacts**: Individual contacts linked to companies with relationship tracking
- **Deals**: Sales opportunities with pipeline stages, values, and probability tracking
- **Activities**: Interaction logging (calls, emails, meetings, tasks, notes)
- **Email Campaigns**: Mass email functionality with recipient tracking

## UI/UX Design Patterns
- **Component Architecture**: Reusable component library with consistent design tokens
- **Layout System**: Sidebar navigation with main content area
- **Form Handling**: React Hook Form with Zod validation
- **Loading States**: Skeleton loaders and optimistic updates
- **Error Handling**: Toast notifications with user-friendly error messages

# External Dependencies

## Core Database
- **Neon PostgreSQL**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database operations and schema management

## Authentication Services
- **Replit OIDC**: Identity provider for user authentication and authorization

## Email Services
- **SendGrid**: Transactional and marketing email delivery service
- **Configuration**: API key-based authentication with fallback for development

## UI Component Libraries
- **Radix UI**: Accessible component primitives for dialogs, dropdowns, forms
- **Lucide React**: Icon library for consistent iconography
- **React Hook Form**: Form state management and validation
- **Zod**: Runtime type validation for forms and API data

## Development Tools
- **Vite**: Build tool with hot module replacement and optimized bundling
- **TypeScript**: Static type checking across the entire codebase
- **Tailwind CSS**: Utility-first CSS framework with design system integration

## Third-party Integrations
- **CSV Import**: File upload and parsing for bulk contact imports
- **Chart Libraries**: Recharts for dashboard analytics and reporting
- **Date Utilities**: date-fns for date formatting and manipulation