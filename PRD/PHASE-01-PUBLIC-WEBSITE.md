# Phase 01 --- Public Website

## Logistics Shipment Tracking & Corporate Website

**Version:** 1.0\
**Status:** Ready for implementation\
**Parent Document:** `MASTER-PRD.md`\
**Phase:** 1 of 4\
**Primary Users:** Public visitors / prospective customers / shipment
recipients

------------------------------------------------------------------------

## 1. Purpose

Phase 1 delivers the public-facing website for the logistics company.

The website has two primary jobs:

1.  Present the company as a credible, modern logistics/shipping
    business.
2.  Provide a clear entry point for customers to track a shipment.

The website should be visually polished and production-quality, but it
must **not** attempt to implement the backend, administrator dashboard,
or Telegram operations system in this phase.

The tracking interface should be built with a clean frontend
architecture so that it can be connected to the real backend in Phase 2.

------------------------------------------------------------------------

# 2. Reference Direction

## 2.1 Primary Creative Reference --- TruKKer

**Reference:** TruKKer logistics website

Use TruKKer primarily for:

-   Overall corporate/logistics visual language
-   Strong hero composition
-   Confident typography
-   Clear section hierarchy
-   Large imagery
-   Service presentation
-   Trust/credibility sections
-   Modern logistics positioning
-   Clear calls-to-action

### Adaptation

Do **not** reproduce TruKKer's website or branding.

The desired direction is:

> **TruKKer's modern logistics/corporate feel, adapted into a lighter,
> cleaner visual system.**

The site should use a predominantly light background rather than a dark
theme.

The color relationships may take inspiration from TruKKer, but the
client's eventual brand colors must remain replaceable because the real
logo, company name, favicon, and brand identity are not yet available.

------------------------------------------------------------------------

## 2.2 Tracking UX Reference --- Tradlinx B/L Tracking

**Reference:** Tradlinx Bill of Lading Tracking interface

Use Tradlinx primarily for:

-   Prominent tracking input
-   Simple tracking interaction
-   Clear information hierarchy
-   Shipment status/location/ETA emphasis
-   Professional freight/shipping UX
-   Minimal friction between entering a tracking number and receiving
    results

The tracking experience should be simplified for this company's smaller
operational model.

The platform uses its own internally generated tracking IDs rather than
Master B/L numbers, so the UI and terminology must use **Tracking ID /
Tracking Number**.

------------------------------------------------------------------------

# 3. Design Direction

## 3.1 Overall Aesthetic

The design should feel:

-   Modern
-   Professional
-   Trustworthy
-   Clean
-   Premium without being luxurious
-   Operational
-   Technology-enabled
-   Human
-   Corporate but not sterile

Avoid:

-   Generic AI SaaS aesthetics
-   Excessive gradients
-   Excessive glassmorphism
-   Neon colors
-   Huge decorative blobs
-   Random 3D objects
-   Cartoon logistics illustrations
-   Excessive animations
-   Overly dark interfaces
-   Excessive card grids

The site should look like a **real logistics company**, not a template
for a startup.

------------------------------------------------------------------------

## 3.2 Theme

Primary theme:

**Light**

Use:

-   White / off-white surfaces
-   Dark text
-   Strong brand accent color
-   Subtle neutral backgrounds
-   Clear borders/dividers where useful
-   High contrast CTA buttons

The final brand palette is intentionally unspecified because the
company's real brand assets will be supplied later.

The implementation must therefore make the color system easy to replace
globally.

------------------------------------------------------------------------

# 4. Temporary Brand System

Because final brand assets are not yet available, use placeholders.

### Company Name

`[LOGISTICS COMPANY]`

### Logo

Use a simple text-based placeholder or neutral geometric mark.

Do not create a detailed permanent logo.

### Favicon

Use a temporary generic favicon.

### Brand Colors

Use a temporary neutral/accent palette that is easy to replace.

All brand colors must be defined through centralized design tokens/CSS
variables rather than scattered throughout components.

### Important

The temporary identity must be clearly structured so the final logo,
company name, favicon, and colors can be replaced without redesigning
the website.

------------------------------------------------------------------------

# 5. Temporary Imagery

Use free-to-use stock imagery only where imagery materially improves the
design.

Possible image categories:

-   Freight transportation
-   Cargo containers
-   Logistics operations
-   Warehouses
-   Shipping/port operations
-   Delivery personnel
-   Packages
-   Transportation infrastructure

