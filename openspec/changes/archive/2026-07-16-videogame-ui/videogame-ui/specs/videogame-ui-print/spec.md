# videogame-ui-print Specification

## Domain: videogame-ui-print

When the user triggers browser print (Ctrl+P), the system SHALL hide the game entirely and render the complete Harvard-style printable CV with no residual game UI.

### Requirement: Media-query swap

The system SHALL swap visibility between the game canvas and the printable CV using CSS `@media screen` and `@media print` rules. The game SHALL be visible on screen, and the printable CV SHALL be visible in print.

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Screen rendering | The viewport is in screen media mode, | the browser lays out the page, | the game canvas is visible and the printable CV container is hidden. |
| Print rendering | The user invokes print preview, | the browser switches to print media mode, | the game canvas and any game overlays SHALL be hidden with `display: none !important`, and the printable CV container is visible with Harvard-style typography. |
| Resume after cancel | The user cancels print and returns to the viewport, | the browser switches back to screen media mode, | the game canvas reappears and the CV container is hidden again; no state is lost. |

### Requirement: Print output completeness

The print output SHALL contain the complete two-locale Harvard-style CV (Spanish + English) with margins, serif typography, and link styling — unchanged from the pre-change baseline.

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Printable CV contents | Print mode is active on either `/es/` or `/en/`, | `chromium --headless` generates the PDF, | the rendered PDF matches the pre-change Harvard-style baseline (margins, typography, links, locale content). |
| No game artifacts in PDF | Print mode is active, | the PDF is generated, | the PDF contains zero game-canvas pixels, zero game scripts referenced visually, and no gameplay HUD elements. |