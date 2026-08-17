# Phase 02 — Backend & Database

## Logistics Shipment Tracking Platform

**Version:** 1.0  
**Status:** Ready for implementation  
**Parent Document:** `MASTER-PRD.md`  
**Technical Guidance:** `TECHNICAL-SETUP.md`  
**Phase:** 2 of 4

---

# 1. Purpose

Phase 2 converts the Phase 1 public website from a mock frontend into a functional shipment tracking platform.

This phase introduces:

- Database
- Shipment records
- Tracking events
- Tracking ID generation
- Public tracking API/data access
- Administrator authentication foundation
- Image storage
- Server-side validation
- Error handling

At the end of this phase, a real shipment stored in the database should be retrievable from the public tracking page.

The administrator dashboard is **not** built in this phase.

---

# 2. Phase Objective

The primary objective is to make this workflow work end-to-end:

```text
Shipment record created
        ↓
Tracking ID generated
        ↓
Shipment stored in database
        ↓
Customer visits /tracking
        ↓
Customer enters tracking ID
        ↓
Backend retrieves shipment
        ↓
Customer sees real shipment details
```

The system should no longer rely on mock shipment data.

---

# 3. Technology

Use the architecture established in `TECHNICAL-SETUP.md`.

Expected stack:

- Next.js
- TypeScript
- Supabase
  - PostgreSQL
  - Auth
  - Storage

Do not introduce additional backend infrastructure unless required.

---

# 4. Scope

## In Scope

- Supabase project configuration
- Database schema
- Shipments table
- Tracking events table
- Storage bucket
- Public tracking query
- Tracking ID generation
- Shipment creation data-access function
- Shipment update data-access functions
- Administrator authentication foundation
- Server-side validation
- Error handling
- Replace Phase 1 mock data with real data

## Out of Scope

- Admin dashboard UI
- Telegram bot
- Customer accounts
- Payment processing
- GPS tracking
- SMS notifications
- Email notifications
- Multi-role permissions
- Advanced analytics
- Warehouse management

---

# 5. Database Overview

The MVP requires three primary entities:

```text
Administrators
      │
      │ creates
      ▼
Shipments
      │
      │ has many
      ▼
Tracking Events
```

Images are stored in object storage and referenced from the shipment or tracking event.

---

# 6. Administrators

Use Supabase Auth for administrator identities.

Do not create a custom password system.

Supabase Auth should handle:

- Login
- Password hashing
- Sessions
- Logout
- Password reset

A lightweight administrator profile table may be created if additional metadata is required later.

## Suggested Fields

```text
id
created_at
updated_at
display_name
```

The primary identifier should correspond to the Supabase Auth user.

---

# 7. Shipments Table

Create a `shipments` table.

## Fields

| Field | Type | Required |
|---|---|---|
| id | UUID | Yes |
| tracking_id | Text | Yes |
| product_description | Text | Yes |
| product_image_path | Text | No |
| sender_name | Text | Yes |
| origin | Text | Yes |
| destination | Text | Yes |
| current_status | Text/Enum | Yes |
| current_location_label | Text | No |
| current_latitude | Numeric | No |
| current_longitude | Numeric | No |
| current_location_updated_at | Timestamp | No |
| estimated_delivery_from | Date | No |
| estimated_delivery_to | Date | No |
| created_at | Timestamp | Yes |
| updated_at | Timestamp | Yes |

---

# 8. Tracking ID

Each shipment must receive a unique public tracking ID.

Example:

```text
NMX-842731
```

Requirements:

- Unique
- Human-readable
- Publicly shareable
- Not based directly on the database UUID
- Indexed for fast lookup

The prefix should be configurable later.

For the MVP, use a fixed temporary prefix.

The generation function must retry if a collision occurs.

---

# 9. Shipment Status

Use a controlled set of statuses.

```text
SHIPMENT_CREATED
RECEIVED_AT_ORIGIN
PROCESSING
DEPARTED_ORIGIN
IN_TRANSIT
ARRIVED_DESTINATION_COUNTRY
RECEIVED_LOCAL_FACILITY
OUT_FOR_DELIVERY
DELIVERED
EXCEPTION
```

The database should reject invalid status values.

---

# 10. Tracking Events Table

Create a `tracking_events` table.

