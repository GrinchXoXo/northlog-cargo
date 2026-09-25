# MASTER PRODUCT REQUIREMENTS DOCUMENT

## Logistics Shipment Tracking & Management Platform

**Version:** 1.0
**Status:** MVP Specification
**Product Type:** Logistics company website + shipment tracking platform + internal operations system
**Primary Users:** Customers / Public Visitors, Administrators
**Primary Objective:** Provide a professional public presence and a simple digital system for creating, managing, and tracking shipments.

---

# 1. Executive Summary

> **Iteration 1 notice.** The Telegram operations bot (component 4
> below, sections 19–21, "Phase 4", and every Telegram mention in the
> phased documents) was removed from the application in Iteration 1,
> together with the introduction of the `organizations` /
> `organization_members` foundation for serving more than one
> customer. Those sections are retained as history and no longer
> describe shipped behaviour. `PRD/PHASE-04-TELEGRAM-BOT.md` was
> deleted with the feature; `SECURITY/PHASE-07-AUDIT-REPORT.md` remains
> a record of a past audit.

The product is a digital platform for a small logistics/shipping company.

The platform consists of four interconnected components:

1. **Public Business Website**
2. **Shipment Tracking Portal**
3. **Internal Admin Dashboard**
4. **Telegram Operations Bot**

All four components communicate with a centralized backend and database.

The backend is the **single source of truth** for shipment information.

The public website provides the company's digital presence and allows customers to track shipments using a unique tracking ID.

The administrator dashboard allows company personnel to create and manage shipments and update their tracking status.

The Telegram bot provides a faster operational interface for a small logistics team, allowing administrators to create and update shipments without constantly opening the web dashboard.

---

# 2. Product Vision

The platform should give a small logistics company capabilities commonly associated with larger logistics providers without requiring a complex enterprise logistics management system.

A customer should be able to:

> Visit the company's website → enter a tracking ID → see the current shipment status, shipment history, last known location and estimated delivery information.

An operator should be able to:

> Receive a package → create a shipment → receive a generated tracking ID → update shipment status/location → have those changes immediately reflected on the customer's tracking page.

The system should prioritize:

* Simplicity
* Reliability
* Professional presentation
* Low operational overhead
* Fast shipment updates
* Clear customer communication
* Extensibility

---

# 3. Problem Statement

Small logistics companies often rely on informal processes such as:

* WhatsApp messages
* Telegram messages
* Spreadsheets
* Paper records
* Phone calls
* Manually communicating shipment status

This creates several problems:

* Customers have no centralized way to check shipment status.
* Operators repeatedly answer "Where is my package?" questions.
* Shipment information can become fragmented.
* There may be no consistent shipment history.
* The company may appear less established than larger logistics providers.
* Updating customers manually does not scale efficiently.

The proposed system centralizes shipment information while keeping the operational workflow simple enough for a small team.

---

# 4. Goals

## 4.1 Primary Goals

The MVP must:

1. Provide a professional company website.
2. Allow customers to track shipments using a tracking ID.
3. Allow administrators to create shipments.
4. Automatically generate unique tracking IDs.
5. Allow administrators to update shipment status.
6. Maintain a chronological shipment history.
7. Store shipment images where required.
8. Store the shipment's latest known location.
9. Display an estimated delivery date/time.
10. Provide an administrator dashboard.
11. Provide a Telegram-based operational interface.
12. Keep the backend as the single source of truth.

---

# 5. Non-Goals

The MVP is **not** intended to be:

* A full enterprise logistics management system.
* A GPS fleet-management platform.
* A real-time vehicle tracking platform.
* A payment processor.
* A warehouse management system.
* A route optimization engine.
* A multi-carrier logistics aggregator.
* A replacement for carrier APIs.
* A complex CRM.

These may become future products/features but should not expand the initial MVP unnecessarily.

---

# 6. Important Definition: Shipment Tracking

The MVP will provide **shipment status tracking and last-known-location tracking**.

It will not claim to provide real-time GPS tracking unless actual GPS/location data is available.

The customer-facing interface should therefore distinguish between:

### Current Status

Example:

> In Transit

### Last Known Location

Example:

> Lagos, Nigeria

### Last Updated

Example:

> Last updated 18 minutes ago

### Estimated Delivery

Example:

> Expected between August 11–12, 2026

This prevents the system from misleading customers into believing that manually entered locations represent live GPS data.

---

# 7. Product Architecture

