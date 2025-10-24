---
title: User Flow & Project Structure
date: 2025-09-23
---

## User Journeys
1) Authenticate → Dashboard → Manage Notes/Projects/Todos/Bookmarks
2) Create Reminder → Scheduler processes → Web/Email notification

## Data Flow
- Inertia serves pages; API v1 handles CRUD
- Controllers validate and call Services; Services use Models
- Realtime via Pusher private `private-user.{id}` channels

## Project Structure (high level)
- `app/controllers` — route handlers
- `app/models` — Lucid models
- `app/services` — domain logic (email, reminders)
- `app/middleware` — auth/guest/etc
- `start/*` — routes, kernel, scheduler
- `inertia/*` — React app, pages, services, hooks


