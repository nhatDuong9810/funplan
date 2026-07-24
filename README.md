# 🎟️ A Very Official Saturday

A fun, interactive date-plan website. She taps through 7 playful questions (with memes),
customizes the Saturday itinerary, and gets:

- 🎉 A confetti-powered personalized timeline
- 🔍 **Venue intel cards** on every stop — address, Saturday hours, what it's known
  for, review highlights, and a Google Maps button (tap the chips on questions
  and timeline items)
- 📱 A QR code that opens her exact plan on any phone
- 📄 A designed, two-page **PDF itinerary**: page 1 is the ticket-style plan,
  page 2 is a "field guide" with every venue's details + scannable Maps QR codes

Everything is static — no build step, no server, no dependencies to install.
All libraries (QR, PDF, confetti) and meme images are vendored locally.

## Run locally

```bash
cd dateplan
python3 -m http.server 8000
# open http://localhost:8000
```

(Any static server works. Don't open index.html via file:// — the PDF generator needs http.)

## Deploy to Vercel

**Option A — via GitHub (recommended):**

```bash
git init
git add -A
git commit -m "A very official Saturday"
gh repo create dateplan --private --source=. --push   # or push manually
```

Then on [vercel.com](https://vercel.com): **Add New Project → Import** the repo →
Framework preset: **Other** → Deploy. That's it — it's a plain static site.

**Option B — instant, no GitHub:**

```bash
npx vercel --prod
```

## How the QR / share link works

Her answers are encoded into the URL (`?d=...`). The QR code and Share button
both point to that URL, so scanning it on her phone reopens her exact plan —
where she can download the PDF. It works automatically on whatever domain you
deploy to (no configuration needed).

## Customize

- **Venues / times / jokes:** edit `timelineData()` and `planLines()` in `app.js`
- **Venue info (addresses, hours, reviews, Maps links):** the `VENUES` object in
  `app.js` — researched July 2026; worth a quick re-check before the date
- **Questions:** the `stepLunch()` … `stepPhotos()` functions in `app.js`
- **Memes:** swap images in `assets/memes/` and captions in the `meme*()` functions
- **PDF design:** `buildPdfHtml()` in `app.js`
- **Colors:** CSS variables at the top of `style.css`
