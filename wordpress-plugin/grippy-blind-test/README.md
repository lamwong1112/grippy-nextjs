# Grippy Blind Test (WordPress plugin)

Install this on your SiteGround WordPress (`cms.grippy.io`).

## Where to see the data

After activation:

- **WordPress Admin → Blind Scores** — gym blind-test submissions
- **WordPress Admin → Lab Data** — lab measurements per ratio/round
- **Settings → Blind Test** — session PIN, enabled sample codes, code→ratio mapping, gyms list

## Install

1. Zip the `grippy-blind-test` folder (so `grippy-blind-test.php` is at the zip root).
2. In WP Admin: **Plugins → Add New → Upload Plugin** → activate **Grippy Blind Test**.
3. Or upload via SFTP to `wp-content/plugins/grippy-blind-test/`.

## Configure a gym session

1. Open **Settings → Blind Test**.
2. Set a **4-digit PIN** climbers enter on `/blind-test`.
3. Enable only the sample codes you brought to the gym (e.g. A/B/C).
4. Map each code to a seawater:mineral ratio (kept secret from the gym form).
5. Save.

## Application Password (for Next.js)

Reuse the same Application Password as Waitlist:

```env
NEXT_PUBLIC_WORDPRESS_URL=https://cms.grippy.io
WP_APPLICATION_USER=your_wp_username
WP_APPLICATION_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx
BLIND_TEST_ACCESS_KEY=choose-a-long-secret-for-lab-and-results
```

`BLIND_TEST_ACCESS_KEY` unlocks `/blind-test/lab` and `/blind-test/results` in the Next.js app (not the WordPress admin password).

## REST endpoints

| Method | Path | Auth |
|--------|------|------|
| GET | `/wp-json/grippy/v1/blind-test/public-config` | Public |
| POST | `/wp-json/grippy/v1/blind-test/verify-pin` | Public |
| POST | `/wp-json/grippy/v1/blind-test/score` | Application Password |
| POST | `/wp-json/grippy/v1/blind-test/lab` | Application Password |
| GET | `/wp-json/grippy/v1/blind-test/entries` | Application Password |
