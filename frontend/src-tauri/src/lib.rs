use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
enum EntityId {
  Str(String),
  Num(u64),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
enum WindowMode {
  #[serde(rename = "fullscreen_framed", alias = "fullscreen")]
  FullscreenFramed,
  #[serde(rename = "fullscreen_borderless")]
  FullscreenBorderless,
  #[serde(rename = "windowed")]
  Windowed,
  #[serde(rename = "borderless")]
  Borderless,
}

fn default_theme() -> String {
  "midnight".to_string()
}

fn default_true() -> bool {
  true
}

fn default_controls_layout() -> String {
  "topbar".to_string()
}

fn default_language() -> String {
  "ru".to_string()
}

fn default_project_statuses() -> Vec<String> {
  vec![
    "Новый".to_string(),
    "В работе".to_string(),
    "Завершен".to_string(),
  ]
}

fn default_window_mode() -> WindowMode {
  WindowMode::FullscreenFramed
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(default, rename_all = "camelCase")]
struct StepState {
  id: Option<EntityId>,
  text: String,
  done: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(default, rename_all = "camelCase")]
struct NoteState {
  id: Option<EntityId>,
  title: String,
  body: String,
  steps: Vec<StepState>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(default, rename_all = "camelCase")]
struct ProjectState {
  id: Option<EntityId>,
  name: String,
  description: String,
  status: String,
  pinned: bool,
  notes: Vec<NoteState>,
  steps: Vec<StepState>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase")]
struct SettingsState {
  #[serde(default = "default_theme")]
  theme: String,
  #[serde(default = "default_true")]
  animations: bool,
  #[serde(default = "default_controls_layout")]
  controls_layout: String,
  #[serde(default = "default_true")]
  statuses_enabled: bool,
  #[serde(default = "default_project_statuses")]
  project_statuses: Vec<String>,
  #[serde(default = "default_window_mode")]
  window_mode: WindowMode,
  always_on_top: bool,
  #[serde(default = "default_language")]
  language: String,
}

impl Default for SettingsState {
  fn default() -> Self {
    Self {
      theme: default_theme(),
      animations: default_true(),
      controls_layout: default_controls_layout(),
      statuses_enabled: default_true(),
      project_statuses: default_project_statuses(),
      window_mode: default_window_mode(),
      always_on_top: false,
      language: default_language(),
    }
  }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(default, rename_all = "camelCase")]
struct AppState {
  projects: Vec<ProjectState>,
  settings: SettingsState,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WindowSettingsPayload {
  window_mode: WindowMode,
  always_on_top: bool,
}

fn state_file_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
  let dir = app.path().app_data_dir().map_err(|err| err.to_string())?;
  fs::create_dir_all(&dir).map_err(|err| err.to_string())?;
  Ok(dir.join("app_state.json"))
}

#[tauri::command]
fn load_app_state(app: tauri::AppHandle) -> Result<AppState, String> {
  let path = state_file_path(&app)?;
  if !path.exists() {
    return Ok(AppState::default());
  }

  let content = fs::read_to_string(path).map_err(|err| err.to_string())?;
  serde_json::from_str(&content).map_err(|err| err.to_string())
}

#[tauri::command]
fn save_app_state(app: tauri::AppHandle, state: AppState) -> Result<(), String> {
  let path = state_file_path(&app)?;
  let serialized = serde_json::to_string_pretty(&state).map_err(|err| err.to_string())?;
  fs::write(path, serialized).map_err(|err| err.to_string())
}

#[tauri::command]
fn apply_window_settings(app: tauri::AppHandle, payload: WindowSettingsPayload) -> Result<(), String> {
  #[cfg(any(target_os = "android", target_os = "ios"))]
  {
    let _ = app;
    let _ = payload;
    return Ok(());
  }

  #[cfg(not(any(target_os = "android", target_os = "ios")))]
  {
  let window = app
    .get_webview_window("main")
    .ok_or_else(|| "main window not found".to_string())?;

  match payload.window_mode {
    WindowMode::FullscreenFramed => {
      window.set_fullscreen(false).map_err(|err| err.to_string())?;
      window.set_decorations(true).map_err(|err| err.to_string())?;
      window.maximize().map_err(|err| err.to_string())?;
    }
    WindowMode::Windowed => {
      window.set_fullscreen(false).map_err(|err| err.to_string())?;
      window.set_decorations(true).map_err(|err| err.to_string())?;
      window.unmaximize().map_err(|err| err.to_string())?;
      window.center().map_err(|err| err.to_string())?;
    }
    WindowMode::FullscreenBorderless => {
      window.set_decorations(false).map_err(|err| err.to_string())?;
      window.set_fullscreen(true).map_err(|err| err.to_string())?;
    }
    WindowMode::Borderless => {
      window.set_fullscreen(false).map_err(|err| err.to_string())?;
      window.set_decorations(false).map_err(|err| err.to_string())?;
      window.maximize().map_err(|err| err.to_string())?;
    }
  }

  window
    .set_always_on_top(payload.always_on_top)
    .map_err(|err| err.to_string())
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      app.handle().plugin(tauri_plugin_opener::init())?;
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      load_app_state,
      save_app_state,
      apply_window_settings
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
