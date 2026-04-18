# Email Notifications Setup Guide

## Overview

This guide explains how to set up email notifications for guestbook entries. When someone submits a guestbook entry, the admin receives an email with an "Approve" button that opens the dashboard directly to that entry.

---

## Prerequisites

1. **Supabase CLI** installed (`brew install supabase/tap/supabase` on Mac)
2. **Resend account** (free tier: 3,000 emails/month) at https://resend.com
3. **Access to Supabase dashboard** for your project

---

## Step 1: Create Resend Account

1. Go to https://resend.com and sign up
2. Verify your email address
3. Go to **API Keys** in dashboard
4. Click "Create API Key"
5. Name it "RTLWE263 Guestbook Notifications"
6. Copy the API key (starts with `re_`)
7. **Save this key securely** - you'll need it in Step 3

---

## Step 2: Verify Your Domain (Optional but Recommended)

**Without domain verification:**
- You can send emails from `onboarding@resend.dev`
- Emails may go to spam
- Limited to 100 emails/day

**With domain verification (recommended):**
- Send from `noreply@lwe623.uk` or `guestbook@lwe623.uk`
- Better deliverability
- Full 3,000 emails/month limit

### To verify domain:

1. In Resend dashboard, go to **Domains**
2. Click "Add Domain"
3. Enter: `lwe623.uk`
4. Follow instructions to add DNS records:
   - Add the TXT record to your DNS (Vercel or domain registrar)
   - Add the CNAME record for DKIM
5. Wait for verification (usually 5-10 minutes)

---

## Step 3: Configure Supabase Edge Function

### 3a. Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Or using npm
npm install -g supabase
```

### 3b. Login to Supabase

```bash
supabase login
```

### 3c. Link Your Project

```bash
cd rtlwe263-website
supabase link --project-ref tvshplxcgdfzvtxvqzvl
```

### 3d. Set Secrets

```bash
# Set Resend API key (replace <YOUR_KEY> with actual key from Step 1)
supabase secrets set RESEND_API_KEY <YOUR_KEY>
```

### 3e. Deploy Edge Function

```bash
supabase functions deploy send-guestbook-email
```

You should see:
```
✓ Deployed Function send-guestbook-email
  URL: https://tvshplxcgdfzvtxvqzvl.supabase.co/functions/v1/send-guestbook-email
```

---

## Step 4: Create Database Trigger

The Edge Function needs to be triggered when a new guestbook entry is inserted.

### Option A: Using Supabase Dashboard (Easiest)

1. Go to https://supabase.com/dashboard
2. Navigate to your project: `tvshplxcgdfzvtxvqzvl`
3. Go to **Database** → **Webhooks**
4. Click "Enable Webhooks" (if not already enabled)
5. Click "Create Webhook"
6. Configure:
   - **Name:** `send_guestbook_email_on_insert`
   - **Table:** `guestbook_entries`
   - **Events:** Check only `INSERT`
   - **Type:** `HTTP Request`
   - **URL:** `https://tvshplxcgdfzvtxvqzvl.supabase.co/functions/v1/send-guestbook-email`
   - **Method:** `POST`
   - **Headers:**
     - Key: `Authorization`
     - Value: `Bearer YOUR_SERVICE_ROLE_KEY`
       (Find this in Supabase → Settings → API → service_role key)
   - **Payload:** `Send record data`
7. Click "Create Webhook"

### Option B: Using SQL (Advanced)

Run this SQL in Supabase SQL Editor:

```sql
-- Create function to call Edge Function
CREATE OR REPLACE FUNCTION notify_guestbook_entry()
RETURNS TRIGGER AS $$
DECLARE
  payload JSON;
BEGIN
  -- Build payload with new row data
  payload := json_build_object(
    'record', row_to_json(NEW)
  );

  -- Call Edge Function using pg_net (requires pg_net extension)
  PERFORM
    net.http_post(
      url := 'https://tvshplxcgdfzvtxvqzvl.supabase.co/functions/v1/send-guestbook-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := payload::jsonb
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_guestbook_entry_inserted ON guestbook_entries;
CREATE TRIGGER on_guestbook_entry_inserted
  AFTER INSERT ON guestbook_entries
  FOR EACH ROW
  EXECUTE FUNCTION notify_guestbook_entry();
```

---

## Step 5: Update Edge Function Email Settings

Edit `supabase/functions/send-guestbook-email/index.ts`:

### If using verified domain:

```typescript
const FROM_EMAIL = 'guestbook@lwe623.uk' // Your verified domain
const ADMIN_EMAIL = 'london.westend@roundtable.org.uk' // Admin email
```

### If NOT using verified domain:

```typescript
const FROM_EMAIL = 'onboarding@resend.dev' // Resend's test email
const ADMIN_EMAIL = 'london.westend@roundtable.org.uk' // Admin email
```

