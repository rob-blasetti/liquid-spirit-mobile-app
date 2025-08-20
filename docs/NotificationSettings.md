# Notification Settings

This document lists the notification types exposed in the app’s Notification Settings screen, grouped as they appear in the UI, along with their backend preference keys.

Notes
- Storage: Preferences are fetched and updated via the Push Preferences service (`services/PushPreferencesService.jsx`).
- Backend endpoints: `GET/PUT /api/users/:userId/push-preferences` (fallback: `/pushPreferences`).
- Defaults: Missing keys are treated as enabled (true) by `normalizePreferences`.
- Toggle truth table: `true` → notifications enabled, `false` → disabled.

## Posts
- Key: `post_created` — New posts
- Key: `post_media` — Comments or likes on my posts

## Activities
- Key: `new_activity` — A new activity is created
- Key: `join_activity` — Someone joins an activity
- Key: `activity_updated` — An activity is updated
- Key: `activity_deleted` — An activity is deleted
- Key: `activity_completed` — An activity is completed

## Sessions
- Key: `session_created` — A new session is created
- Key: `session_reminder` — A session is coming soon
- Key: `session_cancelled` — A session is cancelled

## Events
- Key: `join_event` — Someone joins an event
- Key: `event_reminder` — Reminder for upcoming events

## Announcements
- Key: `signup` — Someone new signs up

## Behavior and UI
- Groups, labels, and switches are defined in `screens/NotificationSettings.jsx`.
- Each switch maps 1:1 to a backend key listed above.
- While preferences are loading, switches default to ON; they update when `getPushPreferences` resolves.
- Individual changes are persisted immediately with `updatePushPreferences`.
