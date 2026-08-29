# PHASE 05 — PERFORMANCE, RESPONSIVE DESIGN & PRODUCTION POLISH

**Project:** Northlog Logistics Tracking Platform  
**Version:** 1.0  
**Status:** Ready for implementation  
**Previous Phase:** Phase 4 — Telegram Operations & Account Linking

## 1. Objective

Make the existing Northlog platform production-presentable without introducing major new functionality.

Phase 5 must:

- Make the public website fully responsive.
- Make the tracking interface fully responsive.
- Make the admin dashboard fully responsive.
- Improve loading speed and runtime performance.
- Optimize images, fonts, JavaScript, data fetching, and rendering where appropriate.
- Improve accessibility.
- Remove placeholder branding/contact information.
- Change all user-facing **Northline** branding to **Northlog**.
- Remove LinkedIn, X, and Instagram appearances.
- Keep only simple **Privacy Policy** and **Terms** pages.
- Replace placeholder email addresses with `support@northlog.xyz`.
- Replace placeholder phone numbers with **Telegram NorthLog Support**.
- Hide/archive the old office address and map/location rather than destroying the underlying information.
- Remove production-facing localhost references.
- Preserve all working Phase 1–4 functionality.

This is an optimization and production-polish phase, not a feature-expansion phase.

---

## 2. Critical Implementation Rule

Before changing anything:

1. Inspect the complete repository.
2. Inspect all routes and components.
3. Inspect the existing Supabase integration.
4. Inspect authentication.
5. Inspect the dashboard.
6. Inspect Telegram integration.
7. Identify current responsive problems.
8. Identify actual performance bottlenecks.
9. Make targeted changes.

Do not rebuild working systems unnecessarily.

---

# 3. Responsive Design

The following must work properly on:

- Mobile phones
- Tablets
- Laptops
- Desktop monitors

Use the project's existing design system where possible.

If no consistent breakpoint system exists, use approximately:

```text
Mobile:  < 640px
Tablet:  640px–1023px
Desktop: >= 1024px
```

Avoid excessive breakpoint-specific CSS. Prefer fluid layouts.

## 3.1 Public Website

Optimize:

- Header
- Navigation
- Hero
- Services
- About
- Contact
- CTA sections
- Footer
- Images
- Forms

Requirements:

- No horizontal overflow.
- Readable text.
- Usable buttons.
- Correct spacing.
- Responsive images.
- Mobile navigation.
- No clipped content.

## 3.2 Mobile Navigation

Desktop navigation may remain horizontal.

Mobile should use a compact menu/drawer or equivalent.

Requirements:

- Accessible.
- Easy to tap.
- Closes after navigation.
- Does not permanently cover content.
- No horizontal overflow.

## 3.3 Tracking Interface

Tracking is a primary customer-facing experience and must be especially usable on mobile.

Ensure:

- Tracking input fits small screens.
- Status is immediately visible.
- Timeline remains readable.
- ETA is prominent.
- Product details do not overflow.
- Images scale correctly.
- Error states are clear.
- Customs/action-required messages remain visible.
- Maps do not force horizontal scrolling.

Example mobile structure:

```text
TRACK SHIPMENT

[ NMX-842731          ]
[ Track Shipment ]

STATUS
IN TRANSIT

CURRENT LOCATION
Lagos, Nigeria

ESTIMATED DELIVERY
14 Aug 2026, 14:00

TIMELINE
● Shipment received
│
● Departed origin
│
● In transit
│
○ Delivered
```

## 3.4 Admin Dashboard

The dashboard must become genuinely mobile-friendly, not merely technically responsive.

Desktop:

```text
┌──────────────┬─────────────────────────┐
│ Sidebar      │ Main Content            │
│              │                         │
│ Dashboard    │                         │
│ Shipments    │                         │
│ Settings     │                         │
└──────────────┴─────────────────────────┘
```

Mobile:

```text
┌──────────────────────────────┐
│ ☰  Northlog                  │
├──────────────────────────────┤
│                              │
│ Main Content                 │
│                              │
└──────────────────────────────┘
```

The sidebar should collapse into an appropriate mobile navigation.

Dashboard tables must not become unreadable. Use responsive cards, priority-based columns, or controlled horizontal scrolling where appropriate.

Shipment details, forms, modals, status updates, ETA updates, customs controls, and Telegram settings must all be usable on touch devices.

## 3.5 Touch Targets

Interactive controls should generally have practical touch targets around:

```text
44 × 44 px
```

---

# 4. Performance Optimization

Measure before optimizing.

Inspect:

