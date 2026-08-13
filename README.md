This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Pre-registration (free courses)

Phone → OTP → application → private Discord invite. Anyone can sign up; the
existing student database is untouched.

**Setup**

1. Run `supabase-preregistration.sql` in the Supabase SQL editor. It adds the
   `applications` table and a `students.is_pre_registration` flag.
2. Set `SUPABASE_SERVICE_ROLE_KEY` (see `.env.example`). **Required.**
   `applications` holds personal ID numbers, so it has RLS on with no policies —
   the public anon key cannot read it and only the service role can.
3. Set `DISCORD_INVITE_URL`, or `DISCORD_BOT_TOKEN` + `DISCORD_CHANNEL_ID` for
   single-use per-applicant invites.

**New people vs. existing students**

`students.is_pre_registration` is the permanent marker — `status` changes as you
process someone (`applicant` → accepted), where they came from doesn't.

```sql
SELECT * FROM students WHERE is_pre_registration;  -- everyone who signed up new
```

- **Newcomers** must complete `/apply` before reaching any other page, and don't
  see the certificate request card (they've never taken a course here).
- **Existing students** are never forced into the application and keep the
  certificate request form exactly as before. They get an opt-in banner on the
  dashboard if they want to join the new programme.

`/admin/applications` lists everything with a new/existing badge, a filter, and
a CSV export.

**Checks**

```bash
npx tsx scripts/check-middleware.ts   # routing: who sees what, and no redirect loops
```

**Careful:** `/api/auth/send-otp` now sends to numbers that aren't in the
database yet, which is what makes self-registration possible. It's rate limited
to one code per minute and 5 per hour per number — don't loosen that without
thinking about the SMS bill.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
