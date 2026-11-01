# METHU MD BOTS

A responsive black-and-red bot directory with a Supabase-powered admin panel.

## Important security note
The password shared in the chat should not be reused. Create a fresh, private password in Supabase Authentication. This project does not hard-code any password. The public website uses Supabase's anon/public key only; never put a Supabase `service_role` key in `app.js`.

## 1. Create the database
1. Create a project at https://supabase.com/
2. Open **SQL Editor** and run all of `supabase-schema.sql`.
3. In **Authentication > Users**, create the admin user with your email and a new private password.
4. Copy the user's UUID from the Users page.
5. In SQL Editor, run this after replacing the placeholder:
   `insert into public.bot_admins (user_id) values ('ADMIN_USER_UUID');`
6. In **Authentication > Providers / Sign In**, disable public sign-ups. You should create admin users yourself, not allow public registration.

## 2. Connect the website
1. In Supabase, open **Project Settings > API**.
2. Copy the Project URL and the anon/public key.
3. Open `app.js` and replace:
   - `PASTE_YOUR_SUPABASE_PROJECT_URL_HERE`
   - `PASTE_YOUR_SUPABASE_ANON_KEY_HERE`
4. Do not use the `service_role` key.

## 3. Publish with GitHub Pages
1. Create a GitHub repository named `methu-md-bots`.
2. Upload `index.html`, `style.css`, `app.js`, and `supabase-schema.sql` (the SQL file is only for setup).
3. Open repository **Settings > Pages**.
4. Select **Deploy from a branch**, choose `main` and `/ (root)`, then Save.
5. Wait for GitHub Pages to publish the site.

## 4. Use the admin panel
Open the published site, choose **Admin Login**, and sign in with the admin email/password created in Supabase. Add, edit, hide, and delete bot listings from the dashboard. Public visitors can browse and search active bots.

## Notes
- Bot image fields accept a publicly accessible image URL.
- Bot links should begin with `https://` or `http://`.
- Admin access is controlled by the `bot_admins` table and Row Level Security (RLS), not by a password written in the website code.
