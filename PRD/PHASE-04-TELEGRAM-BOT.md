# PHASE 04 — TELEGRAM OPERATIONS & ACCOUNT LINKING

**Project:** Logistics Shipment Tracking Platform  
**Version:** 2.0  
**Status:** Ready for implementation  
**Previous Phase:** Phase 3 — Administrator Operations Dashboard  
**Next Phase:** Phase 5 — Performance & Responsive Optimization

## 1. Purpose

Phase 4 introduces a Telegram-based operational interface that allows authorized administrators to manage routine logistics operations directly from Telegram.

The goal is to make shipment management fast and practical for a small logistics company whose operators may primarily work from their phones.

The Telegram interface will allow administrators to:

- Create shipments
- Upload shipment/package images
- Retrieve shipment information
- Update shipment status
- Update shipment location
- Update estimated delivery time
- Manage customs-clearance states
- Add customer-facing action messages
- Add tracking events/notes
- Mark shipments as delivered

The Telegram interface must use the **same Supabase database and application business logic** already used by the dashboard.

## 2. Product Experience

The intended experience is:

```text
Admin logs into Dashboard
        ↓
Settings
        ↓
Connect Telegram
        ↓
Telegram opens
        ↓
User presses "Start"
        ↓
Secure one-time linking
        ↓
Telegram account linked
        ↓
BOT READY
```

The administrator should not need to find or submit their Telegram ID, ask the developer to whitelist them, edit environment variables, enter Supabase credentials, or create a separate Telegram password.

## 3. Core Architecture

Telegram is an **alternative interface to the existing logistics system**, not a separate application.

```text
                    SUPABASE
                       │
              Application Services
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
   ADMIN DASHBOARD             TELEGRAM BOT
          │                         │
          └────────────┬────────────┘
                       │
                       ▼
                SAME SHIPMENTS
                       │
                       ▼
               PUBLIC TRACKING
```

A shipment created through Telegram must appear in the dashboard. A shipment created through the dashboard must be accessible through Telegram. Updates from either interface must affect the same underlying shipment and public tracking data.

## 4. Scope

### In Scope

- Telegram bot
- Telegram account linking
- Administrator authorization
- Shipment creation
- Package image upload
- Shipment lookup
- Shipment status updates
- Location updates
- ETA updates
- Customs updates
- Customer action messages
- Tracking events
- Delivery completion
- Basic help interface
- Workflow cancellation and timeout
- Error handling
- Dashboard "Connect Telegram" interface
- Telegram connection status
- Telegram disconnect/revoke functionality
- Account-to-Telegram association
- Telegram webhook/bot integration
- Shared shipment service layer

### Out of Scope

- Full OAuth provider implementation
- Customer Telegram accounts
- Customer authentication through Telegram
- WhatsApp/SMS
- AI conversational logistics assistant
- GPS hardware integration
- Automatic carrier API integration
- Payments/accounting/inventory/CRM
- Advanced analytics
- Automated customs payment collection

## 5. Authentication & Account Linking

The existing Supabase Auth administrator account remains the primary identity. Telegram is a linked operational channel.

```text
Supabase Admin Account
        │
        └──── Telegram Account
```

### Linking Flow

```text
Admin Dashboard
    ↓
Settings
    ↓
Telegram
    ↓
[ Connect Telegram ]
    ↓
Short-lived one-time token
    ↓
Telegram deep link
    ↓
Bot asks for confirmation
    ↓
[ Connect Account ]
    ↓
Telegram account linked to admin
```

The linking token must be cryptographically random, short-lived, single-use, associated with one authenticated administrator, invalidated after successful use, and must never expose Supabase credentials.

Recommended expiration: **5–15 minutes**.

After linking, store the immutable Telegram numeric user ID internally against the administrator account.

Conceptual relationship:

```text
admin_user
    │
    └── telegram_account
            ├── telegram_user_id
            ├── linked_at
            └── active
```

## 6. Multiple Administrators

