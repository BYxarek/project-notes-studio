$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path $PSScriptRoot -Parent
$frontendDir = Join-Path $repoRoot 'frontend'
$artifactsDir = Join-Path $PSScriptRoot 'artifacts'
$androidOutputs = Join-Path $frontendDir 'src-tauri\gen\android\app\build\outputs'
$releaseSigningFile = Join-Path $PSScriptRoot 'keystore\release-signing.properties'

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

function Resolve-ApkSignerPath([string]$sdkPath) {
  $buildToolsRoot = Join-Path $sdkPath 'build-tools'
  if (-not (Test-Path $buildToolsRoot)) {
    throw "Android build-tools not found under $buildToolsRoot."
  }

  $candidate = Get-ChildItem $buildToolsRoot -Directory |
    Sort-Object Name -Descending |
    ForEach-Object { Join-Path $_.FullName 'apksigner.bat' } |
    Where-Object { Test-Path $_ } |
    Select-Object -First 1

  if (-not $candidate) {
    throw "apksigner.bat not found under $buildToolsRoot."
  }

  return $candidate
}

function Resolve-JarSignerPath {
  $fromPath = Get-Command jarsigner.exe -ErrorAction SilentlyContinue
  if ($fromPath -and (Test-Path $fromPath.Source)) { return $fromPath.Source }

  $candidates = @()
  if ($env:JAVA_HOME) {
    $candidates += (Join-Path $env:JAVA_HOME 'bin\jarsigner.exe')
  }
  $candidates += 'C:\Program Files\Android\Android Studio\jbr\bin\jarsigner.exe'

  foreach ($candidate in $candidates) {
    if (Test-Path $candidate) { return $candidate }
  }

  $javaDirs = @('C:\Program Files\Java', 'C:\Program Files\Eclipse Adoptium')
  foreach ($root in $javaDirs) {
    if (-not (Test-Path $root)) { continue }
    $found = Get-ChildItem $root -Directory -ErrorAction SilentlyContinue |
      Sort-Object Name -Descending |
      ForEach-Object { Join-Path $_.FullName 'bin\jarsigner.exe' } |
      Where-Object { Test-Path $_ } |
      Select-Object -First 1
    if ($found) { return $found }
  }

  throw 'jarsigner.exe not found. Install JDK and/or set JAVA_HOME.'
}

function Get-ReleaseSigningConfig([string]$propsFile) {
  if (-not (Test-Path $propsFile)) {
    throw "Signing properties file not found: $propsFile"
  }

  $raw = @{}
  foreach ($line in Get-Content $propsFile) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith('#')) { continue }
    $pair = $trimmed.Split('=', 2)
    if ($pair.Count -ne 2) { continue }
    $raw[$pair[0].Trim()] = $pair[1].Trim()
  }

  foreach ($required in @('storeFile', 'storePassword', 'keyAlias', 'keyPassword', 'tsaUrl')) {
    if (-not $raw.ContainsKey($required) -or [string]::IsNullOrWhiteSpace($raw[$required])) {
      throw "Missing required key '$required' in $propsFile"
    }
  }

  $storeFileValue = $raw['storeFile']
  $storeFilePath = if ([System.IO.Path]::IsPathRooted($storeFileValue)) {
    $storeFileValue
  } else {
    Join-Path (Split-Path $propsFile -Parent) $storeFileValue
  }

  if (-not (Test-Path $storeFilePath)) {
    throw "Keystore file not found: $storeFilePath"
  }

  $allowSelfSigned = $false
  if ($raw.ContainsKey('allowSelfSigned')) {
    $allowSelfSigned = $raw['allowSelfSigned'].ToLowerInvariant() -eq 'true'
  }

  return @{
    StoreFile = $storeFilePath
    StorePassword = $raw['storePassword']
    KeyAlias = $raw['keyAlias']
    KeyPassword = $raw['keyPassword']
    TsaUrl = $raw['tsaUrl']
    AllowSelfSigned = $allowSelfSigned
  }
}

function Invoke-Checked([string]$Executable, [string[]]$Arguments, [string]$ErrorMessage) {
  & $Executable @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$ErrorMessage (exit code: $LASTEXITCODE)"
  }
}

function Invoke-CheckedCapture([string]$Executable, [string[]]$Arguments, [string]$ErrorMessage) {
  $output = & $Executable @Arguments 2>&1
  if ($LASTEXITCODE -ne 0) {
    if ($output) { $output | ForEach-Object { Write-Host $_ } }
    throw "$ErrorMessage (exit code: $LASTEXITCODE)"
  }
  return $output
}

function Get-SignedApkName([string]$name) {
  if ($name -match '-unsigned\.apk$') { return ($name -replace '-unsigned\.apk$', '.apk') }
  if ($name -match '-unaligned\.apk$') { return ($name -replace '-unaligned\.apk$', '.apk') }
  if ($name -match '-signed\.apk$') { return $name }
  return ([System.IO.Path]::GetFileNameWithoutExtension($name) + '-signed.apk')
}

function Get-SignedAabName([string]$name) {
  if ($name -match '-unsigned\.aab$') { return ($name -replace '-unsigned\.aab$', '.aab') }
  return $name
}

if (-not (Test-Path $frontendDir)) {
  throw "Frontend directory not found: $frontendDir"
}

$sdkPath = Resolve-SdkPath
$ndkPath = Resolve-NdkPath $sdkPath
$apksignerPath = Resolve-ApkSignerPath $sdkPath
$jarsignerPath = Resolve-JarSignerPath
$signing = Get-ReleaseSigningConfig $releaseSigningFile
$env:ANDROID_HOME = $sdkPath
$env:ANDROID_SDK_ROOT = $sdkPath
$env:NDK_HOME = $ndkPath

