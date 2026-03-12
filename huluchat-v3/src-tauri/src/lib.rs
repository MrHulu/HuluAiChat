use tauri_plugin_shell::ShellExt;
use tauri::Manager;

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

/// Open macOS System Settings in Accessibility panel
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

/// Restart the backend process
/// Uses shell command to start the Python backend
#[tauri::command]
async fn restart_backend(app: tauri::AppHandle) -> Result<String, String> {
    let shell = app.shell();

    // Determine the path to the Python backend
    // In development: backend directory relative to project
    // In production: bundled with the app
    let backend_path = if cfg!(debug_assertions) {
        // Development mode - use project relative path
        std::path::PathBuf::from("../backend")
    } else {
        // Production mode - use resource directory
        app.path().resource_dir()
            .map(|p| p.join("backend"))
            .unwrap_or_else(|_| std::path::PathBuf::from("../backend"))
    };

    // Determine Python executable path
    // First try the venv Python, then system Python
    let python_path = if cfg!(windows) {
        let venv_python = backend_path.join(".venv/Scripts/python.exe");
        if venv_python.exists() {
            venv_python.to_string_lossy().to_string()
        } else {
            "python".to_string()
        }
    } else {
        let venv_python = backend_path.join(".venv/bin/python");
        if venv_python.exists() {
            venv_python.to_string_lossy().to_string()
        } else {
            "python3".to_string()
        }
    };

    // Start the backend process
    let main_py = backend_path.join("main.py");
    let main_py_str = main_py.to_string_lossy().to_string();

    let result = shell
        .command(python_path)
        .args(&[main_py_str])
        .current_dir(backend_path)
        .output()
        .await;

    match result {
        Ok(output) => {
            if output.status.success() {
                Ok("Backend restart initiated".to_string())
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr);
                Err(format!("Backend failed to start: {}", stderr))
            }
        }
        Err(e) => Err(format!("Failed to execute backend: {}", e)),
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
            open_accessibility_settings,
            restart_backend
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
