"""主窗口：三区布局、侧边栏、对话区、输入区；通过 AppService 与下层交互。"""
import queue
import os
import sys
from typing import Callable

import customtkinter as ctk
from tkinter import messagebox, PhotoImage

from src.app.service import AppService
from src.chat import TextChunk, DoneChunk, ChatError, is_error
from src.persistence import Session, Message

try:
    from ctk_markdown import CTkMarkdown
    _USE_MARKDOWN = True
except ImportError:
    CTkMarkdown = None  # type: ignore[misc, assignment]
    _USE_MARKDOWN = False

SIDEBAR_WIDTH = 220
SIDEBAR_COLLAPSED = 40  # 折叠后仅图标条，尽量收窄
POLL_MS = 50

# 侧边栏图标按钮：透明、仅图标，悬浮(hover_color)/按压(绑定临时色) 三态
def _bind_pressed_style(btn: ctk.CTkButton) -> None:
    def on_press(_e: object) -> None:
        btn.configure(fg_color=("gray72", "gray32"))
    def on_release(_e: object) -> None:
        btn.configure(fg_color="transparent")
    btn.bind("<Button-1>", on_press)
    btn.bind("<ButtonRelease-1>", on_release)
    btn.bind("<Leave>", on_release)  # 鼠标移出时恢复


def _resource_path(rel_path: str) -> str:
    """在源码运行与 PyInstaller 打包运行时都能定位资源文件。"""
    base = getattr(sys, "_MEIPASS", None)
    if base:
        return os.path.join(base, rel_path)
    here = os.path.abspath(os.path.dirname(__file__))
    project_root = os.path.abspath(os.path.join(here, "..", ".."))
    return os.path.join(project_root, rel_path)


