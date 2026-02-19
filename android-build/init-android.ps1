param(
  [switch]$SkipTargetsInstall
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path $PSScriptRoot -Parent
$frontendDir = Join-Path $repoRoot 'frontend'

function Resolve-SdkPath {
  if ($env:ANDROID_HOME -and (Test-Path $env:ANDROID_HOME)) { return $env:ANDROID_HOME }
  if ($env:ANDROID_SDK_ROOT -and (Test-Path $env:ANDROID_SDK_ROOT)) { return $env:ANDROID_SDK_ROOT }
  $fallbacks = @('D:\android-studio-sdk', "$env:LOCALAPPDATA\Android\Sdk")
  foreach ($p in $fallbacks) { if (Test-Path $p) { return $p } }
  throw 'Android SDK not found. Set ANDROID_HOME or ANDROID_SDK_ROOT.'
}

function Resolve-NdkPath([string]$sdkPath) {
  if ($env:NDK_HOME -and (Test-Path $env:NDK_HOME)) { return $env:NDK_HOME }
  $ndkRoot = Join-Path $sdkPath 'ndk'
  if (Test-Path $ndkRoot) {
    $latest = Get-ChildItem $ndkRoot -Directory | Sort-Object Name -Descending | Select-Object -First 1
    if ($latest) { return $latest.FullName }
  }
  throw "Android NDK not found under $ndkRoot. Install it in Android Studio (SDK Manager -> SDK Tools -> NDK) and rerun."
}

if (-not (Test-Path $frontendDir)) {
  throw "Frontend directory not found: $frontendDir"
}

$sdkPath = Resolve-SdkPath
$ndkPath = Resolve-NdkPath $sdkPath

$env:ANDROID_HOME = $sdkPath
$env:ANDROID_SDK_ROOT = $sdkPath
$env:NDK_HOME = $ndkPath

$cmd = 'npx tauri android init --ci'
if ($SkipTargetsInstall) {
  $cmd += ' --skip-targets-install'
}

Write-Host "ANDROID_HOME=$sdkPath"
Write-Host "NDK_HOME=$ndkPath"
Write-Host "Running: $cmd" -ForegroundColor Cyan
Push-Location $frontendDir
try {
  Invoke-Expression $cmd
} finally {
  Pop-Location
}