The system must support multiple administrators.

```text
Company
 ├── Admin A
 │     └── Telegram A
 │
 └── Admin B
       └── Telegram B
```

Each administrator can independently connect their Telegram account.

A Telegram ID must not be hard-coded into environment variables.

## 7. Disconnect / Reconnect

Dashboard must provide:

> **Disconnect Telegram**

Disconnecting must deactivate the Telegram association without affecting shipment data.

The administrator must be able to reconnect later using the same linking flow, without developer intervention.

If an administrator is removed or disabled, the linked Telegram account must immediately lose administrative authorization.

## 8. Telegram Bot

Create a dedicated Telegram bot using the Telegram Bot API.

Store the bot token server-side:

```text
TELEGRAM_BOT_TOKEN
```

Never commit the token to source control.

Every Telegram request must verify:

```text
Telegram User
      ↓
Linked Telegram Account
      ↓
Active Admin Account
      ↓
Authorized Operation
```

Unauthorized users must receive a friendly message directing them to connect Telegram from the Admin Dashboard.

## 9. Bot Commands

MVP commands:

```text
/start
/help
/create
/track
/update
/cancel
```

`/recent` is optional and should only be implemented if clearly useful.

## 10. `/start` and `/help`

For linked administrators:

```text
Welcome to Northline Operations.

What would you like to do?

[ Create Shipment ]
[ Track Shipment ]
[ Update Shipment ]
```

For unlinked users:

```text
Your Telegram account is not connected.

Please connect Telegram from your administrator dashboard.
```

If `/start` contains a valid linking token, the bot should process the account-linking flow.

`/help` should explain available operations concisely.

## 11. Shipment Creation

Recommended guided workflow:

```text
/create
   ↓
Sender
   ↓
Product
   ↓
Origin
   ↓
Destination
   ↓
Package image
   ↓
ETA
   ↓
Confirmation
   ↓
Create shipment
```

Required fields:

- Sender name
- Product description
- Origin
- Destination

Package image may be optional.

ETA should support predictable inputs such as:

```text
48 hours
```

or:

```text
14 Aug 2026 14:00
```

The backend must convert the input to the canonical `estimated_delivery_at` value.

Do not build complex natural-language date interpretation unless the existing application already supports it reliably.

## 12. Package Image

When an image is supplied:

1. Receive the Telegram file.
2. Validate file type and size.
3. Download it server-side.
4. Upload it to the existing Supabase Storage implementation.
5. Associate the resulting storage path with the shipment.

Do not make public tracking permanently dependent on Telegram file URLs.

If upload fails:

> Image upload failed. Please try again.

## 13. Shipment Confirmation

Before creation, show a summary:

```text
Please confirm:

Sender:
John Doe

Product:
Nike Air Max Shoes

Origin:
Guangzhou, China

Destination:
Lagos, Nigeria

ETA:
14 Aug 2026, 14:00

Image:
Attached

Create shipment?

[ Confirm ]
[ Cancel ]
```

The shipment must not be created before confirmation.

After creation:

```text
Shipment created successfully.

Tracking ID:
NMX-842731

[ View Tracking ]
[ Create Another ]
```

The backend generates the tracking ID. Telegram must never generate it.

## 14. Tracking Lookup

`/track` asks for a tracking ID and displays relevant information:

```text
Tracking ID: NMX-842731

Sender:
John Doe

Product:
Nike Air Max Shoes

Destination:
Lagos, Nigeria

Status:
IN TRANSIT

Current Location:
Lagos, Nigeria

Estimated Delivery:
14 Aug 2026, 14:00
```

Do not expose sensitive internal information.

## 15. Shipment Updates

`/update` asks for a tracking ID and then provides:

```text
Current status:
IN TRANSIT

What would you like to update?

[ Status ]
[ Location ]
[ ETA ]
[ Customs ]
[ Note ]
```

Use the exact valid statuses already defined in the Phase 2 schema. Do not create conflicting status enums.

Example status flow may include:

