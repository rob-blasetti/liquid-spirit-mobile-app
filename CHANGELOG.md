# Changelog

## 2.2.0

Changes since `2.1.1` (`a0b1e6a`).

### Highlights

- Reworked Activity Detail and Event Detail into clearer, more reusable section-based layouts.
- Added shared modal infrastructure for user-body views and full-screen map previews.
- Improved profile, public profile, and home featured experiences for consistency.
- Expanded account management flows with stronger password and passkey handling.

### Added

- Full-screen map preview screen with bottom-up presentation for detail-card maps.
- Shared `DetailSection` wrapper for consistent section headers, spacing, and dividers across Activity, Event, and Post detail screens.
- Shared `UserBodyModal` for Local Spiritual Assembly and other oversight-body member lists.
- Activity Detail empty-state action to create the next session when none exists.
- Settings flows for password and passkey account management.

### Changed

- Activity Detail
- Activity details card now shows richer next-session messaging, improved session actions, and clearer spacing around upcoming sessions.
- Upcoming session cards and people modals now use shared `UserBadgeCell` styling and more consistent section layouts.
- Activity location and curriculum sections now use the shared detail-section pattern.

- Event Detail
- Host Address / Where is it, Attendees, Hosts, Materials, and Oversight Body sections were restyled for clarity and consistency.
- Attendees now use `UserBadgeCell` presentation, optimistic join updates, and a full attendee modal when lists grow.
- Oversight Body now supports shared user-body modal presentation, including Local Spiritual Assembly handling and community chip context.
- Event and activity map sections now share the same expand-to-fullscreen behavior.

- Profile and Home
- Profile and public profile now share hero and recent-badges components for closer visual consistency.
- Local Spiritual Assembly presentation on Home now uses the shared user-body modal pattern.
- Home loading behavior was refined.

- Navigation and auth
- Login reset behavior was tightened after authentication.
- Verification, passkey layout, and password validation flows were improved.
- Change-password requests now use the updated backend endpoint.

### Fixed

- Tooltip sizing in detail-card section headers no longer clips longer help text.
- Passkey and password account flows have more stable validation and layout behavior.
- Public/profile hero layout and recent badge presentation were tightened.
- Activity and event detail empty states now present clearer guidance instead of dropping content entirely.

### Internal

- Continued consolidation of repeated modal and section UI into shared components.
- Additional home/iOS polish and supporting app-shell cleanup landed alongside the feature work above.
