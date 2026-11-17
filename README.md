# Still — personal password space

A responsive static Vite application with login, encrypted password storage, a cryptographic password generator, and account settings.

## Develop

Requires Node.js 20.19+ or 22.12+ (tested on Node 24).

```sh
npm ci
npm run dev
npm run build
npm run preview
```

If the default npm cache is unavailable, use `npm ci --cache /tmp/still-npm-cache`.

## Accounts

- anthtooaung2792005@gmail.com
- anthtooaung10@gmail.com

Both use `password` on their first login in a browser. Change this immediately in Settings before storing real credentials. The configured email list is a client-side access gate, not server authentication or email ownership verification. Anyone can initialize either demo account on their own browser.

## Privacy and storage

Each account has a separate encrypted localStorage vault. AES-256-GCM uses a fresh random 96-bit IV for every write; the non-extractable key is derived using PBKDF2-SHA256 with 310,000 iterations and a random 128-bit salt. Keys exist only in memory while unlocked. Password generation uses crypto.getRandomValues, rejection sampling, and a random shuffle; selected character groups are guaranteed to appear.

There is no backend, cross-device sync, account recovery, or server-managed access control. Browser data deletion removes the vault. Export encrypted backups in Settings; restoring requires the password that encrypted that backup and replaces the current local vault. Password changes re-encrypt the local vault but do not update older exported backups. The shared initial password is public and does not protect sensitive credentials. This implementation has not had an independent security audit.

Settings include display name, inactivity lock (1–30 minutes), password change, and encrypted backup export/restore. Locking or reloading clears the in-memory session. Clipboard copies are not automatically cleared. HTTPS (or localhost) is required for Web Crypto and clipboard access.

## Test

```sh
npx playwright install chromium
npm test
```

With an existing Chromium installation:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test
```

Tests cover rejected login, encrypted CRUD and persistence, separate accounts, generator options, password changes, encrypted backup restore, and layouts from 320 to 1920 pixels. Redesign checks include populated vaults with long names, 64-character generated passwords, mobile action targets, dialog sizing, password visibility, keyboard navigation, and focus return.

## Interface

See [desktop and phone screenshots](docs/design-preview.md) for a preview of all four pages.

The login, vault, generator, settings, and dialogs share a teal and mint design with responsive layouts. Desktop uses a fixed sidebar; phones use compact navigation, stacked panels, and 44-pixel vault action buttons. Generator switches retain native checkbox semantics and keyboard operation. Native dialogs support Escape, focus containment, and return focus to their opening action.

`src/ui.js` contains the shared brand, SVG icons, and panel headings. `src/style.css` defines the common controls and design tokens, followed by tablet and phone breakpoints, reduced-motion preferences, and forced-color support. No external fonts or icon requests are required. The encrypted `still:v1:` record format and backup format remain compatible with the original app.

## Deploy to Vercel

`vercel.json` sets the Vite build, `dist` output, and security headers. No environment variables or backend services are required.

1. Push this project to your GitHub repository.
2. In Vercel, choose **Add New → Project**, import the repository, and deploy with the Vite preset. The root directory is the repository root.
3. Alternatively, from this directory run `npx vercel login`, then `npx vercel --prod` using your authenticated Vercel account.

Deployment was not performed in this environment because no Vercel authentication was available. No deployment URL is claimed.

## Deploy to GitHub Pages

The workflow in `.github/workflows/pages.yml` builds and deploys on every push to `main`. It sets the Vite base path to the repository name; Vercel and local builds keep the default root path.

In GitHub, open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**. Then open **Actions → Deploy to GitHub Pages → Run workflow** if the latest push has not already deployed.

Expected site address after successful deployment:
https://anthtooaung-general.github.io/pw_storing_-_generation/

GitHub Pages serves static files over HTTPS. The security headers in `vercel.json` apply only to Vercel, not GitHub Pages. Browser-local vault data belongs to the site origin; an existing Vercel vault will not automatically appear here. Use encrypted backup export/restore to transfer it. Other projects hosted under the same GitHub Pages origin share that origin's browser storage, so host only trusted projects there.