```text
Received at Origin
Processing
Departed Origin
In Transit
Arrived Destination Country
Customs Clearance
Received Local Facility
Out for Delivery
Delivered
Exception
```

Before significant status changes, show confirmation:

```text
Change status?

IN TRANSIT
      ↓
CUSTOMS CLEARANCE

[ Confirm ]
[ Cancel ]
```

After confirmation:

1. Update shipment.
2. Create tracking event.
3. Update relevant timestamps.
4. Return success.

## 16. Location Updates

Prompt:

> Enter current shipment location.

Example:

```text
Lagos, Nigeria
```

Save through the existing shipment service.

If coordinates are already supported, they may be used. Do not build GPS tracking in Phase 4.

## 17. ETA Updates

Prompt:

> Enter new estimated delivery.

Example:

```text
14 Aug 2026 14:00
```

Save the canonical timestamp and confirm the update.

## 18. Customs Workflow

Support at minimum:

```text
[ Awaiting Clearance ]
[ Cleared ]
```

When awaiting clearance:

1. Set appropriate shipment status.
2. Set customer action requirement.
3. Create tracking event.
4. Allow a customer-facing message.

Example:

> Your shipment is currently awaiting customs clearance. Please contact support to proceed.

When cleared:

1. Remove the customer action requirement.
2. Create a tracking event.
3. Allow the operator to select the next status.
4. Allow ETA update.

## 19. Customer Action

Allow:

```text
Customer action required?

[ Yes ]
[ No ]
```

If enabled, prompt for the customer-facing message.

This must use the existing public tracking data model.

## 20. Notes / Tracking Events

Allow the operator to add operational updates, for example:

> Package held at customs pending clearance.

Where appropriate, create a tracking event.

Do not expose internal-only notes publicly. If the current database does not distinguish internal and public notes, inspect the existing schema before modifying it.

## 21. Delivered

When marking a shipment delivered, require confirmation:

```text
Mark NMX-842731 as DELIVERED?

[ Confirm ]
[ Cancel ]
```

After confirmation:

- Update status.
- Create tracking event.
- Set delivery timestamp.
- Clear obsolete ETA/action states where appropriate.

## 22. Conversation State

Telegram workflows require temporary state.

Example:

```text
Creating Shipment
      ↓
Waiting for Sender
      ↓
Waiting for Product
      ↓
Waiting for Origin
      ↓
Waiting for Destination
      ↓
Waiting for Image
      ↓
Waiting for ETA
      ↓
Waiting for Confirmation
```

Do not rely solely on server memory for production state. Use a durable mechanism appropriate to the existing architecture.

Incomplete workflows should expire after approximately **15–30 minutes**.

`/cancel` must discard the current temporary workflow without deleting existing shipments.

## 23. Backend Architecture

Telegram must reuse the existing application service/data-access layer.

Expected logical operations include:

```text
createShipment()
getShipmentByTrackingId()
updateShipmentStatus()
addTrackingEvent()
updateShipmentLocation()
updateShipmentETA()
setCustomerAction()
uploadShipmentImage()
```

The exact implementation must follow the existing repository architecture.

Do not duplicate shipment business logic inside Telegram handlers.

## 24. Single Source of Truth

All interfaces use the same underlying shipment data:

```text
Web Dashboard
Telegram
Public Tracking
```

Telegram-created:

```text
Telegram
   ↓
Supabase
   ↓
Dashboard + Public Tracking
```

Dashboard-created:

```text
Dashboard
   ↓
Supabase
   ↓
Telegram + Public Tracking
```

There must be only one shipment record per shipment.

## 25. Dashboard Telegram Settings

### Not connected

```text
Telegram

Connect Telegram to manage shipments from your phone.

[ Connect Telegram ]
```

### Connected

```text
Telegram

Connected as:
@username

Connected:
13 Aug 2026

[ Disconnect Telegram ]
```

## 26. Telegram UI

Prefer Telegram inline keyboards for predictable actions.

