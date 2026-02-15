use serde_json::Value;
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

fn state_file_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
  let dir = app.path().app_data_dir().map_err(|err| err.to_string())?;
  fs::create_dir_all(&dir).map_err(|err| err.to_string())?;
  Ok(dir.join("app_state.json"))
}

#[tauri::command]
fn load_app_state(app: tauri::AppHandle) -> Result<Value, String> {
  let path = state_file_path(&app)?;
  if !path.exists() {
    return Ok(Value::Null);
  }

  let content = fs::read_to_string(path).map_err(|err| err.to_string())?;
  serde_json::from_str(&content).map_err(|err| err.to_string())
}

#[tauri::command]
fn save_app_state(app: tauri::AppHandle, state: Value) -> Result<(), String> {
  let path = state_file_path(&app)?;
  let serialized = serde_json::to_string_pretty(&state).map_err(|err| err.to_string())?;
  fs::write(path, serialized).map_err(|err| err.to_string())
}

#[tauri::command]
fn apply_window_settings(
  app: tauri::AppHandle,
  window_mode: String,
  always_on_top: bool,
) -> Result<(), String> {
  let window = app
    .get_webview_window("main")
    .ok_or_else(|| "main window not found".to_string())?;

  match window_mode.as_str() {
    "fullscreen_framed" => {
      window.set_fullscreen(false).map_err(|err| err.to_string())?;
      window.set_decorations(true).map_err(|err| err.to_string())?;
      window.maximize().map_err(|err| err.to_string())?;
    }
    "windowed" => {
      window.set_fullscreen(false).map_err(|err| err.to_string())?;
      window.set_decorations(true).map_err(|err| err.to_string())?;
      window.unmaximize().map_err(|err| err.to_string())?;
      window.center().map_err(|err| err.to_string())?;
    }
    "fullscreen_borderless" => {
      window.set_decorations(false).map_err(|err| err.to_string())?;
      window.set_fullscreen(true).map_err(|err| err.to_string())?;
    }
    "borderless" => {
      window.set_fullscreen(false).map_err(|err| err.to_string())?;
      window.set_decorations(false).map_err(|err| err.to_string())?;
      window.maximize().map_err(|err| err.to_string())?;
    }
    _ => {}
  }

  window
    .set_always_on_top(always_on_top)
    .map_err(|err| err.to_string())
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