- JavaScript bundle size.
- Large dependencies.
- Unused dependencies.
- Large images.
- Fonts.
- Unnecessary client components.
- Duplicate requests.
- Unnecessary re-renders.
- Slow database queries/fetching.
- Heavy map components.
- Unnecessary client-side fetching.

## 4.1 React / Next.js

Where appropriate:

- Prefer Server Components for non-interactive content.
- Keep Client Components limited to interactive areas.
- Avoid unnecessary `"use client"`.
- Remove unused imports/code.
- Lazy-load genuinely heavy components.
- Avoid duplicate data fetching.
- Avoid unnecessary state.
- Avoid replacing simple functionality with large libraries.

Do not introduce unnecessary architecture.

## 4.2 Images

- Optimize dimensions.
- Avoid oversized assets.
- Use the framework's image optimization where appropriate.
- Lazy-load below-the-fold images.
- Avoid unnecessary background images.
- Use efficient image formats where supported.

## 4.3 Fonts

Prefer the existing system-font strategy if it is already working.

Avoid unnecessary external font requests and unused font weights.

## 4.4 Data Fetching

Review:

- Public tracking.
- Dashboard.
- Shipment details.
- Settings.
- Telegram connection state.

Avoid duplicate and unnecessary requests.

Do not aggressively cache shipment status where it could produce stale operational information.

Correctness takes priority.

## 4.5 Loading States

Provide clear loading states for asynchronous operations:

```text
Tracking shipment...
Loading shipments...
Updating shipment...
Connecting Telegram...
```

Avoid blank screens.

## 4.6 Error States

Do not expose raw database/API/stack-trace errors to users.

Use clear messages such as:

> We couldn't load this shipment. Please try again.

Technical details belong in logs.

## 4.7 Layout Stability

Minimize layout shifts caused by:

- Images.
- Fonts.
- Maps.
- Dynamic content.
- Loading components.

Reserve appropriate space for dynamic components.

---

# 5. Branding — Northline → Northlog

Every **user-facing** appearance of:

```text
Northline
NORTHLINE
northline
```

must become:

```text
Northlog
```

Check:

- Header
- Footer
- Homepage
- About
- Contact
- Tracking
- Admin dashboard
- Login
- Page titles
- Metadata
- Open Graph metadata
- Favicon/manifest metadata where applicable
- Telegram UI
- Error messages
- Empty states
- Legal pages
- Any user-facing configuration

Do not blindly rename technical identifiers, migration history, immutable IDs, or database identifiers if doing so creates unnecessary risk.

The production domain is:

```text
northlog.xyz
```

---

# 6. Contact Information

## 6.1 Email

Replace placeholder emails with:

```text
support@northlog.xyz
```

Use a clickable `mailto:` link where appropriate.

## 6.2 Phone Numbers

Remove placeholder phone numbers from user-facing pages.

Replace phone contact CTAs with:

```text
Telegram NorthLog Support
```

This should link to the company's actual Telegram support channel.

**Do not invent a Telegram username or URL.**

Take the real support URL/username from existing project configuration or request it if it has not been configured.

---

# 7. Social Media Removal

Remove every user-facing appearance of:

```text
LinkedIn
X
Instagram
```

This includes:

- Footer links.
- Social icons.
- Contact-page links.
- Header links.
- Mobile navigation.
- Social CTA sections.

Do not leave dead icons or fake URLs.

---

# 8. Footer

Simplify the footer.

Remove all social media links.

The footer may retain:

```text
© 2026 Northlog

Privacy Policy
Terms
```

No unnecessary social links should remain.

---

# 9. Privacy Policy

Create/retain a simple:

```text
/privacy
```

page.

It must:

- Be accessible from the footer.
- Use Northlog rather than Northline.
- Use `support@northlog.xyz` where appropriate.
- Contain no placeholder contact information.

Do not invent legal certifications, compliance claims, jurisdictions, retention policies, or other claims that have not been established.

---

# 10. Terms

Create/retain a simple:

```text
/terms
```

page.

It must:

- Be accessible from the footer.
- Use Northlog rather than Northline.
- Use `support@northlog.xyz` where appropriate.
- Contain no placeholder company information.

---

# 11. Office Address / Location — ARCHIVE, DO NOT DELETE

The existing office address/location must not be permanently destroyed.

However, it must no longer appear publicly as current company information.

Remove its public rendering from:

- Contact page.
- Footer.
- Inline address sections.
- Location cards.
- Maps.
- Map markers.
- Embedded maps.
- Structured location components.

