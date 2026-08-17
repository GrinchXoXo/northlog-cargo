# NORTHLOG — PHASE 7 PRD
## Security Hardening, Security Audit & Production Verification

**Project:** Northlog Logistics Platform  
**Phase:** 7 — Security Hardening  
**Status:** Pre-production / Final Security Pass

## 1. Objective

Audit and harden the existing Northlog application before production use.

Northlog currently consists of:
- Public company website
- Public shipment tracking
- Supabase database and authentication
- Administrator dashboard
- Telegram operational interface/bot
- Cloudflare DNS/CDN/security layer
- Cloudflare Pages hosting
- Shipment/product image storage

The goal is to eliminate obvious and preventable vulnerabilities without turning this small logistics MVP into an unnecessarily complex enterprise system.

Security is risk reduction, not a guarantee. Do not claim the application is “100% secure.”

## 2. Non-Goals

Do not introduce unless a real requirement exists:
- Clerk/Auth0 or another identity provider
- Custom JWT infrastructure
- Custom password hashing
- Multi-tenancy
- Complex RBAC
- Enterprise IAM
- Customer accounts
- Microservices
- Unnecessary security dependencies

Supabase Auth remains the authentication provider.

## 3. Security Model

### Public customers
Allowed:
- Public website
- Public tracking lookup
- Intentionally public shipment information

Not allowed:
- Create/update/delete shipments
- Add tracking events
- Access admin routes
- Access private database fields
- Access credentials or internal operational information

### Administrators
Allowed:
- Authenticated admin access
- Shipment creation/update
- Tracking-event management
- Approved operational functions
- Approved Telegram operations

Every privileged operation must be protected server-side. Hiding a frontend button is not authorization.

### Telegram operators
Telegram is a privileged interface, not an inherently trusted endpoint. Only explicitly authorized Northlog operators may perform privileged actions.

## 4. Secrets & Environment Variables

Audit the repository and Git history for:
- Supabase service-role keys
- Telegram bot tokens
- Telegram webhook secrets
- API keys
- passwords
- SMTP credentials
- Cloudflare API tokens
- Other private credentials

Requirements:
- No secrets in Git.
- No private key in `NEXT_PUBLIC_*`.
- Supabase service-role key never reaches the browser.
- Telegram credentials never enter frontend code.
- Production secrets use deployment environment variables.

If a real credential was previously committed, rotate/revoke it. Deleting it from the current file is not enough.

## 5. Supabase Security

### RLS
Verify RLS is enabled on all private tables, including:
- `shipments`
- `tracking_events`
- admin-related tables
- storage access where applicable

Anonymous users must not be able to directly INSERT, UPDATE, or DELETE shipments or tracking events.

### Public tracking
The public tracking response must expose only the intended public contract, such as:
- tracking ID
- status
- product description
- product image where appropriate
- origin
- destination
- current public location
- estimated delivery information
- public tracking events

It must not expose:
- internal database IDs
- admin information
- private phone/email
- internal notes
- internal costs
- clearance costs
- staff information
- authentication data
- unnecessary internal metadata

Prefer the existing restricted public lookup function/view over broad public table SELECT access.

## 6. Authentication & Authorization

Verify:
- Every `/admin` route requires authentication.
- Unauthenticated requests are rejected/redirected.
- Server-side mutation endpoints verify authentication.
- Database operations cannot be performed merely by manipulating frontend requests.
- Session handling is secure.
- Logout behaves correctly.
- Expired sessions cannot perform privileged actions.

Do not implement custom password hashing. Supabase Auth handles password storage.

## 7. Field Tampering

Never trust sensitive values supplied directly by the browser.

Audit:
- tracking ID
- shipment ID
- status
- timestamps
- ownership
- internal notes
- admin-only fields

A user must not be able to alter another shipment or privileged fields by modifying request parameters.

Sensitive values must be validated and/or constructed server-side.

## 8. Input Validation

Validate:
- tracking IDs
- shipment descriptions
- addresses
- countries/locations
- status values
- dates/timestamps
- query parameters
- request bodies
- Telegram command parameters
- upload metadata

Reject malformed, unexpected, oversized, or invalid input.

## 9. XSS & Content Injection

Audit all operator/user-controlled content.

Requirements:
- Render normal content as text.
- Do not render arbitrary HTML.
- Avoid `dangerouslySetInnerHTML` unless genuinely required.
- Sanitize rich content if required.
- Ensure shipment descriptions cannot execute JavaScript.

Test with harmless XSS payloads.

## 10. File Upload Security

For shipment/product images:
- Restrict MIME types.
- Enforce maximum size.
- Do not trust original filenames.
- Generate controlled storage filenames.
- Reject executable/unnecessary file types.
- Reject HTML/SVG where not required.
- Verify Supabase Storage policies.
- Prevent unauthorized overwriting/deleting.

## 11. Telegram Bot Security

Requirements:
- Bot token is server-side only.
- Webhook secret, if used, is protected.
- Unauthorized Telegram users are rejected.
- Authorized Telegram identities are explicitly defined.
- Command parameters are validated.
- Errors do not reveal secrets or stack traces.
- Bot cannot access arbitrary records without authorization.

Test:
- Authorized operator → succeeds
- Unauthorized user → rejected
- Malformed command → safely rejected
- Unknown shipment → safe error

## 12. Rate Limiting & Abuse Protection

Review protection for:
- Admin login
- Public tracking lookup
- Telegram webhook
- Shipment mutation endpoints
- Upload endpoints