Write-Host "ANDROID_HOME=$sdkPath"
Write-Host "NDK_HOME=$ndkPath"
Write-Host "Using apksigner: $apksignerPath"
Write-Host "Using jarsigner: $jarsignerPath"
Write-Host "Using keystore: $($signing.StoreFile)"
Write-Host "Using TSA URL: $($signing.TsaUrl)"
Write-Host 'Running Android release build...' -ForegroundColor Cyan
Push-Location $frontendDir
try {
  npx tauri android build
} finally {
  Pop-Location
}

if (-not (Test-Path $androidOutputs)) {
  throw "Android outputs not found: $androidOutputs"
}

New-Item -ItemType Directory -Path $artifactsDir -Force | Out-Null
$stampDir = Join-Path $artifactsDir (Get-Date -Format 'yyyyMMdd-HHmmss')
New-Item -ItemType Directory -Path $stampDir -Force | Out-Null

$files = Get-ChildItem $androidOutputs -Recurse -File | Where-Object {
  ($_.Extension -eq '.apk' -and $_.FullName -match '[\\/]release[\\/]') -or
  ($_.Extension -eq '.aab' -and $_.FullName -match 'Release')
}
if (-not $files) {
  throw 'No release .apk or .aab files found after build.'
}

$copiedFiles = @()
foreach ($file in $files) {
  $destination = Join-Path $stampDir $file.Name
  Copy-Item $file.FullName -Destination $destination -Force
  $copiedFiles += (Get-Item $destination)
}

$releaseApks = $copiedFiles | Where-Object { $_.Extension -eq '.apk' }
$releaseAabs = $copiedFiles | Where-Object { $_.Extension -eq '.aab' }

if (-not $releaseApks) { throw 'No release APK artifact found to sign.' }
if (-not $releaseAabs) { throw 'No release AAB artifact found to sign.' }

$signedArtifacts = @()

foreach ($apk in $releaseApks) {
  $finalName = Get-SignedApkName $apk.Name
  $finalPath = Join-Path $apk.DirectoryName $finalName
  $tempOut = if ($finalPath -ieq $apk.FullName) {
    Join-Path $apk.DirectoryName ($apk.BaseName + '.signed.tmp.apk')
  } else {
    $finalPath
  }

  Write-Host "Signing APK: $($apk.Name)"
  Invoke-Checked $apksignerPath @(
    'sign',
    '--ks', $signing.StoreFile,
    '--ks-key-alias', $signing.KeyAlias,
    '--ks-pass', "pass:$($signing.StorePassword)",
    '--key-pass', "pass:$($signing.KeyPassword)",
    '--out', $tempOut,
    $apk.FullName
  ) "Failed to sign APK '$($apk.Name)'"

  if ($finalPath -ieq $apk.FullName) {
    Move-Item -Force $tempOut $finalPath
  } elseif (Test-Path $apk.FullName) {
    Remove-Item $apk.FullName -Force
  }

  Invoke-Checked $apksignerPath @('verify', '--verbose', $finalPath) "Signed APK verification failed for '$finalName'"
  $signedArtifacts += (Get-Item $finalPath)
}

foreach ($aab in $releaseAabs) {
  $finalName = Get-SignedAabName $aab.Name
  $finalPath = Join-Path $aab.DirectoryName $finalName
  $tempOut = if ($finalPath -ieq $aab.FullName) {
    Join-Path $aab.DirectoryName ($aab.BaseName + '.signed.tmp.aab')
  } else {
    $finalPath
  }

  Write-Host "Signing AAB: $($aab.Name)"
  Invoke-Checked $jarsignerPath @(
    '-keystore', $signing.StoreFile,
    '-storepass', $signing.StorePassword,
    '-keypass', $signing.KeyPassword,
    '-tsa', $signing.TsaUrl,
    '-digestalg', 'SHA-256',
    '-sigalg', 'SHA256withRSA',
    '-signedjar', $tempOut,
    $aab.FullName,
    $signing.KeyAlias
  ) "Failed to sign AAB '$($aab.Name)'"

  if ($finalPath -ieq $aab.FullName) {
    Move-Item -Force $tempOut $finalPath
  } elseif (Test-Path $aab.FullName) {
    Remove-Item $aab.FullName -Force
  }

  $verifyOutput = Invoke-CheckedCapture $jarsignerPath @('-verify', '-verbose', '-certs', $finalPath) "Signed AAB verification failed for '$finalName'"
  if (-not $signing.AllowSelfSigned) {
    $verifyText = ($verifyOutput | Out-String)
    if ($verifyText -match '(?i)self-signed|certificate chain is invalid|unable to find valid certification path') {
      throw "AAB signer certificate is not trusted by a public chain for '$finalName'. Use a proper release certificate chain or set allowSelfSigned=true only for internal builds."
    }
    if ($verifyText -match '(?i)does not include a timestamp|no timestamp') {
      throw "Timestamp is missing for '$finalName'. Ensure tsaUrl is valid and reachable."
    }
  }
  $signedArtifacts += (Get-Item $finalPath)
}

Write-Host "Signed $($signedArtifacts.Count) artifact(s) to: $stampDir" -ForegroundColor Green
Write-Host 'Final signed artifacts:' -ForegroundColor Green
foreach ($artifact in $signedArtifacts) {
  Write-Host " - $($artifact.FullName)"
}
