# Android Build Workspace

This folder is a separate workspace for Android build flow based on the existing `frontend/` Tauri app.

## What is already prepared

- `init-android.ps1`: initializes Android target (`npx tauri android init --ci`).
- `build-android.ps1`: builds release APK/AAB (`npx tauri android build`), then signs and verifies release artifacts, and copies final files to `android-build/artifacts/<timestamp>/`.

## Required environment

Set and verify these variables before running scripts:

- `ANDROID_HOME` -> Android SDK path
- `NDK_HOME` -> Android NDK path

Also required in PATH:

- `node` / `npm`
- `rustup` / `cargo`
- Java JDK (for Gradle/Android)

## Release signing configuration

`build-android.ps1` reads signing settings from:

- `android-build/keystore/release-signing.properties`

Template file in repo:

- `android-build/release-signing.properties.template`

Required keys:

- `storeFile` (relative to `android-build/keystore` or absolute path)
- `storePassword`
- `keyAlias`
- `keyPassword`
- `tsaUrl` (RFC 3161 timestamp server URL, used for AAB signing)

Optional keys:

- `allowSelfSigned` (`false` by default)
  - `false`: build fails if AAB signer chain is self-signed/untrusted, and if timestamp is missing
  - `true`: allows internal/self-signed builds (not for production)

Example:

```properties
storeFile=my-release-keystore.p12
storePassword=change-me
keyAlias=release
keyPassword=change-me
tsaUrl=https://timestamp.digicert.com
allowSelfSigned=false
```

Create local signing config:

```powershell
Copy-Item .\android-build\release-signing.properties.template .\android-build\keystore\release-signing.properties
```

## What to change before Android release

1. Update app version in project sources:

- `frontend/package.json` (`version`)
- `frontend/package-lock.json` (`version` in root + package section)
- `frontend/src-tauri/Cargo.toml` (`version`)
- `frontend/src-tauri/Cargo.lock` (`project-notes-studio` package version)
- `frontend/src-tauri/tauri.conf.json` (`version`)

2. Verify Android signing settings in:

- `android-build/keystore/release-signing.properties`

Required values to check:

- `storeFile`
- `storePassword`
- `keyAlias`
- `keyPassword`
- `tsaUrl`

3. Choose signature policy:

- `allowSelfSigned=false` for production release policy
- `allowSelfSigned=true` only for internal/testing builds

## Usage

From repo root (`d:\my-app\pc`):

```powershell
# 1) Initialize Android target once
powershell -ExecutionPolicy Bypass -File .\android-build\init-android.ps1

# 2) Build Android release
powershell -ExecutionPolicy Bypass -File .\android-build\build-android.ps1
```

## Build output

Each run writes artifacts to:

- `android-build/artifacts/<timestamp>/`

Expected release files:

- `app-universal-release-signed.apk`
- `app-universal-release.aab`

## Notes

- APK is signed with `apksigner` and validated with `apksigner verify`.
- AAB is signed with `jarsigner` using timestamping (`-tsa`) and validated with `jarsigner -verify -verbose -certs`.
- Production release should use a CA-issued signing certificate chain (not self-signed).
