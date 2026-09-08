# Releasing

This project uses [Semantic Versioning](https://semver.org/) with a single
version shared across all packages. Releases are cut manually.

## Versioning model
- **Source of truth:** the `version` field in the root `package.json`.
- `backend/`, `frontend/`, and `shared/` package.json are kept in lockstep with
  it — always change the version with the bump script, never by hand.
- The running app exposes its version at **`GET /api/version`** (also in
  `/api/health`) and shows it in the footer, so testers can report their build.
- Pre-1.0 (`0.x`) means the app is still stabilizing during user testing;
  minor bumps may include breaking changes. Bump to `1.0.0` when it's stable.

Choose the bump per SemVer:
- **patch** (`0.1.0 → 0.1.1`) — bug fixes, no new behavior.
- **minor** (`0.1.0 → 0.2.0`) — new features, backwards-compatible.
- **major** (`0.1.0 → 1.0.0`) — breaking changes.

## Cutting a release

1. **Update the changelog.** Make sure everything since the last release is
   listed under `## [Unreleased]` in `CHANGELOG.md`.

2. **Bump the version** (updates all package.json files at once):
   ```bash
   npm run bump -- minor      # or: patch | major | an explicit X.Y.Z
   ```

3. **Finalize the changelog.** Move the `Unreleased` items under a new heading
   `## [X.Y.Z] - YYYY-MM-DD` and update the compare/link references at the
   bottom.

4. **Commit and open a PR** (e.g. `chore(release): vX.Y.Z`), then merge to
   `master`.

5. **Tag the merged commit and push the tag:**
   ```bash
   git checkout master && git pull
   git tag -a vX.Y.Z -m "vX.Y.Z"
   git push origin vX.Y.Z
   ```
   Then create a GitHub Release from that tag, pasting the changelog section as
   the notes. (A tag is the canonical release marker; the GitHub Release is
   optional but recommended.)

## Verifying
```bash
npm run check:version   # fails if any package.json version has drifted
```
Consider running this in CI so a mismatched version can't merge.