Preserve the information in an archived/legacy configuration or equivalent project location.

Conceptually:

```text
Old office information
        ↓
Archived / legacy data
        ↓
No public rendering
```

Do not leave the old map pointing to the old office.

Do not fabricate a replacement address.

If the repository contains a map component, disable its public rendering while preserving the underlying legacy information.

---

# 12. Contact Page

The contact page should focus on the actual available support channels.

Recommended structure:

```text
Contact Northlog

Need help with a shipment?

Email
support@northlog.xyz

Telegram
Telegram NorthLog Support

[ Contact Support ]
```

Do not display:

- Old office address.
- Old office map.
- Placeholder phone number.
- LinkedIn.
- X.
- Instagram.

---

# 13. SEO / Metadata

Update all user-facing metadata:

- Page titles.
- Meta descriptions.
- Open Graph titles/descriptions.
- Twitter/X metadata where present.
- Manifest metadata.
- Sitemap.
- Robots configuration.
- Structured data where applicable.

Replace Northline with Northlog.

Do not invent company claims.

---

# 14. Localhost Cleanup

Search the project for:

```text
localhost:3000
```

Production-facing occurrences must be removed/replaced.

Localhost may remain in development documentation or development-only configuration.

It must not remain in:

- Public links.
- Contact buttons.
- Metadata.
- Production configuration.
- Production UI.

---

# 15. Accessibility

Perform a practical accessibility pass.

Check:

- Keyboard navigation.
- Focus states.
- Form labels.
- Button labels.
- Image alt text.
- Color contrast.
- Heading hierarchy.
- Navigation semantics.
- Error messages.
- Screen-reader-friendly controls.

Do not introduce accessibility regressions while making the site responsive.

---

# 16. Security Review

Perform a lightweight security review.

Verify:

- No secrets in client code.
- No Supabase service-role key in browser bundles.
- No Telegram bot token in client code.
- Admin routes remain protected.
- Public tracking exposes only intended public fields.
- Telegram authorization remains enforced.
- Archived office data is not accidentally rendered.
- Contact links expose no internal data.

---

# 17. Performance Targets

Measure before and after optimization.

At minimum inspect:

- Lighthouse Performance.
- Largest Contentful Paint.
- Cumulative Layout Shift.
- Interaction to Next Paint.
- JavaScript bundle size.
- Image sizes.

Recommended public-page targets:

```text
LCP  < 2.5s
CLS  < 0.1
INP  < 200ms
```

These are engineering goals, not reasons to break functionality. If external services/network conditions prevent a target, optimize the application itself and document the external bottleneck.

---

# 18. Responsive Testing

Test representative viewport sizes:

```text
360 × 800
390 × 844
412 × 915
768 × 1024
1024 × 768
1366 × 768
1920 × 1080
```

Verify no important page requires horizontal scrolling.

---

# 19. Functional Regression Testing

## Public Website

- [ ] Navigation works.
- [ ] Mobile navigation works.
- [ ] Contact Support works.
- [ ] Privacy Policy works.
- [ ] Terms works.
- [ ] Tracking entry point works.

## Tracking

- [ ] Valid tracking ID works.
- [ ] Invalid tracking ID works.
- [ ] Status displays.
- [ ] Timeline displays.
- [ ] ETA displays.
- [ ] Customs/action-required state displays.
- [ ] Location/map works where applicable.
- [ ] Mobile tracking works.

## Dashboard

- [ ] Login works.
- [ ] Shipments load.
- [ ] Shipment creation works.
- [ ] Shipment update works.
- [ ] Status updates work.
- [ ] ETA updates work.
- [ ] Customs updates work.
- [ ] Delivery updates work.
- [ ] Telegram settings work.
- [ ] Mobile dashboard works.

## Telegram

- [ ] Account linking works.
- [ ] Authorization works.
- [ ] Shipment creation works.
- [ ] Shipment lookup works.
- [ ] Shipment updates work.
- [ ] Existing workflows remain functional.

---

# 20. Production Configuration

Review environment variables.

Ensure:

- Production site URL is configurable.
- Supabase credentials are correctly separated.
- Telegram secrets remain server-side.
- Telegram support URL/username is configurable.
- No development-only endpoints remain in production.
- No localhost production links remain.

Example:

```text
NEXT_PUBLIC_SITE_URL=https://northlog.xyz
NEXT_PUBLIC_SUPPORT_TELEGRAM_URL=<actual configured support URL>
```

Do not invent the support URL.

---

# 21. Placeholder Cleanup

Perform a final repository search for:

