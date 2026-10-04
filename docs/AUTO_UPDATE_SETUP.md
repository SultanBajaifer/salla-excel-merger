# Auto-Update and Releases

The app updates itself from **GitHub Releases** using `electron-updater`.
Since v2.0.0 updates are **mandatory**.

## Behaviour for users

1. On startup (and every 6 hours while running) the app checks GitHub Releases.
2. If a newer version exists it is downloaded immediately. A full-screen
   "تحديث إلزامي" (mandatory update) screen with a progress bar blocks the app —
   there is no "Later" button and the screen can't be closed.
3. When the download finishes, the app restarts and installs the update silently.
4. If the download fails, the screen stays up with a "إعادة المحاولة" (retry) button.
5. If the check itself fails (e.g. no internet), the app opens normally and
   checks again next time.

The main process enforces the same rule: while an update is pending, every
file/Excel operation is refused.

Updates only run in installed builds, not in `npm run dev`.

## Logs

Updater and app logs are written to
`%APPDATA%\salla-excel-merger\logs\main.log`. Ask a customer for this file when
an update or activation problem is reported.

## Releasing a new version

1. Update `version` in `package.json` (and run `npm install` so
   `package-lock.json` matches).
2. Commit, tag and push:

   ```bash
   git commit -am "chore(release): v2.0.1"
   git tag v2.0.1
   git push origin main
   git push origin v2.0.1
   ```

3. The **Release** workflow (`.github/workflows/release.yml`) runs on the tag:
   it bundles the Python tools with PyInstaller, checks the license public key
   is configured, runs lint and tests, builds the Windows installer and
   publishes it to GitHub Releases. Installed apps pick it up on their next check.

Only Windows is built and released. Pushes without a tag don't run the release
workflow; pull requests to `main`/`develop` run the **Development Build**
workflow (`.github/workflows/build.yml`), which uploads an unpublished installer
as a build artifact.

## Configuration

All packaging and publishing settings are in `electron-builder.yml`.

- `publish` points the updater at `SultanBajaifer/salla-excel-merger` releases.
- **Never change `appId`** (`com.electron.salla-excel-merger`). The Windows
  installer identity is derived from it, so changing it makes new versions
  install side by side instead of upgrading existing installs.

## Upgrading from v1.x

Old versions (≤ 1.1.6) still show the old optional dialog. As soon as a user
clicks "نعم" (Yes) once, v2 is downloaded and installed (at the latest when the
app is closed), after which the update and license gates apply. Users who keep
clicking "لاحقاً" (Later) stay on the old version.

## Troubleshooting

- **Update not detected:** make sure the release is published (not a draft) and
  that `latest.yml` is among its assets.
- **Release workflow fails at "Verify license public key":** run
  `npm run license:keygen` locally and commit `src/main/license/publicKey.ts`
  (see [LICENSING.md](LICENSING.md)).
