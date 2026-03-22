# KBM Construct – Copilot Instructions

## Project Overview
KBM Construct is a full-featured construction business management system built with **Next.js 16 (App Router)**, **TypeScript**, and **Tailwind CSS**. It targets civils contractors and includes modules for estimating, BOQ, projects, HR, fleet, procurement, and compliance.

## Tech Stack
- **Framework**: Next.js 16 + App Router
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS with CSS variables for theming
- **Email/Calendar**: Microsoft Graph API (Microsoft 365)
- **Persistence**: localStorage (client), JSON files via API routes (server)

## Key Architectural Patterns
- All pages live under `src/app/(app)/`
- Shared components in `src/components/`
- Business logic/stores in `src/lib/`
- API routes under `src/app/api/`
- Sample data in `src/lib/sample-data.ts` and `src/lib/operations-data.ts`
- CSS variables defined in `src/app/globals.css`

## Email & Correspondence
- Mail client at `/mail` – three-pane M365 email interface
- Email-to-record linking via `src/lib/email-links.ts` (localStorage + server sync to `/data/email-links.json`)
- API: `src/app/api/email-links/route.ts` (GET/POST/DELETE/PUT)
- Supported record types: `project | estimate | client | supplier | invoice | purchase-order`
- Compose & link: pre-associate outgoing email with a record; auto-links after send
- `CorrespondencePanel` component renders linked emails on any record page

## Calendar Linking
- Calendar event ↔ project linking via `src/lib/calendar-links.ts`
- API: `src/app/api/calendar-links/route.ts`
- Each project detail page has a Calendar tab to create + view linked meetings

## Projects Kanban
- Five columns: Mobilizing, Planned, Active, In Review, Completed
- Cards show email badge (📧 count) linking to filtered mail view when emails are linked
- `emailLinkCounts` state computed from `getEmailLinksFromStorage()` on mount/focus/storage events

## Development Guidelines
- Use `'use client'` on interactive components; prefer server components for static pages
- Follow existing naming conventions (camelCase functions, PascalCase components)
- Keep sample data in `src/lib/` stores; don't hardcode in page components
- Run `npm run build` to validate before committing
