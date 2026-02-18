use crate::models::AppData;
use std::fs;

pub const DATA_FILE: &str = "notes_data.json";

pub fn load_data(path: &str) -> AppData {
    let content = match fs::read_to_string(path) {
        Ok(c) => c,
        Err(_) => return AppData::default(),
    };

    serde_json::from_str(&content).unwrap_or_default()
}

pub fn save_data(path: &str, data: &AppData) -> std::io::Result<()> {
    let json = serde_json::to_string_pretty(data)
        .map_err(|err| std::io::Error::other(format!("json error: {err}")))?;
    fs::write(path, json)
}