Use Cloudflare capabilities where appropriate.

The MVP does not need a complex distributed rate-limiting system. Prevent obvious brute force, flooding, credential stuffing, and upload abuse.

## 13. Security Headers

Review/configure appropriate headers, including where compatible:
- Content-Security-Policy
- X-Content-Type-Options
- Referrer-Policy
- frame/embedding protection
- Permissions-Policy
- HTTPS enforcement

Test after applying them. A security header that breaks legitimate functionality is not acceptable.

## 14. HTTPS

Verify:
- `https://northlog.xyz` works.
- HTTP redirects to HTTPS.
- No mixed-content resources exist.
- Supabase traffic uses HTTPS.
- Telegram webhook uses HTTPS where applicable.
- Sensitive information is never sent over HTTP.

## 15. Dependency Security

Run:

```bash
npm audit
npm run lint
npm run build
```

Review vulnerabilities instead of blindly upgrading everything.

For relevant findings determine:
1. Whether the package is actually used.
2. Whether the vulnerable path is reachable.
3. Whether an upgrade exists.
4. Whether the upgrade could break the application.
5. Whether the vulnerability affects production.

## 16. Production Error Handling

Production responses must not expose:
- stack traces
- SQL errors
- filesystem paths
- environment variables
- API keys
- internal database details

Customer-facing errors should be safe and actionable.

Server-side logs may contain useful diagnostics without secrets.

## 17. Database Security Tests

Perform unauthenticated tests:

| Test | Expected |
|---|---|
| Read private shipment table | DENIED |
| Insert shipment | DENIED |
| Update shipment | DENIED |
| Delete shipment | DENIED |
| Insert tracking event | DENIED |
| Public tracking lookup | ALLOWED |
| Public lookup returns private fields | DENIED |

## 18. Admin Security Tests

Test:

- Unauthenticated `/admin` → rejected/redirected
- Authenticated admin → allowed
- Authenticated admin mutation → allowed
- Manipulated request against another shipment → rejected
- Manipulated privileged fields → rejected

## 19. Tracking Security Tests

Test:
- Valid tracking ID
- Invalid tracking ID
- Empty ID
- Malformed ID
- Extremely long ID
- SQL-like payload
- HTML payload
- Script payload
- Repeated requests

All must fail safely without exposing database errors.

## 20. Upload Tests

Test:
- Valid image
- Oversized image
- Unsupported file
- Fake image extension
- HTML file
- SVG where not required
- Empty file

Only explicitly permitted files should be accepted.

## 21. Cloudflare Security Review

Verify:
- Domain is behind Cloudflare.
- SSL/TLS is active.
- DNS records are correct.
- Production origin is correct.
- Development Mode is OFF after launch.
- Under Attack Mode is not enabled unless needed.
- Appropriate basic security/WAF protections are active.
- Rate limiting is considered for sensitive endpoints.

Do not enable every Cloudflare feature blindly.

## 22. Storage Security Review

Verify:
1. Who can upload?
2. Who can modify?
3. Who can delete?
4. Who can view?
5. Are public URLs intentional?
6. Can an anonymous user overwrite another shipment image?

Unauthorized modification must be blocked.

## 23. Acceptance Criteria

Phase 7 is complete when:

- [ ] No production secrets are committed to Git.
- [ ] No private keys are exposed client-side.
- [ ] Supabase RLS is enabled and verified.
- [ ] Anonymous database writes are blocked.
- [ ] Admin routes require authentication.
- [ ] Server-side authorization is enforced.
- [ ] Public tracking exposes only intended fields.
- [ ] Input validation is implemented.
- [ ] XSS risks are reviewed.
- [ ] File uploads are restricted.
- [ ] Telegram operations are authorized.
- [ ] Abuse protection is appropriate to the MVP.
- [ ] Security headers are reviewed.
- [ ] HTTPS is verified.
- [ ] Dependencies are reviewed.
- [ ] Production errors do not leak sensitive information.
- [ ] Cloudflare configuration is reviewed.
- [ ] Storage policies are reviewed.
- [ ] Security tests have been performed.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.

## 24. Deliverables

### Security audit report
For every finding document:
- Finding
- Severity
- Affected component
- Evidence
- Fix
- Verification result

Severity:
- CRITICAL
- HIGH
- MEDIUM
- LOW
- INFORMATIONAL

### Code/configuration changes
Commit all required security fixes.

### Production checklist
Provide a final verification checklist.

### Accepted risks
Document any unresolved risks, why they remain, their impact, and future mitigation.

## 25. Engineering Rules

The coding agent MUST:
1. Inspect existing code before changing it.
2. Reuse the current architecture.
3. Avoid unnecessary rewrites.
4. Avoid unnecessary dependencies.
5. Never expose secrets while debugging.
6. Never replace RLS with client-side checks.
7. Never treat frontend restrictions as authorization.
8. Never claim the system is completely secure.
9. Test every security fix.
10. Run the production build after changes.

## 26. Final Outcome

Northlog should be suitable for controlled production use as a small logistics company's MVP.

Target architecture:

```text
CUSTOMER
   │
   ▼
Website / Public Tracking
   │
   ▼
Restricted Public Tracking Contract
   │
   ▼
Supabase Database + RLS
   ▲
   │ authenticated operations
   │
   ├── Admin Dashboard
   │
   └── Authorized Telegram Bot
```

The objective is a secure, maintainable logistics platform without unnecessary enterprise complexity.