Then redeploy:

```bash
supabase functions deploy send-guestbook-email
```

---

## Step 6: Test the Flow

### Test 1: Submit Guestbook Entry

1. Go to https://www.lwe623.uk
2. Scroll to guestbook section
3. Submit a test entry:
   - Name: "Test User"
   - Club: "Test Round Table"
   - Message: "Testing email notifications"
4. Check admin email inbox

### Test 2: Verify Email Received

You should receive an email with:
- Subject: "New Guestbook Entry - Test User from Test Round Table"
- Green "Approve Entry" button
- Gray "View Dashboard" button

### Test 3: Approve from Email

1. Click "Approve Entry" button in email
2. Should open: `https://www.lwe623.uk/admin.html?action=approve&entry=<uuid>`
3. If not logged in, prompted to login
4. After login, guestbook panel opens
5. Entry is highlighted
6. Confirmation dialog appears: "Approve this guestbook entry?"
7. Click OK
8. Entry approved and published

---

## Troubleshooting

### Email Not Received

**Check Spam Folder:**
- Emails might go to spam initially
- Mark as "Not Spam" to train filters

**Check Resend Dashboard:**
- Go to Resend → Logs
- See if email was sent successfully
- Check for errors

**Check Supabase Logs:**
```bash
supabase functions logs send-guestbook-email
```

**Common Issues:**
- **"Invalid API key"** - Check `RESEND_API_KEY` secret
- **"Unverified domain"** - Either verify domain or use `onboarding@resend.dev`
- **"Webhook not firing"** - Check webhook is enabled and URL is correct

### Approve Button Not Working

**Check URL parameters:**
- URL should be: `admin.html?action=approve&entry=<uuid>`
- If missing `entry` parameter, won't work

**Check browser console:**
- Open DevTools (F12)
- Look for JavaScript errors
- Check if `approveEntry()` function exists

**Check entry exists:**
- Entry might have been deleted
- Entry might have already been approved

---

## Cost Breakdown

### Resend Pricing (Free Tier)
- 3,000 emails/month - FREE
- 100 emails/day without domain verification
- After free tier: $20/month for 50,000 emails

### Typical Usage
- **Low traffic club:** ~5-10 entries/month = FREE forever
- **High traffic club:** ~50 entries/month = FREE forever
- You'd need 250+ entries/month to exceed free tier

### Alternative Email Services

If you prefer different service:

**SendGrid** (100 emails/day free):
- More complex setup
- Better documentation

**Mailgun** (5,000 emails/month free for 3 months):
- Similar to Resend
- EU servers available

**Amazon SES** (62,000 emails/month free with AWS free tier):
- More technical setup
- Cheapest at scale

---

## Customizing Email Template

Edit `supabase/functions/send-guestbook-email/index.ts`:

### Change email styling:

```typescript
// Find the <style> section in the html template
const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Change colors, fonts, etc. here */
    .header { background: #YOUR_COLOR; }
    .btn-approve { background: #YOUR_COLOR; }
  </style>
</head>
...
```

### Change button text:

```html
<a href="..." class="button btn-approve">
  ✅ Your Custom Text Here
</a>
```

### Add club logo:

```html
<div class="header">
  <img src="https://www.lwe623.uk/assets/london-west-end-logo.png" 
       alt="Logo" style="width: 60px; height: 60px;">
  <h1 style="margin: 10px 0 0 0;">📖 New Guestbook Entry</h1>
</div>
```

After changes, redeploy:

```bash
supabase functions deploy send-guestbook-email
```

---

## Disabling Email Notifications

If you want to temporarily disable emails:

### Option 1: Disable Webhook
- Go to Supabase → Database → Webhooks
- Toggle webhook off

### Option 2: Delete Trigger
```sql
DROP TRIGGER IF EXISTS on_guestbook_entry_inserted ON guestbook_entries;
```

### Option 3: Comment out in Edge Function
Edit `index.ts` to skip email:
```typescript
serve(async (req) => {
  return new Response(
    JSON.stringify({ disabled: true }),
    { headers: { 'Content-Type': 'application/json' }, status: 200 }
  )
})
```

---

## Security Notes

- **Service Role Key:** Keep secret, never commit to git
- **Resend API Key:** Keep secret, store in Supabase secrets only
- **Edge Function logs:** May contain sensitive data, review regularly
- **Email content:** Sanitize user input to prevent XSS in emails

---

## Support

If you need help:
1. Check Resend docs: https://resend.com/docs
2. Check Supabase Edge Functions docs: https://supabase.com/docs/guides/functions
3. Check this project's CLAUDE.md for coding standards
4. Contact: london.westend@roundtable.org.uk

---

**Setup Status:** ⚠️ Not yet configured
**Last Updated:** 2026-04-18
