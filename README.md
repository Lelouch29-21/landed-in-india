# Landed in India

`Landed in India` is a GitHub Pages app for comparing supported Indian and international product listings and estimating what an imported item could cost after landing in India.

## What it does

- searches supported live sources
  - Amazon India
  - Croma
  - eBay
  - AliExpress
- converts supported foreign prices to INR
- estimates landed import cost for India
- supports light mode and dark mode
- stores saved deals, settings, last scan, and search history in browser storage

## Important limitation

This is a static GitHub Pages app. That means it does **not** run a private crawling backend or a paid shopping-search API, so it cannot reliably search the entire internet the way a backend service could. Instead, it scans a supported set of live sources from the browser and ranks the offers it can read.

## Import-cost model

The default India estimator includes:

- personal import mode at `42.08%`
- gift mode at `77.28%`
- custom duty override
- optional shipping buffer
- optional insurance
- optional handling fee in INR

This is a planning estimate only. Actual customs treatment can change by product category, courier, exemptions, and customs classification.

## Local preview

```bash
cd /Users/ameyakulkarni/Desktop/landed-in-india
python3 -m http.server 4173
```

Then open:

- `http://localhost:4173/`

## Deploying to GitHub Pages

The repository includes a GitHub Actions workflow in `.github/workflows/deploy-pages.yml`.

1. Push to `main`.
2. In repository settings, set GitHub Pages to use `GitHub Actions`.
3. The workflow publishes the root site files.
