# The Spirit Creative

Production-ready portfolio site for **The Spirit Creative** — premium branding, packaging, and creative direction.

**Live site:** https://thespiritcreative.com

## Stack

Plain HTML, CSS, and JavaScript. No build step. Data persists in the browser via `localStorage`.

## Local development

```bash
./start-site.sh
```

Then open http://localhost:8787/

Or serve manually:

```bash
python3 tools/serve.py
```

## Project structure

```
index.html       Main site
styles.css       Public styles
script.js        Interactions, portfolio, case studies
works-data.js    Project data + localStorage API
admin.html       Admin dashboard (client-side password)
admin.js         Works & inquiries management
admin.css        Admin styles
assets/          Logo assets
tools/serve.py   Local static server (port 8787)
vercel.json      Production headers & caching
```

## Admin panel

Open `/admin.html` on the deployed site or locally.

- Default password: `spirit2026` (change in `admin.js` before going live)
- Upload project images, edit copy, reorder works
- View contact form inquiries (stored in browser localStorage only)

> **Note:** Admin auth is client-side only. Do not expose sensitive data. For production-grade admin, add server-side auth.

## Contact form

Submissions are saved to `localStorage` and visible in the admin inquiries tab. They are **not emailed** automatically. Connect a form backend (Formspree, Resend, etc.) for email delivery if needed.

## Deploy to Vercel

1. Push this repo to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Framework preset: **Other** (static site, no build command)
4. Add custom domain `thespiritcreative.com`

## DNS (Vercel custom domain)

At your domain registrar, add:

| Type  | Name | Value              |
|-------|------|--------------------|
| A     | @    | 76.76.21.21        |
| CNAME | www  | cname.vercel-dns.com |

Vercel will provision SSL automatically once DNS propagates.

## License

© The Spirit Creative. All rights reserved.
