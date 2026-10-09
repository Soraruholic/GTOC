# GTOC — Organic Chemistry in GTNH

[中文网站](https://soraruholic.github.io/GTOC/) · [English handbook](https://soraruholic.github.io/GTOC/en/)

An interactive chemistry and process-learning handbook for the GTNH-OC project, targeting GT New Horizons 2.9.0-beta-2. This repository publishes the static website, shared chemical/design data and reviewed English presentation. It does not contain a runnable mod/server release.

## Explore

- [Synthesis atlas](https://soraruholic.github.io/GTOC/en/#synthesis): selectable routes from raw feed to product, with parallel branches and side streams.
- [Line bus and recovery](https://soraruholic.github.io/GTOC/en/line-bus.html): segregated central stores, a complete finite integration plant, separate local containment and central custody endpoints.
- [Build the ester line](https://soraruholic.github.io/GTOC/en/ester-guide.html): 8 steps, feeds, devices, model conditions and material destinations.
- [Build vitamin A through retinol](https://soraruholic.github.io/GTOC/en/vitamin-a-guide.html): 19 chapters through parallel branches, finishing and retinol hydrolysis.
- [Mechanism classroom](https://soraruholic.github.io/GTOC/en/mechanisms.html): 33 lessons, 2D electron flow and mapped 3D structures.
- [Complete facilities](https://soraruholic.github.io/GTOC/en/modular-plant.html): located source stores, metering, waste receivers and utilities.
- [Supply and waste dossiers](https://soraruholic.github.io/GTOC/en/factory-services.html).
- [Retinol and night-vision proposal](https://soraruholic.github.io/GTOC/en/retinol-guide.html).

The main English curriculum has 21 pages. Historical engineering archives and some specialized Chinese simulators remain explicitly linked as Chinese sources. The integration command builds the complete modular test plant, source stores, sealed OC rack and collection ports, then runs one explicitly finite batch automatically. Source debits and chemistry share one durable authority. Native GT pipe ingress, solvent purification, chemical waste treatment and native GT product dispatch are separate acceptance scopes. Recovery splits preserve impurities and hold candidate stock for review. Retinol stock is produced by the integration model; night-vision gameplay remains a separate proposal. Potion duration and cost are fictional game balance, not medical claims.

## Publication

`site/` is the complete public payload. All local links work under the `/GTOC/` project path; main interactive content works offline without a CDN. Open `site/index.html` or serve that directory with a static HTTP server.

The `Publish Pages` workflow verifies the SHA-256 manifest and local links before uploading only `site/` to GitHub Pages. To update, rebuild the canonical handbook in the development workspace, review source/translation changes, run browser and package QA, regenerate `publication-manifest.json`, then commit the reviewed static payload here. No remote chemistry API runs on the public site.

Validation: `python scripts/validate-pages.py`.

Scientific identities and uncertainties remain explicit. A teaching extent is not a measured yield, a rendered conformer is not a transition state, and a storage diagram is not an already operational factory. Embedded third-party material retains its supplied license and source notices; see `site/vendor/3Dmol-LICENSE.txt` and the website source indexes.
