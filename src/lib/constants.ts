/**
 * Brand and contact constants.
 *
 * Everything here is centralized so branding and contact info are only
 * ever defined once. No component should hard-code these strings
 * directly.
 */

export const SITE_NAME = "Northlog Cargo";
export const SITE_SHORT_NAME = "Northlog";
export const SITE_TAGLINE = "Reliable Logistics. Clear Visibility.";

// Reads from NEXT_PUBLIC_SITE_URL (see .env.local / .env.example) so the
// real domain can be set per-environment without a code change.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://northlog.xyz";

export const CONTACT = {
  email: "support@northlog.xyz",
  emailHref: "mailto:support@northlog.xyz",
  telegramLabel: "Telegram Northlog Support",
  telegramHref: "https://t.me/NorthlogSupport",
};

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Tracking", href: "/tracking" },
  { label: "Contact", href: "/contact" },
];
