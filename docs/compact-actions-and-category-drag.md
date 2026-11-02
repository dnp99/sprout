# Compact actions and category dragging

Mobile and desktop share icon-only Edit/Delete controls outside single-record
views. `IconAction` supplies a 16px stroked pencil/trash glyph, a 44px target and
translated accessible name/hover title; callers retain their existing border,
corner and color treatment. Single-record details/editors and destructive
confirmation dialogs keep explicit text. Existing permissions, handlers and
confirmation requirements are unchanged.

Both Personal and Group already support two-level category trees with multiple
children per root. Their shared organizer now lets creation choose a parent
explicitly, and dragging a handle onto a category row places it before that row.
Trailing drop targets place items after the last sibling/root. Existing child
and top-level drop areas attach/detach children; keyboard move-up/down controls
remain. Category moves adopt the destination's parent without creating a third
level, and preserve all nodes. Existing inline transaction-handling choices,
Undo, conflict detection and Save remain the only write path.

UI text uses user-select:none and disables the touch selection callout to prevent
drag/tap misfires. Editable inputs, textareas and contenteditable fields restore
normal text selection/copy/paste. This is interaction styling, not a security
boundary: deliberate Copy buttons and assistive text remain functional.
