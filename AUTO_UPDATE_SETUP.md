# Auto-Update and GitHub Deployment Setup

This document explains how to use the auto-update functionality and GitHub deployment for the Salla Excel Merger application.

## Overview

The application now includes:

1. **Auto-update functionality** using `electron-updater`
2. **GitHub Actions workflows** for automated building and releasing
3. **GitHub Releases** as the update distribution mechanism

## How Auto-Update Works

### For Users

1. The application automatically checks for updates 3 seconds after launch
2. If an update is available, a dialog appears in Arabic asking if they want to download
3. After download completes, users can choose to restart and install immediately or later
4. Updates install automatically on next app restart if "later" was chosen

### For Developers

The auto-update system:

- Only works in production builds (not in development)
- Uses GitHub Releases to distribute updates
- Downloads updates in the background
- Preserves user data during updates

## GitHub Actions Workflows

### 1. Release Workflow (`.github/workflows/release.yml`)

**Trigger**: When you push a version tag (e.g., `v1.0.0`, `v1.2.3`)

**What it does**:

- Builds the application for Windows, macOS, and Linux
- Creates a GitHub Release with the version number
- Uploads installers as release assets
- Publishes update manifests for auto-updater

**Platforms built**:

- **Windows**: `.exe` installer (NSIS)
- **macOS**: `.dmg` installer
- **Linux**: `.AppImage`, `.deb`, `.snap`

### 2. Development Build Workflow (`.github/workflows/build.yml`)

**Trigger**: Push to `main` or `develop` branches, or pull requests

**What it does**:

- Runs linter to check code quality
- Builds the application for all platforms
- Creates build artifacts (stored for 7 days)
- Does NOT create a release or trigger auto-updates

## How to Create a Release

### Step 1: Update Version Number

Edit `package.json` and update the version:

```json
{
  "version": "1.2.0"
}
```

### Step 2: Commit and Push

```bash
git add package.json
git commit -m "Bump version to 1.2.0"
git push origin main
```

### Step 3: Create and Push a Version Tag

```bash
# Create a tag with the version number (must start with 'v')
git tag v1.2.0

# Push the tag to GitHub
git push origin v1.2.0
```

### Step 4: Wait for GitHub Actions

1. Go to your repository on GitHub
2. Click on "Actions" tab
3. You'll see the "Build and Release" workflow running
4. Wait for all jobs (Windows, macOS, Linux) to complete (usually 10-15 minutes)

### Step 5: Verify the Release

1. Go to the "Releases" section of your repository
2. You should see a new release with version `v1.2.0`
3. The release will have installer files attached:
   - `salla-excel-merger-1.2.0-setup.exe` (Windows)
   - `salla-excel-merger-1.2.0.dmg` (macOS)
   - `salla-excel-merger-1.2.0.AppImage` (Linux)
   - `latest.yml`, `latest-mac.yml`, `latest-linux.yml` (update manifests)

## Configuration Files

### `electron-builder.yml`

Updated to use GitHub as the update provider:

```yaml
publish:
  provider: github
  owner: SultanBajaifer
  repo: salla-excel-merger
  releaseType: release
```

### Auto-Update Code in `src/main/index.ts`

Key features:

- Checks for updates on app start (after 3-second delay)
- Shows Arabic dialogs for user interaction
- Doesn't auto-download without user permission
- Auto-installs on app quit if downloaded

## Testing

### Test Development Builds

Push to `main` or `develop` branch:

```bash
git push origin main
```

Check the "Actions" tab to see the build progress. Download artifacts to test.

### Test Auto-Update (Local)

1. Build a production version with version 1.0.0
2. Install and run it
3. Update package.json to version 1.1.0
4. Create and push a tag for v1.1.0
5. Wait for the release to be published
6. Run the 1.0.0 version - it should detect the 1.1.0 update

### Test Auto-Update (Dev Environment)

The auto-updater is disabled in development mode. To test:

