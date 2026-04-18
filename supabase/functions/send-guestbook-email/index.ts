// Supabase Edge Function: Send email notification when guestbook entry submitted
// Deploy with: supabase functions deploy send-guestbook-email

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')! // Set in Supabase secrets
const FROM_EMAIL = 'noreply@lwe623.uk' // Or use Resend's test email
const ADMIN_EMAIL = 'london.westend@roundtable.org.uk' // Or fetch from site_settings

serve(async (req) => {
  try {
    const { record } = await req.json()

    // record is the new guestbook_entries row
    const { id, name, club, message, created_at } = record

    // Email HTML template
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #B8860B; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .entry { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #B8860B; border-radius: 4px; }
    .button { display: inline-block; padding: 12px 30px; margin: 10px 5px; text-decoration: none; border-radius: 6px; font-weight: 600; text-align: center; }
    .btn-approve { background: #4CAF50; color: white; }
    .btn-dashboard { background: #333; color: white; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">📖 New Guestbook Entry</h1>
    </div>

    <div class="content">
      <p><strong>You have a new entry awaiting approval!</strong></p>

      <div class="entry">
        <p><strong>From:</strong> ${name}<br>
        <strong>Club:</strong> ${club}<br>
        <strong>Submitted:</strong> ${new Date(created_at).toLocaleString('en-GB', {
          dateStyle: 'long',
          timeStyle: 'short'
        })}</p>

        <blockquote style="margin: 20px 0; padding: 15px; background: #f5f5f5; border-left: 3px solid #B8860B; font-style: italic;">
          "${message}"
        </blockquote>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://www.lwe623.uk/admin.html?action=approve&entry=${id}" class="button btn-approve">
          ✅ Approve Entry
        </a>

        <a href="https://www.lwe623.uk/admin.html?panel=panel-guestbook" class="button btn-dashboard">
          📋 View Dashboard
        </a>
      </div>

      <div style="background: #fff3cd; padding: 15px; border-radius: 4px; border-left: 4px solid #ffc107;">
        <p style="margin: 0; font-size: 14px;">
          ⚠️ <strong>This entry is pending approval.</strong><br>
          It won't appear on your website until you approve it.
        </p>
      </div>
    </div>

    <div class="footer">
      <p>This is an automated notification from your RTLWE263 website.<br>
      To change notification settings, log in to your admin dashboard.</p>
    </div>
  </div>
</body>
</html>
    `

    // Send email using Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [ADMIN_EMAIL],
        subject: `New Guestbook Entry - ${name} from ${club}`,
        html: html,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(`Resend API error: ${JSON.stringify(data)}`)
    }

    return new Response(
      JSON.stringify({ success: true, email_id: data.id }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
