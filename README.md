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

Tests cover rejected login, encrypted CRUD and persistence, separate accounts, generator options, password changes, encrypted backup restore, and layouts at 320, 768, 1024, and 1440 pixels.

## Deploy to Vercel

`vercel.json` sets the Vite build, `dist` output, and security headers. No environment variables or backend services are required.

1. Push this project to your GitHub repository.
2. In Vercel, choose **Add New → Project**, import the repository, and deploy with the Vite preset. The root directory is the repository root.
3. Alternatively, from this directory run `npx vercel login`, then `npx vercel --prod` using your authenticated Vercel account.

Deployment was not performed in this environment because no Vercel authentication was available. No deployment URL is claimed.
