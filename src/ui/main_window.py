"""主窗口：三区布局、侧边栏、对话区、输入区；通过 AppService 与下层交互。"""
import queue
import os
import sys
from typing import Callable
from tkinter import filedialog
from tkinter import messagebox, PhotoImage

import customtkinter as ctk

from src.app.service import AppService
from src.app.exporter import ChatExporter
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


class ToastNotification:
    """简单的浮动提示框，用于显示操作反馈。"""
    def __init__(self, parent: ctk.CTk, message: str, duration_ms: int = 1500) -> None:
        self._parent = parent
        self._duration = duration_ms
        self._widget: ctk.CTkFrame | None = None

        # 创建半透明背景的提示框
        self._widget = ctk.CTkFrame(
            parent,
            fg_color=("gray80", "gray30"),
            corner_radius=8,
            border_width=1,
            border_color=("gray70", "gray40")
        )
        self._widget.place(relx=0.5, rely=0.85, anchor="center")

        label = ctk.CTkLabel(
            self._widget,
            text=message,
            font=("", 12),
            text_color=("gray15", "gray88"),
            padx=16,
            pady=8
        )
        label.pack()

        # 自动消失
        self._widget.after(duration_ms, self._destroy)

    def _destroy(self) -> None:
        if self._widget and self._widget.winfo_exists():
            self._widget.place_forget()
            self._widget = None


def copy_to_clipboard(text: str) -> None:
    """复制文本到剪贴板。"""
    try:
        # Windows 优先使用 clip 模块（更快）
        import win32clipboard
        win32clipboard.OpenClipboard()
        win32clipboard.EmptyClipboard()
        win32clipboard.SetClipboardText(text, win32clipboard.CF_UNICODETEXT)
        win32clipboard.CloseClipboard()
    except Exception:
        # 回退到 Tkinter 通用方法
        import tkinter
        r = tkinter.Tk()
        r.withdraw()
        r.clipboard_clear()
        r.clipboard_append(text)
        r.update()
        r.destroy()


