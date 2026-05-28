# FallForm

**Forms · no response cap · ever. The grift Typeform built a business on.**

One HTML file. Build forms. Share the URL. Collect responses. Export CSV. Optional webhook + email notify. Forever £0/month.

**Live:** https://sjgant80-hub.github.io/fallform/

---

## The grift it obsoletes

> **Typeform · 2026 pricing**
> - Free tier: only **10 responses/month**
> - Basic: $25/mo · 100 responses
> - Plus: $50/mo · 1,000 responses
> - Business: **$83/mo** · 10,000 responses
> - **Partial completions count toward the cap** — survey drop-off literally drives tier upgrades

For rendering a `<form>` element.

FallForm = unlimited forms · unlimited responses · forever · single HTML.

---

## What it does

| Tab | What you see |
|-----|-------------|
| ▤ Build | Form title · 8 field types · drag-order · required toggle · help text |
| ▶ Preview | Live preview = exactly what the public sees |
| ✉ Responses | All submissions · tap to view full · CSV export |
| 🔗 Share | Public URL (`?f=<id>&mode=fill`) · iframe embed code · backup JSON |

### 8 field types

`text · email · phone · number · date · paragraph · single-choice (radio) · multi-choice (checkbox)`

### Public form mode

Append `?f=<formId>&mode=fill` to the URL → the page hides the builder and shows ONLY the form. Embed via iframe on any site, or just share the link.

### Optional: webhook + email notify

In Settings paste:
- A **webhook URL** — every submission POSTs JSON to your endpoint (Zapier-equivalent, no Zapier)
- A **notify email** — every submission opens your mail client pre-filled with the response

Both optional. Default behaviour: response lands in localStorage on your device.

---

## ƒ(build) gate · 14/14

```
□ 1  single HTML · works from file://                    ✓ 67 KB
□ 2  <400KB                                              ✓ 17% used
□ 3  L1 FACE · 4 views (build · preview · responses · share)
□ 4  L2 SWARM · Ω + α builder + β renderer + γ exporter ✓
□ 5  L3 CASCADE · T0 always · T3 optional               ✓
□ 6  L4 BLOOM · field type routing                       ✓
□ 7  L5 PERSIST · localStorage · CSV + JSON export       ✓
□ 8  L6 SKIN · dark + amber · mobile-first              ✓
□ 9  L7 ASS · "+ Create your first form" empty state    ✓
□ 10 Konomi licence shim · sovereign tier               ✓
□ 11 fall-signal · prime 269 · hello + response broadcast ✓
□ 12 PWA manifest · standalone                          ✓
□ 13 README two-audience · MIT LICENSE                   ✓
□ 14 Pages live · responding 200                         ✓
```

---

## For developers

### postMessage API

```js
window.postMessage({ target: 'fallform', action: 'forms' }, '*');
// → [{ id, title, fieldCount }]

window.postMessage({ target: 'fallform', action: 'responses', formId: '...' }, '*');
// → [{ id, ts, data: {fieldId: value} }]
```

### Fork & rebrand

```bash
gh repo fork sjgant80-hub/fallform --clone=true
cd fallform
# Brand state.settings defaults
gh repo edit --enable-pages --pages-branch main
```

---

## Roadmap

- ✅ Form builder · 8 field types
- ✅ Public fill mode via URL param
- ✅ Iframe embed
- ✅ Optional webhook POST + mailto: notify
- ✅ CSV export
- ✅ Multi-form management (tabs)
- ⬜ File upload field (IndexedDB blob storage)
- ⬜ Conditional logic (show field X if Y selected)
- ⬜ Multi-page forms
- ⬜ Theming per form
- ⬜ Stripe checkout field (paid form)

---

## Licence

MIT · use it, fork it, brand it, sell setup services.

---

## Credit

- **Architecture & build:** Simon Gant · [@sjgant80-hub](https://github.com/sjgant80-hub) · [LinkedIn](https://www.linkedin.com/in/simon-gant-295b56180/)

◊·κ=1 · forms · no response cap · ever · sovereign · single HTML
