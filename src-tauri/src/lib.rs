use parking_lot::Mutex;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread::JoinHandle;
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager, Runtime, Window,
};
use tauri::{Emitter, EventTarget, Listener};
use xcb::{x, Xid, XidNew};

// Add this at file level
lazy_static::lazy_static! {
    static ref MONITOR_HANDLE: Mutex<Option<(JoinHandle<()>, Arc<AtomicBool>)>> = Mutex::new(None);
}

#[tauri::command]
fn list_windows() -> Result<Vec<(u32, String)>, String> {
    // 1. Connect to X server
    let (conn, screen_num) = xcb::Connection::connect(None)
        .map_err(|e| format!("Failed to connect to X server: {}", e))?;
    let setup = conn.get_setup();
    let screen = setup
        .roots()
        .nth(screen_num as usize)
        .ok_or_else(|| "Could not get screen".to_string())?;

    let root = screen.root();

    // 2. Intern the _NET_CLIENT_LIST atom
    let net_client_list_atom = intern_atom(&conn, b"_NET_CLIENT_LIST")
        .map_err(|e| format!("Failed to intern _NET_CLIENT_LIST atom: {}", e))?;

    // 3. Use GetProperty to retrieve the list of top-level windows
    let cookie = conn.send_request(&x::GetProperty {
        delete: false,
        window: root,
        property: net_client_list_atom,
        r#type: x::ATOM_WINDOW,
        long_offset: 0,
        long_length: 1024,
    });

    let reply = conn
        .wait_for_reply(cookie)
        .map_err(|e| format!("Failed to get window list: {}", e))?;
    let window_ids = reply.value::<x::Window>();

    // 4. For each window, attempt to get its name
    let net_wm_name_atom = intern_atom(&conn, b"_NET_WM_NAME")
        .map_err(|e| format!("Failed to get _NET_WM_NAME atom: {}", e))?;

    let mut window_list = Vec::new();

    for &wid in window_ids {
        let title = get_window_title(&conn, wid, net_wm_name_atom)
            .unwrap_or_else(|| "<No Name>".to_string());

        window_list.push((wid.resource_id(), title));
    }

    Ok(window_list)
}

/// Helper function to intern an Atom by name.
fn intern_atom(conn: &xcb::Connection, name: &[u8]) -> Result<x::Atom, xcb::Error> {
    let cookie = conn.send_request(&x::InternAtom {
        only_if_exists: false,
        name,
    });
    let reply = conn.wait_for_reply(cookie)?;
    Ok(reply.atom())
}

/// Attempt to fetch the `_NET_WM_NAME` property, and if that fails or is empty,
/// fallback to the old `WM_NAME` property.
///
/// Returns None if neither property is set.
fn get_window_title(
    conn: &xcb::Connection,
    window: x::Window,
    net_wm_name_atom: x::Atom,
) -> Option<String> {
    get_property_string(conn, window, net_wm_name_atom)
        .filter(|name| !name.is_empty())
        .or_else(|| get_property_string(conn, window, x::ATOM_WM_NAME))
}

