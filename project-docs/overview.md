---
title: Project Overview
date: 2025-09-23
---

## Vision
Provide a personal productivity suite (notes, todos, bookmarks, reminders) with real-time notifications and OAuth login, built on AdonisJS 6, Inertia, and React 19 with TypeScript.

## Objectives
- Unified UX via Inertia (SSR + CSR) and shared auth session
- Reliable reminder delivery (web + email) with scheduler
- Clean domain separation (controllers, services, models, validators)
- Strong typing, linting, and tests

## High-Level Architecture
- Backend: AdonisJS (routing, auth, sessions, Lucid ORM, validators)
- Frontend: Inertia React pages/components, context providers
- Realtime: Pusher (private user channels)
- Email: Nodemailer/Sendgrid via `app/services/email_service.ts`
- Scheduler: `start/scheduler.ts` processes due reminders
- DB: SQLite (Lucid migrations, seeders)

## Current Modules
- Notes, Projects, Todos, Bookmarks (CRUD)
- Auth (email/password + Google OAuth)
- Reminders (create, process, notify)

## Non-Goals (for now)
- Multi-tenant orgs, advanced RBAC UI, offline mode


