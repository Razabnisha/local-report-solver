# Medicine Reminder System

## Overview
Build a self-contained medicine reminder module inside the current project. Each signed-in user manages their own medications, schedules, and dose history.

## Defaults chosen (questions were skipped)
- **Scope:** New module in the existing project (separate landing page at `/reminders`).
- **Reminder channel:** In-app notifications only (no external SMS/email providers needed).
- **Users:** Single patient user; each user sees only their own medications.
- **Schedule:** Daily fixed times, plus optional start/end dates and dosage notes.

## Database changes
Add three tables:
1. **medications** — name, dosage, instructions, start_date, end_date, user_id.
2. **reminder_times** — linked to medications, time of day (HH:MM), days of week bitmask.
3. **dose_logs** — linked to medication + scheduled date/time, status (`taken`/`skipped`/`missed`), taken_at.

RLS: users manage only their own rows; service_role retained for admin/maintenance.
Triggers: update `updated_at`.

## Pages/routes
- `/reminders` — dashboard: today's schedule, adherence summary, next 7-day overview.
- `/reminders/new` — add medication + schedule times.
- `/reminders/$id` — medication detail and history.
- `/reminders/$id/edit` — edit medication and schedule.
- Navbar link to Reminders for signed-in users.

## Core UI components
- `MedicationForm` — name, dosage, instructions, start/end dates, daily time picker with +/- buttons.
- `TodaySchedule` — list of today's scheduled doses with Take/Skip actions.
- `AdherenceSummary` — simple percentage + streak.
- `ReminderCard` — compact medication card.

## Reminder logic
- Derive today's schedule from `reminder_times` joined to active `medications`.
- Use a lightweight periodic check (every 60 s via `setInterval` behind a hydration-safe guard) to surface "due now" in-app alerts as toast messages.
- Marking a dose updates `dose_logs`; missing is computed at query time (past scheduled time + no log).

## Notes
- Preserves the existing Local Report Hub routes and data.
- Uses the current design tokens, `AuthProvider`, and Supabase client patterns.
