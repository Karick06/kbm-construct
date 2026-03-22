# KBM Construct Business Management System

## Overview
A comprehensive construction business management system with specialized modules for civils contractors:

### Core Features
- **Dashboard and Analytics**: Real-time business insights
- **CRM and Client Relationships**: Client and prospect management
- **Projects and Tasks**: Project tracking and task management
- **Invoicing and Documents**: Invoice generation and document management
- **Team and Reports**: Team management and reporting
- **Settings and Workspace**: Company settings and configuration

### Construction-Specific Features
- **📋 BOQ System**: Bill of Quantities creation and management
- **💰 Estimating**: Comprehensive estimating with rate breakdowns
- **🏗️ Civils Rate Builder**: SMM7, CESSM4, MCHW compliant rate templates
- **📦 Materials Database**: Centralized materials management with pricing
- **👷 Labour & Plant Libraries**: Rate libraries for resources
- **📊 Timesheet & Geofencing**: Location-based time tracking
- **🔗 Sage Integration**: Accounting software integration
- **🔗 Sage Integration**: Accounting software integration
- **📧 Email Correspondence**: Microsoft 365 email client with project/record linking
- **📅 Calendar Integration**: Meeting and event linking per project

## Key Documentation

- **[BOQ System Guide](BOQ_SYSTEM.md)** - Bill of Quantities features and usage
- **[BOQ Quick Start](BOQ_QUICK_START.md)** - Getting started with BOQ
- **[Materials Database](MATERIALS_DATABASE.md)** - Centralized materials management ⭐ NEW
- **[SharePoint Integration](SHAREPOINT_INTEGRATION.md)** - Microsoft SharePoint file storage ⭐ NEW
- **[Sage Integration](SAGE_INTEGRATION.md)** - Accounting integration
- **[Timesheet Geofencing](TIMESHEET_GEOFENCING.md)** - Location tracking
- **[Timesheet Geofencing](TIMESHEET_GEOFENCING.md)** - Location tracking

## Email & Calendar Linking

The system includes a full Microsoft 365 email client (`/mail`) with:
- **Record linking**: Link emails to projects, estimates, clients, suppliers, invoices, and purchase orders
- **Compose & link**: Pre-associate an outgoing email with a record before sending; the sent email is auto-linked
- **Correspondence timeline**: Each project has a dedicated Correspondence tab showing all linked emails  
- **Email badges**: Kanban project cards show 📧 counts linking directly to filtered mail view
- **Server persistence**: Email links saved to `/data/email-links.json` via `/api/email-links` (shared across users)
- **Calendar events**: Each project has a Calendar tab to create and view linked meetings (via Microsoft Graph)
- **Thread-level linking**: Link or inherit links across the same email conversation
- **Auto-link rules**: Create sender/domain-based rules for inbound correspondence
- **Shared mailbox support**: Switch between personal and configured shared inboxes in the mail page
- **Tasks from email**: Turn a linked email into a task visible in the Tasks board
- **Attachment saving**: Save email attachments against linked records
- **Approval queue**: Route invoice and purchase-order correspondence into `/approvals`
- **Audit trail**: Mail actions are logged for traceability
## Tech Stack
- Next.js App Router
- TypeScript
- Tailwind CSS

## Getting Started
```bash
npm install
npm run dev
```

Open the app at `http://localhost:3000`.

## Scripts
```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Notes
This scaffold ships with sample data and UI-only flows. Replace the sample data with real services and a database when ready.