```bash
npm run build
npm run build:win  # or build:mac, build:linux
```

Then install and run the built application.

## Troubleshooting

### Updates Not Detecting

**Problem**: App doesn't show update notification

**Solutions**:

1. Ensure you're running a production build (not `npm run dev`)
2. Check that version in `package.json` is lower than the latest release
3. Verify the release has `latest.yml` (Windows), `latest-mac.yml` (macOS), or `latest-linux.yml` (Linux)
4. Check browser console for auto-updater logs

### Build Failing on GitHub Actions

**Problem**: Workflow fails during build

**Solutions**:

1. Check if all dependencies are in `package.json`
2. Verify that `npm run build` works locally
3. Check the GitHub Actions logs for specific error messages
4. Ensure `GH_TOKEN` secret is available (automatically provided by GitHub)

### Release Not Creating

**Problem**: Tag is pushed but no release appears

**Solutions**:

1. Verify tag starts with 'v' (e.g., `v1.0.0`, not `1.0.0`)
2. Check that the workflow file is in `.github/workflows/release.yml`
3. Ensure the workflow has `tags: - 'v*.*.*'` trigger
4. Check GitHub Actions logs for errors

## Security

### GitHub Token

The workflows use `secrets.GITHUB_TOKEN` which is automatically provided by GitHub Actions. You don't need to create or configure this token - it's available by default with the necessary permissions to:

- Create releases
- Upload release assets
- Read repository contents

### Code Signing

For production releases, you should add code signing:

**Windows**: Add code signing certificate

```yaml
win:
  certificateFile: path/to/certificate.pfx
  certificatePassword: ${env.CERTIFICATE_PASSWORD}
```

**macOS**: Add Apple Developer ID

```yaml
mac:
  notarize: true
```

Store secrets in GitHub repository settings → Secrets and variables → Actions.

## Customization

### Change Update Check Frequency

Edit `src/main/index.ts`:

```typescript
// Check for updates every 24 hours
setInterval(
  () => {
    checkForUpdates()
  },
  24 * 60 * 60 * 1000
) // 24 hours in milliseconds
```

### Change Dialog Language

Update the dialog messages in `src/main/index.ts`:

```typescript
dialog.showMessageBox({
  title: 'Update Available', // Change to your language
  message: 'A new update is available'
  // ...
})
```

### Add Version Display in UI

You can show the current version in your app:

```typescript
// In renderer process
const version = window.electron.process.versions.electron
```

## Best Practices

1. **Semantic Versioning**: Use `MAJOR.MINOR.PATCH` (e.g., 1.2.3)
   - MAJOR: Breaking changes
   - MINOR: New features (backward compatible)
   - PATCH: Bug fixes

2. **Testing**: Always test builds locally before creating a release

3. **Changelog**: Keep a CHANGELOG.md file to document changes

4. **Version Tags**: Never delete or move version tags after creating a release

5. **Pre-releases**: Use `-beta` or `-alpha` suffixes for testing (e.g., `v1.2.0-beta.1`)

## Next Steps

### Immediate Actions Required:

1. **Update package.json**: Set the correct initial version

   ```bash
   cd /path/to/salla-excel-merger
   # Edit package.json to set version to "1.0.0"
   ```

2. **Test the workflows**: Push to main branch to trigger dev build

   ```bash
   git add .
   git commit -m "Add auto-update and GitHub workflows"
   git push origin main
   ```

3. **Create first release**: When ready for v1.0.0
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

### Optional Enhancements:

1. **Add code signing** for Windows and macOS
2. **Set up beta/alpha channels** for testing
3. **Add release notes** automation
4. **Configure update intervals** based on your needs
5. **Add update notifications** in the UI

## Support

For issues with auto-update or deployment:

1. Check GitHub Actions logs
2. Review electron-updater documentation
3. Check electron-builder documentation

## Resources

- [electron-updater Documentation](https://www.electron.build/auto-update)
- [electron-builder Documentation](https://www.electron.build/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
