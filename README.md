# My web pages

A collection of self-contained web projects, with each project stored in its own folder.

| Project | Folder | Original |
| --- | --- | --- |
| Hanfu museum | [hanfu/](hanfu/) | [Repository](https://github.com/daoyi2026/hanfu) · [Published website](https://daoyi2026.github.io/hanfu/) |
| Dunhuang Star Chart | [dunhuang-star-chart/](dunhuang-star-chart/) | [Repository](https://github.com/daoyi2026/Dunhuang-Star-Chart) · [Published website](https://daoyi2026.github.io/Dunhuang-Star-Chart/) |
| Temple of Heaven: Hall of Prayer for Good Harvests | [temple-of-heaven/](temple-of-heaven/) | Original local interactive model and research dossier |

The two imported repositories are snapshots of their default branches, not Git submodules. Their existing repositories, version histories, and published websites remain independent; changes made here do not automatically update those originals.

- Hanfu snapshot: `4eaf199dc0a17a95e14a5f67842f22647b58a730`.
- Dunhuang Star Chart snapshot: `3d871ddba129bafd3753c7dc0dfd28cc5d4d2812`.

The Temple of Heaven folder includes the interactive model, local libraries, a preview, and its research materials. Source and attribution information is included with the individual projects.

## Viewing locally

From the repository directory, run `python3 -m http.server 8000` and visit `http://localhost:8000/`, then open a project folder. A local HTTP server is needed for pages that use JavaScript modules or load local assets.
