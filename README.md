# GTOC — Organic Chemistry in GTNH

[中文网站](https://soraruholic.github.io/GTOC/) · [English handbook](https://soraruholic.github.io/GTOC/en/)

An interactive chemistry and process-learning handbook for the GTNH-OC project, targeting GT New Horizons 2.9.0-beta-2. This repository publishes the static website, shared chemical/design data and reviewed English presentation. It does not contain a runnable mod/server release.

## Explore

- [Build the ester line](https://soraruholic.github.io/GTOC/en/ester-guide.html): 8 steps, feeds, devices, model conditions and material destinations.
- [Build vitamin A acetate](https://soraruholic.github.io/GTOC/en/vitamin-a-guide.html): 17 steps through parallel branches and finishing.
- [Mechanism classroom](https://soraruholic.github.io/GTOC/en/mechanisms.html): 33 lessons, 2D electron flow and mapped 3D structures.
- [Complete facilities](https://soraruholic.github.io/GTOC/en/modular-plant.html): located source stores, metering, waste receivers and utilities.
- [Supply and waste dossiers](https://soraruholic.github.io/GTOC/en/factory-services.html).
- [Retinol and night-vision proposal](https://soraruholic.github.io/GTOC/en/retinol-guide.html).

The main English curriculum has 20 pages. Historical engineering archives and some specialized Chinese simulators remain explicitly linked as Chinese sources. Retinol finishing and the night-vision recipe are design proposals, not installed game features. The potion is fictional game balance; its duration and material cost are not medical claims.

## Publication

`site/` is the complete public payload. All local links work under the `/GTOC/` project path; main interactive content works offline without a CDN. Open `site/index.html` or serve that directory with a static HTTP server.

The `Publish Pages` workflow verifies the SHA-256 manifest and local links before uploading only `site/` to GitHub Pages. To update, rebuild the canonical handbook in the development workspace, review source/translation changes, run browser and package QA, regenerate `publication-manifest.json`, then commit the reviewed static payload here. No remote chemistry API runs on the public site.

Validation: `python scripts/validate-pages.py`.

Scientific identities and uncertainties remain explicit. A teaching extent is not a measured yield, a rendered conformer is not a transition state, and a storage diagram is not an already operational factory. Embedded third-party material retains its supplied license and source notices; see `site/vendor/3Dmol-LICENSE.txt` and the website source indexes.
