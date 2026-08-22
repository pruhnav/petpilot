# PetPilot — foster roster board

Shelter management front end: foster roster, medical calendar, intake & outcomes.

## Files

- `Foster Board.dc.html` — the whole app (markup + logic in one file). Open it directly in a browser.
- `support.js` — runtime the page loads. Keep it next to the HTML file.
- `_ds/industry-.../` — the Industry design system: `styles.css` holds every color, type and spacing token; `_ds_bundle.js` its components.
- `uploads/` — reference screenshot supplied at the start of the project.

## Running it

No build step. Serve the folder over any static server (a plain `file://` open works too, but a server avoids font/CORS quirks):

```
python3 -m http.server 8000
```

then open <http://localhost:8000/Foster%20Board.dc.html>.

## Where things live inside `Foster Board.dc.html`

- `<helmet>` — font links, design-system stylesheet/bundle, and the page's own CSS classes (`pp-grid`, `pp-cal`, `pp-mini`, …).
- Template — three tab sections (`tabFosterOn`, `tabMedicalOn`, `tabReportsOn`) plus the record drawer.
- `class Component` — the data arrays (`ANIMALS`, `MEDICAL`, `INTAKE_BARS`, `OUTCOME_BARS`, `MOVEMENT`) and `renderVals()`, which feeds every `{{ hole }}` in the template.

All records are placeholder data; swap the arrays for a real API response when wiring a backend.