Each shipment may have multiple events.

## Fields

| Field | Type |
|---|---|
| id | UUID |
| shipment_id | UUID |
| status | Text/Enum |
| location | Text |
| latitude | Numeric |
| longitude | Numeric |
| note | Text |
| image_path | Text |
| created_by | UUID |
| created_at | Timestamp |

---

# 11. Event History Principle

Tracking events are append-only.

Do not overwrite historical events.

Example:

```text
Shipment Created
Received at Origin
Departed Origin
In Transit
Arrived Destination Country
```

When a shipment status changes:

1. Update the shipment's `current_status`.
2. Insert a new `tracking_event`.
3. Update the shipment's current location fields if applicable.

The tracking page should render the timeline from `tracking_events`.

---

# 12. Image Storage

Create a Supabase Storage bucket for shipment images.

Suggested bucket name:

```text
shipment-images
```

Store:

- Product/package images
- Optional tracking event images

Requirements:

- Validate file type.
- Validate file size.
- Store only supported image formats.
- Return storage paths rather than embedding binary data in the database.

The public tracking page should only display images intended to be public.

---

# 13. Public Tracking Data Contract

The public tracking page must receive only safe data.

Conceptually:

```typescript
{
  trackingId: string;
  product: {
    description: string;
    imageUrl?: string;
  };
  sender: {
    name: string;
  };
  origin: string;
  destination: string;
  status: ShipmentStatus;
  currentLocation?: {
    label: string;
    latitude?: number;
    longitude?: number;
    updatedAt?: string;
  };
  estimatedDelivery?: {
    from?: string;
    to?: string;
  };
  events: TrackingEvent[];
}
```

Do not expose:

- Internal database IDs
- Admin IDs
- Internal notes
- Authentication information
- Private phone numbers
- Private emails
- Any data not required by the customer

---

# 14. Public Tracking Query

The public tracking page should perform a lookup by `tracking_id`.

Conceptually:

```text
GET shipment by tracking_id
        ↓
Shipment exists?
     /       \
   Yes        No
   ↓          ↓
Return      Return
public      not found
data
```

The lookup should return the shipment and its tracking events.

---

# 15. Tracking Page Integration

Replace the Phase 1 mock data with the real data-access layer.

The UI should not need a redesign.

The following states must work:

## Loading

```text
Finding your shipment...
```

## Found

Display real shipment.

## Not Found

```text
We couldn't find a shipment with that tracking ID.
```

## Unexpected Error

```text
We couldn't retrieve your shipment right now.
Please try again shortly.
```

---

# 16. Authentication Foundation

Phase 2 should configure administrator authentication.

Implement:

- Login route/page if necessary for testing
- Supabase Auth integration
- Session handling
- Protected server-side operations

Do not build the full admin dashboard.

Authentication exists so that Phase 3 can immediately build on it.

---

# 17. Authorization

Public users must only be able to read public shipment tracking data.

Administrative operations must require an authenticated administrator.

Public users must not be able to:

- Create shipments
- Update shipments
- Delete shipments
- Add tracking events
- Upload shipment images

All authorization checks must happen server-side.

---

# 18. Data Access Layer

Keep database access separate from UI.

Suggested conceptual structure:

```text
src/
├── lib/
│   ├── supabase/
│   └── shipments/
│       ├── getShipmentByTrackingId
│       ├── createShipment
│       ├── updateShipment
│       └── addTrackingEvent
```

The exact file structure may vary.

Do not place raw database queries inside React components.

---

# 19. Validation

All write operations must validate input.

Validate:

- Product description
- Sender name
- Origin
- Destination
- Status
- Dates
- Coordinates
- Uploaded images

Client-side validation may improve UX but is not sufficient.

Server-side validation is required.

---

# 20. Error Handling

The backend should distinguish between:

- Shipment not found
- Unauthorized
- Validation failure
- Storage upload failure
- Database failure

Do not expose raw database errors to public users.

Log meaningful errors for debugging.

---

# 21. Database Indexes

Create indexes where they improve the MVP.

At minimum:

- Unique index on `tracking_id`
- Index on `tracking_events.shipment_id`

Avoid premature indexing.

---

# 22. Row-Level Security

Use Supabase Row Level Security appropriately.