```text
Northline
northline
LinkedIn
Instagram
localhost:3000
@example
XXX
placeholder
```

Also search for placeholder phone numbers and email addresses.

Review each match individually.

Do not blindly replace technical or historical references.

The public-facing product must contain no accidental placeholder company/contact information.

---

# 22. Production Build

Run:

```bash
npm run lint
npm run build
```

Run any existing test commands as well.

Do not ignore build warnings without understanding them.

---

# 23. Implementation Order

The coding agent should implement this phase in this order.

### Step 1 — Audit

Inspect:

- Routes.
- Components.
- Responsive behavior.
- Performance bottlenecks.
- Contact information.
- Branding.
- Social links.
- Office location/map.
- Production configuration.

### Step 2 — Branding and Content Cleanup

Implement:

- Northline → Northlog.
- `support@northlog.xyz`.
- Telegram NorthLog Support.
- Social-media removal.
- Privacy page.
- Terms page.
- Office-location archival/hiding.
- Localhost cleanup.

### Step 3 — Responsive Public Website

Optimize:

- Header.
- Navigation.
- Homepage.
- Services.
- About.
- Contact.
- Footer.

### Step 4 — Responsive Tracking

Optimize:

- Search.
- Shipment information.
- Timeline.
- ETA.
- Customs messages.
- Location/map.

### Step 5 — Responsive Dashboard

Optimize:

- Sidebar/navigation.
- Tables.
- Cards.
- Shipment details.
- Forms.
- Modals.
- Settings.
- Telegram connection interface.

### Step 6 — Performance

Optimize:

- Images.
- Fonts.
- Client/server boundaries.
- JavaScript.
- Data fetching.
- Rendering.
- Heavy components.

### Step 7 — Accessibility

Perform the accessibility pass.

### Step 8 — Regression Testing

Verify Phases 1–4.

### Step 9 — Production Verification

Run:

```bash
npm run lint
npm run build
```

Then test the production configuration.

---

# 24. Definition of Done

## Branding

- [ ] Northline has been replaced by Northlog everywhere user-facing.
- [ ] `northlog.xyz` is configured as the production domain.
- [ ] No accidental placeholder branding remains.

## Contact

- [ ] `support@northlog.xyz` is used wherever an email contact is displayed.
- [ ] Placeholder phone numbers are removed.
- [ ] Telegram NorthLog Support replaces phone CTAs.
- [ ] Actual Telegram support URL is configured.

## Social

- [ ] LinkedIn removed.
- [ ] X removed.
- [ ] Instagram removed.
- [ ] No dead social icons remain.

## Legal

- [ ] Privacy Policy exists.
- [ ] Terms exists.
- [ ] Both are accessible from the footer.
- [ ] Both use Northlog/contact information rather than placeholders.

## Office Location

- [ ] Old office address is no longer publicly displayed.
- [ ] Old map/location is no longer publicly displayed.
- [ ] Existing office information is archived rather than destroyed.

## Responsive

- [ ] Public website works on mobile.
- [ ] Tracking works on mobile.
- [ ] Dashboard works on mobile.
- [ ] Tablet layouts work.
- [ ] Desktop layouts remain functional.
- [ ] No normal page has unintended horizontal overflow.

## Performance

- [ ] Images optimized.
- [ ] Unnecessary client-side JavaScript reduced.
- [ ] Unused dependencies/code reviewed.
- [ ] Data fetching reviewed.
- [ ] Loading states implemented.
- [ ] Layout shifts minimized.
- [ ] Performance measured before/after.

## Quality

- [ ] Accessibility pass completed.
- [ ] Production build succeeds.
- [ ] Lint succeeds.
- [ ] Phase 1–4 functionality remains operational.
- [ ] Production-facing localhost references are removed.

---

# 25. Final Product State

After Phase 5, the platform should behave as one coherent product:

```text
                         NORTHLOG
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
        WEBSITE         TRACKING        ADMIN
            │               │               │
            └───────────────┼───────────────┘
                            │
                         SUPABASE
                            │
                         TELEGRAM
                            │
                    NORTHLOG SUPPORT
```

The customer receives a fast, professional, responsive logistics website and tracking experience.

The operator can use the responsive dashboard and Telegram.

The company can operate the platform without placeholder branding or developer-only configuration.

---

# 26. Final Constraint

**Do not turn Phase 5 into another feature-development phase.**

The primary objective is:

> **Take what already exists and make it fast, responsive, coherent, secure, accessible, and ready to hand over.**

If the coding agent discovers a feature requiring substantial architectural changes, stop and flag it rather than silently expanding Phase 5.
