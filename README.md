# Project Notes Studio

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Latest Release](https://img.shields.io/github/v/release/BYxarek/project-notes-studio)](https://github.com/BYxarek/project-notes-studio/releases)
[![Platform](https://img.shields.io/badge/Platform-Windows%2010%2F11-0078D6)](https://github.com/BYxarek/project-notes-studio/releases)
[![Tech](https://img.shields.io/badge/Stack-React%20%2B%20Tauri-4B6BFF)](https://github.com/BYxarek/project-notes-studio)

Desktop app for managing projects, notes, and project-level action steps. Built with **React + Vite + Tauri (Rust)**.

## Screenshots / Скриншоты

![Projects Page](<Screenshot 2026-02-18 201021.png>)
![Project Details](<Screenshot 2026-02-18 201034.png>)
![Settings Page](<Screenshot 2026-02-18 201048.png>)

## English

### Features
- Project management (create, edit, delete)
- Notes inside each project
- Separate project-level action steps (outside notes)
- Mark steps as done and reorder them
- Settings page:
  - Animation toggle
  - Window modes:
    - Fullscreen (framed)
    - Fullscreen (borderless)
    - Windowed
    - Borderless
  - Always-on-top
  - Language switcher (**RU / EN / UK**)
  - App version display
  - **Update checker via GitHub Releases** + one-click download link
- Persistent storage via Tauri backend in AppData (`app_state.json`) so data survives updates

### Tech Stack
- Frontend: React 19, Vite 7, lucide-react
- Desktop shell: Tauri 2
- Backend: Rust (Tauri commands)

### Development
```powershell
cd frontend
npm install
npm run tauri:dev
```

### Build Installer
```powershell
cd frontend
npm run package
```

Windows artifacts are generated here:

- `Project Notes Studio_<version>_x64-setup.exe` (NSIS)
- `Project Notes Studio_<version>_x64_en-US.msi` (MSI)

### Android Release Build
```powershell
powershell -ExecutionPolicy Bypass -File .\android-build\init-android.ps1
Copy-Item .\android-build\release-signing.properties.template .\android-build\keystore\release-signing.properties
powershell -ExecutionPolicy Bypass -File .\android-build\build-android.ps1
```
Details: `android-build/README.md`

Android artifacts are generated here:

- `app-universal-release-signed.apk`
- `app-universal-release.aab`

### Releases
Prebuilt installers are published on GitHub Releases:
- NSIS setup (`.exe`)
- MSI package (`.msi`)

Release page: https://github.com/BYxarek/project-notes-studio/releases

---

## Русский

### Возможности
- Управление проектами (создание, редактирование, удаление)
- Заметки внутри проекта
- Отдельные шаги проекта (не внутри заметок)
- Отметка выполнения и изменение порядка шагов
- Страница настроек:
  - Вкл/выкл анимаций
  - Режимы окна:
    - Полный экран (с рамками)
    - Полный экран (без рамок)
    - Оконный
    - Без рамок
  - Поверх всех окон
  - Переключение языка (**RU / EN / UK**)
  - Отображение версии приложения
  - **Проверка обновлений через GitHub Releases** и переход на скачивание
- Сохранение данных через backend Tauri в AppData (`app_state.json`), данные не теряются при обновлении

### Стек
- Frontend: React 19, Vite 7, lucide-react
- Desktop-оболочка: Tauri 2
- Backend: Rust (команды Tauri)

### Запуск в разработке
```powershell
cd frontend
npm install
npm run tauri:dev
```

### Сборка установщика
```powershell
cd frontend
npm run package
```

Готовые Windows-артефакты:

- `Project Notes Studio_<version>_x64-setup.exe` (NSIS)
- `Project Notes Studio_<version>_x64_en-US.msi` (MSI)

### Android Release-сборка
```powershell
powershell -ExecutionPolicy Bypass -File .\android-build\init-android.ps1
Copy-Item .\android-build\release-signing.properties.template .\android-build\keystore\release-signing.properties
powershell -ExecutionPolicy Bypass -File .\android-build\build-android.ps1
```
Подробности: `android-build/README.md`

Готовые Android-артефакты:

- `app-universal-release-signed.apk`
- `app-universal-release.aab`

### Релизы
Готовые установщики публикуются в GitHub Releases:
- NSIS-установщик (`.exe`)
- MSI-пакет (`.msi`)

## Repository Structure
```text
frontend/                 React + Vite UI + Tauri app
frontend/src/             UI code
frontend/src-tauri/       Rust backend + Tauri configuration
legacy/eframe-prototype/  legacy Rust prototype (kept for history)
```