Suitable temporary sources may include free stock-image libraries such
as Unsplash or Pexels.

### Requirements

-   Images must be replaceable.
-   Do not hard-code the design around a particular stock image.
-   Avoid images containing prominent third-party logos.
-   Avoid images that imply services the company does not actually
    provide.
-   Prefer realistic logistics photography over generic illustrations.

All temporary images should be easy to remove or replace before client
delivery.

------------------------------------------------------------------------

# 6. Target Audience

Primary audiences:

### Existing Customers

People who already have a shipment and want to check its status.

### Prospective Customers

People evaluating the company as a shipping/logistics provider.

### Business Customers

Companies seeking logistics/shipping services.

The website should therefore balance:

**Trust + service information + immediate shipment tracking.**

------------------------------------------------------------------------

# 7. Sitemap

MVP pages:

``` text
/
├── Home
├── About
├── Services
├── Tracking
└── Contact
```

Optional sections may exist within these pages.

Do not create unnecessary pages simply to make the site appear larger.

------------------------------------------------------------------------

# 8. Global Navigation

The navigation should contain:

-   Logo / company name
-   Home
-   About
-   Services
-   Tracking
-   Contact

Primary CTA:

**Track Shipment**

The CTA should be visually prominent.

On mobile:

-   Use a compact navigation menu.
-   Keep the tracking CTA easy to reach.

------------------------------------------------------------------------

# 9. Home Page

## 9.1 Hero

The hero is the primary conversion/positioning section.

It should communicate:

-   What the company does.
-   Why customers should trust it.
-   A clear action to track an existing shipment.

Suggested structure:

``` text
[Eyebrow]

Reliable Logistics. Clear Visibility.

[Short supporting statement explaining the company's
shipping/logistics service.]

[Track Your Shipment] [Contact Support]

[Large logistics image / visual]
```

The final copy should remain editable.

Do not make unsupported claims such as:

-   "Fastest shipping"
-   "100% guaranteed delivery"
-   "Real-time GPS tracking"
-   "Worldwide delivery"

unless the company confirms them.

------------------------------------------------------------------------

# 10. Tracking Entry Section

Tracking must be one of the most prominent elements on the website.

It may appear:

-   In the hero
-   Immediately below the hero
-   As a dedicated section
-   On a dedicated Tracking page

The homepage should provide a direct tracking entry point.

### Tracking UI

``` text
Track Your Shipment

Enter your tracking number to view the latest
shipment status and delivery information.

[ Tracking ID __________________ ] [Track Shipment]
```

The input should have a clear label.

Placeholder:

`e.g. NMX-842731`

Button:

`Track Shipment`

------------------------------------------------------------------------

# 11. Tracking Page

Route:

`/tracking`

The page should be designed as a standalone customer utility.

## Initial State

Display:

-   Page heading
-   Short explanation
-   Tracking input
-   Track button
-   Contact Support option

Example:

``` text
Track Your Shipment

Enter your tracking ID to view your shipment's
latest status, location and estimated delivery.

[ Enter Tracking ID ]
[ Track Shipment ]

Need help?
[ Contact Support ]
```

------------------------------------------------------------------------

# 12. Tracking Result Interface

Phase 1 should implement the frontend structure for a tracking result.

Because the backend does not exist yet, use **mock data**.

The component must later be able to consume a backend response without
requiring a redesign.

------------------------------------------------------------------------

## 12.1 Result Header

Display:

-   Tracking ID
-   Current status
-   Last updated time

Example:

``` text
NMX-842731

IN TRANSIT

Last updated 18 minutes ago
```

------------------------------------------------------------------------

## 12.2 Shipment Summary

Display:

-   Product image
-   Product description
-   Sender name
-   Origin
-   Destination
-   Estimated delivery

Example:

``` text
Nike Air Max Shoes

Sender
John Doe

From
Guangzhou, China

To
Lagos, Nigeria

Estimated Delivery
August 14, 2026
```

The sender name must be included.

Recipient information should not be displayed unless the company later
confirms that it should be public.

------------------------------------------------------------------------

# 13. Tracking Timeline

The tracking timeline is a major component.

Example:

``` text
✓ Shipment Received
  Guangzhou, China
  Aug 06, 2026 — 09:42

✓ Departed Origin
  Guangzhou, China
  Aug 06, 2026 — 18:20

✓ In Transit
  International Transit
  Aug 07, 2026 — 04:15

● Arrived in Destination Country
  Pending

○ Received at Local Facility
  Pending

○ Out for Delivery
  Pending

○ Delivered
  Pending
```

