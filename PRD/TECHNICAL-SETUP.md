# Technical Setup & Coding Agent Instructions

## Logistics Shipment Tracking Platform

**Project Type:** Logistics company website + shipment tracking platform  
**Current Phase:** Phase 1 — Public Website  
**Status:** Development Setup  
**Authoritative Product Documents:**

```text
PRD/
├── MASTER-PRD.md
└── PHASE-01-PUBLIC-WEBSITE.md
```

---

# 1. Role

You are the primary AI software engineering agent for this project.

Your responsibility is to implement the product described in the project PRDs while maintaining:

- Clean architecture
- Maintainable code
- Strong separation of concerns
- Good UX
- Responsive design
- Accessibility
- Security
- Minimal unnecessary complexity

You are an implementation agent, not the product owner.

Do not invent business requirements.

---

# 2. Source of Truth

Before writing code, read:

```text
PRD/MASTER-PRD.md
PRD/PHASE-01-PUBLIC-WEBSITE.md
```

The Master PRD defines the overall product.

The Phase PRD defines what should be implemented now.

### Priority

When interpreting requirements:

1. Explicit user instructions in the current task
2. Current Phase PRD
3. Master PRD
4. Existing project architecture
5. Reasonable engineering conventions

If two requirements genuinely conflict, stop and ask for clarification rather than silently choosing a direction that could affect the product.

Do not ask for clarification for trivial implementation details.

Use reasonable engineering judgment for minor decisions.

---

# 3. Current Scope

The current implementation target is:

## Phase 1 — Public Website

Implement:

- Public website
- Responsive navigation
- Home page
- About page
- Services page
- Tracking page
- Contact page
- Tracking input
- Mock tracking results
- Shipment summary
- Tracking timeline
- Last-known-location section
- Estimated delivery
- Contact Support CTA
- Loading state
- Error state
- Temporary branding
- Temporary imagery
- Basic SEO
- Accessibility
- Responsive behavior

Do NOT implement:

- Database
- Supabase
- Authentication
- Admin dashboard
- Telegram bot
- Real shipment creation
- Real shipment updates
- Real tracking API
- GPS tracking
- Customer accounts
- Payment systems
- Notifications

The codebase should be prepared for those future phases but should not implement them prematurely.

---

# 4. Technology Stack

Use the following stack unless a technical limitation makes it unsuitable.

## Frontend

**Next.js**

Use the current stable version available at project initialization.

Use the App Router.

## Language

**TypeScript**

Strict TypeScript should be enabled.

Avoid `any` unless there is a compelling technical reason.

## Styling

**Tailwind CSS**

Use Tailwind for the majority of styling.

Do not introduce another styling framework.

## Icons

Use a lightweight icon library such as:

**Lucide React**

Do not manually create SVG icons unless a custom icon is genuinely required.

## Fonts

Prefer a high-quality web-safe/system font stack initially.

If a custom Google Font materially improves the design, use one or two fonts maximum.

Do not load unnecessary font families.

## Images

Use Next.js image optimization where applicable.

Temporary stock imagery is permitted.

Images must be easy to replace later.

---

# 5. Backend Strategy

There is intentionally no backend implementation in Phase 1.

Phase 2 is expected to introduce:

- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Backend/data access layer

Do not install or configure Supabase during Phase 1 unless required purely for future architecture.

The tracking UI should consume mock data through an abstraction that can later be replaced by a real API/data source.

---

# 6. Deployment Strategy

The intended production deployment is:

**Cloudflare**

The exact Cloudflare deployment mechanism can be determined during deployment preparation.

Do not add unnecessary infrastructure.

Do not introduce:

- Docker
- Kubernetes
- AWS infrastructure
- Separate backend servers
- Redis
- Message queues
- Microservices

unless a later phase has a concrete requirement for them.

---

# 7. Repository Structure

Use a structure approximately like:

```text
project-root/
│
├── PRD/
│   ├── MASTER-PRD.md
│   ├── TECHNICAL-SETUP.md
│   └── PHASE-01-PUBLIC-WEBSITE.md
│
├── public/
│   ├── images/
│   └── icons/
│
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── about/
│   │   ├── services/
│   │   ├── tracking/
│   │   └── contact/
│   │
│   ├── components/
│   │   ├── layout/
│   │   ├── navigation/
│   │   ├── tracking/
│   │   ├── sections/
│   │   └── ui/
│   │
│   ├── data/
│   │   └── mock/
│   │
│   ├── lib/
│   │
│   ├── types/
│   │
│   └── styles/
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.*
└── README.md
```

The exact structure may be adjusted if the framework's conventions make another arrangement cleaner.

Do not create directories that have no meaningful purpose.

---

# 8. Architecture Principles

## 8.1 Separate Content From Presentation

Do not hard-code large amounts of content directly into JSX.

For example, service information should preferably be represented as structured data:

```typescript
const services = [
  {
    title: "...",
    description: "...",
    ...
  }
]
```

Components should render the data.

This will make future CMS/backend integration easier.

---

## 8.2 Separate Mock Data From Components

Tracking mock data must not be embedded throughout the tracking components.

Use something similar to:

