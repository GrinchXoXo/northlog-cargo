# Phase 03 — Administrator Operations Dashboard

## Logistics Shipment Tracking Platform

**Version:** 1.0  
**Status:** Ready for implementation  
**Parent Document:** `MASTER-PRD.md`  
**Previous Phase:** Phase 2 — Backend & Database  
**Next Phase:** Phase 4 — Telegram / Operational Automation

---

# 1. Purpose

Phase 3 introduces the internal administrator dashboard used by the logistics company to manage shipments and update operational tracking information.

The dashboard is intentionally lightweight.

This is a small logistics operation with a limited number of administrators. The goal is not to build a large logistics management system.

The goal is to provide administrators with a fast interface for:

- Creating shipments
- Finding shipments
- Updating shipment status
- Updating shipment location
- Managing tracking events
- Setting estimated delivery
- Managing customs-clearance states
- Uploading shipment images
- Managing customer-facing action messages

Every change made through the dashboard should be reflected on the public tracking page.

---

# 2. Core Workflow

The primary operational workflow is:

```text
Shipment arrives at logistics company
        ↓
Administrator creates shipment
        ↓
System generates tracking ID
        ↓
Administrator adds product/package information
        ↓
Administrator sets origin/destination
        ↓
Administrator sets initial status
        ↓
Shipment becomes trackable publicly
        ↓
Administrator updates shipment as it moves
        ↓
Customer sees updated tracking information
```

---

# 3. Phase 3 Scope

## In Scope

- Administrator authentication
- Protected admin routes
- Dashboard overview
- Shipment list
- Shipment search
- Shipment creation
- Shipment detail page
- Shipment editing
- Status updates
- Tracking event creation
- Current location updates
- ETA management
- ETA countdown support
- Customs clearance state
- Customer action/exception messaging
- Shipment image upload/update
- Shipment history
- Basic administrator logout

## Out of Scope

- Telegram bot
- Automated shipment ingestion
- GPS hardware integration
- Automatic carrier API integrations
- Customer accounts
- Customer-facing shipment editing
- Payments
- Accounting
- Inventory management
- Advanced analytics
- Staff scheduling
- CRM
- Email/SMS automation

---

# 4. Design Principle

The dashboard should optimize for **speed of operation**.

The administrator may be using the dashboard while physically handling shipments.

Therefore:

- Avoid unnecessary screens.
- Avoid excessive forms.
- Avoid unnecessary confirmation dialogs.
- Make common actions obvious.
- Keep shipment updates fast.
- Use sensible defaults.
- Clearly show the current shipment state.

The dashboard should feel like an operations tool, not an enterprise ERP.

---

# 5. Authentication

All dashboard routes must require administrator authentication.

The existing Supabase Auth foundation from Phase 2 should be reused.

## Required

- `/admin/login`
- Session validation
- Protected `/admin/*` routes
- Logout
- Redirect unauthenticated users to `/admin/login`

Do not create a second authentication system.

---

# 6. Dashboard Structure

Suggested route structure:

```text
/admin
/admin/login
/admin/shipments
/admin/shipments/new
/admin/shipments/[trackingId]
```

The exact routing structure may vary if the existing application architecture suggests a better approach.

---

# 7. Dashboard Home

The dashboard home should provide a concise operational overview.

Suggested summary cards:

```text
Total Shipments
In Transit
Awaiting Customs
Out for Delivery
Delivered
```

Do not build complex analytics.

These are operational counts, not a business intelligence system.

---

# 8. Shipment List

The shipment list is the primary navigation point for administrators.

Display:

| Field | Description |
|---|---|
| Tracking ID | Public tracking identifier |
| Sender | Sender name |
| Destination | Destination |
| Status | Current shipment status |
| Current Location | Latest known location |
| ETA | Estimated delivery |
| Updated | Last update time |

The list should be responsive.

---

# 9. Shipment Search

Administrators should be able to search by:

- Tracking ID
- Sender name

Tracking ID should be the primary search mechanism.

Search should not require exact capitalization.

For example:

```text
nmx-842731
```

should find:

```text
NMX-842731
```

---

# 10. Shipment Creation

Provide a simple shipment creation form.

## Required Fields

```text
Sender name
Product description
Origin
Destination
```

## Optional Fields

```text
Product image
Estimated delivery
Current location
Initial tracking note
```

The system should generate the tracking ID automatically.

Administrators should not manually type tracking IDs.

---

# 11. Tracking ID Generation

Continue using the Phase 2 tracking ID generator.

Example:

```text
NMX-842731
```

The administrator should see the generated tracking ID after shipment creation.

Example:

```text
Shipment created successfully.

Tracking ID
NMX-842731

[ Copy Tracking ID ]
[ View Shipment ]
```

---

# 12. Shipment Detail Page

The shipment detail page is the most important screen in the dashboard.

Suggested layout:

```text
┌──────────────────────────────────────────────┐
│ NMX-842731                    [Update]       │
│                                              │
│ Status                                       │
│ IN TRANSIT                                   │
│                                              │
│ Sender                                       │
│ John Doe                                     │
│                                              │
│ Product                                      │
│ Nike Air Max Shoes                           │
│                                              │
│ Origin                 Destination           │
│ Guangzhou, China       Lagos, Nigeria        │
│                                              │
│ Current Location                             │
│ Lagos, Nigeria                               │
│                                              │
│ Estimated Delivery                           │
│ Aug 14, 2026 14:00                           │
│                                              │
│ Tracking Timeline                            │
│ ● Shipment Created                           │
│ ● Departed Origin                            │
│ ● In Transit                                 │
│                                              │
│ [ Add Tracking Update ]                      │
└──────────────────────────────────────────────┘
```

---

# 13. Updating Shipment Status

Administrators must be able to update the current shipment status.

Available statuses:

```text
SHIPMENT_CREATED
RECEIVED_AT_ORIGIN
PROCESSING
DEPARTED_ORIGIN
IN_TRANSIT
ARRIVED_DESTINATION_COUNTRY
CUSTOMS_CLEARANCE
RECEIVED_LOCAL_FACILITY
OUT_FOR_DELIVERY
DELIVERED
EXCEPTION
```

The system should prevent arbitrary status strings.

---

# 14. Status Update Behaviour

When an administrator changes the status:

1. Validate the new status.
2. Update `shipments.current_status`.
3. Create a corresponding `tracking_event`.
4. Update `shipments.updated_at`.
5. Update location if supplied.
6. Update ETA if supplied.
7. Refresh the dashboard.
8. Public tracking should immediately reflect the new state.

Example:

```text
Previous:
IN_TRANSIT

New:
ARRIVED_DESTINATION_COUNTRY
```

This creates:

```text
Tracking Event
Status: ARRIVED_DESTINATION_COUNTRY
Location: Lagos, Nigeria
Timestamp: Current time
```

Historical tracking events must never be overwritten.

---

# 15. Tracking Event Creation

Administrators should be able to manually add an event without necessarily changing the current shipment status.

Fields:

```text
Status
Location
Date/time
Note
Latitude
Longitude
Image
```

Not every field is required.

This allows the operator to provide additional operational information.

---

# 16. Current Location

Administrators should be able to specify the shipment's latest known location.

Example:

```text
Lagos, Nigeria
```

Optional coordinates:

```text
Latitude
Longitude
```

If coordinates are available, the public tracking page may display the shipment on a map.

If coordinates are unavailable, the system should simply display the location label.

Do not implement automatic GPS tracking in this phase.

---

# 17. ETA Management

The administrator should be able to set an estimated delivery time.

Use a timestamp as the canonical value:

```text
estimated_delivery_at
```

Example:

```text
14 August 2026, 14:00
```

The system should not treat ETA as a guaranteed delivery promise.

The UI should label it:

> Estimated delivery

not:

> Guaranteed delivery

---

# 18. ETA Countdown

The public tracking page may display a live countdown.

The countdown should be calculated client-side from:

```text
estimated_delivery_at
```

