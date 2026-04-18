# V Grand Group — WhatsApp Bot Setup Guide

## ⚠️ First: Rotate Your Access Token (Do This Now)

Your access token was shared in a chat — treat it as compromised.

1. Go to business.facebook.com
2. Settings → Users → System Users
3. Click your system user → Generate New Token
4. Select app, check: `whatsapp_business_messaging` + `whatsapp_business_management`
5. Copy the new token → put in `.env.local` as `WHATSAPP_ACCESS_TOKEN`

---

## Step 1 — Supabase Setup (5 minutes)

1. Go to supabase.com → New Project
2. Name it: `vgrand-production`
3. SQL Editor → New Query → paste contents of `supabase/schema.sql` → Run
4. Settings → API → copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`
5. Authentication → Users → Add User:
   - Email: admin@vgrandgroup.com
   - Password: (strong password for client)

---

## Step 2 — Deploy to Vercel (5 minutes)

1. Push code to GitHub
2. vercel.com → New Project → Import from GitHub
3. Add all environment variables from `.env.example`
4. Deploy → get live URL: `https://vgrandgroup.com`

---

## Step 3 — Register Webhook with Meta (5 minutes)

1. developers.facebook.com → Your App
2. Left menu: WhatsApp → Configuration
3. Webhooks section → Edit
4. Callback URL: `https://vgrandgroup.com/api/whatsapp-webhook`
5. Verify Token: `vgrand_webhook_secret_2024` (must match your env var)
6. Click Verify and Save
7. Subscribe to field: **messages** ✓

---

## Step 4 — Test the Bot

Send "Hi" to your WhatsApp Business number.

Expected flow:
```
You:  Hi
Bot:  Welcome to V Grand Infra! Which location?
      [Ongole] [Koppolu] [Other]

You:  [tap Ongole]
Bot:  What is your budget?
      [Under ₹40L] [₹40L–₹80L] [₹80L+]

You:  [tap ₹40L–₹80L]
Bot:  What type of property?
      [2 BHK] [3 BHK] [Villa/Plot]

You:  [tap 2 BHK]
Bot:  Please reply with your name and phone number.
      Example: Ravi Kumar, 9876543210

You:  Ravi Kumar, 9876543210
Bot:  Thank you Ravi! Our team will call within 2 hours.

→ Lead appears in admin panel instantly
→ Agent gets WhatsApp notification
```

---

## Step 5 — Use the WhatsApp Button on Site

```jsx
// In your root layout.jsx — floating button on ALL pages
import WhatsAppButton from '@/components/WhatsAppButton';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <WhatsAppButton
          phoneNumber={process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}
          variant="floating"
        />
      </body>
    </html>
  );
}

// In project detail page
<WhatsAppButton
  phoneNumber={process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}
  variant="banner"
  projectName={project.name}
/>
```

---

## Files In This Package

```
├── app/
│   ├── api/
│   │   └── whatsapp-webhook/
│   │       └── route.js          ← The bot brain
│   ├── admin/
│   │   └── leads/
│   │       └── page.jsx          ← Admin leads dashboard
│   └── components/
│       └── WhatsAppButton.jsx    ← WhatsApp button (3 variants)
├── supabase/
│   └── schema.sql                ← Database tables + RLS
├── docs/
│   └── MASTER_BUILD_PROMPT.txt  ← Paste into Lovable/Cursor
└── .env.example                  ← All env vars needed
```

---

## Monthly Running Cost

| Service | Cost |
|---------|------|
| Supabase | ₹0 (free tier) |
| Vercel | ₹0 (free tier) |
| Meta WhatsApp API | ₹0 for first 1000 conversations/month |
| **Total** | **₹0/month to start** |

Meta charges only after 1000 conversations/month — roughly ₹0.50–₹1.50 per conversation above that.
No WATI needed. No ₹3,500/month subscription.
