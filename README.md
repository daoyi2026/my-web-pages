# My web pages

A collection of self-contained web projects. The [collection homepage](https://daoyi2026.github.io/my-web-pages/) links directly to each project.

| No. | Project | Files | Website |
| --- | --- | --- | --- |
| 004 | Softling — Draw Your Plush Companion | [softling/](softling/) | [Open](https://daoyi2026.github.io/my-web-pages/softling/) |
| 003 | Temple of Heaven: Hall of Prayer for Good Harvests | [temple-of-heaven/](temple-of-heaven/) | [Open](https://daoyi2026.github.io/my-web-pages/temple-of-heaven/) |
| 002 | Hanfu museum | [hanfu/](hanfu/) | [Open](https://daoyi2026.github.io/my-web-pages/hanfu/) |
| 001 | Dunhuang Star Chart | [dunhuang-star-chart/](dunhuang-star-chart/) | [Open](https://daoyi2026.github.io/my-web-pages/dunhuang-star-chart/) |

The Hanfu and Dunhuang folders are snapshots of the original projects' default branches. Each folder contains its own assets and source documentation. The [archives/](archives/) folder preserves the original Git histories and GitHub discussion records. The Temple of Heaven folder also includes a research dossier and local rendering libraries.

- Hanfu snapshot: `4eaf199dc0a17a95e14a5f67842f22647b58a730`.
- Dunhuang Star Chart snapshot: `3d871ddba129bafd3753c7dc0dfd28cc5d4d2812`.

## Catalog numbering

Project numbers follow creation order and stay with each project. Add a newly created project with the next number (currently `005`), place it first in the catalog, use three-digit numbers, and update the displayed number range without renumbering older projects. Both this table and the homepage catalog list newest additions first.

Softling is a browser-local drawing playground with five plush/fabric styles, random accessories, supportive sentences, mobile drawing controls, and PNG share-card export. It uses locally vendored Three.js and does not require an API key.

## Viewing locally

From the repository directory, run `python3 -m http.server 8000` and visit `http://localhost:8000/`. A local HTTP server is needed for pages that use JavaScript modules or load local assets.