class QuickSwitcherDialog:
    """快速会话切换对话框 - 支持 Ctrl+Tab 快速切换会话。"""
    def __init__(
        self,
        parent: ctk.CTk,
        sessions: list,
        current_id: str | None,
        on_select: Callable[[str], None],
        initial_index: int = 0,
        message_counts: dict[str, int] | None = None,
    ) -> None:
        """
        Args:
            parent: 父窗口
            sessions: 会话列表 (Session 对象)
            current_id: 当前会话 ID
            on_select: 选择回调，接收 session_id
            initial_index: 初始选中的索引 (用于 Ctrl+Tab 快速切换)
            message_counts: 会话消息计数字典 {session_id: count}
        """
        self._parent = parent
        self._sessions = sessions
        self._current_id = current_id
        self._on_select = on_select
        self._selected_index = initial_index
        self._filter_text = ""
        self._filtered_indices: list[int] = list(range(len(sessions)))
        self._message_counts = message_counts or {}
        self._widget: ctk.CTkToplevel | None = None
        self._session_list_frame: ctk.CTkScrollableFrame | None = None
        self._session_buttons: list[ctk.CTkButton] = []
        self._search_var: ctk.StringVar | None = None
            initial_index: 初始选中的索引 (用于 Ctrl+Tab 快速切换)
        """
        self._parent = parent
        self._sessions = sessions
        self._current_id = current_id
        self._on_select = on_select
        self._selected_index = initial_index
        self._filter_text = ""
        self._filtered_indices: list[int] = list(range(len(sessions)))
        self._widget: ctk.CTkToplevel | None = None
        self._session_list_frame: ctk.CTkScrollableFrame | None = None
        self._session_buttons: list[ctk.CTkButton] = []
        self._search_var: ctk.StringVar | None = None

        self._create_dialog()

    def _create_dialog(self) -> None:
        """创建对话框。"""
        self._widget = ctk.CTkToplevel(self._parent)
        self._widget.title("切换会话")
        self._widget.geometry("600x400")
        self._widget.transient(self._parent)  # 设置为工具窗口
        self._widget.grab_set()  # 模态对话框

        # 居中显示
        self._widget.update_idletasks()
        parent_x = self._parent.winfo_x()
        parent_y = self._parent.winfo_y()
        parent_w = self._parent.winfo_width()
        parent_h = self._parent.winfo_height()
        dlg_w = 600
        dlg_h = 400
        self._widget.geometry(f"{dlg_w}x{dlg_h}+{parent_x + (parent_w - dlg_w) // 2}+{parent_y + (parent_h - dlg_h) // 2}")

        # 主框架
        main = ctk.CTkFrame(self._widget, fg_color="transparent")
        main.pack(fill="both", expand=True, padx=16, pady=16)
        main.grid_columnconfigure(0, weight=1)
        main.grid_rowconfigure(1, weight=1)

        # 搜索框
        self._search_var = ctk.StringVar()
        search_entry = ctk.CTkEntry(
            main,
            placeholder_text="🔍 输入过滤会话...",
            textvariable=self._search_var,
            height=36,
        )
        search_entry.grid(row=0, column=0, sticky="ew", pady=(0, 12))
        search_entry.bind("<KeyRelease>", self._on_search_input)
        search_entry.bind("<Escape>", lambda e: self._close())
        search_entry.bind("<Up>", lambda e: self._select_prev())
        search_entry.bind("<Down>", lambda e: self._select_next())
        search_entry.bind("<Return>", lambda e: self._confirm())
        search_entry.focus_set()

        # 会话列表
        self._session_list_frame = ctk.CTkScrollableFrame(
            main,
            fg_color=("gray85", "gray22"),
            corner_radius=8,
        )
        self._session_list_frame.grid(row=1, column=0, sticky="nsew")

        # 绑定键盘导航
        self._widget.bind("<Escape>", lambda e: self._close())
        self._widget.bind("<Up>", lambda e: self._select_prev())
        self._widget.bind("<Down>", lambda e: self._select_next())
        self._widget.bind("<Return>", lambda e: self._confirm())

        # 渲染会话列表
        self._render_sessions()

    def _render_sessions(self) -> None:
        """渲染会话列表。"""
        if not self._session_list_frame:
            return

        # 清空现有按钮
        for btn in self._session_buttons:
            if btn.winfo_exists():
                btn.destroy()
        self._session_buttons.clear()

        # 过滤后的会话
        for idx in self._filtered_indices:
            session = self._sessions[idx]
            is_current = session.id == self._current_id
            is_pinned = session.pinned
            msg_count = self._message_counts.get(session.id, 0)

            # 构建显示文本
            pin_icon = "📌" if is_pinned else ""
            count_text = f"({msg_count})" if msg_count > 0 else ""
            title = session.title or "未命名会话"
            display_text = f"{pin_icon} {title} {count_text}".strip()

            # 创建按钮
            btn = ctk.CTkButton(
                self._session_list_frame,
                text=display_text,
                height=40,
                fg_color=("gray75", "gray30") if not is_current else ("gray60", "gray45"),
                hover_color=("gray70", "gray28"),
                text_color=("gray15", "gray88"),
                anchor="w",
                command=lambda sid=session.id: self._select_session(sid),
            )
            btn.pack(fill="x", padx=8, pady=4)
            self._session_buttons.append(btn)

        # 更新选中状态
        self._update_selection()

    def _on_search_input(self, event) -> None:
        """处理搜索输入。"""
        if not self._search_var:
            return
        query = self._search_var.get().lower()

        if not query:
            self._filtered_indices = list(range(len(self._sessions)))
        else:
            self._filtered_indices = [
                i for i, s in enumerate(self._sessions)
                if query in (s.title or "").lower()
            ]

        # 重置选中索引到第一个过滤结果
        if self._filtered_indices:
            self._selected_index = self._filtered_indices[0]

        self._render_sessions()

    def _update_selection(self) -> None:
        """更新选中状态的视觉反馈。"""
        for i, btn in enumerate(self._session_buttons):
            # 找到对应的原始索引
            if i < len(self._filtered_indices):
                orig_idx = self._filtered_indices[i]
                is_selected = orig_idx == self._selected_index
                is_current = self._sessions[orig_idx].id == self._current_id

                if is_selected:
                    btn.configure(
                        fg_color=("gray50", "gray40"),
                        border_width=2,
                        border_color=("gray40", "gray35"),
                    )
                elif is_current:
                    btn.configure(
                        fg_color=("gray60", "gray45"),
                        border_width=0,
                    )
                else:
                    btn.configure(
                        fg_color=("gray75", "gray30"),
                        border_width=0,
                    )

    def _select_next(self) -> None:
        """选择下一个会话。"""
        if not self._filtered_indices:
            return

        # 找到当前选中在过滤列表中的位置
        try:
            current_pos = self._filtered_indices.index(self._selected_index)
        except ValueError:
            current_pos = -1

        next_pos = (current_pos + 1) % len(self._filtered_indices)
        self._selected_index = self._filtered_indices[next_pos]
        self._update_selection()

    def _select_prev(self) -> None:
        """选择上一个会话。"""
        if not self._filtered_indices:
            return

        # 找到当前选中在过滤列表中的位置
        try:
            current_pos = self._filtered_indices.index(self._selected_index)
        except ValueError:
            current_pos = 0

        prev_pos = (current_pos - 1) % len(self._filtered_indices)
        self._selected_index = self._filtered_indices[prev_pos]
        self._update_selection()

    def _select_session(self, session_id: str) -> None:
        """选择会话并关闭对话框。"""
        self._on_select(session_id)
        self._close()

    def _confirm(self) -> None:
        """确认当前选中。"""
        if 0 <= self._selected_index < len(self._sessions):
            session_id = self._sessions[self._selected_index].id
            self._select_session(session_id)

    def _close(self) -> None:
        """关闭对话框。"""
        if self._widget and self._widget.winfo_exists():
            self._widget.destroy()
            self._widget = None

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
        self._search_query: str = ""  # 当前搜索关键词
        self._search_global: bool = False  # 全局搜索模式
        self._matched_message_ids: set[str] = set()  # 匹配的消息ID集合
        self._search_matches: list[tuple[str, int, int]] = []  # (msg_id, start_pos, end_pos) 所有匹配位置
        self._current_match_index: int = 0  # 当前选中的匹配索引
        self._current_match_msg_id: str | None = None  # 当前匹配所在的消息ID
        # 最近搜索下拉框
        self._search_dropdown: ctk.CTkFrame | None = None  # 下拉框容器
        self._search_dropdown_open: bool = False  # 下拉框是否打开
        self._search_debounce_job: str | None = None  # 防抖任务ID

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
        top.grid_columnconfigure(1, weight=1)

        # 搜索框
        self._search_var = ctk.StringVar()
        self._search_entry = ctk.CTkEntry(
            top,
            placeholder_text="🔍 搜索... (Ctrl+K)",
            width=200,
            textvariable=self._search_var,
            height=32
        )
        self._search_entry.grid(row=0, column=0, sticky="w")
        self._search_entry.bind("<KeyRelease>", self._on_search_input)
        self._search_entry.bind("<Escape>", lambda e: self._clear_search())
        self._search_entry.bind("<FocusIn>", lambda e: self._show_search_dropdown())
        self._search_entry.bind("<FocusOut>", self._on_search_focus_out)
        self._search_entry.bind("<Return>", self._on_search_enter)
        # 全局搜索切换按钮
        self._search_global_btn = ctk.CTkButton(
            top,
            text="本会话",
            width=70,
            height=32,
            command=self._toggle_search_scope,
            fg_color=("gray75", "gray30"),
            hover_color=("gray70", "gray28"),
            text_color=("gray15", "gray88"),
        )
        self._search_global_btn.grid(row=0, column=1, padx=(4, 0))

        # 搜索结果计数器
        self._search_counter_var = ctk.StringVar()
        self._search_counter = ctk.CTkLabel(
            top,
            textvariable=self._search_counter_var,
            width=50,
            font=("", 11),
            text_color=("gray50", "gray65"),
            anchor="e"
        )
        self._search_counter.grid(row=0, column=2, padx=(4, 8))
        self._search_counter.grid_remove()  # 初始隐藏

        self._model_var = ctk.StringVar(value=self._current_model_display())
        self._model_menu = ctk.CTkOptionMenu(
            top, variable=self._model_var, values=self._model_options(), width=180, command=self._on_model_change
        )
        self._model_menu.grid(row=0, column=3, padx=8)
        ctk.CTkButton(top, text="模板", width=70, command=self._on_templates).grid(row=0, column=4, padx=4)
        ctk.CTkButton(top, text="导出", width=70, command=self._on_export).grid(row=0, column=5, padx=4)
        ctk.CTkButton(top, text="设置", width=70, command=self._on_settings).grid(row=0, column=6, padx=4)
        # 快捷键提示按钮
        ctk.CTkButton(
            top,
            text="⌨️",
            width=36,
            command=self._show_shortcuts_help,
            fg_color="transparent",
            hover_color=("gray80", "gray28"),
            text_color=("gray40", "gray60")
        ).grid(row=0, column=7, padx=4)
        # 添加 column 1 的权重，让搜索按钮有足够空间
        top.grid_columnconfigure(1, weight=0)
        top.grid_columnconfigure(2, weight=0)  # 计数器固定宽度

        # 对话区
        self._chat_scroll = ctk.CTkScrollableFrame(main, fg_color="transparent")
        self._chat_scroll.grid(row=1, column=0, sticky="nsew", padx=12, pady=4)
        self._chat_scroll.grid_columnconfigure(0, weight=1)
        self._chat_widgets: list[tuple[str, ctk.CTkFrame]] = []  # (msg_id, frame containing CTkTextbox)

        # 输入区
        input_frame = ctk.CTkFrame(main, fg_color="transparent")
        input_frame.grid(row=2, column=0, sticky="ew", padx=12, pady=8)
        input_frame.grid_columnconfigure(1, weight=1)

        # 提示词模板快捷按钮
        self._template_var = ctk.StringVar(value="模板")
        self._template_menu = ctk.CTkOptionMenu(
            input_frame,
            variable=self._template_var,
            values=self._template_options(),
            width=90,
            command=self._on_template_selected,
        )
        self._template_menu.grid(row=0, column=0, padx=(0, 8))

        self._input = ctk.CTkTextbox(input_frame, height=80, wrap="word")
        self._input.grid(row=0, column=1, sticky="ew", padx=(0, 8))
        self._input.bind("<Return>", self._on_input_return)
        self._input.bind("<Control-Return>", lambda e: None)  # Ctrl+Enter 换行由默认行为处理
        self._send_btn = ctk.CTkButton(input_frame, text="发送", width=80, command=self._on_send)
        self._send_btn.grid(row=0, column=2)
        self._sending_label = ctk.CTkLabel(input_frame, text="", fg_color="transparent")
        self._sending_label.grid(row=0, column=3, padx=8)
        self._error_label = ctk.CTkLabel(input_frame, text="", text_color=("red", "orange"))
        self._error_label.grid(row=1, column=0, columnspan=4, sticky="w", pady=(4, 0))

        self._refresh_sessions_list()
        self._refresh_chat_area()
        self._root.after(POLL_MS, self._poll_stream)
        self._root.protocol("WM_DELETE_WINDOW", self._on_close)

        # 键盘快捷键
        self._root.bind("<Control-k>", lambda e: self._focus_search())
        self._root.bind("<Control-K>", lambda e: self._focus_search())  # 大写 K 兼容
        self._root.bind("<Control-n>", lambda e: self._on_new_chat())
        self._root.bind("<Control-N>", lambda e: self._on_new_chat())  # 大写 N 兼容
        self._root.bind("<Control-w>", lambda e: self._on_close_current_session())
        self._root.bind("<Control-W>", lambda e: self._on_close_current_session())  # 大写 W 兼容
        self._root.bind("<Control-l>", lambda e: self._focus_input())
        self._root.bind("<Control-L>", lambda e: self._focus_input())  # 大写 L 兼容
        self._root.bind("<Control-slash>", lambda e: self._show_shortcuts_help())
        self._root.bind("<Control-question>", lambda e: self._show_shortcuts_help())  # 某些键盘布局
        self._root.bind("<Control-comma>", lambda e: self._on_settings())  # Ctrl+, 打开设置
        self._root.bind("<Control-t>", lambda e: self._toggle_sidebar())  # Ctrl+T 切换侧边栏
        self._root.bind("<Control-T>", lambda e: self._toggle_sidebar())
        self._root.bind("<Control-r>", lambda e: self._on_regenerate())  # Ctrl+R 重新生成
        self._root.bind("<Control-R>", lambda e: self._on_regenerate())
        self._root.bind("<Control-p>", lambda e: self._on_toggle_current_session_pinned())  # Ctrl+P 切换置顶
        self._root.bind("<Control-P>", lambda e: self._on_toggle_current_session_pinned())  # 大写 P 兼容
        self._root.bind("<Control-C>", lambda e: self._on_copy_last_message())  # Ctrl+Shift+C 复制最后一条 AI 回复
        self._root.bind("<Control-Up>", lambda e: self._on_next_session(-1))  # Ctrl+Up 上一个会话
        self._root.bind("<Control-Down>", lambda e: self._on_next_session(1))  # Ctrl+Down 下一个会话
        # 搜索结果导航
        self._root.bind("<F3>", lambda e: self._next_search_match())
        self._root.bind("<Shift-F3>", lambda e: self._prev_search_match())
        # 快速会话切换 Ctrl+Tab / Ctrl+Shift+Tab
        self._root.bind("<Control-Tab>", lambda e: self._on_quick_switcher(1))  # Ctrl+Tab 下一个
        self._root.bind("<Control-ISO_Left_Tab>", lambda e: self._on_quick_switcher(-1))  # Ctrl+Shift+Tab 上一个

    def _current_model_display(self) -> str:
        p = self._app.get_current_provider()
        return p.name if p else "未选择模型"

    def _model_options(self) -> list[str]:
        return [p.name for p in self._app.config().providers] or ["未配置模型"]

    def _template_options(self) -> list[str]:
        """获取模板选项列表。"""
        templates = self._app.list_prompt_templates()
        return [t.title for t in templates] or ["无模板"]

    def _on_template_selected(self, choice: str) -> None:
        """用户选择模板时，将模板内容插入输入框。"""
        templates = self._app.list_prompt_templates()
        for t in templates:
            if t.title == choice:
                # 获取当前选中的文本（如果有）
                current_text = self._input.get("1.0", "end").strip()
                # 替换模板中的 {selection} 占位符
                content = t.content.replace("{selection}", current_text if current_text else "")
                # 如果内容已存在且不是占位符，追加；否则替换
                if current_text and "{selection}" not in t.content:
                    self._input.delete("1.0", "end")
                    self._input.insert("1.0", content)
                else:
                    self._input.delete("1.0", "end")
                    self._input.insert("1.0", content)
                # 重置下拉菜单显示
                self._template_var.set("模板")
                break

    def _on_search_input(self, event) -> None:
        """搜索输入框内容变化时触发。"""
        query = self._search_var.get().strip()
        if query != self._search_query:
            self._search_query = query
            self._refresh_chat_area()

        # 取消之前的防抖任务
        if self._search_debounce_job:
            self._root.after_cancel(self._search_debounce_job)

        # 如果查询不为空，设置防抖任务（1秒后添加到最近搜索）
        if query:
            self._search_debounce_job = self._root.after(1000, lambda: self._add_search_to_history(query))
        else:
            self._search_debounce_job = None

    def _add_search_to_history(self, query: str) -> None:
        """防抖后添加到最近搜索历史。"""
        current = self._search_var.get().strip()
        # 只有当前搜索框的内容仍然匹配时才添加（防止用户继续输入）
        if current == query:
            self._app.add_recent_search(query)
            self._search_debounce_job = None

    def _clear_search(self) -> None:
        """清除搜索。"""
        # 取消防抖任务
        if self._search_debounce_job:
            self._root.after_cancel(self._search_debounce_job)
            self._search_debounce_job = None
        self._search_var.set("")
        self._search_query = ""
        self._refresh_chat_area()
        self._search_entry.focus_set()

    def _update_search_counter(self) -> None:
        """更新搜索框旁的计数器显示。"""
        if self._search_query and self._search_matches:
            self._search_counter_var.set(f"{self._current_match_index + 1}/{len(self._search_matches)}")
            self._search_counter.grid()
        elif self._search_query:
            self._search_counter_var.set("0/0")
            self._search_counter.grid()
        else:
            self._search_counter.grid_remove()

    def _toggle_search_scope(self) -> None:
        """切换搜索范围（本会话/全部会话）。"""
        self._search_global = not self._search_global
        self._search_global_btn.configure(text="全部会话" if self._search_global else "本会话")
        self._refresh_chat_area()

    def _on_search_enter(self, event) -> None:
        """用户在搜索框按 Enter 键，执行搜索并记录到最近搜索。"""
        # 取消防抖任务
        if self._search_debounce_job:
            self._root.after_cancel(self._search_debounce_job)
            self._search_debounce_job = None

        query = self._search_var.get().strip()
        if query:
            self._app.add_recent_search(query)
        # 执行搜索
        if query != self._search_query:
            self._search_query = query
            self._refresh_chat_area()
        self._hide_search_dropdown()
        return "break"  # 阻止默认行为

    def _show_search_dropdown(self) -> None:
        """显示最近搜索下拉框。"""
        recent = self._app.get_recent_searches()
        if not recent:
            return  # 没有最近搜索，不显示下拉框

        # 如果已经显示，不再重复创建
        if self._search_dropdown_open:
            return

        # 获取搜索框的位置
        x = self._search_entry.winfo_x()
        y = self._search_entry.winfo_y() + self._search_entry.winfo_height()
        width = self._search_entry.winfo_width()

        # 创建下拉框容器
        self._search_dropdown = ctk.CTkFrame(
            self._root,
            fg_color=("gray95", "gray22"),
            border_width=1,
            border_color=("gray70", "gray40"),
            corner_radius=6,
        )
        self._search_dropdown.place(x=x, y=y, width=width, anchor="nw")
        self._search_dropdown_open = True

        # 添加最近搜索项
        for i, query in enumerate(recent):
            btn = ctk.CTkButton(
                self._search_dropdown,
                text=f"🕐 {query}",
                fg_color="transparent",
                hover_color=("gray85", "gray30"),
                text_color=("gray15", "gray88"),
                height=28,
                anchor="w",
                corner_radius=0,
            )
            btn.pack(fill="x", padx=0, pady=0)
            # 点击该项，执行搜索
            btn.configure(command=lambda q=query: self._select_recent_search(q))

        # 清除历史按钮
        clear_btn = ctk.CTkButton(
            self._search_dropdown,
            text="🗑️ 清除搜索历史",
            fg_color="transparent",
            hover_color=("gray80", "gray28"),
            text_color=("gray40", "gray60"),
            height=28,
            anchor="w",
            corner_radius=0,
        )
        clear_btn.pack(fill="x", padx=0, pady=(4, 0))
        clear_btn.configure(command=self._clear_recent_searches)

    def _hide_search_dropdown(self) -> None:
        """隐藏最近搜索下拉框。"""
        if self._search_dropdown:
            self._search_dropdown.place_forget()
            self._search_dropdown = None
        self._search_dropdown_open = False

    def _on_search_focus_out(self, event) -> None:
        """搜索框失去焦点时，延迟隐藏下拉框（允许点击下拉项）。"""
        # 延迟100ms，给点击事件时间处理
        self._root.after(100, self._hide_search_dropdown)

    def _select_recent_search(self, query: str) -> None:
        """选择一个最近搜索项。"""
        # 取消防抖任务
        if self._search_debounce_job:
            self._root.after_cancel(self._search_debounce_job)
            self._search_debounce_job = None

        self._search_var.set(query)
        self._search_query = query
        self._app.add_recent_search(query)  # 更新为最新
        self._hide_search_dropdown()
        self._refresh_chat_area()

    def _clear_recent_searches(self) -> None:
        """清除所有最近搜索。"""
        self._app.clear_recent_searches()
        self._hide_search_dropdown()
        ToastNotification(self._root, "搜索历史已清除")

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

    def _copy_message(self, content: str) -> None:
        """复制消息内容到剪贴板，并显示提示。"""
        copy_to_clipboard(content)
        ToastNotification(self._root, "✓ 已复制到剪贴板")

    def _toggle_pin(self, message_id: str) -> None:
        """切换消息的置顶状态。"""
        is_pinned = self._app.toggle_message_pin(message_id)
        msg = "📌 已置顶" if is_pinned else "📍 已取消置顶"
        ToastNotification(self._root, msg)
        self._refresh_chat_area()

    def _edit_message(self, message_id: str, current_content: str) -> None:
        """编辑消息内容。"""
        # 获取消息信息
        sid = self._app.current_session_id()
        if not sid:
            return
        messages = self._app.load_messages(sid)
        target_msg = None
        for m in messages:
            if m.id == message_id:
                target_msg = m
                break
        if not target_msg:
            ToastNotification(self._root, "❌ 消息不存在")
            return

        # 创建编辑对话框
        dialog = ctk.CTkToplevel(self._root)
        dialog.title("编辑消息")
        dialog.geometry("600x400")
        dialog.transient(self._root)
        dialog.grab_set()

        # 角色标签
        role_label = ctk.CTkLabel(
            dialog,
            text=f"编辑{'用户' if target_msg.role == 'user' else '助手'}消息",
            font=("", 14, "bold")
        )
        role_label.pack(pady=(16, 8))

        # 文本输入框
        textbox = ctk.CTkTextbox(
            dialog,
            wrap="word",
            height=250,
            font=("", 12)
        )
        textbox.pack(padx=16, pady=8, fill="both", expand=True)
        textbox.insert("1.0", current_content)

        # 按钮容器
        btn_frame = ctk.CTkFrame(dialog, fg_color="transparent")
        btn_frame.pack(pady=(8, 16))

        def save_and_close():
            new_content = textbox.get("1.0", "end").strip()
            if not new_content:
                messagebox.showwarning("警告", "消息内容不能为空")
                return
            if self._app.update_message_content(message_id, new_content):
                ToastNotification(self._root, "✓ 消息已更新")
                self._refresh_chat_area()
                dialog.destroy()
            else:
                messagebox.showerror("错误", "更新消息失败")

        def cancel_and_close():
            dialog.destroy()

        # 保存按钮
        save_btn = ctk.CTkButton(
            btn_frame,
            text="保存",
            command=save_and_close,
            width=100,
            fg_color=("gray70", "gray30"),
            hover_color=("gray60", "gray20")
        )
        save_btn.pack(side="left", padx=8)

        # 取消按钮
        cancel_btn = ctk.CTkButton(
            btn_frame,
            text="取消",
            command=cancel_and_close,
            width=100,
            fg_color="transparent",
            border_width=1,
            border_color=("gray60", "gray40")
        )
        cancel_btn.pack(side="left", padx=8)

        # 聚焦到文本框
        textbox.focus_set()

    def _delete_message(self, message_id: str) -> None:
        """删除消息，需用户确认。"""
        if not messagebox.askyesno("确认删除", "确定要删除这条消息吗？"):
            return

        if self._app.delete_message(message_id):
            ToastNotification(self._root, "🗑️ 消息已删除")
            self._refresh_chat_area()
        else:
            ToastNotification(self._root, "❌ 删除失败")

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
            # 消息数量标签
            msg_count = self._app.get_message_count(s.id)
            count_label = ctk.CTkLabel(
                row,
                text=str(msg_count),
                font=("", 10),
                text_color=("gray50", "gray65"),
                width=20,
            )
            count_label.grid(row=0, column=1, padx=(0, 2))
            # 置顶按钮
            pin_text = "📌" if s.is_pinned else "📍"
            btn_pin = ctk.CTkButton(
                row, text=pin_text, width=26, height=26,
                fg_color="transparent", hover_color=("gray80", "gray28"), border_width=0,
                text_color=_side_text,
                command=lambda sid=s.id: self._on_toggle_session_pinned(sid),
            )
            btn_pin.grid(row=0, column=2, padx=2)
            _bind_pressed_style(btn_pin)
            btn_rename = ctk.CTkButton(
                row, text="✏️", width=26, height=26,
                fg_color="transparent", hover_color=("gray80", "gray28"), border_width=0,
                text_color=_side_text,
                command=lambda sid=s.id, tit=s.title: self._on_rename_session(sid, tit),
            )
            btn_rename.grid(row=0, column=3, padx=2)
            _bind_pressed_style(btn_rename)
            btn_del = ctk.CTkButton(
                row, text="🗑️", width=26, height=26,
                fg_color="transparent", hover_color=("gray80", "gray28"), border_width=0,
                text_color=_side_text,
                command=lambda sid=s.id: self._on_delete_session(sid),
            )
            btn_del.grid(row=0, column=4, padx=2)
            _bind_pressed_style(btn_del)
            self._session_row_frames.append(row)
        self._session_list_frame.columnconfigure(0, weight=1)

    def _message_textbox_height(self, content: str) -> int:
        """根据内容行数计算文本框高度，避免长文被截断。"""
        lines = max(2, content.count("\n") + 1)
        return min(400, max(60, lines * 22))

    def _insert_highlighted_text(self, tb: ctk.CTkTextbox, prefix: str, content: str, msg_id: str) -> None:
        """插入文本并高亮搜索匹配。"""
        tb.insert("1.0", f"{prefix}: ")
        # 配置高亮标签（如果支持）
        try:
            # 尝试使用底层 Tkinter Text 的 tag_configure
            text_widget = tb._textbox if hasattr(tb, '_textbox') else tb
            text_widget.tag_config("search_highlight", background="yellow", foreground="black")
        except Exception:
            pass  # CTkTextbox 可能不支持标签

        if not self._search_query:
            tb.insert("end", content)
            return

        # 插入内容并高亮匹配
        content_lower = content.lower()
        query_lower = self._search_query.lower()
        start = 0
        has_match = False

        while True:
            pos = content_lower.find(query_lower, start)
            if pos == -1:
                # 插入剩余部分
                if start < len(content):
                    tb.insert("end", content[start:])
                break
            has_match = True
            # 插入匹配前的文本
            if pos > start:
                tb.insert("end", content[start:pos])
            # 插入匹配文本（尝试高亮）
            match_text = content[pos:pos + len(self._search_query)]
            tb.insert("end", match_text)
            try:
                text_widget = tb._textbox if hasattr(tb, '_textbox') else tb
                # 计算在文本框中的位置
                line_start = f"1.0 + {len(prefix) + 2 + pos} chars"
                line_end = f"1.0 + {len(prefix) + 2 + pos + len(match_text)} chars"
                text_widget.tag_add("search_highlight", line_start, line_end)
            except Exception:
                pass  # 忽略高亮失败
            start = pos + len(self._search_query)

        if not has_match:
            tb.insert("end", content)

    def _refresh_chat_area(self) -> None:
        for _, w in self._chat_widgets:
            w.destroy()
        self._chat_widgets.clear()
        sid = self._app.current_session_id()

        # 全局搜索模式
        if self._search_global and self._search_query:
            self._refresh_global_search_results()
            return

        # 正常模式或本会话搜索
        if not sid:
            lbl = ctk.CTkLabel(
                self._chat_scroll, text="新对话：在下方输入并发送。", anchor="w", justify="left"
            )
            lbl.grid(sticky="ew", pady=8)
            self._chat_scroll.columnconfigure(0, weight=1)
            return
        messages = self._app.load_messages(sid)

        # 搜索过滤
        if self._search_query:
            self._matched_message_ids = {m.id for m in self._app.search_messages(sid, self._search_query)}
            filtered_messages = [m for m in messages if m.id in self._matched_message_ids]
        else:
            self._matched_message_ids = set()
            filtered_messages = messages

        if not filtered_messages:
            hint = "没有匹配的消息" if self._search_query else "在下方输入并发送。"
            lbl = ctk.CTkLabel(
                self._chat_scroll, text=hint, anchor="w", justify="left", text_color=("gray40", "gray60")
            )
            lbl.grid(sticky="ew", pady=8)
            self._chat_scroll.columnconfigure(0, weight=1)
            return

        # 收集所有匹配位置用于导航
        self._search_matches = []
        if self._search_query:
            for m in filtered_messages:
                content_lower = m.content.lower()
                query_lower = self._search_query.lower()
                start = 0
                while True:
                    pos = content_lower.find(query_lower, start)
                    if pos == -1:
                        break
                    self._search_matches.append((m.id, pos, pos + len(self._search_query)))
                    start = pos + 1
            self._current_match_index = 0

        # 更新搜索框旁的计数器
        self._update_search_counter()

        # 计算当前匹配所在的消息ID（用于视觉指示器）
        self._current_match_msg_id: str | None = None
        if self._search_matches and 0 <= self._current_match_index < len(self._search_matches):
            self._current_match_msg_id = self._search_matches[self._current_match_index][0]

        # 显示搜索结果数量提示
        if self._search_query:
            match_text = f"找到 {len(self._search_matches)} 个匹配" if self._search_matches else "没有匹配"
            if self._search_matches:
                match_text += f" ({self._current_match_index + 1}/{len(self._search_matches)})"
            count_label = ctk.CTkLabel(
                self._chat_scroll,
                text=match_text,
                anchor="w",
                text_color=("gray40", "gray60"),
                font=("", 11)
            )
            count_label.grid(sticky="ew", pady=(0, 8))

        for m in filtered_messages:
            fg = ("gray85", "gray25") if m.role == "user" else ("gray70", "gray30")
            # 当前匹配的消息添加橙色边框作为视觉指示器
            is_current_match = (m.id == self._current_match_msg_id)
            border_color = ("orange", "dark orange") if is_current_match else None
            border_width = 2 if is_current_match else 0
            frame = ctk.CTkFrame(
                self._chat_scroll,
                fg_color=fg,
                corner_radius=8,
                border_color=border_color,
                border_width=border_width
            )
            frame.grid(sticky="ew", pady=4)
            frame.grid_columnconfigure(0, weight=1)
            frame.grid_columnconfigure(1, weight=0)

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
                prefix = '你' if m.role == 'user' else '助手'
                self._insert_highlighted_text(tb, prefix, m.content, m.id)
                tb.configure(state="disabled")

            # 右侧按钮组
            btn_frame = ctk.CTkFrame(frame, fg_color="transparent")
            btn_frame.grid(row=0, column=1, padx=(4, 8), pady=4)

            # 置顶按钮
            pin_text = "📌" if m.is_pinned else "📍"
            pin_btn = ctk.CTkButton(
                btn_frame,
                text=pin_text,
                width=28,
                height=28,
                fg_color=("yellow", "dark goldenrod") if m.is_pinned else "transparent",
                hover_color=("gold", "goldenrod") if m.is_pinned else ("gray80", "gray28"),
                border_width=0,
                command=lambda msg_id=m.id: self._toggle_pin(msg_id)
            )
            pin_btn.grid(row=0, column=0, pady=2)
            _bind_pressed_style(pin_btn)

            # 复制按钮
            copy_btn = ctk.CTkButton(
                btn_frame,
                text="📋",
                width=28,
                height=28,
                fg_color="transparent",
                hover_color=("gray80", "gray28"),
                border_width=0,
                command=lambda content=m.content: self._copy_message(content)
            )
            copy_btn.grid(row=1, column=0, pady=2)
            _bind_pressed_style(copy_btn)

            # 编辑按钮
            edit_btn = ctk.CTkButton(
                btn_frame,
                text="✏️",
                width=28,
                height=28,
                fg_color="transparent",
                hover_color=("gray80", "gray28"),
                border_width=0,
                command=lambda msg_id=m.id, content=m.content: self._edit_message(msg_id, content)
            )
            edit_btn.grid(row=2, column=0, pady=2)
            _bind_pressed_style(edit_btn)

            # 删除按钮
            delete_btn = ctk.CTkButton(
                btn_frame,
                text="🗑️",
                width=28,
                height=28,
                fg_color="transparent",
                hover_color=("gray80", "gray28"),
                border_width=0,
                command=lambda msg_id=m.id: self._delete_message(msg_id)
            )
            delete_btn.grid(row=3, column=0, pady=2)
            _bind_pressed_style(delete_btn)

            self._chat_widgets.append((m.id, frame))
        self._chat_scroll.columnconfigure(0, weight=1)

    def _refresh_global_search_results(self) -> None:
        """刷新全局搜索结果。"""
        all_messages = self._app.search_all_messages(self._search_query)

        if not all_messages:
            hint = f"没有找到包含「{self._search_query}」的消息"
            lbl = ctk.CTkLabel(
                self._chat_scroll, text=hint, anchor="w", justify="left", text_color=("gray40", "gray60")
            )
            lbl.grid(sticky="ew", pady=8)
            self._chat_scroll.columnconfigure(0, weight=1)
            return

        # 显示搜索结果数量提示
        count_label = ctk.CTkLabel(
            self._chat_scroll,
            text=f"在全部会话中找到 {len(all_messages)} 条匹配消息",
            anchor="w",
            text_color=("gray40", "gray60"),
            font=("", 11)
        )
        count_label.grid(sticky="ew", pady=(0, 8))

        # 获取所有会话信息用于显示标题
        sessions = {s.id: s for s in self._app.load_sessions()}

        for m in all_messages:
            fg = ("gray85", "gray25") if m.role == "user" else ("gray70", "gray30")
            session = sessions.get(m.session_id)
            session_title = session.title if session else "未知会话"

            frame = ctk.CTkFrame(
                self._chat_scroll,
                fg_color=fg,
                corner_radius=8,
            )
            frame.grid(sticky="ew", pady=4)
            frame.grid_columnconfigure(0, weight=1)
            frame.grid_columnconfigure(1, weight=0)

            # 消息内容
            tb = ctk.CTkTextbox(
                frame, wrap="word", height=self._message_textbox_height(m.content),
                fg_color="transparent", border_width=0, state="normal"
            )
            tb.grid(row=0, column=0, sticky="ew", padx=12, pady=8)
            prefix = '你' if m.role == 'user' else '助手'
            tb.insert("1.0", f"{prefix}: {m.content}")
            tb.configure(state="disabled")

            # 右侧按钮组
            btn_frame = ctk.CTkFrame(frame, fg_color="transparent")
            btn_frame.grid(row=0, column=1, padx=(4, 8), pady=4)

            # 置顶按钮（全局搜索结果中显示置顶状态但不提供切换）
            if m.is_pinned:
                pin_label = ctk.CTkLabel(
                    btn_frame,
                    text="📌",
                    width=28,
                    text_color=("orange", "dark goldenrod")
                )
                pin_label.grid(row=0, column=0, pady=2)

            # 复制按钮
            copy_btn = ctk.CTkButton(
                btn_frame,
                text="📋",
                width=28,
                height=28,
                fg_color="transparent",
                hover_color=("gray80", "gray28"),
                border_width=0,
                command=lambda content=m.content: self._copy_message(content)
            )
            copy_btn.grid(row=1 if m.is_pinned else 0, column=0, pady=2)
            _bind_pressed_style(copy_btn)

            # 跳转到会话按钮
            goto_btn = ctk.CTkButton(
                btn_frame,
                text="🔗",
                width=28,
                height=28,
                fg_color="transparent",
                hover_color=("gray80", "gray28"),
                border_width=0,
                command=lambda sid=m.session_id: self._goto_session(sid)
            )
            goto_btn.grid(row=2 if m.is_pinned else 1, column=0, pady=2)
            _bind_pressed_style(goto_btn)

            # 编辑按钮
            edit_btn = ctk.CTkButton(
                btn_frame,
                text="✏️",
                width=28,
                height=28,
                fg_color="transparent",
                hover_color=("gray80", "gray28"),
                border_width=0,
                command=lambda msg_id=m.id, content=m.content: self._edit_message(msg_id, content)
            )
            edit_btn.grid(row=3 if m.is_pinned else 2, column=0, pady=2)
            _bind_pressed_style(edit_btn)

            # 删除按钮
            delete_btn = ctk.CTkButton(
                btn_frame,
                text="🗑️",
                width=28,
                height=28,
                fg_color="transparent",
                hover_color=("gray80", "gray28"),
                border_width=0,
                command=lambda msg_id=m.id: self._delete_message(msg_id)
            )
            delete_btn.grid(row=4 if m.is_pinned else 3, column=0, pady=2)
            _bind_pressed_style(delete_btn)

            # 会话标题标签
            title_label = ctk.CTkLabel(
                frame,
                text=f"📁 {session_title}",
                anchor="w",
                text_color=("gray50", "gray70"),
                font=("", 10)
            )
            title_label.grid(row=1, column=0, sticky="w", padx=12, pady=(0, 4))

            self._chat_widgets.append((m.id, frame))
        self._chat_scroll.columnconfigure(0, weight=1)

    def _goto_session(self, session_id: str) -> None:
        """跳转到指定会话并退出全局搜索模式。"""
        self._app.switch_session(session_id)
        self._search_global = False
        self._search_global_btn.configure(text="本会话")
        self._search_var.set("")
        self._search_query = ""
        self._refresh_sessions_list()
        self._refresh_chat_area()

    def _focus_search(self) -> None:
        """聚焦搜索框（Ctrl+K）。"""
        self._search_entry.focus_set()
        # 选中已有文本方便替换
        current = self._search_var.get()
        if current:
            self._search_entry.select_range(0, "end")

    def _focus_input(self) -> None:
        """聚焦输入框（Ctrl+L）。"""
        self._input.focus_set()
        self._input.mark_set("insert", "end")  # 光标移到末尾

    def _show_shortcuts_help(self) -> None:
        """显示快捷键帮助对话框（Ctrl+/）。"""
        dialog = ctk.CTkToplevel(self._root)
        dialog.title("键盘快捷键")
        dialog.geometry("380x470")
        dialog.transient(self._root)

        # 主容器
        main = ctk.CTkFrame(dialog, fg_color="transparent")
        main.pack(fill="both", expand=True, padx=16, pady=16)

        # 标题
        ctk.CTkLabel(
            main,
            text="⌨️ 键盘快捷键",
            font=("", 18, "bold")
        ).pack(pady=(0, 16))

        # 快捷键列表
        shortcuts = [
            ("Ctrl + K", "聚焦搜索框"),
            ("Ctrl + L", "聚焦输入框"),
            ("Ctrl + N", "新建对话"),
            ("Ctrl + P", "切换置顶"),
            ("Ctrl + R", "重新生成最后回复"),
            ("Ctrl + Shift + C", "复制最后 AI 回复"),
            ("Ctrl + Tab", "快速切换会话"),
            ("Ctrl + Up/Down", "上/下一个会话"),
            ("Ctrl + T", "切换侧边栏"),
            ("Ctrl + W", "删除当前对话"),
            ("Ctrl + ,", "打开设置"),
            ("Ctrl + /", "显示此帮助"),
            ("ESC", "清除搜索"),
            ("F3", "下一个搜索匹配"),
            ("Shift + F3", "上一个搜索匹配"),
            ("Ctrl + Enter", "输入框内换行"),
            ("Enter", "发送消息"),
        ]

        # 使用 Frame 来对齐
        for key, desc in shortcuts:
            row = ctk.CTkFrame(main, fg_color="transparent")
            row.pack(fill="x", pady=4)
            ctk.CTkLabel(
                row,
                text=key,
                font=("Courier", 12),
                width=120,
                anchor="w",
                text_color=("blue", "cyan")
            ).pack(side="left")
            ctk.CTkLabel(
                row,
                text=desc,
                anchor="w"
            ).pack(side="left", padx=(8, 0))

        # 关闭按钮
        ctk.CTkButton(
            main,
            text="关闭",
            width=100,
            command=dialog.destroy
        ).pack(pady=(16, 0))

    def _scroll_to_match(self, msg_id: str) -> None:
        """滚动到包含指定消息的 widget，使其可见。"""
        for mid, frame in self._chat_widgets:
            if mid == msg_id:
                # 使用 _chat_scroll 的 scroll_to 方法滚动到该 frame
                try:
                    # CTkScrollableFrame 有 scroll_to 方法（基于底层 canvas）
                    # 计算相对位置
                    self._root.update_idletasks()  # 确保布局已更新
                    frame_y = frame.winfo_y()
                    scroll_height = self._chat_scroll._canvas.winfo_height()
                    # 滚动使目标可见（在视口中间位置）
                    target_y = max(0, frame_y - scroll_height // 3)
                    self._chat_scroll._canvas.yview_moveto(target_y / self._chat_scroll._canvas.winfo_height() * 2)
                except Exception:
                    # 回退：使用 see 方法（如果可用）
                    pass
                break

    def _next_search_match(self) -> None:
        """跳转到下一个搜索匹配（F3）。"""
        if not self._search_matches:
            return
        self._current_match_index = (self._current_match_index + 1) % len(self._search_matches)
        # 获取目标消息 ID，刷新后滚动到该位置
        target_msg_id = self._search_matches[self._current_match_index][0]
        self._refresh_chat_area()
        # 延迟滚动，等待 UI 更新完成
        self._root.after(50, lambda: self._scroll_to_match(target_msg_id))

    def _prev_search_match(self) -> None:
        """跳转到上一个搜索匹配（Shift+F3）。"""
        if not self._search_matches:
            return
        self._current_match_index = (self._current_match_index - 1) % len(self._search_matches)
        # 获取目标消息 ID，刷新后滚动到该位置
        target_msg_id = self._search_matches[self._current_match_index][0]
        self._refresh_chat_area()
        # 延迟滚动，等待 UI 更新完成
        self._root.after(50, lambda: self._scroll_to_match(target_msg_id))

    def _on_close_current_session(self) -> None:
        """关闭当前会话（Ctrl+W）。"""
        sid = self._app.current_session_id()
        if sid:
            from tkinter import messagebox
            if messagebox.askyesno("删除会话", "确定删除当前会话？", parent=self._root):
                self._app.delete_session(sid)
                self._refresh_sessions_list()
                self._refresh_chat_area()

    def _on_new_chat(self) -> None:
        self._app.new_session()
        self._refresh_sessions_list()
        self._refresh_chat_area()

    def _on_regenerate(self) -> None:
        """重新生成最后一条助手回复（Ctrl+R）。"""
        sid = self._app.current_session_id()
        if not sid:
            ToastNotification(self._root, "⚠️ 请先选择一个会话")
            return
        # 检查是否正在流式输出
        if self._streaming_session_id is not None:
            ToastNotification(self._root, "⚠️ 请等待当前回复完成")
            return
        self._error_label.configure(text="")
        self._sending_label.configure(text="正在重新生成…")
        self._send_btn.configure(state="disabled")
        self._streaming_session_id = sid
        self._app.regenerate_response(
            sid,
            self._stream_queue,
            on_done=self._on_stream_done,
            on_error=self._on_stream_error,
        )

    def _on_select_session(self, session_id: str) -> None:
        self._app.switch_session(session_id)
        self._refresh_sessions_list()
        self._refresh_chat_area()

    def _on_toggle_session_pinned(self, session_id: str) -> None:
        """切换会话置顶状态。"""
        new_pinned = self._app.toggle_session_pinned(session_id)
        icon = "📌" if new_pinned else "📍"
        status = "已置顶" if new_pinned else "已取消置顶"
        ToastNotification(self._root, f"{icon} {status}")
        self._refresh_sessions_list()

    def _on_toggle_current_session_pinned(self) -> None:
        """切换当前会话的置顶状态（键盘快捷键 Ctrl+P）。"""
        current_session_id = self._app.current_session_id
        if current_session_id:
            self._on_toggle_session_pinned(current_session_id)
        else:
            ToastNotification(self._root, "⚠️ 没有活动会话")

    def _on_copy_last_message(self) -> None:
        """复制最后一条 AI 回复到剪贴板（键盘快捷键 Ctrl+Shift+C）。"""
        sid = self._app.current_session_id()
        if not sid:
            ToastNotification(self._root, "⚠️ 请先选择一个会话")
            return
        messages = self._app.load_messages(sid)
        # 找到最后一条 assistant 消息
        last_assistant_msg = None
        for m in messages:
            if m.role == "assistant":
                last_assistant_msg = m
        if last_assistant_msg:
            self._copy_message(last_assistant_msg.content)
        else:
            ToastNotification(self._root, "⚠️ 没有可复制的 AI 回复")

    def _on_next_session(self, direction: int) -> None:
        """切换到下一个（direction=1）或上一个（direction=-1）会话。"""
        sessions = self._app.load_sessions()
        if not sessions:
            ToastNotification(self._root, "⚠️ 没有会话可切换")
            return
        current = self._app.current_session_id()
        try:
            idx = sessions.index(next(s for s in sessions if s.id == current)) if current else -1
        except StopIteration:
            idx = -1
        new_idx = idx + direction
        if new_idx < 0:
            new_idx = len(sessions) - 1  # 循环到最后
        elif new_idx >= len(sessions):
            new_idx = 0  # 循环到第一个
        self._on_select_session(sessions[new_idx].id)

    def _on_quick_switcher(self, direction: int) -> None:
        """打开快速会话切换对话框（Ctrl+Tab / Ctrl+Shift+Tab）。"""
        sessions = self._app.load_sessions()
        if not sessions:
            ToastNotification(self._root, "⚠️ 没有会话可切换")
            return

        current = self._app.current_session_id()

        # 找到当前会话的索引
        try:
            current_idx = sessions.index(next(s for s in sessions if s.id == current)) if current else 0
        except StopIteration:
            current_idx = 0

        # 计算初始选中索引
        initial_idx = (current_idx + direction) % len(sessions)

        # 获取消息计数
        message_counts: dict[str, int] = {}
        for session in sessions:
            messages = self._app.load_messages(session.id)
            message_counts[session.id] = len(messages)

        def on_select(session_id: str) -> None:
            self._on_select_session(session_id)

        QuickSwitcherDialog(
            self._root,
            sessions=sessions,
            current_id=current,
            on_select=on_select,
            initial_index=initial_idx,
            message_counts=message_counts,
        )

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

    def _on_templates(self) -> None:
        """打开提示词模板管理对话框。"""
        from src.ui.templates_dialog import open_templates_dialog
        open_templates_dialog(self._root, self._app, self._on_config_changed)

    def _on_config_changed(self) -> None:
        """配置更改后的回调：刷新模型列表、模板列表。"""
        self._model_var.set(self._current_model_display())
        self._model_menu.configure(values=self._model_options())
        self._template_menu.configure(values=self._template_options())

    def _on_export(self) -> None:
        """导出当前会话."""
        sid = self._app.current_session_id()
        if not sid:
            messagebox.showinfo("提示", "请先选择一个会话", parent=self._root)
            return

        # 创建导出对话框
        dialog = ctk.CTkToplevel(self._root)
        dialog.title("导出对话")
        dialog.geometry("300x300")
        dialog.transient(self._root)

        ctk.CTkLabel(dialog, text="选择导出格式：", anchor="w").pack(anchor="w", padx=12, pady=(12, 8))

        format_var = ctk.StringVar(value="md")
        md_radio = ctk.CTkRadioButton(dialog, text="Markdown (.md)", variable=format_var, value="md")
        md_radio.pack(anchor="w", padx=12, pady=4)
        json_radio = ctk.CTkRadioButton(dialog, text="JSON (.json)", variable=format_var, value="json")
        json_radio.pack(anchor="w", padx=12, pady=4)
        pdf_radio = ctk.CTkRadioButton(dialog, text="PDF (.pdf)", variable=format_var, value="pdf")
        pdf_radio.pack(anchor="w", padx=12, pady=4)
        html_radio = ctk.CTkRadioButton(dialog, text="HTML (.html)", variable=format_var, value="html")
        html_radio.pack(anchor="w", padx=12, pady=4)
        docx_radio = ctk.CTkRadioButton(dialog, text="Word (.docx)", variable=format_var, value="docx")
        docx_radio.pack(anchor="w", padx=12, pady=4)

        result: list[tuple[str, str]] = []  # (format, path)

        def do_export() -> None:
            fmt = format_var.get()
            ext_map = {"md": "md", "json": "json", "pdf": "pdf", "html": "html", "docx": "docx"}
            ext = ext_map.get(fmt, "md")
            # 弹出文件保存对话框
            path = filedialog.asksaveasfilename(
                title="保存导出文件",
                defaultextension=f".{ext}",
                filetypes=[(f"{fmt.upper()} Files", f"*.{ext}"), ("All Files", "*.*")],
                parent=self._root,
            )
            if path:
                result.append((fmt, path))
            dialog.destroy()

        def cancel() -> None:
            dialog.destroy()

        btn_frame = ctk.CTkFrame(dialog, fg_color="transparent")
        btn_frame.pack(pady=16)
        ctk.CTkButton(btn_frame, text="导出", width=80, command=do_export).pack(side="left", padx=4)
        ctk.CTkButton(btn_frame, text="取消", width=80, command=cancel).pack(side="left", padx=4)

        dialog.wait_window()

        if result:
            fmt, path = result[0]
            try:
                session = self._app.get_session(sid)
                messages = self._app.load_messages(sid)
                exporter = ChatExporter(session, messages)
                exporter.save(path, fmt)
                messagebox.showinfo("成功", f"已导出到：{path}", parent=self._root)
            except Exception as e:
                messagebox.showerror("错误", f"导出失败：{e}", parent=self._root)

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
        frame.grid_columnconfigure(1, weight=0)
        tb = ctk.CTkTextbox(
            frame, wrap="word", height=self._message_textbox_height(content),
            fg_color="transparent", border_width=0, state="normal"
        )
        tb.grid(row=0, column=0, sticky="ew", padx=12, pady=8)
        self._insert_highlighted_text(tb, "你", content, "user")
        tb.configure(state="disabled")
        # 复制按钮
        copy_btn = ctk.CTkButton(
            frame,
            text="📋",
            width=28,
            height=28,
            fg_color="transparent",
            hover_color=("gray80", "gray28"),
            border_width=0,
            command=lambda c=content: self._copy_message(c)
        )
        copy_btn.grid(row=0, column=1, padx=(4, 8), pady=4)
        _bind_pressed_style(copy_btn)
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
