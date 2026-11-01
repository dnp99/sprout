# What’s new

Desktop shows a curated release announcement after sign-in/onboarding, replacing
the automatic Install Sprout offer. Phones keep their existing install offer;
installation remains optional in Personal and Group Settings on every surface.
What’s new is also available from Settings on desktop and phones after dismissal.

## Release publishing

`src/lib/whats-new.ts` holds the current release version, calendar publication
date, highlight keys and internal destinations. Increment the integer version
only for meaningful user-facing releases, not every deployment. Update highlight
copy in all four `whatsNew` message catalogs. Links lead to implemented features;
group highlights open the group directory so users can choose their own group.
The initial release covers group split/repayment improvements, shared group
transaction entry, and appearance preferences.

The authenticated shell waits three seconds on desktop, deferring while another
dialog is open or the document is hidden. It never opens before authentication
or onboarding is complete. The shared modal consumes ledger context and semantic
tokens for Vibrant/Cozy and light/dark, traps focus, restores focus on close, and
keeps content scrollable on short screens. Resizing below the desktop breakpoint
hides the automatic offer without acknowledging it.

## Account acknowledgement

`users.whats_new_seen_version` starts at zero. The app-facing User includes
`whatsNewSeenVersion`. Dismissing the announcement (Got it, close or Escape), or
following a highlight, PATCHes `/api/auth/me` with the current published version.
The server validates positive published integer versions and uses SQL `greatest`
to prevent an older tab from reducing a newer acknowledgement. No other profile
fields need to be included. Existing accounts receive the first release too.

An acknowledgement applies across devices when they next load or refresh their
account state. Already-open tabs are not synchronized in real time. Reopening
an already acknowledged release from Settings does not write again. Errors keep
the dialog open with retry feedback; links navigate only after acknowledgement
succeeds. An in-flight acknowledgement cannot replace a different signed-in
user’s store state. This uses account storage rather than localStorage, so
browser storage restrictions do not erase the preference.

Generated migration `0028_release_announcements` adds the defaulted column;
Vercel applies it through the existing deployment migration runner. No financial
records or PWA installation identity change.

Tests cover desktop install suppression without consuming the phone cooldown,
unseen/seen release gating, active-dialog deferral, replay, acknowledgement errors,
version validation, and internal destinations. Browser QA additionally verifies
cross-session persistence, themes, responsive sizing and real API writes.
