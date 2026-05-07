# Initiate Care Pricing Calculator

A two-mode subscription calculator for first aid and AED service. Public-facing, top-of-funnel.

- **Quick estimate** — total kit counts, instant ballpark price.
- **Detailed quote** — per-location matrix with tax handling.

Submissions hand off to a pipeline endpoint (Wix integration pending — see below).

---

## Run locally

You'll need [Node.js](https://nodejs.org) 18 or newer.

```bash
npm install
npm run dev
```

The dev server prints a local URL (usually http://localhost:5173). Open it.

To build for production:

```bash
npm run build
npm run preview   # optional: preview the production build locally
```

---

## Push to GitHub (web upload)

1. Go to [github.com/new](https://github.com/new) and create a new repository.
   - Name it whatever you want (e.g. `initiate-care-calculator`).
   - Public or private — your call.
   - **Important:** leave all the "Initialize this repository with…" boxes unchecked. The project already has a README and .gitignore.
   - Click **Create repository**.

2. On the empty repository page, click the **uploading an existing file** link (it's in the "Quick setup" section).

3. Open the unzipped `initiate-care-calculator` folder on your computer. Select **all the files inside it** (not the folder itself) and drag them onto the upload area on GitHub.
   - On macOS: open the folder, ⌘+A to select all, drag.
   - On Windows: open the folder, Ctrl+A to select all, drag.
   - There should be ~13 items: `src/`, `package.json`, `index.html`, `README.md`, etc.

4. Wait for the files to finish uploading (you'll see them listed below the drop zone). Scroll down, leave the default commit message, click **Commit changes**.

To make future updates after editing files locally, repeat the upload: in the repo, click **Add file → Upload files**, drag the changed files in, commit. Vercel will redeploy automatically each time.

---

## Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new).
2. Import the GitHub repo you just pushed.
3. Vercel auto-detects Vite — leave all defaults.
4. Click **Deploy**.

You'll get a URL like `your-repo-xyz.vercel.app` to share. Every push to `main` redeploys automatically. Pull request previews work out of the box.

To share with a teammate: just send them the Vercel URL.

---

## Wix Sales Pipeline integration (TODO)

The submission hook lives in `src/App.jsx`, in the `submitToPipeline` function near the top. Right now it logs to the browser console and resolves after a fake delay — so the modal works end-to-end for testing.

When ready to wire up Wix, replace the body of that function with a real `fetch` call. The payload shape is stable:

```js
{
  mode: 'quick' | 'detailed',
  contact: { name, email, company, phone },
  kits: [...]            // for 'quick' mode
  locations: [...],      // for 'detailed' mode
  totals: { monthly, annual, ... },
  submitted_at: '2026-...'
}
```

The `mode` field is what tells the receiver whether to route to the Sales Pipeline (detailed) versus the lighter handling for quick estimates. Wix has a few options here — Velo HTTP Functions, a third-party form gateway, or Zapier as a stopgap. Whichever you pick, only that one function changes.

---

## Updating pricing

All kit definitions and tax regions are at the top of `src/App.jsx`, in the `KITS` and `TAX_REGIONS` constants. Edit the prices, save, and the deploy auto-updates after the next push.

When you're ready for non-engineers to update pricing without a deploy, the natural next step is moving these to a JSON file (or a Wix CMS collection) and fetching at load.

---

## Project structure

```
.
├── index.html              # entry HTML
├── package.json            # dependencies and scripts
├── postcss.config.js       # Tailwind/PostCSS pipeline
├── tailwind.config.js      # Tailwind content paths
├── vite.config.js          # Vite + React plugin
└── src/
    ├── App.jsx             # the entire calculator (single file by design)
    ├── index.css           # Tailwind directives + Geist font import
    └── main.jsx            # React mount point
```

Single-component layout is deliberate — easy to scan, easy to hand off, easy to refactor into smaller files when it earns the split.
