# Supplier image library

The site uses verified WebP images in `public/images/catalog/`. The images ship with the app; runtime rendering does not fetch Unsplash or depend on the suppliers' image servers.

`src/content/source-photos.json` records each file's source URL, supplier, source page, dimensions, and description. Existing keys such as `heroWarehouse` remain available in `src/content/photos.ts`. Additional images use `supplier_<id>` keys.

In an image field, choose **Stock photos** and search by product or key. The picker shows 60 results at a time. Uploaded lot photos take precedence over representative images, which are labelled on listing cards and galleries. Supplier attribution is retained in internal records.

## Check the library

```powershell
npm run photos:check
```

This offline check validates the actual image files and dimensions, all catalog references, excluded graphics, gallery duplicates, and uploaded-photo precedence.

## Refresh source images

```powershell
npm run photos:fetch
npm run photos:check
```

Refreshing requires network access. The importer uses the Jax product snapshot and the supplied supplier pages. It retains previously verified local images if a source becomes unavailable and refuses to replace the manifest when a required image is missing. Files below the minimum dimensions are rejected before saving. The exclusions in `scripts/excluded-source-photos.json` prevent reviewed logos, badges, and decorative graphics from returning.

The importer regenerates `PHOTO-CREDITS.md`, `docs/STOCK-IMAGE-INDEX.md`, and its fetch report. Review newly added images before deploying. Faire's New Products page was inaccessible during the import; public discovery links and any failures are recorded separately.

## Verify a production build separately

```powershell
$env:PALLET_BUILD_DIR = '.next-verify'
npm run build
Remove-Item Env:PALLET_BUILD_DIR
```

This keeps verification output separate from a development server using `.next`. Normal hosting builds still use `.next`.