class MainWindow:
    def __init__(self, app: AppService) -> None:
        self._app = app
        self._stream_queue: queue.Queue = queue.Queue()
        self._streaming_session_id: str | None = None
        self._streaming_textbox_id: int | None = None  # id(streaming CTkTextbox)
        self._streaming_text: list[str] = []
        self._icon_image: PhotoImage | None = None

        ctk.set_appearance_mode(self._app.config().theme)
        self._root = ctk.CTk()
        self._root.title("HuluChat")
        try:
            # 优先用 .ico（与 exe 内嵌图标一致，任务栏/标题栏显示统一）
            icon_ico = _resource_path(os.path.join("assets", "icon.ico"))
            icon_png = _resource_path(os.path.join("assets", "icon.png"))
            if os.path.exists(icon_ico) and sys.platform == "win32":
                self._root.iconbitmap(icon_ico)
                print("图标设置成功(ico)", icon_ico)
            elif os.path.exists(icon_png):
                self._icon_image = PhotoImage(file=icon_png)
                self._root.iconphoto(True, self._icon_image)
                print("图标设置成功(png)", icon_png)
        except Exception:
            # 图标设置失败不影响主功能（例如：运行环境 Tk 不支持 PNG）
            self._icon_image = None
            print("图标设置失败")
        self._root.geometry("900x600")
        self._root.minsize(400, 300)

        # 主网格：侧边栏 | 主区（column 0 的 minsize 在 _refresh_sidebar_width 中按展开/收起设置）
        self._root.grid_columnconfigure(0, weight=0)
        self._root.grid_columnconfigure(1, weight=1)
        self._root.grid_rowconfigure(0, weight=1)

        # 侧边栏
        self._sidebar = ctk.CTkFrame(self._root, width=SIDEBAR_WIDTH, corner_radius=0, fg_color=("gray90", "gray17"))
        self._sidebar.grid(row=0, column=0, sticky="nsew")
        self._sidebar.grid_rowconfigure(1, weight=1)
        self._sidebar_expanded = self._app.config().sidebar_expanded
        # 侧边栏按钮文字/图标需与背景有对比（明/暗主题）
        _sidebar_btn_text = ("gray15", "gray88")
        # 新对话：展开时带文字，折叠时仅图标；透明 + 悬浮/按压样式
        self._sidebar_btn_new = ctk.CTkButton(
            self._sidebar,
            text="新对话",
            command=self._on_new_chat,
            fg_color="transparent",
            hover_color=("gray80", "gray28"),
            border_width=0,
            text_color=_sidebar_btn_text,
        )
        self._sidebar_btn_new.grid(row=0, column=0, padx=12, pady=12, sticky="ew")
        # 折叠/展开：仅图标，透明
        self._sidebar_toggle = ctk.CTkButton(
            self._sidebar,
            text="◀" if self._sidebar_expanded else "▶",
            command=self._toggle_sidebar,
            fg_color="transparent",
            hover_color=("gray80", "gray28"),
            border_width=0,
            width=32,
            height=32,
            text_color=_sidebar_btn_text,
        )
        self._sidebar_toggle.grid(row=0, column=1, padx=2, pady=12)
        _bind_pressed_style(self._sidebar_btn_new)
        _bind_pressed_style(self._sidebar_toggle)
        self._session_list_frame = ctk.CTkScrollableFrame(self._sidebar, fg_color="transparent")
        self._session_list_frame.grid(row=1, column=0, columnspan=2, sticky="nsew", padx=8, pady=4)
        self._session_row_frames: list[ctk.CTkFrame] = []
        self._refresh_sidebar_width()

        # 主区
        main = ctk.CTkFrame(self._root, fg_color="transparent")
        main.grid(row=0, column=1, sticky="nsew", padx=0, pady=0)
        main.grid_columnconfigure(0, weight=1)
        main.grid_rowconfigure(1, weight=1)

        # 顶部栏
        top = ctk.CTkFrame(main, fg_color="transparent")
        top.grid(row=0, column=0, sticky="ew", padx=12, pady=8)
        top.grid_columnconfigure(0, weight=1)
        self._model_var = ctk.StringVar(value=self._current_model_display())
        self._model_menu = ctk.CTkOptionMenu(
            top, variable=self._model_var, values=self._model_options(), width=200, command=self._on_model_change
        )
        self._model_menu.grid(row=0, column=0, sticky="w")
        ctk.CTkButton(top, text="设置", width=80, command=self._on_settings).grid(row=0, column=1, padx=8)

        # 对话区
        self._chat_scroll = ctk.CTkScrollableFrame(main, fg_color="transparent")
        self._chat_scroll.grid(row=1, column=0, sticky="nsew", padx=12, pady=4)
        self._chat_scroll.grid_columnconfigure(0, weight=1)
        self._chat_widgets: list[tuple[str, ctk.CTkFrame]] = []  # (msg_id, frame containing CTkTextbox)

        # 输入区
        input_frame = ctk.CTkFrame(main, fg_color="transparent")
        input_frame.grid(row=2, column=0, sticky="ew", padx=12, pady=8)
        input_frame.grid_columnconfigure(0, weight=1)
        self._input = ctk.CTkTextbox(input_frame, height=80, wrap="word")
        self._input.grid(row=0, column=0, sticky="ew", padx=(0, 8))
        self._input.bind("<Return>", self._on_input_return)
        self._input.bind("<Control-Return>", lambda e: None)  # Ctrl+Enter 换行由默认行为处理
        self._send_btn = ctk.CTkButton(input_frame, text="发送", width=80, command=self._on_send)
        self._send_btn.grid(row=0, column=1)
        self._sending_label = ctk.CTkLabel(input_frame, text="", fg_color="transparent")
        self._sending_label.grid(row=0, column=2, padx=8)
        self._error_label = ctk.CTkLabel(input_frame, text="", text_color=("red", "orange"))
        self._error_label.grid(row=1, column=0, columnspan=3, sticky="w", pady=(4, 0))

        self._refresh_sessions_list()
        self._refresh_chat_area()
        self._root.after(POLL_MS, self._poll_stream)
        self._root.protocol("WM_DELETE_WINDOW", self._on_close)

    def _current_model_display(self) -> str:
        p = self._app.get_current_provider()
        return p.name if p else "未选择模型"

    def _model_options(self) -> list[str]:
        return [p.name for p in self._app.config().providers] or ["未配置模型"]

    def _refresh_sidebar_width(self) -> None:
        w = SIDEBAR_WIDTH if self._sidebar_expanded else SIDEBAR_COLLAPSED
        self._root.grid_columnconfigure(0, weight=0, minsize=w)
        self._sidebar.configure(width=w)
        self._sidebar_toggle.configure(text="◀" if self._sidebar_expanded else "▶")
        if self._sidebar_expanded:
            self._sidebar.grid_columnconfigure(0, weight=1)
            self._sidebar.grid_columnconfigure(1, weight=0, minsize=0)
            self._sidebar_btn_new.configure(width=160, height=32, text="新对话")
            self._sidebar_btn_new.grid(row=0, column=0, padx=12, pady=12, sticky="ew")
            self._sidebar_toggle.configure(width=32, height=32)
            self._sidebar_toggle.grid(row=0, column=1, padx=4, pady=12)
            self._session_list_frame.grid(row=1, column=0, columnspan=2, sticky="nsew", padx=8, pady=4)
        else:
            # 折叠时只占一列，列宽占满 40px，展开按钮在第二行可见
            self._sidebar.grid_columnconfigure(0, weight=1, minsize=w)
            self._sidebar.grid_columnconfigure(1, weight=0, minsize=0)
            self._sidebar_btn_new.configure(width=32, height=32, text="＋")
            self._sidebar_btn_new.grid(row=0, column=0, padx=4, pady=6)
            self._sidebar_toggle.configure(width=32, height=32)
            self._sidebar_toggle.grid(row=1, column=0, padx=4, pady=6)
            self._session_list_frame.grid_remove()

    def _toggle_sidebar(self) -> None:
        self._sidebar_expanded = not self._sidebar_expanded
        self._app.set_sidebar_expanded(self._sidebar_expanded)
        self._refresh_sidebar_width()

    def _refresh_sessions_list(self) -> None:
        for row in self._session_row_frames:
            row.destroy()
        self._session_row_frames.clear()
        sessions = self._app.load_sessions()
        current = self._app.current_session_id()
        for s in sessions:
            row = ctk.CTkFrame(self._session_list_frame, fg_color="transparent")
            row.grid(sticky="ew", pady=2)
            row.grid_columnconfigure(0, weight=1)
            title_text = (s.title or "新对话")[:20]
            # 会话标题与图标需与侧边栏背景有对比，明/暗主题下均可见
            _side_text = ("gray15", "gray88")
            btn_title = ctk.CTkButton(
                row,
                text=title_text,
                anchor="w",
                fg_color=("gray75", "gray30") if s.id == current else "transparent",
                text_color=_side_text,
                hover_color=("gray78", "gray28"),
                border_width=0,
                command=lambda sid=s.id: self._on_select_session(sid),
            )
            btn_title.grid(row=0, column=0, sticky="ew", padx=(0, 4))
            btn_rename = ctk.CTkButton(
                row, text="✏️", width=26, height=26,
                fg_color="transparent", hover_color=("gray80", "gray28"), border_width=0,
                text_color=_side_text,
                command=lambda sid=s.id, tit=s.title: self._on_rename_session(sid, tit),
            )
            btn_rename.grid(row=0, column=1, padx=2)
            _bind_pressed_style(btn_rename)
            btn_del = ctk.CTkButton(
                row, text="🗑️", width=26, height=26,
                fg_color="transparent", hover_color=("gray80", "gray28"), border_width=0,
                text_color=_side_text,
                command=lambda sid=s.id: self._on_delete_session(sid),
            )
            btn_del.grid(row=0, column=2, padx=2)
            _bind_pressed_style(btn_del)
            self._session_row_frames.append(row)
        self._session_list_frame.columnconfigure(0, weight=1)

    def _message_textbox_height(self, content: str) -> int:
        """根据内容行数计算文本框高度，避免长文被截断。"""
        lines = max(2, content.count("\n") + 1)
        return min(400, max(60, lines * 22))

    def _refresh_chat_area(self) -> None:
        for _, w in self._chat_widgets:
            w.destroy()
        self._chat_widgets.clear()
        sid = self._app.current_session_id()
        if not sid:
            lbl = ctk.CTkLabel(
                self._chat_scroll, text="新对话：在下方输入并发送。", anchor="w", justify="left"
            )
            lbl.grid(sticky="ew", pady=8)
            self._chat_scroll.columnconfigure(0, weight=1)
            return
        messages = self._app.load_messages(sid)
        if not messages:
            lbl = ctk.CTkLabel(
                self._chat_scroll, text="在下方输入并发送。", anchor="w", justify="left"
            )
            lbl.grid(sticky="ew", pady=8)
            self._chat_scroll.columnconfigure(0, weight=1)
            return
        for m in messages:
            fg = ("gray85", "gray25") if m.role == "user" else ("gray70", "gray30")
            frame = ctk.CTkFrame(self._chat_scroll, fg_color=fg, corner_radius=8)
            frame.grid(sticky="ew", pady=4)
            frame.grid_columnconfigure(0, weight=1)
            if m.role == "assistant" and _USE_MARKDOWN and CTkMarkdown:
                md = CTkMarkdown(frame, width=400)
                md.grid(row=0, column=0, sticky="ew", padx=12, pady=8)
                md.set_markdown(f"**助手:**\n\n{m.content}")
                md.configure(height=self._message_textbox_height(m.content))
            else:
                tb = ctk.CTkTextbox(
                    frame, wrap="word", height=self._message_textbox_height(m.content),
                    fg_color="transparent", border_width=0, state="normal"
                )
                tb.grid(row=0, column=0, sticky="ew", padx=12, pady=8)
                tb.insert("1.0", f"{'你' if m.role == 'user' else '助手'}: {m.content}")
                tb.configure(state="disabled")
            self._chat_widgets.append((m.id, frame))
        self._chat_scroll.columnconfigure(0, weight=1)

    def _on_new_chat(self) -> None:
        self._app.new_session()
        self._refresh_sessions_list()
        self._refresh_chat_area()

    def _on_select_session(self, session_id: str) -> None:
        self._app.switch_session(session_id)
        self._refresh_sessions_list()
        self._refresh_chat_area()

    def _on_rename_session(self, session_id: str, current_title: str) -> None:
        dialog = ctk.CTkToplevel(self._root)
        dialog.title("重命名")
        dialog.geometry("320x100")
        dialog.transient(self._root)
        ctk.CTkLabel(dialog, text="会话标题：").pack(anchor="w", padx=12, pady=(12, 4))
        entry = ctk.CTkEntry(dialog, width=280)
        entry.pack(padx=12, pady=4)
        entry.insert(0, current_title or "新对话")
        entry.focus_set()
        result: list[str] = []

        def ok() -> None:
            t = entry.get().strip()
            if t:
                result.append(t)
            dialog.destroy()

        def cancel() -> None:
            dialog.destroy()

        btn_frame = ctk.CTkFrame(dialog, fg_color="transparent")
        btn_frame.pack(pady=8)
        ctk.CTkButton(btn_frame, text="确定", width=80, command=ok).pack(side="left", padx=4)
        ctk.CTkButton(btn_frame, text="取消", width=80, command=cancel).pack(side="left", padx=4)
        dialog.wait_window()
        if result:
            self._app.update_session_title(session_id, result[0])
            self._refresh_sessions_list()

    def _on_delete_session(self, session_id: str) -> None:
        if messagebox.askyesno("删除会话", "确定删除该会话？", parent=self._root):
            self._app.delete_session(session_id)
            self._refresh_sessions_list()
            self._refresh_chat_area()

    def _on_model_change(self, value: str) -> None:
        for p in self._app.config().providers:
            if p.name == value:
                self._app.set_current_provider(p.id)
                break

    def _on_settings(self) -> None:
        from src.ui.settings import open_settings
        open_settings(self._root, self._app, self._on_config_changed)

    def _on_config_changed(self) -> None:
        """设置保存后刷新模型下拉与主题。"""
        ctk.set_appearance_mode(self._app.config().theme)
        self._model_var.set(self._current_model_display())
        self._model_menu.configure(values=self._model_options())

    def _on_input_return(self, event) -> None:
        if event.state & 0x4:  # Ctrl
            return  # Ctrl+Enter 换行
        self._on_send()
        return "break"

    def _on_send(self) -> None:
        text = self._input.get("1.0", "end").strip()
        if not text:
            return
        sid = self._app.current_session_id()
        if not sid:
            s = self._app.new_session()
            sid = s.id
            self._refresh_sessions_list()
            self._refresh_chat_area()
        self._input.delete("1.0", "end")
        self._error_label.configure(text="")
        self._sending_label.configure(text="正在输入…")
        self._send_btn.configure(state="disabled")
        self._streaming_session_id = sid
        # 先追加用户消息到界面
        self._append_user_message(sid, text)
        self._app.send_message(
            sid,
            text,
            self._stream_queue,
            on_done=self._on_stream_done,
            on_error=self._on_stream_error,
        )

    def _append_user_message(self, session_id: str, content: str) -> None:
        frame = ctk.CTkFrame(self._chat_scroll, fg_color=("gray85", "gray25"), corner_radius=8)
        frame.grid(sticky="ew", pady=4)
        frame.grid_columnconfigure(0, weight=1)
        tb = ctk.CTkTextbox(
            frame, wrap="word", height=self._message_textbox_height(content),
            fg_color="transparent", border_width=0, state="normal"
        )
        tb.grid(row=0, column=0, sticky="ew", padx=12, pady=8)
        tb.insert("1.0", f"你: {content}")
        tb.configure(state="disabled")
        self._chat_widgets.append(("user", frame))
        self._chat_scroll.columnconfigure(0, weight=1)

    def _on_stream_done(self) -> None:
        self._root.after(0, self._stream_done_ui)

    def _stream_done_ui(self) -> None:
        self._sending_label.configure(text="")
        self._send_btn.configure(state="normal")
        self._streaming_session_id = None
        self._streaming_textbox_id = None
        self._streaming_text = []
        self._refresh_sessions_list()

    def _on_stream_error(self, message: str) -> None:
        self._root.after(0, lambda: self._stream_error_ui(message))

    def _stream_error_ui(self, message: str) -> None:
        self._sending_label.configure(text="")
        self._error_label.configure(text=message)
        self._send_btn.configure(state="normal")
        self._streaming_session_id = None
        self._streaming_textbox_id = None
        self._streaming_text = []

    def _poll_stream(self) -> None:
        try:
            while True:
                chunk = self._stream_queue.get_nowait()
                if is_error(chunk):
                    self._sending_label.configure(text="")
                    self._error_label.configure(text=chunk.message)
                    self._send_btn.configure(state="normal")
                    self._streaming_session_id = None
                    self._streaming_textbox_id = None
                    self._streaming_text = []
                    continue
                if isinstance(chunk, DoneChunk):
                    self._sending_label.configure(text="")
                    self._send_btn.configure(state="normal")
                    if self._streaming_textbox_id is not None:
                        tb = self._find_streaming_textbox()
                        if tb is not None and _USE_MARKDOWN and CTkMarkdown:
                            full = tb.get("1.0", "end")
                            content = full.replace("助手: ", "", 1).strip()
                            frame = tb.master
                            tb.destroy()
                            md = CTkMarkdown(frame, width=400, height=280)
                            md.grid(row=0, column=0, sticky="ew", padx=12, pady=8)
                            md.set_markdown(f"**助手:**\n\n{content}")
                        elif tb is not None:
                            tb.configure(state="disabled")
                    self._streaming_session_id = None
                    self._streaming_textbox_id = None
                    self._streaming_text = []
                    self._refresh_sessions_list()
                    continue
                if isinstance(chunk, TextChunk):
                    if self._streaming_textbox_id is None:
                        frame = ctk.CTkFrame(self._chat_scroll, fg_color=("gray70", "gray30"), corner_radius=8)
                        frame.grid(sticky="ew", pady=4)
                        frame.grid_columnconfigure(0, weight=1)
                        tb = ctk.CTkTextbox(
                            frame, wrap="word", height=280,
                            fg_color="transparent", border_width=0, state="normal"
                        )
                        tb.grid(row=0, column=0, sticky="ew", padx=12, pady=8)
                        tb.insert("1.0", "助手: ")
                        self._chat_widgets.append(("streaming", frame))
                        self._streaming_textbox_id = id(tb)
                    tb = self._find_streaming_textbox()
                    if tb is not None:
                        tb.insert("end", chunk.content)
                        tb.see("end")
        except queue.Empty:
            pass
        self._root.after(POLL_MS, self._poll_stream)

    def _find_streaming_textbox(self) -> ctk.CTkTextbox | None:
        """从 _chat_widgets 里找到当前流式输出的 CTkTextbox（streaming 行的 frame 下唯一子控件）。"""
        if self._streaming_textbox_id is None:
            return None
        for _, frame in self._chat_widgets:
            if not isinstance(frame, ctk.CTkFrame):
                continue
            for w in frame.winfo_children():
                if id(w) == self._streaming_textbox_id:
                    return w
        return None

    def _on_close(self) -> None:
        self._root.destroy()

    def run(self) -> None:
        self._root.mainloop()
