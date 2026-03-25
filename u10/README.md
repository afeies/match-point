# User Story
As a tournament organizer, I want to upgrade to a premium subscription so that I can access advanced features like stream overlays and automated video uploads without ads on my event pages.

Why This Matters
Without a monetization path, MatchPoint cannot sustain itself. The freemium model converts the platform's most engaged users — frequent organizers — into paying customers, providing recurring revenue that funds ongoing development.

Machine Acceptance Criteria


POST /api/subscriptions creates a Stripe payment intent and returns a client secret for frontend confirmation.

Subscription status is marked active on the organizer account within 60 seconds of successful payment.

Premium-gated features return 403 for non-subscribers and 200 for active subscribers.

An expired or cancelled subscription correctly reverts the account to the free tier within 1 hour.

GET /api/subscriptions/:user_id returns current subscription status and expiry date.
Human Acceptance Criteria

The upgrade flow from the organizer dashboard to an active premium account completes in under 3 minutes.

A premium badge is visible on the organizer's public profile after successful payment.

Premium features are immediately accessible after payment confirmation — no manual intervention needed.

The organizer receives a clear confirmation (on-screen and via email) with their subscription details.


# Screens
- Checkout
- Payment Error
- Processing Payment
- Subscription Plans
- Upgrade Successful

# UI States
- Empty
- Loading
- Error
- Success

# Design Rationale

## Navigation
- **Why this screen exists:** Organizers need a clear upgrade path from the free tier to premium, allowing them to unlock advanced features (stream overlays, ad-free pages, automated uploads) without leaving the platform.
- **How users reach it:** From the organizer dashboard via a prominent "Upgrade to Premium" button or banner. The Subscription Plans screen is the entry point; users proceed linearly through Checkout → Processing Payment → Upgrade Successful (or Payment Error on failure).

## Component Reuse
- Standard card component for each subscription tier on the Plans screen
- Shared primary action button used for "Subscribe" and "Retry Payment"
- Global nav bar persists across all screens for consistent orientation
- Shared toast/notification component for success and error confirmations
- Loading spinner component reused on the Processing Payment screen

## Accessibility
- Color contrast meets WCAG 2.1 AA (minimum 4.5:1 for text, 3:1 for large text and UI components)
- All action buttons are at least 44×44 px tap targets
- Plan cards and buttons have descriptive labels (e.g., "Select Monthly Plan — $9.99/month") for screen readers
- Payment error messages use both color and icon to convey status (not color alone)
- Focus order follows the logical upgrade flow: plans → checkout form → submit

# UI Element Mapping
| Element | Purpose | User Story |
|--------|--------|-----------|
| Plan card | Displays subscription tier, price, and feature list | Upgrade to premium |
| Subscribe button | Initiates Stripe checkout for the selected plan | Upgrade to premium |
| Checkout form | Collects payment details via Stripe Elements | Upgrade to premium |
| Processing spinner | Indicates payment is being confirmed | Upgrade to premium |
| Success confirmation | Shows premium badge and subscription details after payment | Upgrade to premium |
| Error banner | Displays payment failure reason with a retry option | Upgrade to premium |
| Premium badge | Indicates active premium status on the organizer profile | Upgrade to premium |
| Upgrade CTA banner | Prompts free-tier organizers to explore premium plans | Upgrade to premium |