Example:

```text
What would you like to do?

[ Create Shipment ]
[ Track Shipment ]
[ Update Shipment ]
```

Use text input only for free-form information.

Keep messages concise and mobile-friendly.

## 27. Error Handling

Examples:

**Shipment not found**

> Shipment not found. Please check the tracking ID.

**Database failure**

> We couldn't update this shipment. No changes were saved.

**Unauthorized Telegram**

> Your Telegram account is not connected to an administrator account.

**Link expired**

> This connection link has expired. Please generate a new one from the Admin Dashboard.

**Image failure**

> The image could not be uploaded. Please try again.

Never expose stack traces, SQL errors, API keys, tokens, or internal infrastructure details.

## 28. Duplicate Submission Protection

Prevent duplicate operations caused by:

- Double-clicking confirmation buttons.
- Telegram retries.
- Delayed responses.
- Repeated confirmation messages.

The backend remains authoritative and tracking IDs remain unique.

## 29. Logging

Log important operational events:

- Administrator ID
- Telegram user ID
- Operation
- Timestamp
- Shipment ID where applicable
- Success/failure

Never log:

- Passwords
- Telegram bot token
- Supabase service-role key
- Used linking tokens
- Other secrets

## 30. Deployment

The Telegram bot must run server-side in the project's deployment environment. It must not depend on the developer's local computer.

```text
Telegram
   ↓
Bot Backend
   ↓
Application Services
   ↓
Supabase
```

Use the project's existing hosting strategy where possible.

Do not introduce paid infrastructure unnecessarily.

## 31. Cost Constraint

Use:

- Existing Supabase infrastructure
- Existing application hosting
- Telegram Bot API
- Existing project dependencies where practical

Avoid paid SaaS automation platforms unless absolutely necessary.

## 32. Security Requirements

Mandatory:

- Telegram bot token remains server-side.
- Supabase service-role key remains server-side.
- Linking tokens are short-lived.
- Linking tokens are single-use.
- Telegram accounts must be explicitly linked.
- Disconnected administrators lose Telegram access.
- Unauthorized Telegram users cannot access shipment data.
- Telegram cannot bypass existing application authorization.
- Public tracking never exposes private administrative information.

## 33. Performance Requirements

Telegram interactions should feel responsive.

Avoid unnecessary database queries and repeated shipment retrievals when data is already available in the active workflow.

## 34. Acceptance Criteria — Account Linking

- [ ] Admin can log into existing dashboard.
- [ ] Admin can see Telegram connection settings.
- [ ] Admin can click "Connect Telegram".
- [ ] Telegram opens through a deep link.
- [ ] Bot recognizes the temporary linking token.
- [ ] Admin confirms connection.
- [ ] Telegram account is linked to the correct admin account.
- [ ] Linking token expires.
- [ ] Linking token cannot be reused.
- [ ] Admin can disconnect Telegram.
- [ ] Disconnected Telegram account loses administrative access.
- [ ] No developer intervention is required to connect/disconnect an administrator.

## 35. Acceptance Criteria — Telegram

- [ ] `/start` works.
- [ ] `/help` works.
- [ ] `/create` works.
- [ ] `/track` works.
- [ ] `/update` works.
- [ ] `/cancel` works.
- [ ] Unauthorized Telegram accounts are rejected.
- [ ] Authorized administrators can create shipments.
- [ ] Package images can be uploaded.
- [ ] Backend generates tracking IDs.
- [ ] Shipments appear in the dashboard.
- [ ] Shipments appear on public tracking.
- [ ] Existing shipments can be retrieved.
- [ ] Status can be changed.
- [ ] Tracking events are created.
- [ ] Location can be updated.
- [ ] ETA can be updated.
- [ ] Customs status can be updated.
- [ ] Customer action can be enabled/disabled.
- [ ] Customer-facing messages work.
- [ ] Shipments can be marked delivered.

## 36. Cross-System Acceptance Test

