# Grippy Waitlist (WordPress plugin)

Install this on your SiteGround WordPress (`cms.grippy.io` or wherever WP Admin lives).

## Where to see the data

After activation, open **WordPress Admin → Waitlist** (email icon in the left sidebar).  
Each signup is a private entry: email as the title, signup time in the list.

URL pattern: `https://cms.grippy.io/wp-admin/edit.php?post_type=waitlist_signup`

## Install

1. Zip the `grippy-waitlist` folder (so `grippy-waitlist.php` is at the zip root).
2. In WP Admin: **Plugins → Add New → Upload Plugin** → activate **Grippy Waitlist**.
3. Or upload the folder via SFTP to `wp-content/plugins/grippy-waitlist/`.

## Application Password (for Next.js)

1. WP Admin → **Users → Profile** (or Users → your admin user).
2. Scroll to **Application Passwords**, name it e.g. `grippy-nextjs`, click **Add**.
3. Copy the password (shown once).
4. In the Next.js `.env.local` set:

```env
NEXT_PUBLIC_WORDPRESS_URL=https://cms.grippy.io
WP_APPLICATION_USER=your_wp_username
WP_APPLICATION_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx
```

Use the same WordPress URL your WooCommerce / GraphQL already use if they share one install.
