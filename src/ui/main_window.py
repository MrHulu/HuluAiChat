"""主窗口：三区布局、侧边栏、对话区、输入区；通过 AppService 与下层交互。"""
import queue
from typing import Callable

import customtkinter as ctk

from src.app.service import AppService
from src.chat import TextChunk, DoneChunk, ChatError, is_error
from src.persistence import Session, Message


SIDEBAR_WIDTH = 220
SIDEBAR_COLLAPSED = 56
POLL_MS = 50


class MainWindow:
    def __init__(self, app: AppService) -> None:
        self._app = app
        self._stream_queue: queue.Queue = queue.Queue()
        self._streaming_session_id: str | None = None
        self._streaming_textbox_id: int | None = None  # id(streaming CTkTextbox)
        self._streaming_text: list[str] = []

        ctk.set_appearance_mode(self._app.config().theme)
        self._root = ctk.CTk()
        self._root.title("HuluChat")
        self._root.geometry("900x600")
        self._root.minsize(400, 300)

        # 主网格：侧边栏 | 主区
        self._root.grid_columnconfigure(1, weight=1)
        self._root.grid_rowconfigure(0, weight=1)

        # 侧边栏
        self._sidebar = ctk.CTkFrame(self._root, width=SIDEBAR_WIDTH, corner_radius=0, fg_color=("gray90", "gray17"))
        self._sidebar.grid(row=0, column=0, sticky="nsew")
        self._sidebar.grid_rowconfigure(1, weight=1)
        self._sidebar_expanded = self._app.config().sidebar_expanded
        self._sidebar_btn_new = ctk.CTkButton(
            self._sidebar, text="新对话", command=self._on_new_chat, width=160 if self._sidebar_expanded else 40
        )
        self._sidebar_btn_new.grid(row=0, column=0, padx=12, pady=12, sticky="ew")
        self._sidebar_toggle = ctk.CTkButton(
            self._sidebar, text="◀" if self._sidebar_expanded else "▶", width=32, command=self._toggle_sidebar
        )
        self._sidebar_toggle.grid(row=0, column=1, padx=4, pady=12)
        self._session_list_frame = ctk.CTkScrollableFrame(self._sidebar, fg_color="transparent")
        self._session_list_frame.grid(row=1, column=0, columnspan=2, sticky="nsew", padx=8, pady=4)
        self._session_buttons: list[ctk.CTkButton] = []
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
        self._sidebar.configure(width=w)
        self._sidebar_btn_new.configure(width=160 if self._sidebar_expanded else 40, text="新对话" if self._sidebar_expanded else "＋")
        self._sidebar_toggle.configure(text="◀" if self._sidebar_expanded else "▶")

    def _toggle_sidebar(self) -> None:
        self._sidebar_expanded = not self._sidebar_expanded
        self._app.set_sidebar_expanded(self._sidebar_expanded)
        self._refresh_sidebar_width()

    def _refresh_sessions_list(self) -> None:
        for b in self._session_buttons:
            b.destroy()
        self._session_buttons.clear()
        sessions = self._app.load_sessions()
        current = self._app.current_session_id()
        for s in sessions:
            btn = ctk.CTkButton(
                self._session_list_frame,
                text=(s.title or "新对话")[:20],
                anchor="w",
                fg_color=("gray75", "gray30") if s.id == current else "transparent",
                command=lambda sid=s.id: self._on_select_session(sid),
            )
            btn.grid(sticky="ew", pady=2)
            self._session_list_frame.columnconfigure(0, weight=1)
            self._session_buttons.append(btn)

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
                        if tb is not None:
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