/// Generic helper to fetch a STRING or UTF8_STRING property from a window.
/// Returns None if the property is missing or not a valid string.
fn get_property_string(
    conn: &xcb::Connection,
    window: x::Window,
    property: x::Atom,
) -> Option<String> {
    let cookie = conn.send_request(&x::GetProperty {
        delete: false,
        window,
        property,
        r#type: x::GETPROPERTYTYPE_ANY, // or x::ATOM_STRING / x::ATOM_UTF8_STRING
        long_offset: 0,
        long_length: 4096, // adjust if needed
    });

    if let Ok(reply) = conn.wait_for_reply(cookie) {
        if reply.length() > 0 {
            // The property data is returned as raw bytes. For ASCII/UTF-8 titles, we can convert.
            let data = reply.value::<u8>();
            // We can attempt UTF-8 conversion. If the WM uses a different encoding, you may need conversion logic.
            return String::from_utf8(data.to_vec()).ok();
        }
    }
    None
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn set_window_always_on_top<R: Runtime>(
    window: Window<R>,
    always_on_top: bool,
) -> Result<(), String> {
    window
        .set_always_on_top(always_on_top)
        .map_err(|e| format!("Failed to set always on top: {}", e))
}

#[tauri::command]
fn focus_window(window_id: u32) -> Result<(), String> {
    // Connect to X server
    let (conn, _) = xcb::Connection::connect(None)
        .map_err(|e| format!("Failed to connect to X server: {}", e))?;

    let window = unsafe { x::Window::new(window_id) };

    // Get the root window
    let setup = conn.get_setup();
    let screen = setup.roots().next().unwrap();
    let root = screen.root();

    // Verify the window exists
    let cookie = conn.send_request(&x::GetWindowAttributes { window });
    if conn.wait_for_reply(cookie).is_err() {
        return Err("Invalid window ID".to_string());
    }

    // 1. First, make sure the window is mapped (visible)
    let _ = conn.send_request(&x::MapWindow { window });

    // 2. Raise the window to the top
    let _ = conn.send_request(&x::ConfigureWindow {
        window,
        value_list: &[x::ConfigWindow::StackMode(x::StackMode::Above)],
    });

    // 3. Set input focus with multiple methods
    let _ = conn.send_request(&x::SetInputFocus {
        revert_to: x::InputFocus::PointerRoot,
        focus: window,
        time: x::CURRENT_TIME,
    });

    // 4. Send _NET_ACTIVE_WINDOW message
    let net_active_window = intern_atom(&conn, b"_NET_ACTIVE_WINDOW")
        .map_err(|e| format!("Failed to intern _NET_ACTIVE_WINDOW atom: {}", e))?;

    let data = [
        1, // Source indication (1 = application)
        x::CURRENT_TIME,
        0, // Currently active window, 0 if none
        0,
        0,
    ];

    let _ = conn.send_request(&x::SendEvent {
        propagate: false,
        destination: xcb::x::SendEventDest::Window(root),
        event_mask: x::EventMask::SUBSTRUCTURE_NOTIFY | x::EventMask::SUBSTRUCTURE_REDIRECT,
        event: &x::ClientMessageEvent::new(
            window,
            net_active_window,
            x::ClientMessageData::Data32(data),
        ),
    });

    // 6. Move pointer to the window center (optional)
    let cookie = conn.send_request(&x::GetGeometry {
        drawable: x::Drawable::Window(window),
    });

    if let Ok(geom) = conn.wait_for_reply(cookie) {
        let _ = conn.send_request(&x::WarpPointer {
            src_window: x::WINDOW_NONE,
            dst_window: window,
            src_x: 0,
            src_y: 0,
            src_width: 0,
            src_height: 0,
            dst_x: (geom.width() / 2) as i16,
            dst_y: (geom.height() / 2) as i16,
        });
    }

    // Flush all commands
    conn.flush()
        .map_err(|e| format!("Failed to flush X connection: {}", e))?;

    Ok(())
}

#[tauri::command]
fn start_window_monitor(window: Window) -> Result<(), String> {
    println!("Starting window monitor...");

    // First, stop any existing monitor
    if MONITOR_HANDLE.lock().is_some() {
        println!("Existing monitor found, stopping it first");
        stop_window_monitor()?;
    }

    let (conn, _) = xcb::Connection::connect(None)
        .map_err(|e| format!("Failed to connect to X server: {}", e))?;

    let net_active_window = intern_atom(&conn, b"_NET_ACTIVE_WINDOW")
        .map_err(|e| format!("Failed to intern _NET_ACTIVE_WINDOW atom: {}", e))?;

    let net_wm_name = intern_atom(&conn, b"_NET_WM_NAME")
        .map_err(|e| format!("Failed to intern _NET_WM_NAME atom: {}", e))?;

    let running = Arc::new(AtomicBool::new(true));
    let running_clone = running.clone();

    println!("Starting monitoring thread...");
    let handle = std::thread::spawn(move || {
        println!("Monitor thread started");
        let mut last_title: Option<String> = None;

        while running_clone.load(Ordering::SeqCst) {
            // Get the currently active window
            let cookie = conn.send_request(&x::GetProperty {
                delete: false,
                window: conn.get_setup().roots().nth(0).unwrap().root(),
                property: net_active_window,
                r#type: x::ATOM_WINDOW,
                long_offset: 0,
                long_length: 1,
            });

            if let Ok(reply) = conn.wait_for_reply(cookie) {
                if let Some(&active_window) = reply.value::<x::Window>().get(0) {
                    if let Some(active_title) = get_window_title(&conn, active_window, net_wm_name)
                    {
                        // Only emit and log if the title has changed
                        if last_title.as_ref() != Some(&active_title) {
                            println!("Active window changed to: {}", active_title);
                            let _ = window.emit_to(
                                EventTarget::any(),
                                "window-focus-changed",
                                active_title.clone(),
                            );
                            last_title = Some(active_title);
                        }
                    }
                }
            }

            std::thread::sleep(std::time::Duration::from_millis(250));
        }
        println!("Monitor thread stopping");
    });

    println!("Storing monitor handle");
    *MONITOR_HANDLE.lock() = Some((handle, running));

    Ok(())
}

#[tauri::command]
fn stop_window_monitor() -> Result<(), String> {
    println!("Attempting to stop window monitor...");
    if let Some((handle, running)) = MONITOR_HANDLE.lock().take() {
        println!("Found active monitor, signaling thread to stop");
        // Signal the thread to stop
        running.store(false, Ordering::SeqCst);

        // Wait for the thread to finish
        println!("Waiting for monitor thread to finish...");
        if let Err(e) = handle.join() {
            println!("Error joining monitor thread: {:?}", e);
            return Err("Failed to join monitor thread".to_string());
        }
        println!("Monitor thread successfully stopped");
    } else {
        println!("No active monitor found");
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            let _ = app
                .get_webview_window("main")
                .expect("no main window")
                .set_focus();
        }));
    }
    builder
        .setup(move |app| {
            #[cfg(desktop)]
            {
                use tauri_plugin_autostart::MacosLauncher;
                use tauri_plugin_autostart::ManagerExt;

                let _ = app.handle().plugin(tauri_plugin_autostart::init(
                    MacosLauncher::LaunchAgent,
                    Some(vec!["--flag1", "--flag2"]),
                ));

                // Get the autostart manager
                let autostart_manager = app.autolaunch();
                // Enable autostart
                let _ = autostart_manager.enable();
                // Check enable state
                println!(
                    "registered for autostart? {}",
                    autostart_manager.is_enabled().unwrap()
                );
                // Disable autostart
                let _ = autostart_manager.disable();
            }

            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&quit_i])?;

            let tray = TrayIconBuilder::new()
                .menu(&menu)
                .menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        println!("quit menu item was clicked");
                        app.exit(0);
                    }
                    _ => {
                        println!("menu item {:?} not handled", event.id);
                    }
                })
                .build(app)?;

            let _ = tray.set_icon(app.default_window_icon().clone().cloned());

            // When the app is about to exit, stop the monitoring thread
            let current_window = app.get_webview_window("main");
            current_window
                .unwrap()
                .once("tauri://close-requested", move |_| {
                    let _ = stop_window_monitor();
                });

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            set_window_always_on_top,
            list_windows,
            focus_window,
            start_window_monitor
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