```text
ADMIN DASHBOARD
       ↓
Connect Telegram
       ↓
Telegram
       ↓
Start
       ↓
Account successfully linked
       ↓
/create
       ↓
Create shipment
       ↓
NMX-XXXXXX generated
       ↓
PUBLIC TRACKING
       ↓
Shipment visible
       ↓
TELEGRAM
       ↓
/update
       ↓
Set IN TRANSIT
       ↓
PUBLIC TRACKING
       ↓
IN TRANSIT
       ↓
TELEGRAM
       ↓
Set CUSTOMS CLEARANCE
       ↓
Customer action enabled
       ↓
PUBLIC TRACKING
       ↓
Customs warning/action displayed
       ↓
TELEGRAM
       ↓
Customs CLEARED
       ↓
Update ETA
       ↓
PUBLIC TRACKING
       ↓
Updated ETA
       ↓
TELEGRAM
       ↓
DELIVERED
       ↓
PUBLIC TRACKING
       ↓
DELIVERED
```

## 37. Definition of Done

Phase 4 is complete when a new administrator can independently:

1. Log into the admin dashboard.
2. Connect their own Telegram account.
3. Open the Telegram bot.
4. Create a shipment.
5. Receive the generated tracking ID.
6. Update that shipment from Telegram.
7. See changes reflected in the dashboard.
8. See changes reflected on public tracking.
9. Disconnect Telegram.
10. Reconnect Telegram without developer assistance.

The product should feel like one logistics platform with three interfaces:

```text
             LOGISTICS PLATFORM
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
     Website     Dashboard    Telegram
        │           │           │
        └───────────┼───────────┘
                    │
                 Supabase
```

## 38. Implementation Instructions for Coding Agent

Before modifying anything:

1. Read `MASTER-PRD.md`.
2. Read `TECHNICAL-SETUP.md`.
3. Read Phase 1 PRD.
4. Read Phase 2 PRD.
5. Read Phase 3 PRD.
6. Inspect the actual repository.
7. Inspect the existing Supabase schema.
8. Inspect existing migrations.
9. Inspect existing authentication implementation.
10. Inspect existing shipment service/data-access functions.
11. Inspect existing storage implementation.
12. Inspect existing dashboard shipment operations.

Then:

13. Design the Telegram account-linking mechanism.
14. Implement linking before shipment workflows.
15. Reuse existing shipment business logic.
16. Do not duplicate shipment logic inside Telegram handlers.
17. Do not modify already-applied migrations unnecessarily.
18. If schema changes are required, create a new migration.
19. Keep all secrets server-side.
20. Implement authorization before operational functionality.
21. Build shipment creation.
22. Build shipment lookup.
23. Build shipment updates.
24. Build customs workflow.
25. Build delivery workflow.
26. Implement error handling.
27. Implement workflow timeout/cancellation.
28. Test Telegram ↔ Supabase.
29. Test Telegram ↔ Dashboard.
30. Test Telegram ↔ Public Tracking.
31. Test account disconnection.
32. Test account reconnection.
33. Run lint.
34. Run production build.
35. Confirm all previous phases remain functional.

## 39. Critical Product Rule

**Do not turn this into an AI assistant.**

The goal is not:

> "Talk naturally to the bot and let AI figure out what you mean."

The goal is:

> **"Give a small logistics operator a fast, reliable mobile interface for routine shipment operations."**

Use guided workflows and buttons wherever possible.

Predictability is more important than intelligence.

## 40. Phase 4 Completion State

```text
PHASE 1
Public Website
       +
PHASE 2
Supabase + Tracking Backend
       +
PHASE 3
Admin Dashboard
       +
PHASE 4
Telegram + Self-Service Account Linking
       ↓
COMPLETE FUNCTIONAL MVP
       ↓
PHASE 5
Performance + Mobile/Responsive Optimization
       ↓
PHASE 6
Production QA + Hardening
```

**Phase 4 should end with the company being able to operate the system without needing you to manually configure their Telegram account.**