The server does not need to update the countdown every second.

Conceptually:

```text
ETA
  ↓
Current browser time
  ↓
Remaining time
```

Example:

```text
Estimated delivery

1d 07h 32m
```

The countdown should update automatically.

---

# 19. ETA Expiration

If the current time passes the ETA:

Do not display:

```text
-2d 04h
```

Instead display something appropriate such as:

> Delivery estimate passed

or:

> Delivery update pending

The administrator should be able to update the ETA.

---

# 20. Customs Clearance

Add:

```text
CUSTOMS_CLEARANCE
```

as a legitimate shipment status.

Do not represent customs clearance as a generic technical error.

Customs is an operational state.

Example:

```text
ARRIVED_DESTINATION_COUNTRY
        ↓
CUSTOMS_CLEARANCE
        ↓
RECEIVED_LOCAL_FACILITY
```

---

# 21. Customer Action Required

A shipment may require action from the recipient.

The dashboard should support:

```text
Requires customer action: ON/OFF
```

and:

```text
Action message
```

Example:

> Your shipment has arrived in the destination country and is currently awaiting customs clearance. Please contact support to complete the required clearance process.

---

# 22. Customs Action State

When a shipment is awaiting customs clearance:

```text
Status:
CUSTOMS_CLEARANCE

Requires action:
YES
```

The public tracking page should prominently display the action message.

Example:

```text
ACTION REQUIRED

Your shipment is awaiting customs clearance.

Please contact our support team
to proceed.

[ Contact Support ]
```

The exact wording should be configurable by the administrator.

---

# 23. ETA and Customs Interaction

If customs clearance blocks the shipment, the administrator should be able to update or remove the ETA.

The public interface should not continue displaying a normal countdown when the shipment is operationally blocked.

Preferred presentation:

```text
CUSTOMS CLEARANCE

Delivery estimate paused

Action required from recipient.

[ Contact Support ]
```

Once clearance is completed, the administrator can:

1. Change status.
2. Set/update the ETA.
3. Remove the customer action requirement.

The normal ETA countdown can then resume.

---

# 24. Support Button

The public tracking page should provide a support action when required.

The dashboard should not build a full support system.

The support button should use the company's configured contact channel.

Potential channels:

```text
WhatsApp
Phone
Email
Telegram
```

The exact implementation should follow the contact configuration established in Phase 1.

---

# 25. Shipment Images

Administrators should be able to:

- Upload a shipment/package image.
- Replace an image.
- Remove an image where appropriate.

Use the Supabase Storage infrastructure created in Phase 2.

Validate:

- File type
- File size

Do not store image binaries directly in PostgreSQL.

---

# 26. Shipment Timeline

The shipment detail page should display the complete event history.

Example:

```text
● Shipment Created
  Guangzhou, China
  Aug 10, 09:12

● Departed Origin
  Guangzhou, China
  Aug 10, 14:00

● In Transit
  International Transit
  Aug 10, 18:30

● Arrived Destination Country
  Lagos, Nigeria
  Aug 12, 08:15

● Customs Clearance
  Lagos, Nigeria
  Aug 12, 09:00
```

Events are displayed newest/oldest according to the established public tracking design.

Do not allow administrators to silently modify historical event records.

---

# 27. Public Tracking Synchronization

There should be no separate copy of shipment data for the public site.

Both systems use the same database.

```text
                    SUPABASE
                       │
            ┌──────────┴──────────┐
            │                     │
            ▼                     ▼
    ADMIN DASHBOARD        PUBLIC TRACKING
            │                     │
         WRITE                  READ
            │                     │
            └────── DATABASE ────┘
```

When the administrator changes a shipment, the public tracking page should show the updated information on its next data fetch/refresh.

Do not build a second tracking database.

---

# 28. Optimistic UI

Do not implement complex optimistic updates unless necessary.

For critical shipment changes:

1. Submit update.
2. Wait for server confirmation.
3. Refresh the shipment data.
4. Display success/failure.

Accuracy is more important than shaving a few hundred milliseconds from an administrative action.

