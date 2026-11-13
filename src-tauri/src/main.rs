// 桌面入口：发布模式下不弹出系统控制台窗口
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    antou_todo_lib::run()
}
