# Historical repository backups

These files retain Git history and GitHub discussion records from the original projects before their proposed retirement. They are backups, separate from the working web folders.

- `hanfu.git.bundle.part-aa` and `hanfu.git.bundle.part-ab`: the complete Hanfu Git bundle split into two parts. Combine them in alphabetical order. The resulting bundle has SHA-256 `86736a87078144dd54ba104d8e6f4339cf8831369a079a523b8ece20e310a1aa`.
- `dunhuang-star-chart.git.bundle`: complete Dunhuang Git history, including `main` and the four other branch tips.
- `github-records.json`: snapshots of the original repositories' issues, pull requests, issue comments, pull request review comments and reviews. These are records only; they do not automatically recreate GitHub issues or pull requests.

To inspect a bundle, reconstruct the split Hanfu file first, then create an empty bare repository and fetch all refs:

```sh
cat hanfu.git.bundle.part-* > hanfu.git.bundle
git init --bare restored-hanfu.git
git -C restored-hanfu.git fetch "$(pwd)/hanfu.git.bundle" '+refs/*:refs/*'
```

Use the Dunhuang bundle in the same way without the first command. The original branch tips are retained as `refs/remotes/origin/*` alongside `refs/heads/main`.
