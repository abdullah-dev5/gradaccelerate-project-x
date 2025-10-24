---
title: Requirements & Features
date: 2025-09-23
---

## Core Features
- Auth: Login, register, logout, Google OAuth; `/api/v1/auth` and web routes
- Notes/Projects/Todos/Bookmarks: CRUD via API v1 and Inertia pages
- Labels: list/index for filtering
- Reminders: CRUD + trigger + email/web delivery

## Business Rules
- Auth-required for protected routes using `middleware.auth`
- Inertia pages gated client-side and server-side
- Reminder delivery honors user preferences and reminder channels
- Pusher used only when configured; otherwise skip web pushes gracefully

## Edge Cases
- Timezone handling for `remindAt` (ISO strings with offsets)
- Browser notification permission denied/unavailable
- Email provider failures should not crash scheduler
- Idempotent reminder processing (avoid double-send)

## Non-Functional
- Lint/typecheck clean CI gates
- Console logs acceptable in dev, minimized in prod
- Minimal breaking changes; prefer additive edits