Public access should only allow the minimal read access required for tracking.

Administrative write access must require authenticated users.

Do not disable RLS simply to make development easier.

Policies should be explicit and understandable.

---

# 23. Migration Strategy

The database schema should be created using version-controlled migrations where practical.

The schema should be reproducible from source control.

Do not rely on undocumented manual database changes.

---

# 24. Environment Variables

Add only the variables required by Phase 2.

Example:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

If server-only credentials are required, keep them server-side and document them separately.

Never expose privileged keys to the browser.

Update `.env.example` accordingly.

---

# 25. Testing

Test at minimum:

## Shipment Lookup

- Valid tracking ID
- Invalid tracking ID
- Empty tracking ID

## Database

- Shipment creation
- Unique tracking ID
- Event creation
- Multiple events
- Current status update

## Security

- Public user cannot write
- Unauthenticated user cannot create shipment
- Admin can perform permitted operations

## Storage

- Valid image upload
- Invalid file type
- Oversized image

---

# 26. Seed Data

Create a development seed shipment matching the Phase 1 example.

Tracking ID:

```text
NMX-842731
```

Product:

```text
Nike Air Max Shoes
```

Sender:

```text
John Doe
```

Origin:

```text
Guangzhou, China
```

Destination:

```text
Lagos, Nigeria
```

Status:

```text
IN_TRANSIT
```

Create at least three tracking events.

This allows immediate end-to-end testing of the public tracking page.

---

# 27. Acceptance Criteria

Phase 2 is complete when:

### Database

- [ ] Supabase project configured.
- [ ] Shipments table exists.
- [ ] Tracking events table exists.
- [ ] Storage bucket exists.
- [ ] RLS policies are enabled.
- [ ] Schema is reproducible.

### Shipment Logic

- [ ] Shipment can be created.
- [ ] Unique tracking ID is generated.
- [ ] Shipment status is validated.
- [ ] Tracking events can be added.
- [ ] Historical events are preserved.
- [ ] Current shipment status updates correctly.

### Public Tracking

- [ ] Public tracking lookup works.
- [ ] Real database data appears on the tracking page.
- [ ] Mock data is no longer used.
- [ ] Invalid tracking ID shows not found.
- [ ] Unexpected failures show a friendly error.
- [ ] Private fields are not exposed.

### Authentication

- [ ] Administrator authentication is configured.
- [ ] Protected operations require authentication.
- [ ] Public users cannot modify shipment data.

### Images

- [ ] Shipment image uploads work.
- [ ] Image paths are stored correctly.
- [ ] Public tracking page can display the shipment image.

### Quality

- [ ] TypeScript passes.
- [ ] Lint passes.
- [ ] Production build passes.
- [ ] No Phase 3 or Phase 4 functionality has been implemented.

---

# 28. Definition of Done

Phase 2 is considered complete when the following real workflow succeeds:

```text
Developer creates a shipment
        ↓
System generates NMX-XXXXXX
        ↓
Shipment saved to Supabase
        ↓
Tracking events saved
        ↓
Visit /tracking
        ↓
Enter tracking ID
        ↓
Real shipment data is returned
        ↓
Timeline, sender, location,
status, image and ETA display
```

At that point, the product has transitioned from a static prototype into a functioning shipment tracking system.

---

# 29. Explicit Scope Boundary

**Phase 2 = Backend, Database, Authentication Foundation, and Real Public Tracking.**

Do not build:

- Admin dashboard
- Telegram bot
- Customer login
- Payment processing
- Notifications
- GPS tracking
- Analytics

Those belong to later phases.

The objective is to create a clean, secure, minimal backend that Phase 3 and Phase 4 can build upon without architectural rewrites.

---

# 30. Implementation Instruction

Before coding:

1. Read `MASTER-PRD.md`.
2. Read `TECHNICAL-SETUP.md`.
3. Read `PHASE-01-PUBLIC-WEBSITE.md`.
4. Confirm the existing Phase 1 structure.
5. Propose the database schema and data-access architecture.
6. Implement migrations/schema.
7. Configure Supabase.
8. Replace mock tracking data incrementally.
9. Test the end-to-end tracking flow.
10. Stop after Phase 2 acceptance criteria are met.

Do not continue into Phase 3 automatically.