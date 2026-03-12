use tauri_plugin_shell::ShellExt;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Check if the app has accessibility permissions on macOS
/// Returns true if:
/// - Not on macOS (no permission needed on other platforms)
/// - On macOS and has accessibility permission
#[tauri::command]
fn check_accessibility_permission() -> bool {
    #[cfg(target_os = "macos")]
    {
        // On macOS, check if the app has accessibility permissions
        // This is required for global shortcuts to work when the app is not focused
        use std::ffi::c_void;

        // AXIsProcessTrusted returns true if the app has accessibility permissions
        // https://developer.apple.com/documentation/accessibility/axisprocesstrusted
        #[link(name = "ApplicationServices", kind = "framework")]
        extern "C" {
            fn AXIsProcessTrusted() -> bool;
        }

        unsafe { AXIsProcessTrusted() }
    }
    #[cfg(not(target_os = "macos"))]
    {
        // On non-macOS platforms, no accessibility permission is needed
        true
    }
}

/// Open macOS System Settings to Accessibility panel
/// This helps users grant accessibility permissions
#[tauri::command]
async fn open_accessibility_settings(app: tauri::AppHandle) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        // Open System Settings > Privacy & Security > Accessibility
        // Use x-apple.systempreferences: to open System Settings directly
        let shell = app.shell();

        // Try to open System Settings with accessibility pane
        let result = shell
            .command("open")
            .args(["x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"])
            .output()
            .await;

        match result {
            Ok(output) => {
                if output.status.success() {
                    Ok(())
                } else {
                    // Fallback: open System Settings app directly
                    let fallback = shell
                        .command("open")
                        .args(["-b", "com.apple.systempreferences"])
                        .output()
                        .await;

                    match fallback {
                        Ok(_) => Ok(()),
                        Err(e) => Err(format!("Failed to open System Settings: {}", e)),
                    }
                }
            }
            Err(e) => Err(format!("Failed to execute command: {}", e)),
        }
    }
    #[cfg(not(target_os = "macos"))]
    {
        // On non-macOS platforms, this function does nothing
        let _ = app;
        Ok(())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_keyring::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            greet,
            check_accessibility_permission,
            open_accessibility_settings
        ])
        .setup(|app| {
            // Start the FastAPI backend sidecar
            let shell = app.shell();
            let sidecar_command = shell.sidecar("huluchat-backend").unwrap();

            let (mut _rx, _child) = sidecar_command.spawn().expect("Failed to spawn sidecar");

            println!("FastAPI backend sidecar started successfully");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