---

# 29. Form Validation

Validate all administrator inputs.

Examples:

### Sender

Required.

### Product description

Required.

### Destination

Required.

### ETA

Must be a valid timestamp.

### Coordinates

Must be valid latitude/longitude values.

### Action message

Required when `requires_action = true`.

### Image

Must meet supported file restrictions.

Validation must happen server-side.

---

# 30. Error Handling

Errors should be understandable.

Examples:

```text
Unable to create shipment.
Please try again.
```

```text
Unable to update shipment.
No changes were saved.
```

```text
Image upload failed.
Please try another image.
```

Do not expose raw PostgreSQL/Supabase errors to administrators unless useful for development.

---

# 31. Confirmation Behaviour

Use confirmation only for destructive actions.

For example:

```text
Delete shipment?
```

Normal status updates should not require multiple confirmation dialogs.

The primary workflow should be fast.

---

# 32. Delete Shipment

Deletion is not a primary MVP operation.

If implemented, it must:

- Require administrator authentication.
- Require explicit confirmation.
- Avoid accidentally deleting tracking history.

Prefer archiving/deactivation if the database architecture supports it.

Do not implement hard deletion casually.

---

# 33. Dashboard Navigation

Suggested navigation:

```text
Dashboard
Shipments
Create Shipment
Logout
```

Keep the navigation minimal.

---

# 34. Responsive Behaviour

The dashboard should work on:

- Desktop
- Laptop
- Tablet

Mobile support is desirable but not the primary target.

The public tracking page remains the primary customer-facing mobile experience.

---

# 35. Security

Administrators must not be able to bypass authorization by manually calling API routes.

Every write operation must perform server-side authentication/authorization.

Do not rely exclusively on UI visibility.

Example:

Hiding:

```text
[Update Shipment]
```

does **not** constitute security.

The backend must reject unauthorized requests.

---

# 36. Auditability

Every shipment update should create an appropriate tracking event where applicable.

At minimum, the system should preserve:

- What status changed
- Location
- Timestamp
- Note

Where practical, store the authenticated administrator responsible for the update.

This supports operational accountability without building a complete audit-log product.

---

# 37. Dashboard Performance

The dashboard does not require real-time infrastructure.

For the MVP:

- Normal database queries are sufficient.
- Refresh shipment data after updates.
- Avoid unnecessary polling.
- Avoid WebSockets unless a demonstrated requirement appears.

The public customer tracking page can refresh data when loaded or manually refreshed.

---

# 38. Existing Seed Shipments

The dashboard should work with the Phase 2 seed shipments:

```text
NMX-842731
NMX-113305
```

Administrators should be able to open and update them.

Do not create a separate test database just for the dashboard.

---

# 39. Acceptance Criteria

Phase 3 is complete when:

### Authentication

- [ ] `/admin/login` works.
- [ ] Unauthenticated users cannot access `/admin/*`.
- [ ] Authenticated administrator can access the dashboard.
- [ ] Logout works.

### Dashboard

- [ ] Dashboard home loads.
- [ ] Shipment count summaries work.
- [ ] Shipment list loads.
- [ ] Shipment search works.
- [ ] Shipment detail page works.

### Shipment Creation

- [ ] Administrator can create a shipment.
- [ ] Tracking ID is generated automatically.
- [ ] Shipment is saved to Supabase.
- [ ] Created shipment appears in shipment list.
- [ ] Public tracking can find it.

### Status Updates

- [ ] Administrator can change status.
- [ ] Invalid statuses are rejected.
- [ ] Status change updates shipment.
- [ ] Status change creates tracking event.
- [ ] Public tracking reflects the new status.

### Tracking Events

- [ ] Administrator can add events.
- [ ] Historical events remain intact.
- [ ] Events appear in correct chronological order.
- [ ] Optional location information works.

### ETA

- [ ] Administrator can set ETA.
- [ ] Administrator can update ETA.
- [ ] Public tracking displays ETA.
- [ ] Countdown works.
- [ ] Countdown does not display negative time.
- [ ] Expired ETA has an appropriate state.

