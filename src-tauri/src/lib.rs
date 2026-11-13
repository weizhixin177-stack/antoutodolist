/// 案头清单 Tauri 入口。
///
/// 应用为纯前端架构，数据存于 WebView 的 localStorage，
/// 这里无需注册任何自定义 command，仅启动标准运行时。
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running antou-todo application");
}