```text
src/
└── data/
    └── mock/
        └── shipments.ts
```

Components should receive shipment data as props or through a data-access abstraction.

---

## 8.3 Define Types

Create explicit TypeScript types for shipment data.

For example:

```typescript
type ShipmentStatus =
  | "SHIPMENT_RECEIVED"
  | "PROCESSING"
  | "DEPARTED_ORIGIN"
  | "IN_TRANSIT"
  | "ARRIVED_DESTINATION"
  | "LOCAL_FACILITY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "EXCEPTION";
```

And a shipment type representing the Phase 1 mock data contract.

The type should remain compatible with the data contract described in the Phase 1 PRD.

---

# 9. Design System

Create centralized design tokens.

At minimum:

```text
Colors
Typography
Spacing
Border radius
Shadows
Container width
Breakpoints
Transitions
```

Brand colors must not be scattered throughout the application.

Use CSS variables/Tailwind theme configuration where appropriate.

This is important because:

> The actual company logo, name and brand colors will be supplied later.

Replacing the temporary identity should not require manually editing dozens of components.

---

# 10. Visual Direction

Follow the Phase 1 PRD.

Primary visual reference:

**TruKKer**

Use it for:

- Corporate/logistics feel
- Layout inspiration
- Typography hierarchy
- Hero composition
- Photography
- Service presentation
- General visual confidence

Do not copy its branding, exact layouts, text, assets, or proprietary design.

The final website should be:

**Light-themed + modern + professional + logistics-oriented.**

---

# 11. Tracking UX Direction

Use the Tradlinx B/L tracking experience as a UX reference.

The tracking interface should prioritize:

1. Tracking ID input
2. Current status
3. Shipment summary
4. Timeline
5. Last known location
6. Estimated delivery
7. Contact Support

The tracking experience should be understandable without requiring the user to read large amounts of text.

---

# 12. Component Guidelines

Prefer reusable components where repetition exists.

Examples:

```text
Button
Container
SectionHeading
Header
Footer
TrackingForm
TrackingResult
ShipmentSummary
TrackingTimeline
StatusBadge
LocationCard
DeliveryEstimate
ContactSupport
ServiceCard
```

Do not turn every `<div>` into a component.

Components should represent meaningful UI or behavior.

---

# 13. Page Guidelines

## Home

Should communicate the company proposition immediately.

Primary CTA:

**Track Shipment**

Secondary CTA:

**Contact Support**

The tracking CTA should be visually prominent.

---

## About

Should establish trust and explain the company.

Do not fabricate business claims.

Use placeholders where necessary.

---

## Services

Present only confirmed services.

Use temporary placeholders where the actual services are not yet supplied.

---

## Tracking

This is the most important functional page.

It must support:

```text
Initial state
↓
Tracking ID entered
↓
Loading
↓
Success
OR
↓
Not found
OR
↓
Error
```

---

## Contact

Provide the company's contact information using placeholders where necessary.

The contact form can remain frontend-only in Phase 1.

---

# 14. Mock Data Requirements

Create at least one complete realistic shipment.

Example:

```typescript
{
  trackingId: "NMX-842731",
  product: {
    description: "Nike Air Max Shoes",
    image: "/images/placeholder-package.jpg"
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
  events: [...]
}
```

The mock tracking flow should allow:

```text
NMX-842731
```

to return the mock shipment.

Any other tracking ID should return the not-found state.

---

# 15. Future Backend Boundary

Create a small abstraction between the UI and shipment data.

Conceptually:

```text
Tracking UI
     ↓
Shipment data function
     ↓
Mock data
```

In Phase 2 this becomes:

```text
Tracking UI
     ↓
Shipment data function
     ↓
Backend/API
     ↓
Supabase
```

The UI should not need to know whether the shipment came from mock data or the backend.

---

# 16. Responsive Design

Implement mobile-first.

Test at minimum:

- 320px
- 375px
- 768px
- 1024px
- 1440px+

The website must not:

- Overflow horizontally
- Break navigation
- Produce unreadable text
- Create inaccessible buttons
- Require zooming
- Have overlapping elements

The tracking timeline is particularly important to test on mobile.

---

# 17. Accessibility

Follow basic WCAG principles.

Requirements:

- Semantic HTML
- Proper heading hierarchy
- Form labels
- Keyboard navigation
- Visible focus states
- Accessible buttons
- Meaningful alt text
- Sufficient color contrast
- No color-only status indicators
- Reduced-motion support

Do not sacrifice accessibility for visual effects.

---

# 18. SEO

Every public page should have appropriate:

- Title
- Description
- Canonical URL where appropriate
- Open Graph metadata

Use semantic headings.

Do not create fake SEO content.

Do not keyword-stuff pages.

---

# 19. Performance

Prioritize:

- Optimized images
- Lazy loading
- Minimal JavaScript
- Efficient fonts
- Static rendering where possible
- No unnecessary third-party scripts

Do not install packages simply because they are popular.

Every dependency should have a reason.

---

# 20. Security

Even though Phase 1 has no backend:

- Never put secrets in the frontend.
- Never commit `.env` files containing secrets.
- Do not expose future API keys.
- Do not trust client-side validation as security.
- Sanitize user-generated content when rendering it.
- Keep tracking data limited to the mock/public contract.

---

# 21. Environment Variables

Create:

```text
.env.example
```

Only include variables actually required by Phase 1.

Do not invent credentials.

Do not create fake API keys.

Future backend variables can be introduced during Phase 2.

---

# 22. Git Workflow

Use meaningful commits.

Examples:

```text
feat: initialize Next.js application
feat: add responsive navigation
feat: implement homepage
feat: add tracking interface
feat: add mock shipment data
feat: implement tracking states
feat: add responsive styles
fix: correct mobile timeline overflow
fix: improve tracking error state
```

Avoid commits such as:

```text
stuff
changes
final
final2
please work
```

Keep commits logically grouped.

---

# 23. Development Workflow

Before implementing a significant feature:

1. Read the relevant PRD section.
2. Inspect the existing code.
3. Determine the smallest clean implementation.
4. Implement.
5. Run lint/type checks.
6. Run the development build.
7. Test the relevant UI.
8. Fix errors.
9. Review responsiveness.
10. Continue.

Do not rewrite unrelated working code.

---

# 24. AI Agent Behavior

The coding agent should:

### Do

- Inspect existing files before modifying them.
- Reuse existing components.
- Prefer simple solutions.
- Keep types explicit.
- Keep business logic separate from presentation.
- Test changes.
- Explain significant architectural decisions.
- Flag ambiguity that materially affects the product.
- Maintain the PRD scope.

### Do Not

- Rewrite the entire project unnecessarily.
- Install unnecessary packages.
- Add backend infrastructure during Phase 1.
- Invent business requirements.
- Add fake testimonials.
- Add fake company statistics.
- Add fake certifications.
- Claim real-time GPS tracking.
- Copy reference websites.
- Add excessive animations.
- Add features simply because they are common in AI-generated websites.

---

# 25. Important Rule: Do Not Overbuild

The project is an MVP for a small logistics company.

Do not build enterprise infrastructure for an enterprise that does not exist.

Avoid:

- Microservices
- Complex state-management systems
- GraphQL
- Kubernetes
- Redis
- Event buses
- Complex CMS systems
- Elaborate analytics
- Multi-tenant architecture
- Complex role systems
- Payment infrastructure

unless a later PRD explicitly requires them.

Simple is preferred.

---

# 26. Quality Standard

The website should not look like:

> "An AI generated website."

It should look like:

> "A professional logistics company's website."

That means:

- Consistent spacing
- Strong typography
- Good visual hierarchy
- Intentional imagery
- Clear CTAs
- Good mobile behavior
- Appropriate white space
- Realistic logistics content
- No unnecessary visual gimmicks

---

# 27. Temporary Assets

Use placeholders for:

- Company logo
- Company name
- Favicon
- Contact details
- Address
- Social links

Use free stock imagery when useful.

Organize temporary assets so they can be removed before client delivery.

Do not embed temporary assets throughout the codebase in a way that makes removal difficult.

---

# 28. Testing Requirements

At minimum, manually test:

### Navigation

- Every navigation link.
- Mobile menu.
- CTA buttons.

### Tracking

- Empty submission.
- Valid tracking ID.
- Invalid tracking ID.
- Loading state.
- Error state.
- Shipment result.
- Mobile timeline.

### Responsive

- Mobile.
- Tablet.
- Desktop.

### Accessibility

- Keyboard navigation.
- Form labels.
- Focus states.
- Heading hierarchy.

### Build

Run:

```bash
npm run lint
npm run build
```

before considering Phase 1 complete.

If the project contains automated tests, run those as well.

---

# 29. Definition of Done

Phase 1 implementation is complete only when:

- [ ] All Phase 1 pages exist.
- [ ] Navigation works.
- [ ] Website is responsive.
- [ ] Temporary branding is consistent.
- [ ] Tracking UI works with mock data.
- [ ] Tracking loading state works.
- [ ] Tracking not-found state works.
- [ ] Tracking error state exists.
- [ ] Shipment result displays correctly.
- [ ] Timeline works.
- [ ] Last known location works.
- [ ] Estimated delivery works.
- [ ] Sender name appears.
- [ ] Contact Support CTA appears.
- [ ] SEO metadata exists.
- [ ] Accessibility requirements are addressed.
- [ ] No Phase 2–4 functionality has been implemented.
- [ ] Lint passes.
- [ ] Production build passes.
- [ ] No unnecessary dependencies have been introduced.

---

# 30. Final Instruction Before Coding

Do not immediately start generating the entire application.

First:

1. Read `PRD/MASTER-PRD.md`.
2. Read `PRD/PHASE-01-PUBLIC-WEBSITE.md`.
3. Inspect the repository.
4. Propose the initial technical implementation plan.
5. Identify any genuinely blocking ambiguities.
6. Initialize the project.
7. Implement Phase 1 incrementally.

After each major implementation step, verify that the application still builds and that previously working functionality remains intact.

The goal is not maximum code output.

The goal is a **clean, polished, maintainable Phase 1 implementation that can become the foundation for Phases 2–4.**