### Customs

- [ ] `CUSTOMS_CLEARANCE` status exists.
- [ ] Administrator can set it.
- [ ] Customer-facing customs state is displayed.
- [ ] Customer action can be enabled.
- [ ] Action message can be configured.
- [ ] Support CTA appears when appropriate.
- [ ] ETA can be paused/removed while blocked.
- [ ] ETA can be updated after clearance.

### Images

- [ ] Administrator can upload shipment image.
- [ ] Image appears on appropriate customer-facing interface.
- [ ] Invalid uploads are rejected.

### Security

- [ ] Public users cannot modify shipments.
- [ ] Unauthenticated users cannot access dashboard operations.
- [ ] Server-side authorization is enforced.
- [ ] Internal fields are not exposed publicly.

### Quality

- [ ] TypeScript passes.
- [ ] Lint passes.
- [ ] Production build passes.
- [ ] Existing Phase 1 public website remains functional.
- [ ] Existing Phase 2 tracking functionality remains functional.

---

# 40. Definition of Done

The following scenario must work completely:

```text
Administrator logs in
        ↓
Creates shipment
        ↓
System generates tracking ID
        ↓
Shipment appears in dashboard
        ↓
Customer searches tracking ID
        ↓
Customer sees shipment
        ↓
Shipment departs origin
        ↓
Administrator changes status
        ↓
Tracking event is created
        ↓
ETA is set
        ↓
Customer sees ETA countdown
        ↓
Shipment reaches destination country
        ↓
Administrator changes status to CUSTOMS_CLEARANCE
        ↓
Administrator enables "Action Required"
        ↓
Customer sees customs message
        ↓
Customer sees Contact Support
        ↓
Clearance is completed
        ↓
Administrator changes status
        ↓
Administrator sets new ETA
        ↓
Customer sees updated ETA
        ↓
Shipment goes out for delivery
        ↓
Shipment is marked DELIVERED
        ↓
Customer sees completed tracking history
```

---

# 41. Explicit Scope Boundary

**Phase 3 = Administrator Operations Dashboard.**

Do not build:

- Telegram automation
- WhatsApp automation
- Automatic carrier integrations
- GPS hardware
- Customer accounts
- Payment processing
- Automated notifications
- Advanced analytics
- CRM
- Inventory management

Those belong to later phases.

---

# 42. Implementation Instructions

Before coding:

1. Read `MASTER-PRD.md`.
2. Read `TECHNICAL-SETUP.md`.
3. Read `PHASE-01-PUBLIC-WEBSITE.md`.
4. Read `PHASE-02-BACKEND.md`.
5. Inspect the **actual existing Supabase schema and migrations** before modifying the database.
6. Inspect the existing Phase 2 data-access layer.
7. Reuse existing authentication and shipment functions where possible.
8. Do not rebuild Phase 2 functionality unnecessarily.
9. Identify any schema additions required for ETA/customs/action states.
10. If schema changes are required, create a new migration rather than editing an already-applied migration.
11. Implement the dashboard incrementally.
12. Test every administrative write against the public tracking page.
13. Run lint and production build.
14. Stop when Phase 3 acceptance criteria are satisfied.

---

# 43. Critical Implementation Rule

**Do not assume the Phase 2 PRD perfectly describes the actual database.**

The live implementation is the source of truth.

Before making schema changes, inspect:

```text
supabase/migrations/
```

and the existing data-access layer.

If `estimated_delivery_at`, customs-related status support, or another required field already exists, reuse it.

If a field does not exist, create a new migration.

**Never modify an already-applied migration just to add a new field.**

---

# 44. Phase Completion

When Phase 3 is complete, the system should have:

```text
PHASE 1
Public Company Website
        +
PHASE 2
Real Database + Tracking Backend
        +
PHASE 3
Administrator Operations Dashboard
        ↓
FUNCTIONAL LOGISTICS TRACKING MVP
```

The next phase can then focus on reducing manual dashboard work through Telegram/operational automation.