```text
                         PUBLIC USERS
                              │
                              ▼
                    ┌─────────────────────┐
                    │   PUBLIC WEBSITE    │
                    │                     │
                    │ Company information │
                    │ Services            │
                    │ Contact             │
                    │ Shipment Tracking   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     BACKEND API     │
                    │                     │
                    │ Authentication      │
                    │ Shipment logic      │
                    │ Tracking events     │
                    │ Business logic      │
                    └──────────┬──────────┘
                               │
                         ┌─────┴─────┐
                         │           │
                         ▼           ▼
                ┌──────────────┐ ┌──────────────┐
                │ ADMIN PANEL  │ │ TELEGRAM BOT │
                │              │ │              │
                │ Create       │ │ Create       │
                │ Update       │ │ Update       │
                │ View         │ │ Notifications│
                │ Manage       │ │ Quick actions│
                └──────────────┘ └──────────────┘
                         │           │
                         └─────┬─────┘
                               ▼
                    ┌─────────────────────┐
                    │      DATABASE       │
                    │                     │
                    │ Shipments           │
                    │ Tracking Events     │
                    │ Administrators      │
                    │ Content             │
                    └─────────────────────┘
```

The database/backend is the **system of record**.

The website, dashboard and Telegram bot are interfaces to that system.

---

# 8. User Types

## 8.1 Public Visitor

A public visitor is not authenticated.

Capabilities:

* Browse company website.
* View services.
* View company information.
* View contact information.
* Search for a shipment using a tracking ID.
* View publicly safe shipment information.

Restrictions:

* Cannot modify shipments.
* Cannot access administrative data.
* Cannot access the admin dashboard.
* Cannot view private recipient information unless explicitly intended to be public.

---

## 8.2 Administrator

An administrator is an authorized company employee/operator.

Capabilities:

* Authenticate.
* Create shipments.
* View shipments.
* Search shipments.
* Filter shipments.
* Update shipment information.
* Add tracking events.
* Update shipment status.
* Update location.
* Update estimated delivery.
* Upload shipment images.
* View shipment history.
* Manage selected website content where supported.

---

# 9. Public Website

## 9.1 Purpose

The public website serves two functions:

1. Present the logistics company professionally.
2. Provide customers with access to shipment tracking.

---

## 9.2 Core Pages

The initial website should contain:

### Home

* Company value proposition
* Primary services
* Call-to-action
* Shipment tracking entry point
* Company highlights
* Contact CTA

### About

* Company information
* Mission / positioning
* Operational coverage
* Relevant credibility information

### Services

* Logistics/shipping services
* Service descriptions
* Coverage information

### Tracking

Dedicated shipment tracking interface.

### Contact

* Phone
* Email
* Physical address
* Social channels
* Map/location where appropriate

### Optional

* FAQ
* Blog/news
* Testimonials
* Case studies
* Partners
* Locations

Optional pages should only be implemented if the company has meaningful content for them.

---

# 10. Shipment Tracking Experience

The primary customer interaction is:

```text
Enter Tracking ID
        ↓
Search
        ↓
Shipment found?
     /       \
   YES        NO
    ↓          ↓
Display      Error
shipment     message
details
```

---

## 10.1 Tracking Search

The customer enters a tracking ID.

Example:

`NMX-842731`

The backend validates the tracking ID and returns the appropriate public shipment information.

---

## 10.2 Shipment Information

The customer may see:

* Tracking ID
* Product description
* Product image
* Shipment status
* Origin
* Destination
* Shipment creation/received date
* Last known location
* Last updated time
* Estimated delivery
* Tracking history

---

# 11. Shipment Status System

The MVP should use a standardized status lifecycle.

Suggested statuses:

1. **Shipment Created**
2. **Received at Origin**
3. **Processing**
4. **Departed Origin**
5. **In Transit**
6. **Arrived in Destination Country**
7. **Received at Local Facility**
8. **Out for Delivery**
9. **Delivered**
10. **Exception**

Not every shipment needs to pass through every status.

The administrator must be able to move a shipment to the appropriate status based on actual operational events.

---

# 12. Tracking Timeline

Every significant shipment update should create a tracking event.

Example:

```text
SHIPMENT: NMX-842731

✓ Received at Origin
  Lagos, Nigeria
  Aug 6, 2026 — 09:42

✓ Departed Origin
  Lagos, Nigeria
  Aug 6, 2026 — 18:20

✓ In Transit
  International Transit
  Aug 7, 2026 — 04:15

● Arrived in Destination Country
  Pending

○ Out for Delivery
  Pending

○ Delivered
  Pending
```

