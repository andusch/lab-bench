mod series;

use std::path::Path;
use std::sync::Mutex;

use series::{Desk, Fit, Series};
use tauri::State;

struct DeskState(Mutex<Desk>);

#[tauri::command]
fn open_csv(state: State<'_, DeskState>, path: String) -> Result<Series, String> {
    let mut desk = state
        .0
        .lock()
        .map_err(|_| "The desk is unavailable.".to_string())?;
    desk.open_csv(Path::new(&path))
        .map_err(|err| err.to_string())
}

#[tauri::command]
fn fit_series(state: State<'_, DeskState>, degree: u8) -> Result<Fit, String> {
    let mut desk = state
        .0
        .lock()
        .map_err(|_| "The desk is unavailable.".to_string())?;
    desk.fit_polynomial(degree).map_err(|err| err.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(DeskState(Mutex::new(Desk::new())))
        .invoke_handler(tauri::generate_handler![open_csv, fit_series])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
