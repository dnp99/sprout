# Progressive Web App

Sprout is installable as a progressive web app, but it remains online-only.
Installing Sprout creates a focused app window and does not cache financial
data or promise offline access.

## Install behavior

- Chromium-based browsers expose their native install prompt when the browser
  fires `beforeinstallprompt`.
- iPhone and iPad users see Safari instructions for Add to Home Screen.
- Other browsers see general browser install instructions when native prompt
  support is not available.
- The Settings install card is shared by the web and mobile Settings views.
- The app does not prompt automatically; installation starts only after the
  user selects the install action.

## App shell

The manifest starts installed apps at `/home`, uses the Sprout icon assets in
`public/pwa/`, and declares `/` as its navigation scope. Apple web-app
metadata and safe-area insets support standalone mode on iOS. The Add screen
keeps its own viewport handling so it does not receive the shared shell inset
twice.

## Deliberate non-goals

There is currently no service worker, cache strategy, background sync, or
offline transaction editing. Any future offline capability must define data
freshness, conflict handling, and financial-data protection before it is added.
