# The Spirit Creative

Production-ready portfolio site for **The Spirit Creative** — premium branding, packaging, and creative direction.

**Live site:** https://thespiritcreative.com

## Stack

Plain HTML, CSS, and JavaScript. No build step. Project and inquiry data is stored in `data/*.json` and served through `/api/*` serverless routes.

## Local development

```bash
./start-site.sh
```

Then open http://localhost:8787/

Or serve manually:

```bash
python3 tools/serve.py
```

The local server serves the static site **and** the `/api` routes, writing changes to `data/works.json` and `data/inquiries.json`.

## Project structure

```
index.html       Main site
styles.css       Public styles
script.js        Interactions, portfolio, case studies
works-data.js    Client data layer (loads/saves via /api)
admin.html       Admin dashboard
admin.js         Works & inquiries management
admin.css        Admin styles
assets/          Logo assets
data/            Server-side JSON storage (works + inquiries)
api/             Vercel serverless API routes
tools/serve.py   Local dev server with API support (port 8787)
vercel.json      Production headers & caching
package.json     ESM module type for API routes
```

## Admin panel

Open `/admin.html` on the deployed site or locally.

- Default password: `spirit2026` (override with the `ADMIN_PASSWORD` environment variable on Vercel)
- Upload project images, edit copy, reorder works
- View contact form inquiries submitted from the public site

Admin saves go to the server API, so changes appear for all visitors — not just in your browser.

## Contact form

Submissions are saved to `data/inquiries.json` via `POST /api/inquiries` and appear in the admin inquiries tab. They are **not emailed** automatically. Connect a form backend (Formspree, Resend, etc.) for email delivery if needed.

## Deploy to Vercel

1. Push this repo to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Framework preset: **Other** (no build command)
4. Add these environment variables:

| Variable | Value |
|----------|-------|
| `GITHUB_TOKEN` | GitHub fine-grained PAT with **Contents** read/write on this repo |
| `GITHUB_REPO` | `AleksSimonyan/thespiritcreative` |
| `ADMIN_PASSWORD` | Your admin password (optional; defaults to `spirit2026`) |

`GITHUB_TOKEN` lets the API persist admin edits by updating `data/works.json` and `data/inquiries.json` in the repo. Without it, the site still **reads** the bundled JSON files, but admin saves will fail in production.

5. Add custom domain `thespiritcreative.com`

## DNS (Vercel custom domain)

At your domain registrar, add:

| Type  | Name | Value              |
|-------|------|--------------------|
| A     | @    | 76.76.21.21        |
| CNAME | www  | cname.vercel-dns.com |

Vercel will provision SSL automatically once DNS propagates.

## License

© The Spirit Creative. All rights reserved.
