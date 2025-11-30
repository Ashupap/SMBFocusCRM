# Overview

This is a comprehensive CRM (Customer Relationship Management) application built with a modern full-stack architecture. The system provides sales teams with tools to manage contacts, track deals through a sales pipeline, log activities, run email campaigns, and generate reports. It's designed for small to medium businesses looking to streamline their sales processes and improve customer relationship management.

The application features a React-based frontend with a clean, professional interface using shadcn/ui components, backed by an Express.js server with PostgreSQL database integration via Drizzle ORM. Authentication is handled through a custom JWT-based system with basic security features and extensible architecture, and the application includes email functionality via SendGrid.

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
- **Token Management**: JWT-based stateless authentication
- **File Structure**: Monorepo structure with shared types between client and server
- **Service Layer**: Domain-specific services under `server/services/`:
  - `AuthService`: User operations, authentication, tokens, audit logging
  - `CrmService`: Companies, contacts, deals, pipeline stages
  - `ActivityService`: Activity tracking with contact/deal relations
  - `MarketingService`: Email campaigns, templates, sequences, enrollments
  - `ApprovalService`: Approval workflows, requests, and actions (uses db.transaction for atomicity)
  - `DashboardService`: Metrics, widgets, lead scores, forecasts, analytics
  - `IntegrationService`: API keys, calendar events, synced emails
  - `StorageFacade`: Backward-compatible facade delegating to all services

## Database Architecture
- **Database**: PostgreSQL with connection pooling via Neon serverless
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Code-first approach with TypeScript schema definitions
- **Migrations**: Drizzle Kit for database migrations

## Authentication & Authorization
- **Provider**: Custom JWT (JSON Web Token) authentication system
- **Strategy**: JWT-based authentication with access and refresh tokens
- **Token Storage**: Access tokens and refresh tokens (configurable expiry)
- **Security**: Argon2 password hashing, refresh token rotation, audit logging (implemented), with schema support for account lockout and rate limiting

## Data Models
The system manages the following core entities:
- **Users**: Authentication and profile information with role-based access control
- **Companies**: Organization/account records with industry and contact details
- **Contacts**: Individual contacts linked to companies with relationship tracking
- **Deals**: Sales opportunities with pipeline stages, values, and probability tracking
- **Activities**: Interaction logging (calls, emails, meetings, tasks, notes)
- **Email Campaigns**: Mass email functionality with recipient tracking
- **Email Templates & Sequences**: Reusable email templates and automated email sequences
- **Approval Workflows**: Multi-level approval routing for deal approvals and business processes
- **Dashboard Widgets**: Customizable dashboard with drag-and-drop widgets
- **API Keys**: Secure API key management for external integrations
- **Scheduled Exports**: Automated data exports with email delivery
- **Pipeline Metrics**: Advanced analytics for pipeline conversion and performance tracking

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
- **Custom JWT System**: Self-managed authentication with basic security features and extensible architecture

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
- **Data Import/Export**: 
  - CSV and Excel (.xlsx) file upload and parsing
  - Advanced column mapping for contacts, companies, and deals
  - Scheduled exports with automated email delivery
  - PapaParse for CSV processing
  - XLSX library for Excel file handling
- **Chart Libraries**: Recharts for dashboard analytics and reporting
- **Date Utilities**: date-fns for date formatting and manipulation
- **File Upload**: Multer for handling file uploads
- **API Documentation**: Swagger/OpenAPI for comprehensive REST API documentation

# Advanced Features

## AI-Powered Automation
- **Lead Scoring**: AI-based lead qualification and priority scoring
- **Sales Forecasting**: Predictive analytics for revenue forecasting
- **Smart Recommendations**: Automated next-best-action suggestions
- **Email Generation**: AI-powered email template generation using OpenAI

## Email Marketing
- **Email Templates**: Reusable email templates with variable support
- **Email Sequences**: Automated multi-step email campaigns
- **Sequence Enrollment**: Track contacts through email sequences
- **Campaign Analytics**: Track email opens, clicks, and engagement

## Approval Workflows
- **Multi-Level Routing**: Configure approval workflows with multiple steps
- **Deal Approvals**: Approval routing for high-value deals
- **Workflow Steps**: Define sequential or parallel approval steps
- **Action Tracking**: Complete audit trail of approval decisions

## Custom Dashboards
- **Widget Builder**: Drag-and-drop dashboard customization
- **Widget Types**: Metric cards, charts, tables, pipeline views, activity feeds, forecasts
- **Personalization**: Save custom layouts per user
- **Real-time Updates**: Live data refresh in dashboard widgets

## Advanced Pipeline Analytics
- **Conversion Rates**: Stage-by-stage conversion analysis
- **Pipeline Velocity**: Track average time in each pipeline stage
- **Bottleneck Detection**: Identify pipeline stages requiring attention
- **Win/Loss Analysis**: Analyze deal outcomes and patterns
- **Team Performance**: Sales leaderboards and performance metrics
- **Time-based Filtering**: Analyze data by custom time periods

## Data Management
- **Excel Import**: Support for .xlsx file imports with preview
- **Advanced Mapping**: Column-to-field mapping with validation
- **Bulk Operations**: Import thousands of records efficiently
- **Export Automation**: Schedule recurring exports via email
- **Multiple Formats**: Export to CSV and Excel formats

## API & Integrations
- **REST API**: Comprehensive RESTful API for all CRM operations
- **API Documentation**: Interactive Swagger/OpenAPI documentation at /api-docs
- **API Key Management**: Secure key generation with expiration and revocation
- **Webhook Support**: Real-time event notifications (schema prepared)
- **Rate Limiting**: Built-in rate limiting for API security