Historical events should not be overwritten when a shipment changes status.

---

# 13. Shipment Data Model

A shipment should contain, at minimum:

```text
Shipment
├── id
├── tracking_id
├── product_description
├── product_image
├── sender_information
├── recipient_information
├── origin
├── destination
├── current_status
├── current_location
├── current_location_coordinates
├── estimated_delivery
├── created_at
└── updated_at
```

Sensitive fields should not automatically be exposed through the public tracking endpoint.

---

# 14. Tracking Event Data Model

```text
TrackingEvent
├── id
├── shipment_id
├── status
├── location
├── latitude
├── longitude
├── note
├── image
├── created_by
└── created_at
```

Each event represents a historical update to the shipment.

---

# 15. Administrator Dashboard

The dashboard should intentionally remain small.

The company does not require a large enterprise admin suite for the MVP.

## Core navigation

```text
Dashboard
│
├── Overview
├── Shipments
│
├── [Future]
│   ├── Customers
│   ├── Reports
│   ├── Website Content
│   └── Settings
│
└── Account
```

---

# 16. Dashboard Overview

The dashboard may display:

* Total shipments
* Active shipments
* Delivered shipments
* Shipments requiring attention
* Recently created shipments
* Recently updated shipments

Example:

```text
ACTIVE SHIPMENTS       18
IN TRANSIT             11
OUT FOR DELIVERY        4
DELIVERED              97
EXCEPTIONS              2
```

The dashboard should not become a vanity analytics page.

Only operationally useful metrics should be displayed.

---

# 17. Shipment Management

Administrators must be able to:

### Create

* Create shipment.
* Upload package/product image.
* Enter product description.
* Enter sender information.
* Enter recipient information.
* Enter origin.
* Enter destination.
* Enter estimated delivery.
* Generate tracking ID.

### View

* View shipment list.
* Search tracking ID.
* Search product/customer information where permitted.
* Filter by status.
* Sort by date/status.

### Update

* Change status.
* Change location.
* Change estimated delivery.
* Add notes.
* Upload images.
* Add tracking event.

### Archive

Completed or obsolete records may eventually be archived.

Permanent deletion should be treated carefully because shipment history may have operational or legal value.

---

# 18. Tracking ID

Each shipment must receive a unique tracking ID.

Example format:

`NMX-842731`

Requirements:

* Unique.
* Human-readable.
* Difficult to accidentally duplicate.
* Safe to share publicly.
* Not based directly on database primary keys.
* Searchable by customers.

The final format should be configurable.

---

# 19. Telegram Operations Interface

Telegram is an **operational convenience layer**, not the system of record.

The Telegram bot communicates with the same backend used by the dashboard.

---

## 19.1 Shipment Creation

Potential workflow:

```text
Operator
↓
/newshipment

Bot
↓
Send package image

Operator
↓
[Image]

Bot
↓
Product description?

Operator
↓
Nike Air Max Shoes

Bot
↓
Origin?

Operator
↓
China

Bot
↓
Destination?

Operator
↓
Nigeria

Bot
↓
Estimated delivery?

Operator
↓
August 14

Bot
↓
Shipment created.

Tracking ID:
NMX-842731
```

The exact conversational flow can be optimized during implementation.

---

# 20. Telegram Shipment Updates

Example:

```text
/update NMX-842731
```

Bot:

```text
Current status:
In Transit

Select new status:

1. Arrived Destination Country
2. Received at Local Facility
3. Out for Delivery
4. Delivered
5. Exception
6. Update Location
7. Add Note
```

The operator selects the required action.

The backend creates a new tracking event.

The public tracking page automatically reflects the change.

---

# 21. Telegram Notifications

The bot may also notify administrators when:

* A new shipment is created through the website/dashboard.
* A customer submits a relevant enquiry.
* A shipment reaches an important status.
* An exception is recorded.

Notifications should remain configurable.

---

# 22. Backend Requirements

The backend is responsible for:

* Authentication.
* Authorization.
* Shipment CRUD.
* Tracking events.
* Tracking ID generation.
* Image handling.
* Location data.
* ETA management.
* Public tracking API.
* Admin API.
* Telegram bot integration.
* Validation.
* Error handling.
* Database operations.

---

# 23. API Structure

The exact framework is implementation-dependent, but conceptually the API should provide:

### Public

```text
GET /api/track/:trackingId
```

Returns publicly safe shipment information.

### Admin

