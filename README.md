diff --git a/README.md b/README.md
index 48171a2248a857756d38489181a358f6df5a75e9..912376ee282ff12372653bb40f46693271826050 100644
--- a/README.md
+++ b/README.md
@@ -1,3 +1,123 @@
-#  Demo
+# Round Table London West End 623 website
 
-Some description !
+## Image names expected by default
+
+Put your images in a folder named `assets` at repo root.
+
+Recommended file names:
+
+- `assets/hero.jpg` (homepage hero)
+- `assets/og-cover.jpg` (social sharing image)
+- `assets/gallery-01.jpg`
+- `assets/gallery-02.jpg`
+- `assets/gallery-03.jpg`
+- `assets/gallery-04.jpg`
+- `assets/gallery-05.jpg`
+- `assets/gallery-06.jpg`
+
+
+Tabler card photos expected:
+
+- `assets/tabler-ryan-zammit.jpg`
+- `assets/tabler-matteo.jpg`
+- `assets/tabler-amit-shah.jpg`
+- `assets/tabler-steve.jpg`
+- `assets/tabler-john-bergqvist.jpg`
+- `assets/tabler-kyle-west.jpg`
+- `assets/tabler-vedang-tyagi.jpg`
+- `assets/tabler-david-crow.jpg`
+- `assets/tabler-amrinder-chana.jpg`
+- `assets/tabler-jon-clark.jpg`
+- `assets/tabler-jay-shah.jpg`
+
+### Is there an automated way?
+Yes.
+
+- **Simple automation (no coding):** keep any file names you want and paste paths in the **Content Dashboard** gallery field (one path per line).
+- **Best automation:** use a cloud drive/CMS and sync links to gallery list (future enhancement).
+
+## Why photos were missing
+
+Chat-uploaded images are not automatically copied into your GitHub repo. Vercel can only serve files that exist inside the repository.
+
+## Built-in dashboard (no coding)
+
+The page has a dashboard section where you can update:
+
+- Hero text
+- About text
+- Hero image path
+- Gallery paths
+- Guestbook integration URLs
+
+## Guestbook moderation + admin email (free no-code setup)
+
+Use **Google Sheets + Google Apps Script + Gmail**.
+
+### What you get
+
+1. Visitor submits guestbook entry from website.
+2. Admin gets an email instantly.
+3. Email contains an **Approve** link.
+4. Entry only appears on site after approval.
+
+### Step-by-step from your side
+
+1. Create a Google Sheet named `LWE623 Guestbook` with columns:
+   - `id`
+   - `name`
+   - `club`
+   - `message`
+   - `createdAt`
+   - `approved`
+2. Open **Extensions → Apps Script**.
+3. Add a script that supports:
+   - `POST` submit endpoint (save row + email admin)
+   - `GET ?mode=approved` endpoint (return approved entries as JSON)
+   - `GET ?mode=approve&id=...` endpoint (approve one row)
+   - `GET ?mode=admin` optional admin page
+4. Deploy Apps Script as **Web App**:
+   - Execute as: your account
+   - Access: Anyone with the link
+5. Copy deployed URLs and paste into website Dashboard:
+   - Guestbook submit API URL
+   - Guestbook approved feed URL
+   - Admin approval dashboard URL
+6. Save dashboard and redeploy.
+
+### Free email structure
+
+Use a shared mailbox/alias for continuity:
+
+- `guestbook@yourdomain.com` (forward to 1-3 admins)
+- Subject format: `[LWE623 Guestbook] New entry from {{name}} ({{club}})`
+- Body should include message and one-click Approve URL.
+
+## SEO / AEO / GEO notes
+
+Current site includes:
+
+- Meta description + canonical
+- Open Graph + Twitter cards
+- Structured data (Organization + FAQ)
+
+For stronger GEO/AEO:
+
+- Keep FAQ updated with direct answers
+- Add location-rich text (London areas, venues)
+- Add consistent entity info (name, email, socials)
+
+
+## How to access dashboard
+
+1. Open your live website URL in a browser.
+2. Scroll to the section named **Content Dashboard** near the bottom.
+3. Edit fields and click **Save Content**.
+
+### Gallery captions in dashboard
+
+Use one line per image in this format:
+
+`assets/gallery-01.jpg | Your caption text here`
+
+You can add as many lines as you want.
