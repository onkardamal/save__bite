
# SaveBite (FoodRescue AI)

SaveBite is a lightweight food-inventory and donation demo app that helps you track items, reduce waste, find NGOs, and (optionally) use Gemini-powered features like food scanning and recipe generation.

## Features

- **Auth (local demo)**: email/password signup + login, plus a demo shortcut account.
- **Inventory**: add/edit/delete items, filter/search, see expiry status, swipe actions.
- **Donations**: only safe, non-expired food can be donated; donors must confirm food is safe before handover (see [Secure food donation](#secure-food-donation)). When the donor confirms, the app prepares **full handover details** for the NGO (donor name & phone, items with expiry, date/time, mode, notes) and opens the donor's email client so they can send it to the NGO—no “upcoming delivery” without data.
- **NGO Map**: browse demo NGOs; optionally search nearby NGOs using Gemini.
- **Recipes**: optionally generate recipes from your inventory using Gemini.
- **Dark mode**: persistent theme toggle.

## Run Locally

### Prerequisites

- Node.js (LTS recommended)

### Install

```bash
npm install
```

### Configure (optional AI features)

AI features are **optional**. The app runs without them.

Create a `.env.local` (or `.env`) in the project root:

```bash
# Required for NGO search (Donate + NGO Map) and AI features (scan, recipes). Get key: https://aistudio.google.com/apikey
GEMINI_API_KEY=YOUR_KEY_HERE
```

For **Vercel** (or any host): add `GEMINI_API_KEY` in the project’s Environment Variables and redeploy so the build can inject it. Without it, only demo NGOs are shown.

## Firebase Auth (optional but recommended)

To enable Firebase email/password and Google sign-in, add these to the same `.env.local` (or `.env`) file:

```bash
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

**Send NGO handover emails (optional)**

To have the app **actually send** the handover email to the NGO (instead of only opening your mail client), use [EmailJS](https://www.emailjs.com/):

1. Sign up at emailjs.com, add an email service (e.g. Gmail), and create a template.
2. In the template, set **To** to `{{to_email}}`, **Subject** to `{{subject}}`, and the body to `{{message}}` (or use the plain content you want; the app sends `to_email`, `subject`, `message`, plus `ngo_name`, `donor_name`, `donor_phone`, `handover_date`, `handover_time`, `handover_mode`).
3. Add to `.env.local`:

```bash
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

If these are not set, the app falls back to opening the donor’s email client (mailto) so they can send the message manually.

### Start dev server

```bash
npm run dev
```

Vite is configured to run on:

- `http://localhost:3000/`

## Demo login

Use the built-in demo shortcut on the login screen:

- **Email**: `demo@ecotable.dev`
- **Password**: `password123`

## Build for production

```bash
npm run build
npm run preview
```

## Notes

- This repo uses a CDN Tailwind setup for styling plus a small `index.css` for accessibility focus styling.
- If `GEMINI_API_KEY` is not set, AI actions will show a friendly message instead of crashing the app.
- If Firebase env vars are not set, the app will still render but Firebase auth flows will fail at runtime; for a quick demo, you can continue using the built-in demo login (`demo@ecotable.dev` / `password123`).

## NGO notification (full handover details)

When a donor completes the donation flow and clicks **Confirm Handover Info**, the app:

1. Builds a **handover summary** containing: NGO name, donor name and phone, handover date and time, dropoff/pickup mode, **every item with name, quantity, unit, expiry date, and condition**, and the donor's notes.
2. If the NGO has an email on file: **If EmailJS is configured** (see env vars above), the app **sends the email** to the NGO automatically. Otherwise it opens the donor's email client (mailto) so the donor can send it manually.
3. If the NGO has no email: the donor can use **Copy handover summary** and paste it into WhatsApp, SMS, or another channel.

So NGOs never receive only a generic “upcoming delivery” message—they get the full data they need to plan and coordinate.

## Secure food donation

To protect recipients, the app enforces safe food delivery:

- **Eligibility**: Only items that are not expired and do not have an unsafe condition (e.g. spoiled, moldy, damaged) appear in the donation flow. Logic lives in `utils/donationSafety.ts` (`isEligibleForDonation`).
- **Donor pledge**: Before confirming handover, the donor must check a box confirming that the food is safe to consume, properly stored, and not damaged or contaminated.
- **No bypass**: Expired or unsafe items are never shown as selectable for donation.

## Internationalization (i18n)

- The app supports **English**, **Hindi**, and **Marathi** using `i18next` / `react-i18next`.
- Language can be switched via the **sidebar** (desktop) or via **Profile → Preferences → Language** (mobile/tablet; Profile is in the bottom navigation).
- Translations live in `locales/en/common.json` and `locales/hi/common.json`.
- To add a new language:
  - Create `locales/<lang>/common.json` mirroring the keys in the existing files.
  - Register the language in `i18n.ts` by adding it to the `resources` object.
  - Add the new language option to the selector in `App.tsx`.