```text
POST   /api/admin/shipments
GET    /api/admin/shipments
GET    /api/admin/shipments/:id
PATCH  /api/admin/shipments/:id
POST   /api/admin/shipments/:id/events
```

### Authentication

```text
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
```

The exact endpoint structure can change during implementation.

---

# 24. Public API Security

The public tracking endpoint must not expose private operational information.

For example, the public API should not automatically return:

* Administrator identities.
* Internal notes.
* Private phone numbers.
* Private email addresses.
* Internal database identifiers.
* Authentication information.
* Internal operational comments.

Public tracking data should be deliberately defined rather than exposing the entire shipment database object.

---

# 25. Location / Map Functionality

The MVP should support a **last-known location**.

A tracking event may contain:

```text
Location:
Lagos, Nigeria

Latitude:
6.xxxxxx

Longitude:
3.xxxxxx

Updated:
14 minutes ago
```

The customer-facing tracking page may display this location on a map.

The map should communicate that it represents the **last recorded location**, not necessarily the package's live GPS position.

Actual live tracking should only be introduced when reliable location data becomes available.

---

# 26. Image Management

Shipment images may be uploaded during shipment creation or tracking updates.

Images should:

* Be stored outside the application server where appropriate.
* Have controlled access.
* Be resized/compressed where practical.
* Have validated file types.
* Have reasonable file-size limits.

The public interface should only expose images intended for customers.

---

# 27. Authentication

The dashboard must be protected.

Minimum requirements:

* Login.
* Secure password storage.
* Session/token management.
* Logout.
* Protected administrative routes.
* Server-side authorization.
* Input validation.

Future requirements may include:

* Multiple admin accounts.
* Roles.
* Permissions.
* 2FA.
* Audit logs.

These are not required for the initial MVP unless the company requires them.

---

# 28. Security Requirements

The system must:

* Use HTTPS in production.
* Hash passwords securely.
* Validate all server-side input.
* Authenticate protected requests.
* Authorize administrative actions.
* Protect API credentials.
* Keep secrets out of frontend code.
* Rate-limit sensitive endpoints where appropriate.
* Prevent unauthorized shipment modification.
* Sanitize/validate uploaded files.
* Avoid exposing unnecessary personal information.

---

# 29. Performance Requirements

### Public Website

The public website should prioritize:

* Fast page loads.
* Optimized images.
* Minimal JavaScript.
* Static generation where possible.
* CDN caching where appropriate.

### Dashboard

The dashboard should prioritize:

* Fast data retrieval.
* Efficient pagination.
* Search/filter functionality.
* Clear loading states.
* Graceful API failure handling.

The MVP does not require optimization for massive traffic.

---

# 30. Responsive Design

The public website must work on:

* Mobile phones
* Tablets
* Laptops
* Desktop monitors

The admin dashboard should also be responsive, but the primary operational interface may be optimized for desktop if that reflects the company's actual workflow.

Telegram provides an alternative interface for rapid mobile operations.

---

# 31. Error Handling

The system should provide clear errors.

Examples:

### Invalid Tracking ID

> We couldn't find a shipment with that tracking number. Please check the number and try again.

### Server Error

> We couldn't retrieve your shipment information right now. Please try again shortly.

### Unauthorized Dashboard Access

> You do not have permission to access this page.

Errors should not expose technical stack traces or sensitive backend information.

---

# 32. Notifications

Potential notification channels:

* Telegram
* Email
* SMS
* WhatsApp

Only Telegram is part of the initial planned operational integration.

Customer notifications can be introduced later if there is a business need.

---

# 33. MVP Scope by Phase

## Phase 1 — Public Website

Build:

* Corporate website.
* Responsive layout.
* Core company pages.
* Tracking page UI.
* Contact information.
* Basic SEO.
* Initial deployment.

At this stage, the tracking interface may use mock shipment data until the backend exists.

---

## Phase 2 — Backend & Database

Build:

* Database.
* Shipment model.
* Tracking event model.
* Administrator authentication.
* Shipment API.
* Public tracking API.
* Tracking ID generation.
* Image storage.
* Status management.
* Location data.
* ETA data.

This phase converts the static tracking interface into a functional system.

---

## Phase 3 — Admin Dashboard

Build:

* Admin login.
* Dashboard.
* Shipment list.
* Shipment creation.
* Shipment details.
* Shipment editing.
* Status updates.
* Tracking event creation.
* Image uploads.
* Location updates.
* ETA updates.

The dashboard becomes the primary operational interface.

---

## Phase 4 — Telegram Bot

Build:

