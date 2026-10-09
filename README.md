# GTOC — Organic Chemistry in GTNH

[中文网站](https://soraruholic.github.io/GTOC/) · [English handbook](https://soraruholic.github.io/GTOC/en/)

An interactive chemistry and process-learning handbook for the GTNH-OC project, targeting GT New Horizons 2.9.0-beta-2. This repository publishes the static website, shared chemical/design data and reviewed English presentation. It does not contain a runnable mod/server release.

## Explore

- [Synthesis atlas](https://soraruholic.github.io/GTOC/en/#synthesis): selectable routes from raw feed to product, with parallel branches and side streams.
- [Line bus and recovery](https://soraruholic.github.io/GTOC/en/line-bus.html): segregated central stores, complete production and integration plants, separate local containment and central custody endpoints.
- [Build the ester line](https://soraruholic.github.io/GTOC/en/ester-guide.html): 8 steps, feeds, devices, model conditions and material destinations.
- [Build vitamin A through retinol](https://soraruholic.github.io/GTOC/en/vitamin-a-guide.html): 19 chapters through parallel branches, finishing and retinol hydrolysis.
- [Mechanism classroom](https://soraruholic.github.io/GTOC/en/mechanisms.html): 33 lessons, 2D electron flow and mapped 3D structures.
- [Complete facilities](https://soraruholic.github.io/GTOC/en/modular-plant.html): located source stores, metering, waste receivers and utilities.
- [Supply and waste dossiers](https://soraruholic.github.io/GTOC/en/factory-services.html).
- [Retinol and night-vision gameplay](https://soraruholic.github.io/GTOC/en/retinol-guide.html).

The current production guides target 0.4.6-production-alpha1. Production plants start with empty stores. 36 GT Large Chemical Reactor recipes supply every externally charged reagent, with packet transport through a central double chest and hopper. The scheduler debits stocks, runs each chemical operation, and automatically begins the next funded batch. Retinol production issues ledger-backed uses for 12 minutes of fictional night vision. Copies of a reference share the same balance. Both routes passed two-batch server tests through physical chests and hoppers; human client acceptance is tracked separately. Sealed previous-batch residuals remain authoritative inventory and finite storage applies backpressure. The `integration` command remains an explicitly finite test fixture.

Scientific calibration and operating gameplay rules have separate documentation. Full industrial kinetics, hydraulic simulation and waste-treatment qualification are not inferred from the working game routes.

## Publication

`site/` is the complete public payload. All local links work under the `/GTOC/` project path; main interactive content works offline without a CDN. Open `site/index.html` or serve that directory with a static HTTP server.

The `Publish Pages` workflow verifies the SHA-256 manifest and local links before uploading only `site/` to GitHub Pages. To update, rebuild the canonical handbook in the development workspace, review source/translation changes, run browser and package QA, regenerate `publication-manifest.json`, then commit the reviewed static payload here. No remote chemistry API runs on the public site.

Validation: `python scripts/validate-pages.py`.

Scientific identities and uncertainties remain explicit. A teaching extent is not a measured yield, a rendered conformer is not a transition state, and a storage diagram is not an already operational factory. Embedded third-party material retains its supplied license and source notices; see `site/vendor/3Dmol-LICENSE.txt` and the website source indexes.
