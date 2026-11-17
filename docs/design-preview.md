# Still interface preview

Screenshots use illustrative entries created in a disposable browser context. The app starts with an empty vault for a new account.

## Welcome and unlock

![Login page at 1440 pixels](screenshots/login-desktop.png)

## Password vault

![Populated vault at 1440 pixels](screenshots/vault-desktop.png)

## Password generator

![Password generator at 1440 pixels](screenshots/generator-desktop.png)

## Account settings

![Account settings at 1440 pixels](screenshots/settings-desktop.png)

## Phone layout

![Populated vault at 390 pixels](screenshots/vault-mobile.png)

## Validation

- Production builds for the root URL and the GitHub Pages repository prefix succeed.
- Six Playwright tests pass with system Chromium, including encrypted storage, account isolation, password changes, backup restore, generator options, keyboard interactions, and responsive layouts.
- Populated vaults with long names, 64-character generated passwords, and dialogs fit widths from 320 to 1920 pixels.
- A local preview of the GitHub Pages production build loads the login, vault, generator, settings, and favicon without HTTP or browser runtime errors.