* Telegram authentication/authorization.
* Shipment creation workflow.
* Tracking ID retrieval.
* Shipment status updates.
* Location updates.
* Image uploads.
* Notifications.
* Backend integration.

Telegram should use the existing backend rather than maintaining a separate database.

---

# 34. Phase Dependencies

```text
PHASE 1
Public Website
     │
     ▼
PHASE 2
Backend + Database
     │
     ▼
PHASE 3
Admin Dashboard
     │
     ▼
PHASE 4
Telegram Bot
```

However, these phases should be understood as **development milestones**, not four independent products.

The backend introduced in Phase 2 is the foundation for Phases 3 and 4.

---

# 35. MVP Acceptance Criteria

The MVP is considered functional when the following workflow works end-to-end:

### Step 1

Administrator creates a shipment.

### Step 2

The system generates a unique tracking ID.

Example:

`NMX-842731`

### Step 3

The shipment is stored in the database.

### Step 4

The customer visits the company's website.

### Step 5

The customer enters:

`NMX-842731`

### Step 6

The website retrieves the shipment from the backend.

### Step 7

The customer sees:

* Product description
* Shipment status
* Origin
* Destination
* Tracking history
* Last known location
* Last updated time
* Estimated delivery

### Step 8

Administrator updates the shipment.

Example:

> In Transit → Arrived Destination Country

### Step 9

The backend creates a new tracking event.

### Step 10

The customer searches the tracking ID again and sees the updated status.

### Step 11

The same update can eventually be performed through Telegram.

If this workflow works reliably, the fundamental MVP is working.

---

# 36. Success Metrics

The MVP should initially be evaluated using operational metrics rather than vanity metrics.

Potential measurements:

### Operational

* Time required to create a shipment.
* Time required to update shipment status.
* Number of manual customer status enquiries.
* Number of shipment records successfully created.
* Number of failed tracking searches.

### Customer

* Tracking page usage.
* Successful tracking searches.
* Tracking search error rate.
* Mobile usability.

### System

* API uptime.
* API response time.
* Failed requests.
* Authentication failures.
* Database errors.

---

# 37. Future Expansion

The architecture should leave room for:

### Customer Accounts

Customers could eventually log in and view all of their shipments.

### Automated Notifications

Automatic:

* Email
* SMS
* WhatsApp
* Push notifications

### Carrier Integrations

The platform could eventually consume external carrier APIs.

### GPS Tracking

Vehicles or drivers could transmit location data.

### Payments

Customers could potentially pay for logistics services through the platform.

### Multi-Administrator Roles

Example:

```text
Owner
Manager
Operations
Customer Service
```

### Analytics

Potential metrics:

* Shipment volume
* Average delivery time
* Delivery success rate
* Exception rate
* Geographic distribution

These are explicitly outside the initial MVP unless required.

---

# 38. Technical Architecture Principle

The most important technical rule is:

> **Do not build four separate systems. Build one backend and four interfaces.**

The relationship should be:

```text
             ┌───────────────┐
             │    WEBSITE    │
             └───────┬───────┘
                     │
             ┌───────▼───────┐
             │               │
             │   BACKEND     │
             │               │
             │  Single       │
             │  Source of    │
             │  Truth        │
             │               │
             └───┬───────┬───┘
                 │       │
        ┌────────▼─┐   ┌─▼────────┐
        │ DASHBOARD│   │ TELEGRAM │
        └──────────┘   └──────────┘
                 │       │
                 └───┬───┘
                     ▼
                ┌──────────┐
                │ DATABASE │
                └──────────┘
```

Telegram must never maintain a second independent shipment database.

---

# 39. Documentation Structure

The complete project documentation should be maintained as:

```text
MASTER-PRD.md

phases/
│
├── PHASE-01-PUBLIC-WEBSITE.md
├── PHASE-02-BACKEND.md
└── PHASE-03-ADMIN-DASHBOARD.md
```

The **Master PRD** defines:

* Product vision
* Business problem
* Complete functionality
* Architecture
* Data model
* Product boundaries
* MVP scope
* Phase dependencies
* Acceptance criteria

Each **Phase PRD** should define only the implementation details needed for that phase.

---

# 40. Product Principle

The platform should follow one central principle:

> **Make the customer's experience sophisticated while keeping the company's operational workflow simple.**

The customer should experience:

**Professional website → Tracking ID → Clear shipment history → Current status → Last known location → ETA**

The operator should experience:

**Receive package → Create/update shipment → Done**

The complexity should live in the software, not in the company's daily workflow.
