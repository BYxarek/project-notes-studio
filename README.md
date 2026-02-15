# Project Notes Studio

Desktop application for managing projects, notes, and project-level action steps.
Built with **React + Vite + Tauri (Rust)**.

## English

### Features
- Project management (create, edit, delete)
- Notes inside each project
- Separate project-level task steps (outside notes)
- Mark steps as done and reorder them
- Settings page:
  - UI theme
  - Animations on/off
  - Window modes (framed fullscreen, borderless fullscreen, windowed, borderless)
  - Always-on-top
  - Language switcher (**RU / EN / UK**)
  - App version display
- Persistent data storage via Tauri backend in AppData (`app_state.json`)

### Tech Stack
- Frontend: React 19, Vite 7, lucide-react
- Desktop shell: Tauri 2
- Backend: Rust (Tauri commands)

### Run in Development
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

Installers are generated in:
- `frontend/src-tauri/target/release/bundle/nsis/`
- `frontend/src-tauri/target/release/bundle/msi/`

---

## Русский

### Возможности
- Управление проектами (создание, редактирование, удаление)
- Заметки внутри проекта
- Отдельные шаги проекта (не внутри заметок)
- Отметка выполнения и изменение порядка шагов
- Страница настроек:
  - Тема интерфейса
  - Вкл/выкл анимаций
  - Режимы окна (полный с рамками, полный без рамок, оконный, без рамок)
  - Поверх всех окон
  - Переключение языка (**RU / EN / UK**)
  - Отображение версии приложения
- Сохранение данных через backend Tauri в AppData (`app_state.json`)

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

Установщики появляются в:
- `frontend/src-tauri/target/release/bundle/nsis/`
- `frontend/src-tauri/target/release/bundle/msi/`

## Repository Structure
```text
frontend/                 React + Vite UI + Tauri app
frontend/src/             UI code
frontend/src-tauri/       Rust backend + Tauri configuration
src/                      legacy Rust prototype (kept for history)
```