The component must support:

-   Completed events
-   Current event
-   Pending events
-   Dates
-   Times
-   Locations
-   Optional event notes

The visual distinction between completed/current/pending states should
be obvious without relying solely on color.

------------------------------------------------------------------------

# 14. Last Known Location

Display a dedicated location section.

Example:

``` text
Last Known Location

Lagos, Nigeria

Last updated 18 minutes ago
```

If coordinates are available later, the section should be capable of
displaying a map.

For Phase 1, the map may be a visual placeholder or omitted.

Do **not** imply that the location is live GPS data.

Use language such as:

**Last known location**

and

**Last updated**

------------------------------------------------------------------------

# 15. Estimated Delivery

Estimated delivery should be visually prominent but clearly
distinguished from a guaranteed delivery date.

Example:

``` text
Estimated Delivery

August 14–16, 2026
```

Avoid wording such as:

> Guaranteed delivery: August 14

unless explicitly supported by the business.

------------------------------------------------------------------------

# 16. Contact Support

A **Contact Support** action must be available from the tracking
experience.

Recommended locations:

-   Tracking page
-   Tracking result
-   Footer
-   Contact page

The button may initially link to the Contact page.

Future phases may connect it to:

-   WhatsApp
-   Telegram
-   Phone
-   Email
-   Support ticketing

Do not implement complex support functionality in Phase 1.

------------------------------------------------------------------------

# 17. About Page

The About page should communicate:

-   Who the company is
-   What it does
-   Where it operates
-   Its approach to logistics
-   Why customers should trust it

Use temporary copy where company information is not yet available.

Do not invent certifications, fleet sizes, years of operation, countries
served, partnerships, or performance claims.

------------------------------------------------------------------------

# 18. Services Page

The Services page should present the company's confirmed logistics
services.

Potential structure:

``` text
Services

[Service 1]
Short description

[Service 2]
Short description

[Service 3]
Short description
```

Use placeholders until the company confirms its actual service offering.

Do not assume the company provides:

-   Air freight
-   Sea freight
-   Road freight
-   Warehousing
-   Customs clearance
-   Last-mile delivery

unless confirmed.

------------------------------------------------------------------------

# 19. Contact Page

The Contact page should provide:

-   Phone number placeholder
-   Email placeholder
-   Address placeholder
-   Business hours placeholder
-   Contact form
-   Map placeholder if location is confirmed

The contact form in Phase 1 may be frontend-only if the backend has not
yet been implemented.

The form must clearly indicate that it is a placeholder if it cannot
actually submit yet.

------------------------------------------------------------------------

# 20. Footer

The footer should contain:

-   Company name
-   Short company description
-   Navigation
-   Tracking link
-   Contact link
-   Contact information placeholders
-   Social links placeholders
-   Copyright
-   Privacy Policy placeholder
-   Terms placeholder

------------------------------------------------------------------------

# 21. Responsive Requirements

The website must be designed mobile-first.

### Mobile

-   Navigation collapses cleanly.
-   Tracking input and button stack appropriately.
-   Shipment timeline remains readable.
-   Product image scales correctly.
-   No horizontal scrolling.
-   CTA buttons remain accessible.
-   Text remains readable without zooming.

### Tablet

Use appropriate two-column layouts where beneficial.

### Desktop

Use:

-   Wide hero compositions
-   Two-column content sections
-   Appropriate whitespace
-   Large imagery
-   Clear visual hierarchy

Do not stretch content across the entire viewport unnecessarily.

------------------------------------------------------------------------

# 22. Accessibility

The website should:

-   Use semantic HTML.
-   Provide labels for form fields.
-   Maintain keyboard accessibility.
-   Maintain adequate color contrast.
-   Provide meaningful alt text.
-   Avoid communicating information through color alone.
-   Provide visible focus states.
-   Ensure buttons and links are distinguishable.

The tracking timeline must remain understandable for users who cannot
distinguish colors.

------------------------------------------------------------------------

# 23. SEO

Phase 1 should include:

-   Page titles
-   Meta descriptions
-   Semantic headings
-   Descriptive URLs
-   Open Graph metadata
-   Favicon
-   Sitemap configuration where appropriate
-   Robots configuration
-   Descriptive image alt text

Primary SEO intent:

-   Company name
-   Logistics services
-   Shipping services
-   Geographic service area

Do not engage in keyword stuffing.

------------------------------------------------------------------------

# 24. Performance

The website should prioritize:

-   Optimized images
-   Responsive images
-   Lazy loading for below-the-fold imagery
-   Minimal client-side JavaScript
-   Efficient fonts
-   No unnecessary third-party scripts
-   Static/semi-static rendering where possible

The public website should not require a backend request merely to render
ordinary company information.

The tracking interface is the primary area expected to become
backend-dependent.

------------------------------------------------------------------------

# 25. Animation & Motion

Use subtle motion only where it improves usability or visual polish.

Examples:

-   Button hover states
-   Navigation transitions
-   Timeline appearance
-   Section reveal
-   Loading states

Avoid:

-   Excessive parallax
-   Constant movement
-   Large animated backgrounds
-   Distracting scroll effects

Respect reduced-motion accessibility preferences.

------------------------------------------------------------------------

# 26. Loading States

The tracking interface must eventually support:

### Loading

``` text
Finding your shipment...
```

### Success

Display shipment details.

### Not Found

``` text
We couldn't find a shipment with that tracking ID.

Please check the number and try again.
```

### Server Error

``` text
We couldn't retrieve your shipment right now.

Please try again shortly or contact support.
```

Phase 1 should implement these states using mock data.

------------------------------------------------------------------------

# 27. Mock Tracking Data

Create a realistic mock shipment for development.

Example:

``` text
Tracking ID:
NMX-842731

Product:
Nike Air Max Shoes

Sender:
John Doe

Origin:
Guangzhou, China

Destination:
Lagos, Nigeria

Status:
In Transit

Last Known Location:
International Transit

Estimated Delivery:
August 14–16, 2026
```

Tracking events:

``` text
Shipment Received
Guangzhou, China
August 6, 2026 — 09:42

Departed Origin
Guangzhou, China
August 6, 2026 — 18:20

In Transit
International Transit
August 7, 2026 — 04:15
```

The mock data must be isolated from the UI components so it can be
replaced by API data in Phase 2.

------------------------------------------------------------------------

# 28. Component Architecture

The implementation should be component-based.

Likely reusable components:

``` text
Header
Footer
Button
Container
Section
Hero
TrackingForm
TrackingResult
ShipmentSummary
StatusBadge
TrackingTimeline
LocationCard
DeliveryEstimate
ContactSupport
ServiceCard
ContactForm
LoadingState
ErrorState
```

Do not create unnecessary abstractions.

Components should be reusable where there is a genuine reason.

------------------------------------------------------------------------

# 29. Backend Boundary

Phase 1 must **not** implement:

-   Database
-   Admin authentication
-   Admin dashboard
-   Telegram bot
-   Real shipment creation
-   Real shipment updates
-   Real tracking API
-   GPS tracking
-   Automated notifications
-   Customer accounts

However, the frontend must be structured so these can be connected
later.

The tracking result component should consume a clearly defined mock data
structure.

------------------------------------------------------------------------

# 30. Suggested Frontend Data Contract

The Phase 1 tracking UI should expect an object conceptually similar to:

``` javascript
{
  trackingId: "NMX-842731",
  product: {
    description: "Nike Air Max Shoes",
    image: "/placeholder-package.jpg"
  },
  sender: {
    name: "John Doe"
  },
  origin: "Guangzhou, China",
  destination: "Lagos, Nigeria",
  status: "IN_TRANSIT",
  currentLocation: {
    label: "International Transit",
    latitude: null,
    longitude: null,
    updatedAt: "2026-08-07T04:15:00Z"
  },
  estimatedDelivery: {
    from: "2026-08-14",
    to: "2026-08-16"
  },
  events: [
    {
      status: "SHIPMENT_RECEIVED",
      location: "Guangzhou, China",
      timestamp: "2026-08-06T09:42:00Z"
    },
    {
      status: "DEPARTED_ORIGIN",
      location: "Guangzhou, China",
      timestamp: "2026-08-06T18:20:00Z"
    },
    {
      status: "IN_TRANSIT",
      location: "International Transit",
      timestamp: "2026-08-07T04:15:00Z"
    }
  ]
}
```

The exact API contract will be finalized in Phase 2.

------------------------------------------------------------------------

# 31. Design Tokens

Centralize:

-   Colors
-   Typography
-   Spacing
-   Border radius
-   Shadows
-   Container widths
-   Breakpoints
-   Transitions

Example conceptual structure:

``` text
--color-background
--color-surface
--color-text
--color-muted
--color-primary
--color-primary-hover
--color-border
--radius-sm
--radius-md
--radius-lg
--shadow-sm
--shadow-md
```

The exact values are implementation decisions.

The important requirement is that branding can later be replaced
centrally.

------------------------------------------------------------------------

# 32. Content Rules

Do not invent business facts.

Where information is unknown, use clearly marked placeholders:

``` text
[COMPANY NAME]
[PHONE NUMBER]
[EMAIL ADDRESS]
[OFFICE ADDRESS]
[SERVICE DESCRIPTION]
```

Temporary marketing copy may be created for the prototype, but it must
not make factual claims that the company has not confirmed.

------------------------------------------------------------------------

# 33. Deliverables

Phase 1 is expected to produce:

1.  Responsive public website.
2.  Home page.
3.  About page.
4.  Services page.
5.  Tracking page.
6.  Contact page.
7.  Responsive navigation.
8.  Tracking form.
9.  Mock tracking result.
10. Shipment timeline.
11. Last-known-location component.
12. Estimated-delivery component.
13. Contact Support CTA.
14. Loading/error states.
15. Temporary logo/favicon.
16. Temporary imagery.
17. SEO metadata.
18. Accessible semantic markup.
19. Centralized design tokens.
20. Clean component structure ready for backend integration.

------------------------------------------------------------------------

# 34. Acceptance Criteria

Phase 1 is complete when:

### Website

-   [ ] Home page is complete.
-   [ ] About page is complete.
-   [ ] Services page is complete.
-   [ ] Tracking page is complete.
-   [ ] Contact page is complete.
-   [ ] Navigation works on mobile and desktop.
-   [ ] Footer is complete.
-   [ ] Temporary branding is consistent.

### Tracking

-   [ ] User can enter a tracking ID.
-   [ ] User can submit the tracking form.
-   [ ] Valid mock tracking ID displays shipment results.
-   [ ] Invalid tracking ID displays an error state.
-   [ ] Loading state exists.
-   [ ] Shipment status is clearly displayed.
-   [ ] Sender name is displayed.
-   [ ] Product description is displayed.
-   [ ] Product image is displayed.
-   [ ] Origin and destination are displayed.
-   [ ] Tracking timeline is displayed.
-   [ ] Last known location is displayed.
-   [ ] Last updated time is displayed.
-   [ ] Estimated delivery is displayed.
-   [ ] Contact Support is accessible.

### Technical

-   [ ] Mock data is isolated from presentation components.
-   [ ] No Phase 2--4 functionality has been implemented.
-   [ ] No sensitive information is exposed.
-   [ ] Website works on mobile.
-   [ ] Website works on desktop.
-   [ ] Basic accessibility requirements are met.
-   [ ] Basic SEO requirements are implemented.
-   [ ] Temporary assets can be replaced easily.

------------------------------------------------------------------------

# 35. Definition of Done

Phase 1 is considered done when a user can visit the website, understand
what the logistics company does, navigate the site, open the tracking
interface, enter a sample tracking ID, and receive a convincing
shipment-tracking experience using mock data.

The implementation must be sufficiently structured that Phase 2 can
replace the mock tracking data with a backend API without redesigning
the tracking interface.

------------------------------------------------------------------------

# 36. Explicit Scope Boundary

**Phase 1 = Public Website + Frontend Tracking Experience.**

Do not build:

> Backend → Database → Authentication → Admin Dashboard → Telegram Bot

during this phase.

The only backend-related work allowed is architectural preparation for
the future API integration.

The goal is to finish Phase 1 with a **convincing, polished,
static/semi-static logistics website and a realistic tracking
interface**, not a partially built full-stack system.

------------------------------------------------------------------------

# 37. Implementation Instruction

The coding agent should read:

`PRD/MASTER-PRD.md`

before implementing this document.

This file is the authoritative specification for Phase 1.

When requirements conflict:

1.  Follow explicit requirements in this Phase 1 PRD.
2.  Follow the broader product constraints in the Master PRD.
3.  Do not invent business functionality.
4.  Do not implement later-phase functionality.
5.  Ask for clarification only when a missing requirement blocks
    implementation; otherwise use clearly marked placeholders.

The implementation should prioritize a polished result over unnecessary
technical complexity.
