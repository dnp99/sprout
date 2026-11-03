# Loading indicator

`LoadingIndicator` renders the Sprout navigation mark using the surrounding text
color, so it is visible on themed surfaces and action buttons. Its gentle scale
animation grows and shrinks until work finishes; reduced-motion preferences show
the mark without animation. Inline uses are decorative when adjacent text already
announces progress. `LoadingStatus` provides a localized status for standalone
page and section loads. The shared component replaces spinners and list skeletons;
operation-specific messages remain visible and continue to describe the work.

The shared decorative-icon reset excludes the loading mark so explicit themed
status colors remain intact. Inline button loaders still inherit button ink.

## Page content versus initial boot

Once authentication is known, Personal and Group page data loads use
`LoadingRegion`: the large centered logo occupies only the content region.
Sidebar, page title, context switch and mobile navigation stay mounted.
Data-dependent record actions are disabled until the page is ready. Full-page
loading is reserved for unknown authentication and pending auth redirects.
