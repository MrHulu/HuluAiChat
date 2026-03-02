"""主窗口：三区布局、侧边栏、对话区、输入区；通过 AppService 与下层交互。"""
import queue
import os
import sys
from typing import Callable
from datetime import datetime, timedelta
from tkinter import filedialog
from tkinter import messagebox, PhotoImage, Menu

import customtkinter as ctk

from src.app.service import AppService
from src.app.exporter import ChatExporter
from src.chat import TextChunk, DoneChunk, ChatError, is_error
from src.persistence import Session, Message

# v2.0.0: 设计系统
try:
    from src.ui.design_system import (
        Colors, Spacing, Radius, FontSize, FontWeight,
        Button, Input, Card, Message as MessageSpec,
    )
    _HAS_DESIGN_SYSTEM = True
except ImportError:
    _HAS_DESIGN_SYSTEM = False

try:
    from src.ui.statistics_dialog import open_statistics_dialog, open_global_statistics_dialog
    _HAS_STATISTICS = True
except ImportError:
    _HAS_STATISTICS = False

try:
    from ctk_markdown import CTkMarkdown
    _USE_MARKDOWN = True
except ImportError:
    CTkMarkdown = None  # type: ignore[misc, assignment]
    _USE_MARKDOWN = False

# v1.4.0: Enhanced Markdown with code block copy buttons
try:
    from src.ui.enhanced_markdown import EnhancedMarkdown, create_enhanced_markdown
    _HAS_ENHANCED_MARKDOWN = True
except ImportError:
    _HAS_ENHANCED_MARKDOWN = False

# v2.3.0: 快捷操作栏
try:
    from src.ui.quick_action_bar import QuickActionBar
    _HAS_QUICK_ACTION_BAR = True
except ImportError:
    _HAS_QUICK_ACTION_BAR = False

# v2.4.0: 搜索结果面板
try:
    from src.ui.search_results_panel import SearchResultsPanel
    _HAS_SEARCH_RESULTS_PANEL = True
except ImportError:
    _HAS_SEARCH_RESULTS_PANEL = False

SIDEBAR_WIDTH = 220
SIDEBAR_COLLAPSED = 40  # 折叠后仅图标条，尽量收窄
POLL_MS = 50


class ToastNotification:
    """v2.0.0: 浮动提示框，用于显示操作反馈。"""
    def __init__(self, parent: ctk.CTk, message: str, duration_ms: int = 1500) -> None:
        self._parent = parent
        self._duration = duration_ms
        self._widget: ctk.CTkFrame | None = None

        # v2.0.0: 使用设计系统配色
        bg_color = Colors.TOAST_BG if _HAS_DESIGN_SYSTEM else ("gray80", "gray30")
        text_color = Colors.TOAST_TEXT if _HAS_DESIGN_SYSTEM else ("gray15", "gray88")
        border_color = Colors.TOAST_BORDER if _HAS_DESIGN_SYSTEM else ("gray70", "gray40")
        radius = Radius.MD if _HAS_DESIGN_SYSTEM else 8

        # 创建半透明背景的提示框
        self._widget = ctk.CTkFrame(
            parent,
            fg_color=bg_color,
            corner_radius=radius,
            border_width=1,
            border_color=border_color
        )
        self._widget.place(relx=0.5, rely=0.85, anchor="center")

        label = ctk.CTkLabel(
            self._widget,
            text=message,
            font=("", FontSize.SM),
            text_color=text_color,
            padx=Spacing.LG,
            pady=Spacing.SM
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

        # v2.0.0: 会话列表 - 使用设计系统
        self._session_list_frame = ctk.CTkScrollableFrame(
            main,
            fg_color=Colors.BG_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray85", "gray22"),
            corner_radius=Radius.MD if _HAS_DESIGN_SYSTEM else 8,
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

            # v2.0.0: 创建按钮 - 使用设计系统
            btn = ctk.CTkButton(
                self._session_list_frame,
                text=display_text,
                height=40,
                fg_color=Colors.BG_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray75", "gray30") if not is_current else Colors.SELECTED_BG if _HAS_DESIGN_SYSTEM else ("gray60", "gray45"),
                hover_color=Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray70", "gray28"),
                text_color=Colors.TEXT_PRIMARY if _HAS_DESIGN_SYSTEM else ("gray15", "gray88"),
                anchor="w",
                corner_radius=Radius.SM if _HAS_DESIGN_SYSTEM else 0,
                command=lambda sid=session.id: self._select_session(sid),
            )
            btn.pack(fill="x", padx=8, pady=4)

            # v2.7.0: 绑定双击事件编辑标题
            btn.bind("<Double-Button-1>", lambda e, sid=session.id, title=session.title: self._rename_session(sid, title))
            # v2.7.0: 绑定右键菜单
            btn.bind("<Button-3>", lambda e, sid=session.id, title=session.title: self._show_session_context_menu(e, sid, title))
            # macOS 右键支持
            btn.bind("<Button-2>", lambda e, sid=session.id, title=session.title: self._show_session_context_menu(e, sid, title))

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
                        fg_color=Colors.SELECTED_BG if _HAS_DESIGN_SYSTEM else ("gray50", "gray40"),
                        border_width=2,
                        border_color=Colors.BORDER_DEFAULT if _HAS_DESIGN_SYSTEM else ("gray40", "gray35"),
                    )
                elif is_current:
                    btn.configure(
                        fg_color=Colors.SELECTED_BG if _HAS_DESIGN_SYSTEM else ("gray60", "gray45"),
                        border_width=0,
                    )
                else:
                    btn.configure(
                        fg_color=Colors.BTN_DEFAULT if _HAS_DESIGN_SYSTEM else ("gray75", "gray30"),
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


class GoToMessageDialog:
    """跳转到指定消息的对话框 - 支持按消息编号快速定位。"""
    def __init__(
        self,
        parent: ctk.CTk,
        total_messages: int,
        on_jump: Callable[[int], None],
    ) -> None:
        """
        Args:
            parent: 父窗口
            total_messages: 会话中消息总数
            on_jump: 跳转回调，接收消息索引（从 0 开始）
        """
        self._parent = parent
        self._total_messages = total_messages
        self._on_jump = on_jump
        self._widget: ctk.CTkToplevel | None = None
        self._entry_var: ctk.StringVar | None = None

        self._create_dialog()

    def _create_dialog(self) -> None:
        """创建对话框。"""
        self._widget = ctk.CTkToplevel(self._parent)
        self._widget.title("跳转到消息")
        self._widget.geometry("400x200")
        self._widget.transient(self._parent)
        self._widget.grab_set()
        self._widget.resizable(False, False)

        # 居中显示
        self._widget.update_idletasks()
        parent_x = self._parent.winfo_x()
        parent_y = self._parent.winfo_y()
        parent_w = self._parent.winfo_width()
        parent_h = self._parent.winfo_height()
        dlg_w = 400
        dlg_h = 200
        self._widget.geometry(f"{dlg_w}x{dlg_h}+{parent_x + (parent_w - dlg_w) // 2}+{parent_y + (parent_h - dlg_h) // 2}")

        # 主框架
        main = ctk.CTkFrame(self._widget, fg_color="transparent")
        main.pack(fill="both", expand=True, padx=24, pady=24)
        main.grid_columnconfigure(0, weight=1)

        # 标题
        title = ctk.CTkLabel(
            main,
            text="📍 跳转到消息",
            font=("", 16, "bold"),
            text_color=Colors.TEXT_PRIMARY if _HAS_DESIGN_SYSTEM else ("gray15", "gray88")
        )
        title.grid(row=0, column=0, pady=(0, 8))

        # 提示信息
        hint = ctk.CTkLabel(
            main,
            text=f"输入消息编号 (1 - {self._total_messages})",
            text_color=Colors.TEXT_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray40", "gray60")
        )
        hint.grid(row=1, column=0, pady=(0, 16))

        # 输入框
        self._entry_var = ctk.StringVar()
        entry = ctk.CTkEntry(
            main,
            textvariable=self._entry_var,
            placeholder_text=f"消息编号 (1-{self._total_messages})",
            height=40,
        )
        entry.grid(row=2, column=0, pady=(0, 16))
        entry.focus_set()
        entry.bind("<Return>", lambda e: self._jump())
        entry.bind("<Escape>", lambda e: self._close())

        # 按钮区域
        btn_frame = ctk.CTkFrame(main, fg_color="transparent")
        btn_frame.grid(row=3, column=0)
        btn_frame.grid_columnconfigure(0, weight=1)
        btn_frame.grid_columnconfigure(1, weight=1)

        ctk.CTkButton(
            btn_frame,
            text="跳转",
            width=100,
            height=36,
            command=self._jump,
        ).grid(row=0, column=0, padx=(0, 8))

        ctk.CTkButton(
            btn_frame,
            text="取消",
            width=100,
            height=36,
            fg_color=Colors.BTN_DEFAULT if _HAS_DESIGN_SYSTEM else ("gray70", "gray35"),
            hover_color=Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray60", "gray30"),
            command=self._close,
        ).grid(row=0, column=1, padx=(8, 0))

        # 绑定 ESC 关闭
        self._widget.bind("<Escape>", lambda e: self._close())

    def _jump(self) -> None:
        """执行跳转。"""
        if not self._entry_var:
            return
        try:
            msg_num = int(self._entry_var.get().strip())
            if 1 <= msg_num <= self._total_messages:
                # 转换为 0-based 索引
                self._on_jump(msg_num - 1)
                self._close()
            else:
                # 显示错误提示（短暂闪烁输入框边框）
                self._entry_var.set("")
        except ValueError:
            self._entry_var.set("")

    def _close(self) -> None:
        """关闭对话框。"""
        if self._widget and self._widget.winfo_exists():
            self._widget.destroy()
            self._widget = None


class DatePickerDialog:
    """简单的日期选择对话框，用于选择日期范围。"""
    def __init__(
        self,
        parent: ctk.CTk,
        title: str,
        on_select: Callable[[str | None], None],
        initial_date: str | None = None,
    ) -> None:
        """初始化日期选择器。

        Args:
            parent: 父窗口
            title: 对话框标题
            on_select: 选择回调，接收 ISO 格式日期字符串或 None (取消)
            initial_date: 初始日期 (ISO 格式)
        """
        self._parent = parent
        self._title = title
        self._on_select = on_select
        self._widget: ctk.CTkToplevel | None = None
        self._selected_date: str | None = initial_date

        # 解析初始日期
        if initial_date:
            try:
                dt = datetime.fromisoformat(initial_date.replace("Z", "+00:00"))
                self._year = dt.year
                self._month = dt.month
                self._day = dt.day
            except Exception:
                today = datetime.now()
                self._year = today.year
                self._month = today.month
                self._day = today.day
        else:
            today = datetime.now()
            self._year = today.year
            self._month = today.month
            self._day = today.day

        self._build()

    def _build(self) -> None:
        """构建日期选择器 UI。"""
        self._widget = ctk.CTkToplevel(self._parent)
        self._widget.title(self._title)
        self._widget.transient(self._parent)
        self._widget.grab_set()
        self._widget.resizable(False, False)

        # 居中显示
        parent_x = self._parent.winfo_x()
        parent_y = self._parent.winfo_y()
        parent_w = self._parent.winfo_width()
        parent_h = self._parent.winfo_height()
        dlg_w, dlg_h = 320, 400
        self._widget.geometry(f"{dlg_w}x{dlg_h}+{parent_x + (parent_w - dlg_w) // 2}+{parent_y + (parent_h - dlg_h) // 2}")

        # 主框架
        main = ctk.CTkFrame(self._widget, fg_color="transparent")
        main.pack(fill="both", expand=True, padx=16, pady=16)
        main.grid_columnconfigure(0, weight=1)

        # 年月选择行
        row = 0
        header = ctk.CTkFrame(main, fg_color="transparent")
        header.grid(row=row, column=0, sticky="ew", pady=(0, 12))
        header.grid_columnconfigure(1, weight=1)

        self._prev_month_btn = ctk.CTkButton(
            header, text="<", width=40, height=32,
            command=self._prev_month
        )
        self._prev_month_btn.grid(row=0, column=0)

        self._year_month_var = ctk.StringVar()
        self._year_month_label = ctk.CTkLabel(
            header, textvariable=self._year_month_var,
            font=("", 14, "bold")
        )
        self._year_month_label.grid(row=0, column=1)

        self._next_month_btn = ctk.CTkButton(
            header, text=">", width=40, height=32,
            command=self._next_month
        )
        self._next_month_btn.grid(row=0, column=2)

        # 星期标题
        row += 1
        weekdays = ["一", "二", "三", "四", "五", "六", "日"]
        weekday_frame = ctk.CTkFrame(main, fg_color="transparent")
        weekday_frame.grid(row=row, column=0, sticky="ew", pady=(0, 8))
        for i, wd in enumerate(weekdays):
            lbl = ctk.CTkLabel(
                weekday_frame, text=wd,
                width=40, height=32,
                font=("", 11),
                text_color=Colors.TEXT_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray50", "gray65")
            )
            lbl.grid(row=0, column=i)

        # 日期网格
        row += 1
        self._date_frame = ctk.CTkFrame(main, fg_color="transparent")
        self._date_frame.grid(row=row, column=0, sticky="nsew", pady=(0, 12))
        self._day_buttons: list[ctk.CTkButton] = []

        # 按钮区域
        row += 1
        btn_frame = ctk.CTkFrame(main, fg_color="transparent")
        btn_frame.grid(row=row, column=0, sticky="ew")
        btn_frame.grid_columnconfigure(0, weight=1)
        btn_frame.grid_columnconfigure(1, weight=1)

        ctk.CTkButton(
            btn_frame, text="清除", width=100, height=36,
            fg_color=Colors.BTN_DEFAULT if _HAS_DESIGN_SYSTEM else ("gray70", "gray35"),
            hover_color=Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray60", "gray30"),
            command=self._clear
        ).grid(row=0, column=0, padx=(0, 8))

        ctk.CTkButton(
            btn_frame, text="今天", width=100, height=36,
            command=self._select_today
        ).grid(row=0, column=1, padx=(8, 0))

        self._update_calendar()
        self._widget.bind("<Escape>", lambda e: self._close())

    def _update_calendar(self) -> None:
        """更新日历显示。"""
        # 更新年月标签
        self._year_month_var.set(f"{self._year}年 {self._month}月")

        # 清除旧按钮
        for btn in self._day_buttons:
            btn.destroy()
        self._day_buttons.clear()

        # 计算日历
        first_day = datetime(self._year, self._month, 1)
        # 中国习惯: 周一为第一天 (0=周一, 6=周日)
        # weekday(): 0=周一, 6=周日
        first_weekday = first_day.weekday()

        # 本月天数
        if self._month == 12:
            next_month = datetime(self._year + 1, 1, 1)
        else:
            next_month = datetime(self._year, self._month + 1, 1)
        days_in_month = (next_month - timedelta(days=1)).day

        # 创建日期按钮
        day = 1
        for week in range(6):  # 最多6行
            if day > days_in_month:
                break
            for wd in range(7):  # 7列
                if week == 0 and wd < first_weekday:
                    # 空白格
                    lbl = ctk.CTkLabel(
                        self._date_frame, text="",
                        width=40, height=32
                    )
                    lbl.grid(row=week, column=wd)
                elif day <= days_in_month:
                    # 日期按钮
                    is_selected = (day == self._day and
                                   self._month == datetime.fromisoformat(
                                       self._selected_date.replace("Z", "+00:00")
                                   ).month if self._selected_date else False)
                    is_today = (day == datetime.now().day and
                                self._month == datetime.now().month and
                                self._year == datetime.now().year)

                    btn = ctk.CTkButton(
                        self._date_frame,
                        text=str(day),
                        width=40, height=32,
                        fg_color=Colors.SELECTED_BG if _HAS_DESIGN_SYSTEM else ("gray65", "gray30") if is_selected else Colors.BTN_DEFAULT if _HAS_DESIGN_SYSTEM else ("gray85", "gray25"),
                        hover_color=Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray55", "gray28"),
                        text_color=Colors.TEXT_PRIMARY if _HAS_DESIGN_SYSTEM else ("gray15", "gray88"),
                        command=lambda d=day: self._select_day(d)
                    )
                    btn.grid(row=week, column=wd, padx=1, pady=1)
                    self._day_buttons.append(btn)
                    day += 1
                else:
                    # 空白格
                    lbl = ctk.CTkLabel(
                        self._date_frame, text="",
                        width=40, height=32
                    )
                    lbl.grid(row=week, column=wd)

    def _prev_month(self) -> None:
        """上一月。"""
        if self._month == 1:
            self._month = 12
            self._year -= 1
        else:
            self._month -= 1
        self._update_calendar()

    def _next_month(self) -> None:
        """下一月。"""
        if self._month == 12:
            self._month = 1
            self._year += 1
        else:
            self._month += 1
        self._update_calendar()

    def _select_day(self, day: int) -> None:
        """选择日期。"""
        self._day = day
        date_str = datetime(self._year, self._month, self._day).isoformat()
        self._on_select(date_str)
        self._close()

    def _select_today(self) -> None:
        """选择今天。"""
        today = datetime.now()
        date_str = datetime(today.year, today.month, today.day).isoformat()
        self._on_select(date_str)
        self._close()

    def _clear(self) -> None:
        """清除日期选择。"""
        self._on_select(None)
        self._close()

    def _close(self) -> None:
        """关闭对话框。"""
        if self._widget and self._widget.winfo_exists():
            self._widget.destroy()
            self._widget = None


# v2.0.0: 侧边栏图标按钮：透明、仅图标，悬浮(hover_color)/按压(绑定临时色) 三态
def _bind_pressed_style(btn: ctk.CTkButton) -> None:
    def on_press(_e: object) -> None:
        btn.configure(fg_color=Colors.HOVER_MEDIUM if _HAS_DESIGN_SYSTEM else ("gray72", "gray32"))
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
        # v1.4.8: 高级搜索选项
        self._search_case_sensitive: bool = False  # 区分大小写
        self._search_whole_word: bool = False  # 全词匹配
        self._search_regex: bool = False  # 正则表达式 (v1.4.9)
        self._starred_only: bool = False  # v2.2.0: 仅显示收藏消息
        self._archived_only: bool = False  # v2.5.0: 仅显示归档会话
        self._show_archived_only: bool = False  # v2.5.0: 会话列表归档过滤
        # 最近搜索下拉框
        self._search_dropdown: ctk.CTkFrame | None = None  # 下拉框容器
        self._search_dropdown_open: bool = False  # 下拉框是否打开
        self._search_debounce_job: str | None = None  # 防抖任务ID
        # 日期范围过滤
        self._search_start_date: str | None = None  # 起始日期 (ISO 格式)
        self._search_end_date: str | None = None  # 结束日期 (ISO 格式)
        # v2.8.0: 分页状态
        self._pagination_enabled: bool = True  # 是否启用分页
        self._pagination_page_size: int = 50  # 每页消息数
        self._pagination_current_page: int = 0  # 当前页码（从0开始）
        self._pagination_total_count: int = 0  # 总消息数
        self._pagination_controls: ctk.CTkFrame | None = None  # 分页控件容器
        self._quoted_message: tuple[str, str] | None = None  # (message_id, content) 正在引用的消息
        # 消息选择模式 (v1.2.5)
        self._selection_mode: bool = False  # 是否处于选择模式
        self._selected_messages: set[str] = set()  # 已选择的消息 ID 集合
        self._message_checkboxes: dict[str, ctk.BooleanVar] = {}  # 消息复选框变量
        self._last_clicked_message_id: str | None = None  # 上次点击的消息 ID (v1.2.7 Shift+Click)
        self._shift_pressed_on_click: bool = False  # 点击时 Shift 键状态 (v1.2.7)

        ctk.set_appearance_mode(self._app.config().theme)

        # v1.4.5: 初始化代码块主题（从配置加载）
        if _HAS_ENHANCED_MARKDOWN:
            from src.ui.enhanced_markdown import CodeBlockFrame, set_theme_save_callback, set_font_size_save_callback
            saved_theme = self._app.get_code_block_theme()
            CodeBlockFrame.set_shared_theme(saved_theme)
            # 设置主题保存回调
            set_theme_save_callback(self._app.set_code_block_theme)
            # v1.4.6: 初始化代码块字号（从配置加载）
            saved_font_size = self._app.get_code_block_font_size()
            CodeBlockFrame.set_shared_font_size(saved_font_size)
            # 设置字号保存回调
            set_font_size_save_callback(self._app.set_code_block_font_size)

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

        # 主网格：侧边栏 | 主区 | 搜索结果面板（column 0 的 minsize 在 _refresh_sidebar_width 中按展开/收起设置）
        # v2.4.0: 添加第3列支持搜索结果面板
        self._root.grid_columnconfigure(0, weight=0)
        self._root.grid_columnconfigure(1, weight=1)
        self._root.grid_columnconfigure(2, weight=0)  # 搜索结果面板
        self._root.grid_rowconfigure(0, weight=1)

        # v2.0.0: 侧边栏 - 使用设计系统
        sidebar_bg = Colors.BG_SECONDARY if _HAS_DESIGN_SYSTEM else ("gray90", "gray17")
        sidebar_text = Colors.TEXT_PRIMARY if _HAS_DESIGN_SYSTEM else ("gray15", "gray88")
        sidebar_hover = Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray80", "gray28")

        self._sidebar = ctk.CTkFrame(self._root, width=SIDEBAR_WIDTH, corner_radius=0, fg_color=sidebar_bg)
        self._sidebar.grid(row=0, column=0, sticky="nsew")
        self._sidebar.grid_rowconfigure(1, weight=1)
        self._sidebar_expanded = self._app.config().sidebar_expanded

        # 侧边栏按钮文字/图标需与背景有对比（明/暗主题）
        _sidebar_btn_text = sidebar_text
        # 新对话：展开时带文字，折叠时仅图标；透明 + 悬浮/按压样式
        self._sidebar_btn_new = ctk.CTkButton(
            self._sidebar,
            text="新对话",
            command=self._on_new_chat,
            fg_color="transparent",
            hover_color=sidebar_hover,
            border_width=0,
            text_color=_sidebar_btn_text,
        )
        sidebar_pad = Spacing.MD if _HAS_DESIGN_SYSTEM else 12
        self._sidebar_btn_new.grid(row=0, column=0, padx=sidebar_pad, pady=sidebar_pad, sticky="ew")
        # 折叠/展开：仅图标，透明
        self._sidebar_toggle = ctk.CTkButton(
            self._sidebar,
            text="◀" if self._sidebar_expanded else "▶",
            command=self._toggle_sidebar,
            fg_color="transparent",
            hover_color=sidebar_hover,
            border_width=0,
            width=32,
            height=32,
            text_color=_sidebar_btn_text,
        )
        self._sidebar_toggle.grid(row=0, column=1, padx=2, pady=sidebar_pad)
        _bind_pressed_style(self._sidebar_btn_new)
        _bind_pressed_style(self._sidebar_toggle)
        self._session_list_frame = ctk.CTkScrollableFrame(self._sidebar, fg_color="transparent")
        session_padx = Spacing.SM if _HAS_DESIGN_SYSTEM else 8
        session_pady = 4 if _HAS_DESIGN_SYSTEM else 4
        self._session_list_frame.grid(row=1, column=0, columnspan=2, sticky="nsew", padx=session_padx, pady=session_pady)
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

        # v2.0.0: 搜索框 - 使用设计系统
        self._search_var = ctk.StringVar()
        search_height = Input.HEIGHT if _HAS_DESIGN_SYSTEM else 32
        self._search_entry = ctk.CTkEntry(
            top,
            placeholder_text="🔍 搜索... (Ctrl+K)",
            width=200,
            textvariable=self._search_var,
            height=search_height,
            border_width=1 if _HAS_DESIGN_SYSTEM else 0,
            border_color=Colors.BORDER_SUBTLE if _HAS_DESIGN_SYSTEM else ("gray70", "gray40"),
            corner_radius=Input.RADIUS if _HAS_DESIGN_SYSTEM else 0,
        )
        self._search_entry.grid(row=0, column=0, sticky="w")
        self._search_entry.bind("<KeyRelease>", self._on_search_input)
        self._search_entry.bind("<Escape>", lambda e: self._clear_search())
        self._search_entry.bind("<FocusIn>", lambda e: self._show_search_dropdown())
        self._search_entry.bind("<FocusOut>", self._on_search_focus_out)
        self._search_entry.bind("<Return>", self._on_search_enter)
        # v2.0.0: 全局搜索切换按钮
        self._search_global_btn = ctk.CTkButton(
            top,
            text="本会话",
            width=70,
            height=search_height,
            command=self._toggle_search_scope,
            fg_color=Colors.BG_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray75", "gray30"),
            hover_color=Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray70", "gray28"),
            text_color=Colors.TEXT_PRIMARY if _HAS_DESIGN_SYSTEM else ("gray15", "gray88"),
            corner_radius=Button.GHOST_RADIUS if _HAS_DESIGN_SYSTEM else 0,
        )
        self._search_global_btn.grid(row=0, column=1, padx=(4, 0))

        # v2.0.0: 日期范围过滤按钮
        self._date_filter_btn = ctk.CTkButton(
            top,
            text="📅",
            width=36,
            height=search_height,
            command=self._toggle_date_filter,
            fg_color="transparent",
            hover_color=Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray80", "gray28"),
            text_color=Colors.TEXT_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray40", "gray60")
        )
        self._date_filter_btn.grid(row=0, column=2, padx=(4, 0))

        # v2.2.0: 星标过滤按钮
        self._starred_only_var = ctk.BooleanVar(value=False)
        self._starred_filter_btn = ctk.CTkButton(
            top,
            text="⭐",
            width=36,
            height=search_height,
            command=self._toggle_starred_filter,
            fg_color="transparent",
            hover_color=Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray80", "gray28"),
            text_color=Colors.TEXT_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray40", "gray60")
        )
        self._starred_filter_btn.grid(row=0, column=3, padx=(4, 0))

        # v2.5.0: 归档过滤按钮
        self._archived_only_var = ctk.BooleanVar(value=False)
        self._archived_filter_btn = ctk.CTkButton(
            top,
            text="📂",
            width=36,
            height=search_height,
            command=self._toggle_archived_filter,
            fg_color="transparent",
            hover_color=Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray80", "gray28"),
            text_color=Colors.TEXT_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray40", "gray60")
        )
        self._archived_filter_btn.grid(row=0, column=4, padx=(4, 0))

        # v2.4.0: 搜索结果面板按钮
        if _HAS_SEARCH_RESULTS_PANEL:
            self._search_panel_btn = ctk.CTkButton(
                top,
                text="📋",
                width=36,
                height=search_height,
                command=self._toggle_search_results_panel,
                fg_color="transparent",
                hover_color=Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray80", "gray28"),
                text_color=Colors.TEXT_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray40", "gray60")
            )
            self._search_panel_btn.grid(row=0, column=5, padx=(4, 0))
            # 更新后续按钮的列位置
            search_options_column = 6
        else:
            search_options_column = 5

        # v1.4.8: 高级搜索选项容器
        search_options_frame = ctk.CTkFrame(top, fg_color="transparent")
        search_options_frame.grid(row=0, column=search_options_column, padx=(4, 0))

        # v2.0.0: 区分大小写切换 (Aa)
        self._case_sensitive_var = ctk.BooleanVar(value=False)
        self._case_sensitive_btn = ctk.CTkButton(
            search_options_frame,
            text="Aa",
            width=28,
            height=search_height,
            command=self._toggle_case_sensitive,
            fg_color="transparent",
            hover_color=Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray80", "gray28"),
            text_color=Colors.TEXT_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray40", "gray60"),
            font=("", FontSize.XS, "bold")
        )
        self._case_sensitive_btn.pack(side="left", padx=(0, 2))

        # v2.0.0: 全词匹配切换 (W)
        self._whole_word_var = ctk.BooleanVar(value=False)
        self._whole_word_btn = ctk.CTkButton(
            search_options_frame,
            text="W",
            width=28,
            height=search_height,
            command=self._toggle_whole_word,
            fg_color="transparent",
            hover_color=Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray80", "gray28"),
            text_color=Colors.TEXT_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray40", "gray60"),
            font=("", FontSize.XS, "bold")
        )
        self._whole_word_btn.pack(side="left", padx=(0, 2))

        # v2.0.0: 正则表达式切换 (.*)
        self._regex_btn = ctk.CTkButton(
            search_options_frame,
            text=".*",
            width=28,
            height=search_height,
            command=self._toggle_regex,
            fg_color="transparent",
            hover_color=Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray80", "gray28"),
            text_color=Colors.TEXT_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray40", "gray60"),
            font=("", FontSize.XS, "bold")
        )
        self._regex_btn.pack(side="left")

        # v2.0.0: 搜索结果计数器
        self._search_counter_var = ctk.StringVar()
        self._search_counter = ctk.CTkLabel(
            top,
            textvariable=self._search_counter_var,
            width=50,
            font=("", FontSize.SM),
            text_color=Colors.TEXT_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray50", "gray65"),
            anchor="e"
        )
        self._search_counter.grid(row=0, column=4, padx=(4, 8))
        self._search_counter.grid_remove()  # 初始隐藏

        self._model_var = ctk.StringVar(value=self._current_model_display())
        self._model_menu = ctk.CTkOptionMenu(
            top, variable=self._model_var, values=self._model_options(), width=180, command=self._on_model_change
        )
        self._model_menu.grid(row=0, column=4, padx=8)
        ctk.CTkButton(top, text="模板", width=70, command=self._on_templates).grid(row=0, column=5, padx=4)
        ctk.CTkButton(top, text="导出", width=70, command=self._on_export).grid(row=0, column=6, padx=4)
        # v1.3.2: Statistics button
        if _HAS_STATISTICS:
            ctk.CTkButton(top, text="统计", width=70, command=self._on_show_statistics).grid(row=0, column=7, padx=4)
        ctk.CTkButton(top, text="设置", width=70, command=self._on_settings).grid(row=0, column=8, padx=4)
        # 快捷键提示按钮
        ctk.CTkButton(
            top,
            text="⌨️",
            width=36,
            command=self._show_shortcuts_help,
            fg_color="transparent",
            hover_color=Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray80", "gray28"),
            text_color=Colors.TEXT_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray40", "gray60")
        ).grid(row=0, column=9, padx=4)
        # 添加 column 1 的权重，让搜索按钮有足够空间
        top.grid_columnconfigure(1, weight=0)
        top.grid_columnconfigure(2, weight=0)  # 日期按钮固定宽度
        top.grid_columnconfigure(3, weight=0)  # 计数器固定宽度

        # 日期范围过滤面板（初始隐藏）
        self._date_filter_frame = ctk.CTkFrame(
            main,
            fg_color=Colors.HOVER_MEDIUM if _HAS_DESIGN_SYSTEM else ("gray85", "gray28"),
            corner_radius=Radius.MD if _HAS_DESIGN_SYSTEM else 8
        )
        # 初始不显示，有日期过滤时才显示

        self._date_start_var = ctk.StringVar()
        self._date_end_var = ctk.StringVar()

        date_label = ctk.CTkLabel(
            self._date_filter_frame,
            text="📅 日期范围:",
            font=("", FontSize.XS if _HAS_DESIGN_SYSTEM else 11),
            text_color=Colors.TEXT_SECONDARY if _HAS_DESIGN_SYSTEM else ("gray40", "gray70")
        )
        date_label.grid(row=0, column=0, padx=(8, 4), pady=6)

        self._date_start_entry = ctk.CTkEntry(
            self._date_filter_frame,
            placeholder_text="起始 (YYYY-MM-DD)",
            width=140,
            height=32,
            textvariable=self._date_start_var
        )
        self._date_start_entry.grid(row=0, column=1, padx=4, pady=6)

        self._date_start_btn = ctk.CTkButton(
            self._date_filter_frame,
            text="📆",
            width=36,
            height=32,
            command=lambda: self._open_date_picker("start"),
            fg_color=Colors.BTN_DEFAULT if _HAS_DESIGN_SYSTEM else ("gray75", "gray32"),
            hover_color=Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray70", "gray28")
        )
        self._date_start_btn.grid(row=0, column=2, padx=(0, 4), pady=6)

        to_label = ctk.CTkLabel(
            self._date_filter_frame,
            text="至",
            font=("", FontSize.XS if _HAS_DESIGN_SYSTEM else 11),
            text_color=Colors.TEXT_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray50", "gray65")
        )
        to_label.grid(row=0, column=3, padx=4, pady=6)

        self._date_end_entry = ctk.CTkEntry(
            self._date_filter_frame,
            placeholder_text="结束 (YYYY-MM-DD)",
            width=140,
            height=32,
            textvariable=self._date_end_var
        )
        self._date_end_entry.grid(row=0, column=4, padx=4, pady=6)

        self._date_end_btn = ctk.CTkButton(
            self._date_filter_frame,
            text="📆",
            width=36,
            height=32,
            command=lambda: self._open_date_picker("end"),
            fg_color=Colors.BTN_DEFAULT if _HAS_DESIGN_SYSTEM else ("gray75", "gray32"),
            hover_color=Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray70", "gray28")
        )
        self._date_end_btn.grid(row=0, column=5, padx=(0, 4), pady=6)

        self._date_clear_btn = ctk.CTkButton(
            self._date_filter_frame,
            text="清除",
            width=60,
            height=32,
            command=self._clear_date_filter,
            fg_color=Colors.BTN_DEFAULT if _HAS_DESIGN_SYSTEM else ("gray70", "gray30"),
            hover_color=Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray65", "gray28")
        )
        self._date_clear_btn.grid(row=0, column=6, padx=(8, 8), pady=6)

        # 对话区
        self._chat_scroll = ctk.CTkScrollableFrame(main, fg_color="transparent")
        self._chat_scroll.grid(row=2, column=0, sticky="nsew", padx=12, pady=4)
        self._chat_scroll.grid_columnconfigure(0, weight=1)
        self._chat_widgets: list[tuple[str, ctk.CTkFrame]] = []  # (msg_id, frame containing CTkTextbox)

        # 输入区
        input_frame = ctk.CTkFrame(main, fg_color="transparent")
        input_frame.grid(row=3, column=0, sticky="ew", padx=12, pady=8)
        # v2.3.0: 调整行配置，row=0 快捷操作栏, row=1 引用提示条, row=2 输入框
        input_frame.grid_rowconfigure(2, weight=1)
        input_frame.grid_columnconfigure(1, weight=1)

        # v2.3.0: 快捷操作栏（模板快捷访问、星标切换、最近会话）
        if _HAS_QUICK_ACTION_BAR:
            self._quick_action_bar = QuickActionBar(
                input_frame,
                app=self._app,
                on_template_apply=self._apply_template_to_input,
                on_toggle_starred=self._on_toggle_starred_from_quick_bar,
                on_recent_session=self._on_switch_to_session,
            )
            self._quick_action_bar.grid(row=0, column=0, columnspan=4, sticky="ew", pady=(0, Spacing.XS))
        else:
            self._quick_action_bar = None  # type: ignore[assignment]

        # v2.0.0: 引用提示条（初始隐藏）
        self._quote_frame = ctk.CTkFrame(input_frame, fg_color=Colors.BTN_DEFAULT if _HAS_DESIGN_SYSTEM else ("gray75", "gray35"), corner_radius=Radius.SM if _HAS_DESIGN_SYSTEM else 6)
        # 不 grid，有引用时才显示

        self._quote_label = ctk.CTkLabel(
            self._quote_frame,
            text="",
            anchor="w",
            text_color=Colors.TEXT_SECONDARY if _HAS_DESIGN_SYSTEM else ("gray40", "gray70"),
            font=("", FontSize.XS if _HAS_DESIGN_SYSTEM else 10),
            padx=Spacing.MD if _HAS_DESIGN_SYSTEM else 12,
            pady=Spacing.SM if _HAS_DESIGN_SYSTEM else 6,
        )
        self._quote_label.pack(side="left", fill="x", expand=True, padx=(12, 4), pady=6)

        self._quote_cancel_btn = ctk.CTkButton(
            self._quote_frame,
            text="❌",
            width=24,
            height=24,
            fg_color="transparent",
            hover_color=Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray65", "gray30"),
            border_width=0,
            command=self._cancel_quote,
        )
        self._quote_cancel_btn.pack(side="right", padx=(4, 8), pady=6)

        # 模板和选择模式按钮容器
        template_select_frame = ctk.CTkFrame(input_frame, fg_color="transparent")
        template_select_frame.grid(row=2, column=0, padx=(0, 8))

        # 提示词模板快捷按钮
        self._template_var = ctk.StringVar(value="模板")
        self._template_menu = ctk.CTkOptionMenu(
            template_select_frame,
            variable=self._template_var,
            values=self._template_options(),
            width=90,
            command=self._on_template_selected,
        )
        self._template_menu.pack(side="left", padx=(0, 4))

        # v2.0.0: 选择模式切换按钮 (v1.2.5)
        self._selection_mode_btn = ctk.CTkButton(
            template_select_frame,
            text="☐",
            width=36,
            height=36,
            fg_color="transparent",
            hover_color=Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray80", "gray28"),
            border_width=1,
            border_color=Colors.BORDER_DEFAULT if _HAS_DESIGN_SYSTEM else ("gray70", "gray40"),
            command=self._toggle_selection_mode,
        )
        self._selection_mode_btn.pack(side="left")

        self._input = ctk.CTkTextbox(input_frame, height=80, wrap="word")
        self._input.grid(row=2, column=1, sticky="ew", padx=(0, 8))
        self._input.bind("<Return>", self._on_input_return)
        self._input.bind("<Control-Return>", lambda e: None)  # Ctrl+Enter 换行由默认行为处理
        # v1.3.0: Bind KeyRelease to update character counter
        self._input.bind("<KeyRelease>", self._on_input_key_release)

        # v2.0.0: 发送按钮使用品牌色
        self._send_btn = ctk.CTkButton(
            input_frame,
            text="发送",
            width=80,
            command=self._on_send,
            fg_color=Colors.PRIMARY if _HAS_DESIGN_SYSTEM else None,
            hover_color=Colors.PRIMARY_HOVER if _HAS_DESIGN_SYSTEM else None,
            text_color=("white", "white") if _HAS_DESIGN_SYSTEM else None,
            corner_radius=Button.PRIMARY_RADIUS if _HAS_DESIGN_SYSTEM else None,
        )
        self._send_btn.grid(row=2, column=2)

        # v2.0.0: Enhanced loading indicator with animation support
        self._sending_label = ctk.CTkLabel(
            input_frame,
            text="",
            fg_color="transparent",
            font=("", FontSize.SM),
            text_color=Colors.PRIMARY if _HAS_DESIGN_SYSTEM else ("#3b82f6", "#60a5fa")
        )
        self._sending_label.grid(row=2, column=3, padx=8)
        self._loading_anim_step = 0  # v1.3.0: Animation step counter
        self._loading_anim_job = None  # v1.3.0: Animation job handle

        # v2.0.0: Character counter label (positioned at bottom right of input area)
        self._char_count_label = ctk.CTkLabel(
            input_frame,
            text="0 字符",
            font=("", FontSize.XS),
            text_color=Colors.TEXT_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray50", "gray65"),
            anchor="e"
        )
        self._char_count_label.grid(row=3, column=1, sticky="e", padx=(0, 8), pady=(2, 0))

        self._error_label = ctk.CTkLabel(input_frame, text="", text_color=("red", "orange"))
        self._error_label.grid(row=4, column=0, columnspan=4, sticky="w", pady=(4, 0))

        # v2.4.0: 搜索结果面板
        self._search_results_panel: SearchResultsPanel | None = None
        self._search_panel_visible = False
        if _HAS_SEARCH_RESULTS_PANEL:
            self._search_results_panel = SearchResultsPanel(
                self._root,
                app_service=self._app,
                on_message_click=self._on_search_result_click,
                on_close=self._toggle_search_results_panel,
            )
            # 初始隐藏面板
            # self._search_results_panel.grid(row=0, column=2, sticky="nsew")  # 取消注释以显示

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
        self._root.bind("<Control-s>", lambda e: self._on_show_statistics())  # Ctrl+S 显示当前会话统计
        self._root.bind("<Control-S>", lambda e: self._on_show_statistics())  # 大写 S 兼容
        self._root.bind("<Control-Alt-s>", lambda e: self._on_show_global_statistics())  # Ctrl+Alt+S 显示全局统计
        self._root.bind("<Control-Alt-S>", lambda e: self._on_show_global_statistics())  # 大写 S 兼容
        self._root.bind("<Control-p>", lambda e: self._on_toggle_current_session_pinned())  # Ctrl+P 切换置顶
        self._root.bind("<Control-P>", lambda e: self._on_toggle_current_session_pinned())  # 大写 P 兼容
        # v2.5.0: Ctrl+Shift+A 切换归档
        self._root.bind("<Control-A>", lambda e: self._on_toggle_current_session_archived())  # Ctrl+A 切换归档
        self._root.bind("<Control-F>", lambda e: self._on_manage_folders())  # Ctrl+Shift+F 管理文件夹
        self._root.bind("<Control-C>", lambda e: self._on_copy_last_message())  # Ctrl+Shift+C 复制最后一条 AI 回复
        self._root.bind("<Control-Up>", lambda e: self._on_next_session(-1))  # Ctrl+Up 上一个会话
        self._root.bind("<Control-Down>", lambda e: self._on_next_session(1))  # Ctrl+Down 下一个会话
        # 搜索结果导航
        self._root.bind("<F3>", lambda e: self._next_search_match())
        self._root.bind("<Shift-F3>", lambda e: self._prev_search_match())
        # v2.4.0: 搜索结果面板 Ctrl+Shift+H
        if _HAS_SEARCH_RESULTS_PANEL:
            self._root.bind("<Control-H>", lambda e: self._toggle_search_results_panel())
        # 快速会话切换 Ctrl+Tab / Ctrl+Shift+Tab
        self._root.bind("<Control-Tab>", lambda e: self._on_quick_switcher(1))  # Ctrl+Tab 下一个
        self._root.bind("<Control-ISO_Left_Tab>", lambda e: self._on_quick_switcher(-1))  # Ctrl+Shift+Tab 上一个
        # 消息导航 Ctrl+Home / Ctrl+End / Ctrl+G / Alt+Up / Alt+Down
        self._root.bind("<Control-Home>", lambda e: self._scroll_to_first_message())  # Ctrl+Home 跳转到首条消息
        self._root.bind("<Control-End>", lambda e: self._scroll_to_last_message())  # Ctrl+End 跳转到末条消息
        self._root.bind("<Control-g>", lambda e: self._on_go_to_message())  # Ctrl+G 跳转到指定消息
        self._root.bind("<Control-G>", lambda e: self._on_go_to_message())  # 大写 G 兼容
        self._root.bind("<Alt-Up>", lambda e: self._on_prev_message())  # Alt+Up 上一条消息
        self._root.bind("<Alt-Down>", lambda e: self._on_next_message())  # Alt+Down 下一条消息
        # 消息选择快捷键
        self._root.bind("<Control-a>", lambda e: self._on_select_all())  # Ctrl+A 全选
        self._root.bind("<Control-A>", lambda e: self._on_select_all())  # 大写 A 兼容
        self._root.bind("<Escape>", lambda e: self._on_escape_key())  # ESC 退出选择模式或清除搜索

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

    # ========== v2.3.0: 快捷操作栏回调 ==========

    def _apply_template_to_input(self, content: str) -> None:
        """快捷操作栏：应用模板到输入框。"""
        # 获取当前选中的文本（如果有）
        current_text = self._input.get("1.0", "end").strip()
        # 替换模板中的 {selection} 占位符
        content = content.replace("{selection}", current_text if current_text else "")
        # 替换其他变量
        content = content.replace("{date}", datetime.now().strftime("%Y-%m-%d"))
        content = content.replace("{time}", datetime.now().strftime("%H:%M"))
        content = content.replace("{datetime}", datetime.now().strftime("%Y-%m-%d %H:%M"))
        # 插入内容
        self._input.delete("1.0", "end")
        self._input.insert("1.0", content)
        self._input.focus_set()

    def _on_toggle_starred_from_quick_bar(self) -> None:
        """快捷操作栏：切换星标视图。"""
        self._toggle_starred_filter()
        # 同步快捷操作栏的状态
        if self._quick_action_bar:
            self._quick_action_bar.set_show_starred_only(self._starred_only)

    def _on_switch_to_session(self, session_id: str) -> None:
        """快捷操作栏：切换到指定会话。"""
        session = self._app.get_session(session_id)
        if session:
            self._current_session_id = session_id
            self._refresh_sessions_list()
            self._refresh_chat_area()

    # ========== v2.3.0: 快捷操作栏回调结束 ==========

    def _on_search_input(self, event) -> None:
        """搜索输入框内容变化时触发。"""
        query = self._search_var.get().strip()
        if query != self._search_query:
            self._search_query = query
            self._refresh_chat_area()

        # v2.4.0: 同时更新搜索结果面板
        if _HAS_SEARCH_RESULTS_PANEL and self._search_results_panel:
            self._update_search_results_panel()

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

        # v2.4.0: 清除搜索结果面板
        if _HAS_SEARCH_RESULTS_PANEL and self._search_results_panel:
            self._search_results_panel.clear()

    # ========== v2.8.0: 分页控件方法 ==========

    def _add_pagination_controls(self) -> None:
        """添加分页控件到聊天区域底部。"""
        if self._pagination_controls:
            return  # 已存在

        # 计算页码信息
        total_pages = (self._pagination_total_count + self._pagination_page_size - 1) // self._pagination_page_size
        current_page_num = self._pagination_current_page + 1
        start_idx = self._pagination_current_page * self._pagination_page_size + 1
        end_idx = min(start_idx + self._pagination_page_size - 1, self._pagination_total_count)

        # 分页控件容器
        bg_color = Colors.BG_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray85", "gray22")
        self._pagination_controls = ctk.CTkFrame(
            self._chat_scroll,
            fg_color=bg_color,
            corner_radius=Radius.MD if _HAS_DESIGN_SYSTEM else 8,
        )
        self._pagination_controls.grid(sticky="ew", pady=Spacing.LG if _HAS_DESIGN_SYSTEM else 12,
                                       padx=Spacing.MD if _HAS_DESIGN_SYSTEM else 0)

        # 信息标签
        text_color = Colors.TEXT_SECONDARY if _HAS_DESIGN_SYSTEM else ("gray50", "gray60")
        font_size = FontSize.SM if _HAS_DESIGN_SYSTEM else 12
        info_label = ctk.CTkLabel(
            self._pagination_controls,
            text=f"📄 {start_idx}-{end_idx} / {self._pagination_total_count} 条消息",
            font=("", font_size),
            text_color=text_color,
        )
        info_label.pack(side="left", padx=Spacing.MD if _HAS_DESIGN_SYSTEM else 12, pady=Spacing.SM)

        # 按钮容器
        btn_frame = ctk.CTkFrame(self._pagination_controls, fg_color="transparent")
        btn_frame.pack(side="right", padx=Spacing.MD if _HAS_DESIGN_SYSTEM else 12)

        # 上一页按钮
        prev_btn = ctk.CTkButton(
            btn_frame,
            text="◀ 上一页",
            width=80,
            height=28,
            state="normal" if self._pagination_current_page > 0 else "disabled",
            command=self._pagination_prev_page,
        )
        prev_btn.pack(side="left", padx=Spacing.XS)

        # 下一页按钮
        next_btn = ctk.CTkButton(
            btn_frame,
            text="下一页 ▶",
            width=80,
            height=28,
            state="normal" if self._pagination_current_page < total_pages - 1 else "disabled",
            command=self._pagination_next_page,
        )
        next_btn.pack(side="left", padx=Spacing.XS)

        # 滚动到底部
        self._chat_scroll.after(100, lambda: self._chat_scroll._scrollbar.set(1.0, 1.0))

    def _pagination_prev_page(self) -> None:
        """翻到上一页。"""
        if self._pagination_current_page > 0:
            self._pagination_current_page -= 1
            self._refresh_chat_area()

    def _pagination_next_page(self) -> None:
        """翻到下一页。"""
        total_pages = (self._pagination_total_count + self._pagination_page_size - 1) // self._pagination_page_size
        if self._pagination_current_page < total_pages - 1:
            self._pagination_current_page += 1
            self._refresh_chat_area()

    # ========== v2.4.0: 搜索结果面板方法 ==========

    def _update_search_results_panel(self) -> None:
        """v2.4.0: 更新搜索结果面板。"""
        if not self._search_results_panel:
            return

        query = self._search_var.get().strip()
        if not query:
            self._search_results_panel.clear()
            return

        # 执行搜索
        if self._search_global:
            messages = self._app.search_all_messages(
                query,
                limit=100,
                start_date=self._search_start_date,
                end_date=self._search_end_date,
                case_sensitive=self._search_case_sensitive,
                whole_word=self._search_whole_word,
                regex=self._search_regex,
            )
        else:
            messages = self._app.search_messages(
                self._current_session_id or "",
                query,
                start_date=self._search_start_date,
                end_date=self._search_end_date,
                case_sensitive=self._search_case_sensitive,
                whole_word=self._search_whole_word,
                regex=self._search_regex,
            )

        # 获取涉及的会话
        session_ids = set(msg.session_id for msg in messages)
        sessions = {}
        for sid in session_ids:
            session = self._app.get_session(sid)
            if session:
                sessions[sid] = session

        # 更新面板
        self._search_results_panel.set_results(messages, sessions, query)

    def _toggle_search_results_panel(self) -> None:
        """v2.4.0: 切换搜索结果面板显示。"""
        if not self._search_results_panel:
            return

        self._search_panel_visible = not self._search_panel_visible
        if self._search_panel_visible:
            self._search_results_panel.grid(row=0, column=2, sticky="nsew")
            # 如果有搜索查询，更新面板内容
            if self._search_var.get().strip():
                self._update_search_results_panel()
            # 更新按钮状态
            if _HAS_SEARCH_RESULTS_PANEL and hasattr(self, '_search_panel_btn'):
                self._search_panel_btn.configure(
                    fg_color=Colors.BTN_DEFAULT if _HAS_DESIGN_SYSTEM else ("gray70", "gray35"),
                    text_color=Colors.TEXT_HIGH_CONTRAST if _HAS_DESIGN_SYSTEM else ("gray10", "gray90")
                )
        else:
            self._search_results_panel.grid_forget()
            # 更新按钮状态
            if _HAS_SEARCH_RESULTS_PANEL and hasattr(self, '_search_panel_btn'):
                self._search_panel_btn.configure(
                    fg_color="transparent",
                    text_color=Colors.TEXT_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray40", "gray60")
                )

    def _on_search_result_click(self, session_id: str, message_id: str) -> None:
        """v2.4.0: 点击搜索结果时的回调。

        跳转到指定会话和消息。
        """
        # 切换到目标会话
        if session_id != self._current_session_id:
            session = self._app.get_session(session_id)
            if session:
                self._current_session_id = session_id
                self._refresh_sessions_list()
                self._refresh_chat_area()

        # 滚动到指定消息
        if self._search_global:
            # 全局搜索模式：需要特殊处理，暂时切换到该会话
            self._search_global = False
            self._search_global_btn.configure(text="本会话")
            self._refresh_chat_area()

        # TODO: 添加滚动到特定消息的功能
        # 目前可以先跳转到会话，用户可以手动查找

    # ========== v2.4.0: 搜索结果面板方法结束 ==========

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

    def _toggle_date_filter(self) -> None:
        """切换日期过滤面板的显示。"""
        if self._date_filter_frame.winfo_ismapped():
            self._date_filter_frame.grid_remove()
        else:
            self._date_filter_frame.grid(row=1, column=0, sticky="ew", padx=(12, 12), pady=(0, 8))

    def _toggle_case_sensitive(self) -> None:
        """切换区分大小写搜索 (v1.4.8)。"""
        self._search_case_sensitive = not self._search_case_sensitive
        # v2.0.0: 更新按钮样式
        if self._search_case_sensitive:
            self._case_sensitive_btn.configure(
                fg_color=Colors.BTN_DEFAULT if _HAS_DESIGN_SYSTEM else ("gray70", "gray35"),
                text_color=Colors.TEXT_HIGH_CONTRAST if _HAS_DESIGN_SYSTEM else ("gray10", "gray90")
            )
        else:
            self._case_sensitive_btn.configure(
                fg_color="transparent",
                text_color=Colors.TEXT_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray40", "gray60")
            )
        # 刷新搜索结果
        self._refresh_chat_area()

    def _toggle_whole_word(self) -> None:
        """切换全词匹配搜索 (v1.4.8)。"""
        self._search_whole_word = not self._search_whole_word
        # v2.0.0: 更新按钮样式
        if self._search_whole_word:
            self._whole_word_btn.configure(
                fg_color=Colors.BTN_DEFAULT if _HAS_DESIGN_SYSTEM else ("gray70", "gray35"),
                text_color=Colors.TEXT_HIGH_CONTRAST if _HAS_DESIGN_SYSTEM else ("gray10", "gray90")
            )
        else:
            self._whole_word_btn.configure(
                fg_color="transparent",
                text_color=Colors.TEXT_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray40", "gray60")
            )
        # 刷新搜索结果
        self._refresh_chat_area()

    def _toggle_regex(self) -> None:
        """切换正则表达式搜索 (v1.4.9)。"""
        self._search_regex = not self._search_regex
        # v2.0.0: 更新按钮样式
        if self._search_regex:
            self._regex_btn.configure(
                fg_color=Colors.BTN_DEFAULT if _HAS_DESIGN_SYSTEM else ("gray70", "gray35"),
                text_color=Colors.TEXT_HIGH_CONTRAST if _HAS_DESIGN_SYSTEM else ("gray10", "gray90")
            )
        else:
            self._regex_btn.configure(
                fg_color="transparent",
                text_color=Colors.TEXT_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray40", "gray60")
            )
        # 刷新搜索结果
        self._refresh_chat_area()

    def _toggle_starred_filter(self) -> None:
        """v2.2.0: 切换仅显示收藏消息过滤。"""
        self._starred_only = not self._starred_only
        # 更新按钮样式
        if self._starred_only:
            self._starred_filter_btn.configure(
                fg_color=Colors.BTN_DEFAULT if _HAS_DESIGN_SYSTEM else ("gray70", "gray35"),
                text_color=Colors.TEXT_HIGH_CONTRAST if _HAS_DESIGN_SYSTEM else ("gray10", "gray90")
            )
        else:
            self._starred_filter_btn.configure(
                fg_color="transparent",
                text_color=Colors.TEXT_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray40", "gray60")
            )
        # 刷新聊天区域
        self._refresh_chat_area()

    def _open_date_picker(self, field: str) -> None:
        """打开日期选择器。

        Args:
            field: "start" 或 "end"，指定要设置的字段
        """
        current_date = None
        if field == "start" and self._search_start_date:
            current_date = self._search_start_date
        elif field == "end" and self._search_end_date:
            current_date = self._search_end_date

        title = "选择起始日期" if field == "start" else "选择结束日期"

        def on_select(date_str: str | None) -> None:
            if date_str:
                # 转换为 YYYY-MM-DD 格式显示
                dt = datetime.fromisoformat(date_str)
                display_date = dt.strftime("%Y-%m-%d")
                if field == "start":
                    self._search_start_date = f"{display_date}T00:00:00Z"
                    self._date_start_var.set(display_date)
                else:
                    # 结束日期设为当天的 23:59:59
                    self._search_end_date = f"{display_date}T23:59:59Z"
                    self._date_end_var.set(display_date)
            else:
                if field == "start":
                    self._search_start_date = None
                    self._date_start_var.set("")
                else:
                    self._search_end_date = None
                    self._date_end_var.set("")
            # 刷新搜索结果
            self._refresh_chat_area()

        DatePickerDialog(self._root, title, on_select, current_date)

    def _clear_date_filter(self) -> None:
        """清除日期过滤。"""
        self._search_start_date = None
        self._search_end_date = None
        self._date_start_var.set("")
        self._date_end_var.set("")
        self._refresh_chat_area()
        # 隐藏日期过滤面板
        self._date_filter_frame.grid_remove()

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

        # v2.0.0: 创建下拉框容器
        self._search_dropdown = ctk.CTkFrame(
            self._root,
            fg_color=Colors.DROPDOWN_BG if _HAS_DESIGN_SYSTEM else ("gray95", "gray22"),
            border_width=1,
            border_color=Colors.BORDER_DEFAULT if _HAS_DESIGN_SYSTEM else ("gray70", "gray40"),
            corner_radius=Radius.SM if _HAS_DESIGN_SYSTEM else 6,
        )
        self._search_dropdown.place(x=x, y=y, width=width, anchor="nw")
        self._search_dropdown_open = True

        # 添加最近搜索项
        for i, query in enumerate(recent):
            btn = ctk.CTkButton(
                self._search_dropdown,
                text=f"🕐 {query}",
                fg_color="transparent",
                hover_color=Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray85", "gray30"),
                text_color=Colors.TEXT_PRIMARY if _HAS_DESIGN_SYSTEM else ("gray15", "gray88"),
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
            hover_color=Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray80", "gray28"),
            text_color=Colors.TEXT_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray40", "gray60"),
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

    def _show_message_context_menu(self, event, message_id: str, content: str, role: str, is_pinned: bool, is_starred: bool = False) -> None:
        """显示消息的右键上下文菜单 (v1.5.2)。"""
        # v2.0.0: 创建上下文菜单 - 使用设计系统
        if _HAS_DESIGN_SYSTEM:
            menu_bg = Colors.DROPDOWN_BG[0] if self._appearance == "Light" else Colors.DROPDOWN_BG[1]
            menu_fg = Colors.TEXT_PRIMARY[0] if self._appearance == "Light" else Colors.TEXT_PRIMARY[1]
            menu_active_bg = Colors.HOVER_BG[0] if self._appearance == "Light" else Colors.HOVER_BG[1]
            menu_active_fg = Colors.TEXT_PRIMARY[0] if self._appearance == "Light" else Colors.TEXT_PRIMARY[1]
        else:
            menu_bg = "gray95" if self._appearance == "Light" else "gray25"
            menu_fg = "black" if self._appearance == "Light" else "white"
            menu_active_bg = "gray80" if self._appearance == "Light" else "gray35"
            menu_active_fg = "black" if self._appearance == "Light" else "white"

        context_menu = Menu(self._root, tearoff=0, bg=menu_bg,
                           fg=menu_fg,
                           activebackground=menu_active_bg,
                           activeforeground=menu_active_fg,
                           borderwidth=1, relief="solid",
                           font=("", FontSize.XS if _HAS_DESIGN_SYSTEM else 10))

        # 复制
        context_menu.add_command(label="📋 复制", command=lambda: self._copy_message(content))

        # 引用
        context_menu.add_command(label="💬 引用回复", command=lambda: self._quote_message(message_id, content))

        # 转发
        context_menu.add_command(label="➡️ 转发到...", command=lambda: self._forward_single_message(message_id))

        context_menu.add_separator()

        # v2.2.0: 收藏/取消收藏
        star_label = "⭐ 取消收藏" if is_starred else "⭐ 收藏"
        context_menu.add_command(label=star_label, command=lambda: self._toggle_star(message_id))

        # 置顶/取消置顶
        pin_label = "📍 取消置顶" if is_pinned else "📌 置顶"
        context_menu.add_command(label=pin_label, command=lambda: self._toggle_pin(message_id))

        # 编辑 (仅用户消息)
        if role == "user":
            context_menu.add_command(label="✏️ 编辑", command=lambda: self._edit_message(message_id, content))

        context_menu.add_separator()

        # 删除
        context_menu.add_command(label="🗑️ 删除", command=lambda: self._delete_message(message_id))

        # 在鼠标位置显示菜单
        try:
            context_menu.tk_popup(event.x_root, event.y_root)
        finally:
            context_menu.grab_release()

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

    def _toggle_star(self, message_id: str) -> None:
        """v2.2.0: 切换消息的收藏（星标）状态。"""
        is_starred = self._app.toggle_message_starred(message_id)
        msg = "⭐ 已收藏" if is_starred else "⭐ 已取消收藏"
        ToastNotification(self._root, msg)
        self._refresh_chat_area()

    def _edit_message(self, message_id: str, current_content: str) -> None:
        """v2.6.0: 编辑消息内容，支持编辑后重新生成 AI 回复。"""
        # 获取消息信息
        sid = self._app.current_session_id()
        if not sid:
            return
        messages = self._app.load_messages(sid)
        target_msg = None
        target_index = -1
        for i, m in enumerate(messages):
            if m.id == message_id:
                target_msg = m
                target_index = i
                break
        if not target_msg:
            ToastNotification(self._root, "❌ 消息不存在")
            return

        # 检查是否有后续消息（仅对用户消息）
        has_following_messages = False
        next_assistant_msg_id = None
        if target_msg.role == "user" and target_index < len(messages) - 1:
            # 检查下一条是否是 assistant 消息
            next_msg = messages[target_index + 1] if target_index + 1 < len(messages) else None
            if next_msg and next_msg.role == "assistant":
                has_following_messages = True
                next_assistant_msg_id = next_msg.id

        # 创建编辑对话框
        dialog = ctk.CTkToplevel(self._root)
        dialog.title("编辑消息")
        dialog.geometry("600x450")
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
            height=220,
            font=("", 12)
        )
        textbox.pack(padx=16, pady=8, fill="both", expand=True)
        textbox.insert("1.0", current_content)

        # v2.6.0: 重新生成选项（仅用户消息且有后续回复时显示）
        regenerate_var = ctk.BooleanVar(value=False)
        if has_following_messages:
            regenerate_frame = ctk.CTkFrame(dialog, fg_color="transparent")
            regenerate_frame.pack(pady=(4, 8), padx=16, fill="x")

            regenerate_cb = ctk.CTkCheckBox(
                regenerate_frame,
                text="🔄 编辑后重新生成 AI 回复",
                variable=regenerate_var,
                onvalue=True,
                offvalue=False,
            )
            regenerate_cb.pack(anchor="w")

            hint_label = ctk.CTkLabel(
                regenerate_frame,
                text="   选中后将删除当前 AI 回复并重新生成",
                font=("", 10),
                text_color=("gray50", "gray60")
            )
            hint_label.pack(anchor="w")

        # 按钮容器
        btn_frame = ctk.CTkFrame(dialog, fg_color="transparent")
        btn_frame.pack(pady=(8, 16))

        def save_and_close():
            new_content = textbox.get("1.0", "end").strip()
            if not new_content:
                messagebox.showwarning("警告", "消息内容不能为空")
                return
            if not self._app.update_message_content(message_id, new_content):
                messagebox.showerror("错误", "更新消息失败")
                return

            # v2.6.0: 检查是否需要重新生成
            should_regenerate = regenerate_var.get() if has_following_messages else False
            if should_regenerate and next_assistant_msg_id:
                dialog.destroy()
                # 删除后续的 AI 回复消息
                self._app.delete_message(next_assistant_msg_id)
                # 触发重新生成
                self._refresh_chat_area()
                # 检查是否正在流式输出
                if self._streaming_session_id is not None:
                    ToastNotification(self._root, "⚠️ 请等待当前回复完成")
                    return
                self._error_label.configure(text="")
                self._start_loading_animation()
                self._send_btn.configure(state="disabled")
                self._streaming_session_id = sid
                self._app.regenerate_response(
                    sid,
                    self._stream_queue,
                    on_done=self._on_stream_done,
                    on_error=self._on_stream_error,
                )
            else:
                ToastNotification(self._root, "✓ 消息已更新")
                self._refresh_chat_area()
                dialog.destroy()

        def cancel_and_close():
            dialog.destroy()

        # v2.0.0: 保存按钮
        save_btn = ctk.CTkButton(
            btn_frame,
            text="保存",
            command=save_and_close,
            width=100,
            fg_color=Colors.PRIMARY if _HAS_DESIGN_SYSTEM else ("gray70", "gray30"),
            hover_color=Colors.PRIMARY_HOVER if _HAS_DESIGN_SYSTEM else ("gray60", "gray20")
        )
        save_btn.pack(side="left", padx=8)

        # v2.0.0: 取消按钮
        cancel_btn = ctk.CTkButton(
            btn_frame,
            text="取消",
            command=cancel_and_close,
            width=100,
            fg_color="transparent",
            border_width=1,
            border_color=Colors.BORDER_DEFAULT if _HAS_DESIGN_SYSTEM else ("gray60", "gray40")
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

    def _quote_message(self, message_id: str, content: str) -> None:
        """引用消息，准备回复。"""
        self._quoted_message = (message_id, content)
        # 更新引用提示条
        preview = content[:80] + "..." if len(content) > 80 else content
        self._quote_label.configure(text=f"💬 回复: {preview}")
        self._quote_frame.grid(row=0, column=0, columnspan=4, sticky="ew", pady=(0, 4))
        ToastNotification(self._root, "💬 已引用消息，输入回复后发送")
        # 聚焦到输入框
        self._input.focus_set()

    def _cancel_quote(self) -> None:
        """取消引用。"""
        self._quoted_message = None
        # 隐藏引用提示条
        self._quote_frame.grid_forget()
        ToastNotification(self._root, "❌ 已取消引用")

    # ========== 消息选择模式 (v1.2.5) ==========

    def _toggle_selection_mode(self) -> None:
        """切换选择模式。"""
        self._selection_mode = not self._selection_mode
        if self._selection_mode:
            self._selection_mode_btn.configure(
                text="☑",
                fg_color=("gray70", "gray35"),
                border_color=("orange", "dark orange"),
            )
            # 创建批量操作面板
            self._show_batch_actions_panel()
            ToastNotification(self._root, "✓ 选择模式已开启")
        else:
            self._selection_mode_btn.configure(
                text="☐",
                fg_color="transparent",
                border_color=("gray70", "gray40"),
            )
            # 清除选择
            self._selected_messages.clear()
            self._message_checkboxes.clear()
            # 隐藏批量操作面板
            if hasattr(self, '_batch_actions_frame') and self._batch_actions_frame:
                self._batch_actions_frame.destroy()
                self._batch_actions_frame = None
            self._refresh_chat_area()
            ToastNotification(self._root, "❌ 已退出选择模式")

    def _on_select_all(self) -> None:
        """Ctrl+A 全选消息（仅在选择模式下有效）。"""
        if self._selection_mode:
            self._select_all_messages()

    def _on_escape_key(self) -> None:
        """ESC 键处理：优先退出选择模式，其次清除搜索。"""
        if self._selection_mode:
            # 如果在选择模式中，退出选择模式
            self._toggle_selection_mode()
        else:
            # 否则清除搜索
            self._clear_search()

    def _show_batch_actions_panel(self) -> None:
        """显示批量操作面板。"""
        # 首先清除旧的面板
        if hasattr(self, '_batch_actions_frame') and self._batch_actions_frame:
            self._batch_actions_frame.destroy()

        # v2.0.0: 使用设计系统
        self._batch_actions_frame = ctk.CTkFrame(
            self._chat_scroll,
            fg_color=Colors.BTN_DEFAULT if _HAS_DESIGN_SYSTEM else ("gray75", "gray35"),
            corner_radius=Radius.MD if _HAS_DESIGN_SYSTEM else 8,
        )
        # 使用 place 将面板固定在聊天区域顶部中央
        self._batch_actions_frame.place(relx=0.5, rely=0.02, anchor="n")

        # 选择计数标签
        self._selection_count_label = ctk.CTkLabel(
            self._batch_actions_frame,
            text="已选择 0 条消息",
            font=("", FontSize.XS if _HAS_DESIGN_SYSTEM else 11),
            text_color=Colors.TEXT_SECONDARY if _HAS_DESIGN_SYSTEM else ("gray40", "gray70"),
        )
        self._selection_count_label.pack(side="left", padx=Spacing.MD if _HAS_DESIGN_SYSTEM else 12, pady=Spacing.SM if _HAS_DESIGN_SYSTEM else 8)

        # 全选/取消全选按钮
        select_all_btn = ctk.CTkButton(
            self._batch_actions_frame,
            text="全选",
            width=60,
            height=28,
            fg_color="transparent",
            hover_color=Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray65", "gray30"),
            command=self._select_all_messages,
        )
        select_all_btn.pack(side="left", padx=4)

        # 批量复制按钮
        copy_btn = ctk.CTkButton(
            self._batch_actions_frame,
            text="📋 复制",
            width=70,
            height=28,
            fg_color="transparent",
            hover_color=Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray65", "gray30"),
            command=self._batch_copy_selected,
        )
        copy_btn.pack(side="left", padx=4)

        # 批量删除按钮
        delete_btn = ctk.CTkButton(
            self._batch_actions_frame,
            text="🗑️ 删除",
            width=70,
            height=28,
            fg_color="transparent",
            hover_color=Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray65", "gray30"),
            command=self._batch_delete_selected,
        )
        delete_btn.pack(side="left", padx=4)

        # 批量导出按钮
        export_btn = ctk.CTkButton(
            self._batch_actions_frame,
            text="📦 导出",
            width=70,
            height=28,
            fg_color="transparent",
            hover_color=Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray65", "gray30"),
            command=self._batch_export_selected,
        )
        export_btn.pack(side="left", padx=4)

        # v2.0.0: 批量转发按钮 (v1.5.0)
        forward_btn = ctk.CTkButton(
            self._batch_actions_frame,
            text="➡️ 转发",
            width=70,
            height=28,
            fg_color="transparent",
            hover_color=Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray65", "gray30"),
            command=self._batch_forward_selected,
        )
        forward_btn.pack(side="left", padx=4)

        # 刷新聊天区域以显示复选框
        self._refresh_chat_area()

    def _update_selection_count(self) -> None:
        """更新选择计数显示。"""
        if hasattr(self, '_selection_count_label') and self._selection_count_label:
            count = len(self._selected_messages)
            self._selection_count_label.configure(text=f"已选择 {count} 条消息")

    def _on_checkbox_click(self, event, message_id: str) -> None:
        """复选框点击事件 - 检测 Shift 键状态 (v1.2.7)。"""
        # 0x0001 是 Shift 键的掩码
        self._shift_pressed_on_click = bool(event.state & 0x0001)

    def _on_message_checkbox_toggled(self, message_id: str, checked: bool) -> None:
        """消息复选框状态变化回调。"""
        if self._shift_pressed_on_click and self._last_clicked_message_id:
            # Shift+Click: 范围选择 (v1.2.7)
            self._select_message_range(self._last_clicked_message_id, message_id, checked)
            self._shift_pressed_on_click = False  # 重置标志
        else:
            # 普通点击: 切换单条消息
            if checked:
                self._selected_messages.add(message_id)
            else:
                self._selected_messages.discard(message_id)
            # 记录最后点击的消息 ID
            self._last_clicked_message_id = message_id
        self._update_selection_count()

    def _select_message_range(self, from_id: str, to_id: str, select: bool) -> None:
        """选择两个消息之间的所有消息 (v1.2.7)。"""
        sid = self._app.current_session_id()
        if not sid:
            return
        messages = self._app.load_messages(sid)
        message_ids = [m.id for m in messages]

        try:
            from_idx = message_ids.index(from_id)
            to_idx = message_ids.index(to_id)
        except ValueError:
            return

        # 确保范围正确（从小到大）
        start, end = min(from_idx, to_idx), max(from_idx, to_idx)

        # 选择范围内的所有消息
        for i in range(start, end + 1):
            msg_id = message_ids[i]
            if select:
                self._selected_messages.add(msg_id)
                if msg_id in self._message_checkboxes:
                    self._message_checkboxes[msg_id].set(True)
            else:
                self._selected_messages.discard(msg_id)
                if msg_id in self._message_checkboxes:
                    self._message_checkboxes[msg_id].set(False)

        # 更新最后点击的消息 ID
        self._last_clicked_message_id = to_id

    def _select_all_messages(self) -> None:
        """全选/取消全选当前会话的所有消息。"""
        messages = self._app.load_messages(self._app.current_session_id())
        all_selected = all(msg.id in self._selected_messages for msg in messages)

        if all_selected:
            # 取消全选
            self._selected_messages.clear()
            for msg_id, var in self._message_checkboxes.items():
                var.set(False)
        else:
            # 全选
            for msg in messages:
                self._selected_messages.add(msg.id)
                if msg.id in self._message_checkboxes:
                    self._message_checkboxes[msg.id].set(True)
        self._update_selection_count()

    def _batch_copy_selected(self) -> None:
        """批量复制选中的消息。"""
        if not self._selected_messages:
            ToastNotification(self._root, "⚠️ 未选择任何消息")
            return

        messages = self._app.load_messages(self._app.current_session_id())
        selected = [m for m in messages if m.id in self._selected_messages]
        selected.sort(key=lambda m: m.created_at)  # 按时间排序

        combined = []
        for m in selected:
            prefix = "你" if m.role == "user" else "助手"
            combined.append(f"{prefix}: {m.content}")

        copy_to_clipboard("\n\n".join(combined))
        ToastNotification(self._root, f"📋 已复制 {len(selected)} 条消息")

    def _batch_delete_selected(self) -> None:
        """批量删除选中的消息。"""
        if not self._selected_messages:
            ToastNotification(self._root, "⚠️ 未选择任何消息")
            return

        count = len(self._selected_messages)
        if not messagebox.askyesno(
            "确认删除",
            f"确定要删除选中的 {count} 条消息吗？\n此操作不可撤销。"
        ):
            return

        # 逐个删除
        success_count = 0
        for msg_id in list(self._selected_messages):
            if self._app.delete_message(msg_id):
                success_count += 1

        if success_count > 0:
            ToastNotification(self._root, f"🗑️ 已删除 {success_count} 条消息")
            # 清除选择并刷新
            self._selected_messages.clear()
            self._message_checkboxes.clear()
            self._refresh_chat_area()
            self._update_selection_count()
        else:
            ToastNotification(self._root, "❌ 删除失败")

    def _batch_export_selected(self) -> None:
        """批量导出选中的消息。"""
        if not self._selected_messages:
            ToastNotification(self._root, "⚠️ 未选择任何消息")
            return

        # 打开导出对话框
        export_dialog = ctk.CTkToplevel(self._root)
        export_dialog.title("导出选中消息")
        export_dialog.geometry("350x180")
        export_dialog.transient(self._root)
        export_dialog.grab_set()

        ctk.CTkLabel(
            export_dialog,
            text=f"导出 {len(self._selected_messages)} 条选中的消息",
            font=("", 14)
        ).pack(pady=(20, 15))

        # 格式选择
        format_frame = ctk.CTkFrame(export_dialog, fg_color="transparent")
        format_frame.pack(fill="x", padx=20, pady=(0, 15))
        ctk.CTkLabel(format_frame, text="格式：").pack(side="left", padx=4)

        format_var = ctk.StringVar(value="md")
        formats = [("md", "Markdown"), ("txt", "纯文本"), ("json", "JSON"),
                   ("html", "HTML"), ("pdf", "PDF"), ("docx", "Word")]
        format_options = [f[0] for f in formats]
        format_labels = {f[0]: f[1] for f in formats}

        format_menu = ctk.CTkOptionMenu(
            format_frame,
            variable=format_var,
            values=format_options,
            width=200,
            command=lambda v: format_menu.configure(text=format_labels.get(v, v))
        )
        format_menu.set("md")
        format_menu.configure(text="Markdown")
        format_menu.pack(side="left", padx=4)

        # 按钮区域
        btn_frame = ctk.CTkFrame(export_dialog, fg_color="transparent")
        btn_frame.pack(pady=(0, 20))

        def do_export() -> None:
            fmt = format_var.get()
            messages = self._app.load_messages(self._app.current_session_id())
            selected = [m for m in messages if m.id in self._selected_messages]
            selected.sort(key=lambda m: m.created_at)

            # 保存文件
            ext = fmt
            file_path = filedialog.asksaveasfilename(
                defaultextension=f".{ext}",
                filetypes=[(format_labels[fmt], f"*.{ext}")],
                initialfile=f"selected_messages.{ext}",
            )
            if not file_path:
                return

            # 使用当前会话信息创建导出器
            current_session = self._app.current_session()
            if current_session:
                try:
                    exporter = ChatExporter(current_session, selected)
                    exporter.save(file_path, fmt)
                    ToastNotification(self._root, f"📦 已导出 {len(selected)} 条消息")
                    export_dialog.destroy()
                except Exception as e:
                    ToastNotification(self._root, "❌ 导出失败")
            else:
                ToastNotification(self._root, "❌ 导出失败")

        ctk.CTkButton(btn_frame, text="导出", width=100, command=do_export).pack(side="left", padx=8)
        # v2.0.0: 取消按钮
        ctk.CTkButton(
            btn_frame, text="取消", width=100,
            fg_color=Colors.BTN_DEFAULT if _HAS_DESIGN_SYSTEM else ("gray70", "gray35"),
            command=export_dialog.destroy
        ).pack(side="left", padx=8)

    def _batch_forward_selected(self) -> None:
        """批量转发选中的消息到另一个会话 (v1.5.0)。"""
        if not self._selected_messages:
            ToastNotification(self._root, "⚠️ 未选择任何消息")
            return

        current_session_id = self._app.current_session_id()
        if not current_session_id:
            ToastNotification(self._root, "⚠️ 当前会话不存在")
            return

        # 获取所有会话列表（排除当前会话）
        all_sessions = self._app.load_sessions()
        other_sessions = [s for s in all_sessions if s.id != current_session_id]

        if not other_sessions:
            ToastNotification(self._root, "⚠️ 没有其他会话可转发")
            return

        # 打开转发对话框
        forward_dialog = ctk.CTkToplevel(self._root)
        forward_dialog.title("转发消息")
        forward_dialog.geometry("400x350")
        forward_dialog.transient(self._root)
        forward_dialog.grab_set()

        # 标题
        ctk.CTkLabel(
            forward_dialog,
            text=f"转发 {len(self._selected_messages)} 条消息",
            font=("", FontSize.LG if _HAS_DESIGN_SYSTEM else 14)
        ).pack(pady=(20, 10))

        ctk.CTkLabel(
            forward_dialog,
            text="选择目标会话：",
            text_color=Colors.TEXT_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray50", "gray60"),
            font=("", FontSize.XS if _HAS_DESIGN_SYSTEM else 11)
        ).pack(pady=(0, 10))

        # 会话列表（使用 ScrollableFrame 以支持多会话）
        from customtkinter import CTkScrollableFrame
        session_frame = CTkScrollableFrame(
            forward_dialog,
            height=180,
            fg_color=Colors.BG_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray90", "gray25"),
            corner_radius=Radius.MD if _HAS_DESIGN_SYSTEM else 8,
        )
        session_frame.pack(fill="both", expand=True, padx=20, pady=(0, 15))

        # 会话选择变量
        selected_session_id = [None]  # 使用列表以在闭包中修改

        # 按更新时间排序会话
        other_sessions.sort(key=lambda s: s.updated_at, reverse=True)

        for session in other_sessions:
            session_btn = ctk.CTkButton(
                session_frame,
                text=f"📄 {session.title[:30]}{'...' if len(session.title) > 30 else ''}",
                height=36,
                fg_color="transparent",
                hover_color=Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray70", "gray30"),
                anchor="w",
                command=lambda sid=session.id, stitle=session.title: _select_session(sid, stitle)
            )
            session_btn.pack(fill="x", pady=2)

        def _select_session(session_id: str, title: str) -> None:
            """选择目标会话并执行转发。"""
            selected_session_id[0] = session_id
            # 确认转发
            if not messagebox.askyesno(
                "确认转发",
                f"确定将 {len(self._selected_messages)} 条消息转发到「{title}」吗？"
            ):
                return

            # 执行转发
            message_ids = list(self._selected_messages)
            count = self._app.forward_messages(message_ids, session_id)

            if count > 0:
                ToastNotification(self._root, f"✅ 已转发 {count} 条消息")
                # 清除选择并刷新
                self._selected_messages.clear()
                self._message_checkboxes.clear()
                self._refresh_chat_area()
                self._update_selection_count()
                forward_dialog.destroy()
            else:
                ToastNotification(self._root, "❌ 转发失败")

        # 底部提示
        ctk.CTkLabel(
            forward_dialog,
            text="点击会话名称进行转发",
            text_color=Colors.TEXT_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray50", "gray60"),
            font=("", FontSize.XS if _HAS_DESIGN_SYSTEM else 10)
        ).pack(pady=(0, 15))

        # 取消按钮
        ctk.CTkButton(
            forward_dialog,
            text="取消",
            width=100,
            fg_color=Colors.BTN_DEFAULT if _HAS_DESIGN_SYSTEM else ("gray70", "gray35"),
            command=forward_dialog.destroy
        ).pack()

    def _forward_single_message(self, message_id: str) -> None:
        """转发单条消息到另一个会话 (v1.5.1)。"""
        current_session_id = self._app.current_session_id()
        if not current_session_id:
            ToastNotification(self._root, "⚠️ 当前会话不存在")
            return

        # 获取所有会话列表（排除当前会话）
        all_sessions = self._app.load_sessions()
        other_sessions = [s for s in all_sessions if s.id != current_session_id]

        if not other_sessions:
            ToastNotification(self._root, "⚠️ 没有其他会话可转发")
            return

        # 打开转发对话框
        forward_dialog = ctk.CTkToplevel(self._root)
        forward_dialog.title("转发消息")
        forward_dialog.geometry("400x350")
        forward_dialog.transient(self._root)
        forward_dialog.grab_set()

        # 标题
        ctk.CTkLabel(
            forward_dialog,
            text="转发 1 条消息",
            font=("", 14)
        ).pack(pady=(20, 10))

        ctk.CTkLabel(
            forward_dialog,
            text="选择目标会话：",
            text_color=("gray50", "gray60"),
            font=("", 11)
        ).pack(pady=(0, 10))

        # 会话列表（使用 ScrollableFrame 以支持多会话）
        from customtkinter import CTkScrollableFrame
        session_frame = CTkScrollableFrame(
            forward_dialog,
            height=180,
            fg_color=("gray90", "gray25"),
            corner_radius=8,
        )
        session_frame.pack(fill="both", expand=True, padx=20, pady=(0, 15))

        # 会话选择变量
        selected_session_id = [None]  # 使用列表以在闭包中修改

        # 按更新时间排序会话
        other_sessions.sort(key=lambda s: s.updated_at, reverse=True)

        for session in other_sessions:
            session_btn = ctk.CTkButton(
                session_frame,
                text=f"📄 {session.title[:30]}{'...' if len(session.title) > 30 else ''}",
                height=36,
                fg_color="transparent",
                hover_color=Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray70", "gray30"),
                anchor="w",
                command=lambda sid=session.id, stitle=session.title: _select_session(sid, stitle)
            )
            session_btn.pack(fill="x", pady=2)

        def _select_session(session_id: str, title: str) -> None:
            """选择目标会话并执行转发。"""
            selected_session_id[0] = session_id
            # 确认转发
            if not messagebox.askyesno(
                "确认转发",
                f"确定将这条消息转发到「{title}」吗？"
            ):
                return

            # 执行转发
            count = self._app.forward_messages([message_id], session_id)

            if count > 0:
                ToastNotification(self._root, "✅ 已转发 1 条消息")
                forward_dialog.destroy()
            else:
                ToastNotification(self._root, "❌ 转发失败")

        # 底部提示
        ctk.CTkLabel(
            forward_dialog,
            text="点击会话名称进行转发",
            text_color=Colors.TEXT_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray50", "gray60"),
            font=("", FontSize.XS if _HAS_DESIGN_SYSTEM else 10)
        ).pack(pady=(0, 15))

        # 取消按钮
        ctk.CTkButton(
            forward_dialog,
            text="取消",
            width=100,
            fg_color=Colors.BTN_DEFAULT if _HAS_DESIGN_SYSTEM else ("gray70", "gray35"),
            command=forward_dialog.destroy
        ).pack()

    # ========== 会话列表刷新 ==========

    def _refresh_sessions_list(self) -> None:
        """v2.5.0: 刷新会话列表，按文件夹分组显示，支持归档会话过滤/分组。"""
        for row in self._session_row_frames:
            row.destroy()
        self._session_row_frames.clear()

        current = self._app.current_session_id()
        folders = self._app.list_folders()

        # 按文件夹分组会话
        root_sessions = []  # 根目录的会话（非归档）
        folder_sessions = {}  # {folder_id: [sessions]} （非归档）
        archived_root_sessions = []  # 归档的根目录会话
        archived_folder_sessions = {}  # {folder_id: [sessions]} 归档的文件夹会话

        all_sessions = self._app.load_sessions()
        for s in all_sessions:
            # v2.5.0: 过滤归档会话
            if self._show_archived_only and not s.is_archived:
                continue
            if not self._show_archived_only and s.is_archived:
                # 如果不是只显示归档模式，跳过归档会话（它们会单独显示）
                pass  # 稍后处理
            if s.is_archived:
                # 归档会话单独分组
                if s.folder_id is None:
                    archived_root_sessions.append(s)
                else:
                    if s.folder_id not in archived_folder_sessions:
                        archived_folder_sessions[s.folder_id] = []
                    archived_folder_sessions[s.folder_id].append(s)
            else:
                # 非归档会话正常分组
                if s.folder_id is None:
                    root_sessions.append(s)
                else:
                    if s.folder_id not in folder_sessions:
                        folder_sessions[s.folder_id] = []
                    folder_sessions[s.folder_id].append(s)

        # 先显示根目录的会话（非归档）
        if root_sessions:
            for s in root_sessions:
                self._add_session_row(s, current)

        # 然后显示每个文件夹的会话（非归档）
        for folder in folders:
            if folder.id not in folder_sessions:
                continue

            # 文件夹标题行
            is_collapsed = self._app.is_folder_collapsed(folder.id)
            folder_row = self._add_folder_header(folder, is_collapsed, len(folder_sessions[folder.id]))
            self._session_row_frames.append(folder_row)

            # 如果未折叠，显示会话
            if not is_collapsed:
                for s in folder_sessions[folder.id]:
                    self._add_session_row(s, current)

        # v2.5.0: 如果不是只显示归档模式，在列表底部显示归档会话分组
        if not self._show_archived_only and (archived_root_sessions or archived_folder_sessions):
            # 添加归档分隔线
            separator = ctk.CTkFrame(
                self._session_list_frame,
                height=1,
                fg_color=Colors.BORDER_SUBTLE if _HAS_DESIGN_SYSTEM else ("gray75", "gray30"),
            )
            separator.grid(sticky="ew", pady=(12, 4))
            self._session_row_frames.append(separator)

            # 归档标题
            archived_header = ctk.CTkFrame(self._session_list_frame, fg_color="transparent")
            archived_header.grid(sticky="ew", pady=(0, 4))
            archived_label = ctk.CTkLabel(
                archived_header,
                text="📦 归档会话",
                font=("", FontSize.SM, "bold"),
                text_color=Colors.TEXT_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray50", "gray65"),
                anchor="w",
            )
            archived_label.pack(side="left", padx=(0, Spacing.SM))
            self._session_row_frames.append(archived_header)

            # 显示归档的根目录会话
            for s in archived_root_sessions:
                self._add_session_row(s, current)

            # 显示归档的文件夹会话
            for folder in folders:
                if folder.id not in archived_folder_sessions:
                    continue
                for s in archived_folder_sessions[folder.id]:
                    self._add_session_row(s, current)

        self._session_list_frame.columnconfigure(0, weight=1)

    def _add_folder_header(self, folder, is_collapsed: bool, session_count: int) -> ctk.CTkFrame:
        """添加文件夹标题行。"""
        row = ctk.CTkFrame(self._session_list_frame, fg_color="transparent")
        row.grid(sticky="ew", pady=(8, 2))
        row.grid_columnconfigure(1, weight=1)

        # 展开/折叠图标
        collapse_icon = "▶" if is_collapsed else "▼"
        btn_collapse = ctk.CTkButton(
            row,
            text=collapse_icon,
            width=24,
            height=24,
            fg_color="transparent",
            hover_color=("gray80", "gray28"),
            border_width=0,
            text_color=("gray15", "gray88"),
            command=lambda: self._on_toggle_folder_collapsed(folder.id),
        )
        btn_collapse.grid(row=0, column=0, padx=(0, 4))

        # v1.3.9: 文件夹名称（不带计数，计数单独做成徽章）
        folder_name = ctk.CTkLabel(
            row,
            text=f"{folder.icon} {folder.name}",
            anchor="w",
            font=("", 12, "bold"),
            text_color=folder.color,
        )
        folder_name.grid(row=0, column=1, sticky="w")

        # v1.3.9: 视觉徽章显示会话数量
        badge_frame = ctk.CTkFrame(
            row,
            fg_color=folder.color,
            corner_radius=10,
        )
        badge_frame.grid(row=0, column=2, padx=(6, 0), pady=2)

        count_label = ctk.CTkLabel(
            badge_frame,
            text=str(session_count),
            font=("", 10, "bold"),
            text_color=("white", "black"),  # 根据徽章背景色自适应
            padx=6,
            pady=1,
        )
        count_label.grid()

        return row

    def _add_session_row(self, s: Session, current: str | None) -> None:
        """v2.0.0: 添加单个会话行 - 使用设计系统。v2.5.0: 添加归档按钮。"""
        row = ctk.CTkFrame(self._session_list_frame, fg_color="transparent")
        row.grid(sticky="ew", pady=Spacing.XS if _HAS_DESIGN_SYSTEM else 2)
        row.grid_columnconfigure(0, weight=1)
        title_text = (s.title or "新对话")[:20]
        # 会话标题与图标需与侧边栏背景有对比，明/暗主题下均可见
        _side_text = Colors.TEXT_PRIMARY if _HAS_DESIGN_SYSTEM else ("gray15", "gray88")
        _selected_bg = Colors.SELECTED_BG if _HAS_DESIGN_SYSTEM else ("gray75", "gray30")
        _hover_bg = Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray78", "gray28")
        btn_title = ctk.CTkButton(
            row,
            text=title_text,
            anchor="w",
            fg_color=_selected_bg if s.id == current else "transparent",
            text_color=_side_text,
            hover_color=_hover_bg,
            border_width=0,
            corner_radius=Radius.SM if _HAS_DESIGN_SYSTEM else 0,
            command=lambda sid=s.id: self._on_select_session(sid),
        )
        btn_title.grid(row=0, column=0, sticky="ew", padx=(0, Spacing.XS if _HAS_DESIGN_SYSTEM else 4))
        # 消息数量标签
        msg_count = self._app.get_message_count(s.id)
        count_label = ctk.CTkLabel(
            row,
            text=str(msg_count),
            font=("", FontSize.XS),
            text_color=Colors.TEXT_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray50", "gray65"),
            width=20,
        )
        count_label.grid(row=0, column=1, padx=(0, 2))
        # 置顶按钮
        pin_text = "📌" if s.is_pinned else "📍"
        _hover_btn = Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray80", "gray28")
        btn_pin = ctk.CTkButton(
            row, text=pin_text, width=26, height=26,
            fg_color="transparent", hover_color=_hover_btn, border_width=0,
            text_color=_side_text,
            command=lambda sid=s.id: self._on_toggle_session_pinned(sid),
        )
        btn_pin.grid(row=0, column=2, padx=2)
        _bind_pressed_style(btn_pin)
        # v2.5.0: 归档按钮
        archive_text = "📦" if s.is_archived else "📂"
        btn_archive = ctk.CTkButton(
            row, text=archive_text, width=26, height=26,
            fg_color="transparent", hover_color=_hover_btn, border_width=0,
            text_color=_side_text,
            command=lambda sid=s.id: self._on_toggle_session_archived(sid),
        )
        btn_archive.grid(row=0, column=3, padx=2)
        _bind_pressed_style(btn_archive)
        # 移动到文件夹按钮 (列号后移)
        btn_folder = ctk.CTkButton(
            row, text="📁", width=26, height=26,
            fg_color="transparent", hover_color=_hover_btn, border_width=0,
            text_color=_side_text,
            command=lambda sid=s.id: self._on_move_session_to_folder(sid),
        )
        btn_folder.grid(row=0, column=4, padx=2)
        _bind_pressed_style(btn_folder)
        btn_rename = ctk.CTkButton(
            row, text="✏️", width=26, height=26,
            fg_color="transparent", hover_color=_hover_btn, border_width=0,
            text_color=_side_text,
            command=lambda sid=s.id, tit=s.title: self._on_rename_session(sid, tit),
        )
        btn_rename.grid(row=0, column=5, padx=2)
        _bind_pressed_style(btn_rename)
        btn_del = ctk.CTkButton(
            row, text="🗑️", width=26, height=26,
            fg_color="transparent", hover_color=_hover_btn, border_width=0,
            text_color=_side_text,
            command=lambda sid=s.id: self._on_delete_session(sid),
        )
        btn_del.grid(row=0, column=6, padx=2)
        _bind_pressed_style(btn_del)
        self._session_row_frames.append(row)

    def _message_textbox_height(self, content: str) -> int:
        """根据内容行数计算文本框高度，避免长文被截断。"""
        lines = max(2, content.count("\n") + 1)
        return min(400, max(60, lines * 22))

    def _insert_highlighted_text(self, tb: ctk.CTkTextbox, prefix: str, content: str, msg_id: str) -> None:
        """插入文本并高亮搜索匹配。"""
        tb.insert("1.0", f"{prefix}: ")
        # 配置高亮标签（主题感知，v1.2.9）
        try:
            # 尝试使用底层 Tkinter Text 的 tag_configure
            text_widget = tb._textbox if hasattr(tb, '_textbox') else tb
            # 根据主题使用不同颜色：亮色用黄色，暗色用橙色高亮
            is_dark = ctk.get_appearance_mode() == "Dark"
            if is_dark:
                text_widget.tag_config("search_highlight", background="#E65100", foreground="white")
            else:
                text_widget.tag_config("search_highlight", background="#FFEB3B", foreground="black")
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

        # v2.8.0: 移除旧的分页控件
        if self._pagination_controls:
            self._pagination_controls.destroy()
            self._pagination_controls = None

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

        # v2.8.0: 判断是否使用分页（仅在无过滤、无搜索时启用）
        use_pagination = (
            self._pagination_enabled and
            not self._search_query and
            not self._starred_only
        )

        if use_pagination:
            # 分页模式：只加载当前页
            offset = self._pagination_current_page * self._pagination_page_size
            messages, total = self._app.load_messages_paginated(sid, offset, self._pagination_page_size)
            self._pagination_total_count = total
            filtered_messages = messages
            self._matched_message_ids = set()
        else:
            # 非分页模式：加载全部消息
            self._pagination_total_count = 0
            messages = self._app.load_messages(sid)

            # 搜索过滤
            if self._search_query:
                self._matched_message_ids = {m.id for m in self._app.search_messages(
                    sid, self._search_query, self._search_start_date, self._search_end_date,
                    self._search_case_sensitive, self._search_whole_word, self._search_regex
                )}
                filtered_messages = [m for m in messages if m.id in self._matched_message_ids]
            else:
                self._matched_message_ids = set()
                filtered_messages = messages

            # v2.2.0: 星标过滤
            if self._starred_only:
                filtered_messages = [m for m in filtered_messages if m.is_starred]

        if not filtered_messages:
            if use_pagination:
                hint = f"第 {self._pagination_current_page + 1} 页为空" if self._pagination_total_count > 0 else "在下方输入并发送。"
            elif self._starred_only:
                hint = "⭐ 暂无收藏消息"
            else:
                hint = "没有匹配的消息" if self._search_query else "在下方输入并发送。"
            lbl = ctk.CTkLabel(
                self._chat_scroll, text=hint, anchor="w", justify="left", text_color=("gray40", "gray60")
            )
            lbl.grid(sticky="ew", pady=8)
            self._chat_scroll.columnconfigure(0, weight=1)
            # 分页模式下即使没消息也显示分页控件
            if use_pagination and self._pagination_total_count > 0:
                self._add_pagination_controls()
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

        for idx, m in enumerate(filtered_messages, start=1):
            # v2.0.0: 使用设计系统的消息气泡颜色
            if m.role == "user":
                # 用户消息：柔和紫色，更现代的视觉效果
                fg = Colors.USER_MSG_BG if _HAS_DESIGN_SYSTEM else ("#7C5DF0", "#9B7FE8")
                border_color_user = Colors.USER_MSG_BORDER if _HAS_DESIGN_SYSTEM else ("#6B4CE0", "#8A6FD8")
                text_color = Colors.USER_MSG_TEXT if _HAS_DESIGN_SYSTEM else ("#FFFFFF", "#FFFFFF")
            else:
                # AI 消息：中性背景，清晰可读
                fg = Colors.AI_MSG_BG if _HAS_DESIGN_SYSTEM else ("#F4F4F5", "#252525")
                border_color_user = Colors.AI_MSG_BORDER if _HAS_DESIGN_SYSTEM else ("#E5E5E5", "#383838")
                text_color = Colors.AI_MSG_TEXT if _HAS_DESIGN_SYSTEM else ("#1A1A1A", "#EAEAEA")

            # 当前匹配的消息添加高亮边框作为视觉指示器
            is_current_match = (m.id == self._current_match_msg_id)
            if is_current_match:
                border_color = Colors.INFO if _HAS_DESIGN_SYSTEM else ("#ff9500", "#ff6b00")
                border_width = 2
            else:
                border_color = border_color_user
                border_width = 1

            # v2.0.0: 消息容器 - 使用设计系统
            outer_frame = ctk.CTkFrame(
                self._chat_scroll,
                fg_color=Colors.MSG_CONTAINER_BG if _HAS_DESIGN_SYSTEM else "transparent",
                corner_radius=Radius.XL if _HAS_DESIGN_SYSTEM else 16,
            )
            outer_frame.grid(sticky="ew", pady=Spacing.SM if _HAS_DESIGN_SYSTEM else 6)
            outer_frame.grid_columnconfigure(0, weight=1)

            # 消息编号标签（左上角小数字）
            num_label = ctk.CTkLabel(
                outer_frame,
                text=f"#{idx}",
                font=("", FontSize.XS),
                text_color=Colors.TEXT_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray50", "gray65"),
                anchor="w",
            )
            num_label.grid(row=0, column=0, sticky="w", padx=Spacing.MD, pady=(Spacing.XS, 0))

            # 选择模式复选框 (v1.2.5)
            if self._selection_mode:
                # 确保此消息有对应的 BooleanVar
                if m.id not in self._message_checkboxes:
                    self._message_checkboxes[m.id] = ctk.BooleanVar(value=m.id in self._selected_messages)

                checkbox = ctk.CTkCheckBox(
                    outer_frame,
                    variable=self._message_checkboxes[m.id],
                    command=lambda mid=m.id, var=self._message_checkboxes[m.id]: self._on_message_checkbox_toggled(mid, var.get()),
                    width=20,
                    height=20,
                    border_width=2,
                    fg_color=("gray70", "gray35"),
                    hover_color=("gray60", "gray30"),
                    checkmark_color=("gray40", "gray70"),
                )
                # v1.2.7: 绑定点击事件以检测 Shift 键状态
                checkbox.bind("<Button-1>", lambda e, mid=m.id: self._on_checkbox_click(e, mid))
                checkbox.grid(row=0, column=0, sticky="w", padx=(40, 0), pady=(2, 0))

            # 引用内容显示（如果有）
            content_row = 1
            if m.quoted_content:
                # v2.0.0: 引用框使用设计系统
                quote_frame = ctk.CTkFrame(
                    outer_frame,
                    fg_color=Colors.BG_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray70", "gray35"),
                    corner_radius=Radius.MD if _HAS_DESIGN_SYSTEM else 8,
                    border_width=1,
                    border_color=Colors.BORDER_SUBTLE if _HAS_DESIGN_SYSTEM else ("gray60", "gray40"),
                )
                quote_frame.grid(row=content_row, column=0, sticky="ew", padx=Spacing.MD, pady=(Spacing.XS, 0))
                content_row += 1

                quote_label = ctk.CTkLabel(
                    quote_frame,
                    text=f"💬 {m.quoted_content[:100]}{'...' if len(m.quoted_content) > 100 else ''}",
                    anchor="w",
                    justify="left",
                    text_color=Colors.TEXT_SECONDARY if _HAS_DESIGN_SYSTEM else ("gray40", "gray70"),
                    font=("", FontSize.SM),
                    padx=Spacing.MD,
                    pady=Spacing.SM,
                )
                quote_label.pack(fill="x")

            # v2.0.0: 主消息 frame - 使用设计系统
            frame = ctk.CTkFrame(
                outer_frame,
                fg_color=fg,
                corner_radius=Radius.XL if _HAS_DESIGN_SYSTEM else 16,
                border_color=border_color,
                border_width=border_width
            )
            frame.grid(row=content_row, column=0, sticky="ew", padx=Spacing.MD, pady=(Spacing.XS, 0))
            frame.grid_columnconfigure(0, weight=1)
            frame.grid_columnconfigure(1, weight=0)

            # v1.5.2: 绑定右键上下文菜单
            frame.bind("<Button-3>", lambda e, mid=m.id, content=m.content, role=m.role, pinned=m.is_pinned, starred=m.is_starred:
                       self._show_message_context_menu(e, mid, content, role, pinned, starred))
            # macOS 右键支持
            frame.bind("<Button-2>", lambda e, mid=m.id, content=m.content, role=m.role, pinned=m.is_pinned, starred=m.is_starred:
                       self._show_message_context_menu(e, mid, content, role, pinned, starred))

            # v1.4.0: Use enhanced markdown with code block copy buttons for AI responses
            if m.role == "assistant" and _HAS_ENHANCED_MARKDOWN:
                # 使用增强版 Markdown（支持代码块复制按钮）
                content_container = ctk.CTkFrame(frame, fg_color="transparent")
                content_container.grid(row=0, column=0, sticky="nsew", padx=12, pady=8)
                content_container.grid_columnconfigure(0, weight=1)

                # 添加助手标签
                role_label = ctk.CTkLabel(
                    content_container,
                    text="**助手:**",
                    anchor="w",
                    font=("", 11, "bold")
                )
                role_label.grid(row=0, column=0, sticky="w", pady=(0, 4))

                # 渲染 Markdown 内容（v1.4.7: 传递搜索查询以支持高亮）
                md_widgets = EnhancedMarkdown.render_with_code_blocks(
                    content_container,
                    m.content,
                    use_base_ctkmarkdown=_USE_MARKDOWN,
                    search_query=self._search_query
                )
                for i, widget in enumerate(md_widgets, start=1):
                    widget.grid(row=i, column=0, sticky="ew")
            elif m.role == "assistant" and _USE_MARKDOWN and CTkMarkdown:
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

            # v2.0.0: 时间戳标签 - 使用设计系统
            try:
                # 解析 ISO 8601 时间戳
                dt = datetime.fromisoformat(m.created_at.replace('Z', '+00:00'))
                # 根据消息新旧程度显示不同格式
                now = datetime.now(dt.tzinfo)
                delta = now - dt
                if delta.days < 1:
                    # 今天内显示时间
                    time_str = dt.strftime("%H:%M")
                elif delta.days < 7:
                    # 一周内显示星期几+时间
                    weekdays = ["一", "二", "三", "四", "五", "六", "日"]
                    time_str = f"周{weekdays[dt.weekday()]} {dt.strftime('%H:%M')}"
                else:
                    # 更早显示完整日期
                    time_str = dt.strftime("%m-%d %H:%M")

                # 使用设计系统的颜色和字体
                timestamp_color = Colors.TEXT_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray40", "gray60")
                # 根据消息角色调整时间戳颜色以获得更好对比度
                if m.role == "user":
                    timestamp_color = ("rgba(255,255,255,0.7)", "rgba(255,255,255,0.7)") if _HAS_DESIGN_SYSTEM else ("rgba(255,255,255,0.7)", "rgba(255,255,255,0.7)")

                timestamp_label = ctk.CTkLabel(
                    frame,
                    text=time_str,
                    font=("", FontSize.XS),
                    text_color=timestamp_color,
                    anchor="w",
                )
                timestamp_label.grid(row=1, column=0, sticky="w", padx=Spacing.MD, pady=(0, Spacing.SM))
            except (ValueError, TypeError):
                pass  # 时间戳解析失败时不显示

            # v2.0.0: 右侧按钮组 - 使用设计系统
            btn_frame = ctk.CTkFrame(frame, fg_color="transparent")
            btn_frame.grid(row=0, column=1, rowspan=2, padx=(Spacing.XS, Spacing.SM), pady=Spacing.XS)

            # 置顶按钮
            pin_text = "📌" if m.is_pinned else "📍"
            pin_bg = Colors.PINNED if m.is_pinned else "transparent"
            pin_hover = Colors.PIN_GOLD_HOVER if m.is_pinned else Colors.HOVER_BG
            pin_btn = ctk.CTkButton(
                btn_frame,
                text=pin_text,
                width=Button.ICON_SIZE,
                height=Button.ICON_SIZE,
                fg_color=pin_bg if _HAS_DESIGN_SYSTEM else ("yellow", "dark goldenrod") if m.is_pinned else "transparent",
                hover_color=pin_hover if _HAS_DESIGN_SYSTEM else ("gold", "goldenrod") if m.is_pinned else ("gray80", "gray28"),
                corner_radius=Button.ICON_RADIUS if _HAS_DESIGN_SYSTEM else 6,
                border_width=0,
                command=lambda msg_id=m.id: self._toggle_pin(msg_id)
            )
            pin_btn.grid(row=0, column=0, pady=Spacing.XS)
            _bind_pressed_style(pin_btn)

            # 复制按钮
            copy_btn = ctk.CTkButton(
                btn_frame,
                text="📋",
                width=Button.ICON_SIZE,
                height=Button.ICON_SIZE,
                fg_color="transparent",
                hover_color=Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray80", "gray28"),
                corner_radius=Button.ICON_RADIUS if _HAS_DESIGN_SYSTEM else 6,
                border_width=0,
                command=lambda content=m.content: self._copy_message(content)
            )
            copy_btn.grid(row=1, column=0, pady=Spacing.XS)
            _bind_pressed_style(copy_btn)

            # 编辑按钮
            edit_btn = ctk.CTkButton(
                btn_frame,
                text="✏️",
                width=Button.ICON_SIZE,
                height=Button.ICON_SIZE,
                fg_color="transparent",
                hover_color=Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray80", "gray28"),
                corner_radius=Button.ICON_RADIUS if _HAS_DESIGN_SYSTEM else 6,
                border_width=0,
                command=lambda msg_id=m.id, content=m.content: self._edit_message(msg_id, content)
            )
            edit_btn.grid(row=2, column=0, pady=Spacing.XS)
            _bind_pressed_style(edit_btn)

            # 删除按钮
            delete_btn = ctk.CTkButton(
                btn_frame,
                text="🗑️",
                width=Button.ICON_SIZE,
                height=Button.ICON_SIZE,
                fg_color="transparent",
                hover_color=Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray80", "gray28"),
                corner_radius=Button.ICON_RADIUS if _HAS_DESIGN_SYSTEM else 6,
                border_width=0,
                command=lambda msg_id=m.id: self._delete_message(msg_id)
            )
            delete_btn.grid(row=3, column=0, pady=Spacing.XS)
            _bind_pressed_style(delete_btn)

            # 引用按钮
            quote_btn = ctk.CTkButton(
                btn_frame,
                text="💬",
                width=28,
                height=28,
                fg_color="transparent",
                hover_color=Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray80", "gray28"),
                border_width=0,
                command=lambda msg_id=m.id, content=m.content: self._quote_message(msg_id, content)
            )
            quote_btn.grid(row=4, column=0, pady=2)
            _bind_pressed_style(quote_btn)

            # 转发按钮 (v1.5.1)
            forward_btn = ctk.CTkButton(
                btn_frame,
                text="➡️",
                width=28,
                height=28,
                fg_color="transparent",
                hover_color=Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray80", "gray28"),
                border_width=0,
                command=lambda msg_id=m.id: self._forward_single_message(msg_id)
            )
            forward_btn.grid(row=5, column=0, pady=2)
            _bind_pressed_style(forward_btn)

            self._chat_widgets.append((m.id, frame))
        self._chat_scroll.columnconfigure(0, weight=1)

        # v2.8.0: 添加分页控件
        if use_pagination and self._pagination_total_count > self._pagination_page_size:
            self._add_pagination_controls()

    def _refresh_global_search_results(self) -> None:
        """刷新全局搜索结果。v2.0.0 使用设计系统优化样式。"""
        all_messages = self._app.search_all_messages(
            self._search_query, 100, self._search_start_date, self._search_end_date,
            self._search_case_sensitive, self._search_whole_word, self._search_regex
        )

        if not all_messages:
            # v2.0.0: 使用设计系统的空状态提示
            hint_bg = Colors.BG_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray90", "gray25")
            hint_radius = Radius.MD if _HAS_DESIGN_SYSTEM else 8
            hint_frame = ctk.CTkFrame(
                self._chat_scroll,
                fg_color=hint_bg,
                corner_radius=hint_radius,
            )
            hint_frame.grid(sticky="ew", pady=Spacing.LG if _HAS_DESIGN_SYSTEM else 8, padx=Spacing.MD if _HAS_DESIGN_SYSTEM else 0)

            hint_text_color = Colors.TEXT_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray40", "gray60")
            hint_font = ( "", FontSize.SM if _HAS_DESIGN_SYSTEM else 11)
            hint = f"🔍 没有找到包含「{self._search_query}」的消息"
            lbl = ctk.CTkLabel(
                hint_frame, text=hint, anchor="w", justify="left",
                text_color=hint_text_color, font=hint_font,
                padx=Spacing.MD if _HAS_DESIGN_SYSTEM else 12,
                pady=Spacing.SM if _HAS_DESIGN_SYSTEM else 8,
            )
            lbl.pack()
            self._chat_scroll.columnconfigure(0, weight=1)
            return

        # v2.0.0: 显示搜索结果数量提示 - 使用设计系统
        count_text_color = Colors.TEXT_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray40", "gray60")
        count_font = ("", FontSize.SM if _HAS_DESIGN_SYSTEM else 11)
        count_label = ctk.CTkLabel(
            self._chat_scroll,
            text=f"🔎 在全部会话中找到 {len(all_messages)} 条匹配消息",
            anchor="w",
            text_color=count_text_color,
            font=count_font,
        )
        count_label.grid(sticky="ew", pady=(0, Spacing.MD if _HAS_DESIGN_SYSTEM else 8),
                        padx=Spacing.MD if _HAS_DESIGN_SYSTEM else 0)

        # 获取所有会话信息用于显示标题
        sessions = {s.id: s for s in self._app.load_sessions()}

        for m in all_messages:
            # v2.0.0: 使用设计系统的消息卡片颜色
            if _HAS_DESIGN_SYSTEM:
                card_bg = Colors.USER_MSG_BG if m.role == "user" else Colors.AI_MSG_BG
                card_border = Colors.USER_MSG_BORDER if m.role == "user" else Colors.AI_MSG_BORDER
                card_radius = Radius.MD
            else:
                card_bg = ("gray85", "gray25") if m.role == "user" else ("gray70", "gray30")
                card_border = ("gray75", "gray32")
                card_radius = 8

            session = sessions.get(m.session_id)
            session_title = session.title if session else "未知会话"

            # v2.0.0: 搜索结果卡片 - 带边框和圆角
            frame = ctk.CTkFrame(
                self._chat_scroll,
                fg_color=card_bg,
                corner_radius=card_radius,
                border_width=1 if _HAS_DESIGN_SYSTEM else 0,
                border_color=card_border if _HAS_DESIGN_SYSTEM else "transparent",
            )
            frame.grid(sticky="ew", pady=Spacing.XS if _HAS_DESIGN_SYSTEM else 4,
                      padx=Spacing.XS if _HAS_DESIGN_SYSTEM else 0)
            frame.grid_columnconfigure(0, weight=1)
            frame.grid_columnconfigure(1, weight=0)

            # v1.5.2: 绑定右键上下文菜单（搜索结果）
            frame.bind("<Button-3>", lambda e, mid=m.id, content=m.content, role=m.role, pinned=m.is_pinned, starred=m.is_starred:
                       self._show_message_context_menu(e, mid, content, role, pinned, starred))
            # macOS 右键支持
            frame.bind("<Button-2>", lambda e, mid=m.id, content=m.content, role=m.role, pinned=m.is_pinned, starred=m.is_starred:
                       self._show_message_context_menu(e, mid, content, role, pinned, starred))

            # v2.0.0: 消息内容 - 使用设计系统间距
            msg_padding = Spacing.MD if _HAS_DESIGN_SYSTEM else 12
            tb = ctk.CTkTextbox(
                frame, wrap="word", height=self._message_textbox_height(m.content),
                fg_color="transparent", border_width=0, state="normal"
            )
            tb.grid(row=0, column=0, sticky="ew", padx=msg_padding, pady=(msg_padding, Spacing.XS if _HAS_DESIGN_SYSTEM else 8))
            prefix = '你' if m.role == 'user' else '助手'
            self._insert_highlighted_text(tb, prefix, m.content, m.id)
            tb.configure(state="disabled")

            # v2.0.0: 时间戳标签 - 使用设计系统
            try:
                dt = datetime.fromisoformat(m.created_at.replace('Z', '+00:00'))
                now = datetime.now(dt.tzinfo)
                delta = now - dt
                if delta.days < 1:
                    time_str = dt.strftime("%H:%M")
                elif delta.days < 7:
                    weekdays = ["一", "二", "三", "四", "五", "六", "日"]
                    time_str = f"周{weekdays[dt.weekday()]} {dt.strftime('%H:%M')}"
                else:
                    time_str = dt.strftime("%m-%d %H:%M")

                time_text_color = Colors.TEXT_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray50", "gray65")
                time_font = ("", FontSize.XS if _HAS_DESIGN_SYSTEM else 9)
                timestamp_label = ctk.CTkLabel(
                    frame,
                    text=f"🕐 {time_str}",
                    font=time_font,
                    text_color=time_text_color,
                    anchor="w",
                )
                timestamp_label.grid(row=1, column=0, sticky="w", padx=msg_padding, pady=(0, 2))
            except (ValueError, TypeError):
                pass

            # v2.0.0: 右侧按钮组 - 使用设计系统
            btn_padding = Spacing.XS if _HAS_DESIGN_SYSTEM else 4
            btn_frame = ctk.CTkFrame(frame, fg_color="transparent")
            btn_frame.grid(row=0, column=1, rowspan=2, padx=(Spacing.XS if _HAS_DESIGN_SYSTEM else 4, msg_padding), pady=btn_padding)

            # v2.0.0: 按钮悬停颜色 - 使用设计系统
            btn_hover = Colors.HOVER_LIGHT if _HAS_DESIGN_SYSTEM else ("gray80", "gray28")
            icon_size = Button.ICON_SIZE if _HAS_DESIGN_SYSTEM else 28

            # 置顶按钮（全局搜索结果中显示置顶状态但不提供切换）
            if m.is_pinned:
                pin_color = Colors.PIN_GOLD if _HAS_DESIGN_SYSTEM else ("orange", "dark goldenrod")
                pin_label = ctk.CTkLabel(
                    btn_frame,
                    text="📌",
                    width=icon_size,
                    text_color=pin_color,
                )
                pin_label.grid(row=0, column=0, pady=Spacing.XS if _HAS_DESIGN_SYSTEM else 2)

            # 复制按钮
            copy_btn = ctk.CTkButton(
                btn_frame,
                text="📋",
                width=icon_size,
                height=icon_size,
                fg_color="transparent",
                hover_color=btn_hover,
                border_width=0,
                corner_radius=Radius.SM if _HAS_DESIGN_SYSTEM else 0,
                command=lambda content=m.content: self._copy_message(content)
            )
            copy_btn.grid(row=1 if m.is_pinned else 0, column=0, pady=Spacing.XS if _HAS_DESIGN_SYSTEM else 2)
            _bind_pressed_style(copy_btn)

            # 跳转到会话按钮
            goto_btn = ctk.CTkButton(
                btn_frame,
                text="🔗",
                width=icon_size,
                height=icon_size,
                fg_color="transparent",
                hover_color=btn_hover,
                border_width=0,
                corner_radius=Radius.SM if _HAS_DESIGN_SYSTEM else 0,
                command=lambda sid=m.session_id: self._goto_session(sid)
            )
            goto_btn.grid(row=2 if m.is_pinned else 1, column=0, pady=Spacing.XS if _HAS_DESIGN_SYSTEM else 2)
            _bind_pressed_style(goto_btn)

            # 编辑按钮
            edit_btn = ctk.CTkButton(
                btn_frame,
                text="✏️",
                width=icon_size,
                height=icon_size,
                fg_color="transparent",
                hover_color=btn_hover,
                border_width=0,
                corner_radius=Radius.SM if _HAS_DESIGN_SYSTEM else 0,
                command=lambda msg_id=m.id, content=m.content: self._edit_message(msg_id, content)
            )
            edit_btn.grid(row=3 if m.is_pinned else 2, column=0, pady=Spacing.XS if _HAS_DESIGN_SYSTEM else 2)
            _bind_pressed_style(edit_btn)

            # 删除按钮 - 使用警告色悬停
            delete_hover = Colors.ERROR if _HAS_DESIGN_SYSTEM else ("gray80", "gray28")
            delete_btn = ctk.CTkButton(
                btn_frame,
                text="🗑️",
                width=icon_size,
                height=icon_size,
                fg_color="transparent",
                hover_color=delete_hover,
                border_width=0,
                corner_radius=Radius.SM if _HAS_DESIGN_SYSTEM else 0,
                command=lambda msg_id=m.id: self._delete_message(msg_id)
            )
            delete_btn.grid(row=4 if m.is_pinned else 3, column=0, pady=Spacing.XS if _HAS_DESIGN_SYSTEM else 2)
            _bind_pressed_style(delete_btn)

            # v2.0.0: 会话标题标签 - 使用设计系统
            title_text_color = Colors.TEXT_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray50", "gray70")
            title_font = ("", FontSize.XS if _HAS_DESIGN_SYSTEM else 10)
            title_label = ctk.CTkLabel(
                frame,
                text=f"📁 {session_title}",
                anchor="w",
                text_color=title_text_color,
                font=title_font,
            )
            title_label.grid(row=1, column=0, sticky="w", padx=msg_padding, pady=(0, Spacing.SM if _HAS_DESIGN_SYSTEM else 4))

            self._chat_widgets.append((m.id, frame))
        self._chat_scroll.columnconfigure(0, weight=1)

    def _goto_session(self, session_id: str) -> None:
        """跳转到指定会话并退出全局搜索模式。"""
        self._app.switch_session(session_id)
        self._search_global = False
        self._search_global_btn.configure(text="本会话")
        self._search_var.set("")
        self._search_query = ""
        # v2.8.0: 重置分页到第一页
        self._pagination_current_page = 0
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
        dialog.geometry("400x580")
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
            ("会话导航", ""),
            ("Ctrl + K", "聚焦搜索框"),
            ("Ctrl + L", "聚焦输入框"),
            ("Ctrl + N", "新建对话"),
            ("Ctrl + P", "切换置顶"),
            ("Ctrl + Tab", "快速切换会话"),
            ("Ctrl + Up/Down", "上/下一个会话"),
            ("Ctrl + T", "切换侧边栏"),
            ("Ctrl + W", "删除当前对话"),
            ("消息导航", ""),
            ("Ctrl + Home", "跳转到首条消息"),
            ("Ctrl + End", "跳转到末条消息"),
            ("Ctrl + G", "跳转到指定消息"),
            ("Alt + Up", "上一条消息"),
            ("Alt + Down", "下一条消息"),
            ("消息操作", ""),
            ("Ctrl + R", "重新生成最后回复"),
            ("Ctrl + Shift + C", "复制最后 AI 回复"),
            ("消息选择", ""),
            ("Ctrl + A", "全选消息 (选择模式)"),
            ("Shift + 点击", "范围选择 (选择模式)"),
            ("ESC", "退出选择模式"),
            ("其他", ""),
            ("Ctrl + ,", "打开设置"),
            ("Ctrl + S", "当前会话统计"),
            ("Ctrl + Alt + S", "全局统计"),
            ("Ctrl + /", "显示此帮助"),
            ("ESC", "清除搜索"),
            ("F3", "下一个搜索匹配"),
            ("Shift + F3", "上一个搜索匹配"),
            ("Ctrl + Enter", "输入框内换行"),
            ("Enter", "发送消息"),
        ]

        # 使用 Frame 来对齐
        for key, desc in shortcuts:
            if not desc:
                # 分类标题
                ctk.CTkLabel(
                    main,
                    text=key,
                    font=("", 12, "bold"),
                    anchor="w",
                    text_color=("gray40", "gray60")
                ).pack(fill="x", pady=(12, 4))
            else:
                row = ctk.CTkFrame(main, fg_color="transparent")
                row.pack(fill="x", pady=2)
                ctk.CTkLabel(
                    row,
                    text=key,
                    font=("Courier", 11),
                    width=140,
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

    def _scroll_to_first_message(self) -> None:
        """滚动到第一条消息（Ctrl+Home）。"""
        if not self._chat_widgets:
            return
        # 滚动到顶部
        try:
            self._root.update_idletasks()
            # 使用 canvas 的 yview_moveto 滚动到顶部
            self._chat_scroll._canvas.yview_moveto(0.0)
            # 高亮第一条消息
            if self._chat_widgets:
                _, first_frame = self._chat_widgets[0]
                self._flash_message_frame(first_frame)
        except Exception:
            pass

    def _scroll_to_last_message(self) -> None:
        """滚动到最后一条消息（Ctrl+End）。"""
        if not self._chat_widgets:
            return
        # 滚动到底部
        try:
            self._root.update_idletasks()
            # 使用 canvas 的 yview_moveto 滚动到底部
            self._chat_scroll._canvas.yview_moveto(1.0)
            # 高亮最后一条消息
            if self._chat_widgets:
                _, last_frame = self._chat_widgets[-1]
                self._flash_message_frame(last_frame)
        except Exception:
            pass

    def _on_go_to_message(self) -> None:
        """打开跳转到消息对话框（Ctrl+G）。"""
        if not self._chat_widgets:
            ToastNotification(self._root, "⚠️ 当前会话没有消息")
            return

        total = len(self._chat_widgets)

        def on_jump(index: int) -> None:
            self._on_jump_to_message_index(index)

        GoToMessageDialog(
            self._root,
            total_messages=total,
            on_jump=on_jump,
        )

    def _on_jump_to_message_index(self, index: int) -> None:
        """跳转到指定索引的消息。"""
        if 0 <= index < len(self._chat_widgets):
            _, frame = self._chat_widgets[index]
            # 滚动到该消息
            try:
                self._root.update_idletasks()
                frame_y = frame.winfo_y()
                canvas_height = self._chat_scroll._canvas.winfo_height()
                scroll_region_height = self._chat_scroll._canvas.winfo_reqheight()
                if scroll_region_height > 0:
                    # 计算滚动位置，使消息在视口中间
                    target_y = max(0, frame_y - canvas_height // 3)
                    scroll_fraction = target_y / scroll_region_height
                    self._chat_scroll._canvas.yview_moveto(min(scroll_fraction, 1.0))
                self._flash_message_frame(frame)
                ToastNotification(self._root, f"📍 消息 {index + 1}/{len(self._chat_widgets)}", duration_ms=1000)
            except Exception:
                pass

    def _on_prev_message(self) -> None:
        """跳转到上一条消息（Alt+Up）。"""
        if not self._chat_widgets:
            return
        # 获取当前滚动位置，找到当前可见的消息
        try:
            self._root.update_idletasks()
            canvas = self._chat_scroll._canvas
            scroll_top = float(canvas.canvasy(0))
            current_idx = -1
            for i, (_, frame) in enumerate(self._chat_widgets):
                frame_y = frame.winfo_y()
                frame_bottom = frame_y + frame.winfo_height()
                if frame_y >= scroll_top:
                    current_idx = i
                    break
            if current_idx > 0:
                self._on_jump_to_message_index(current_idx - 1)
            elif current_idx == 0:
                ToastNotification(self._root, "⬆️ 已是第一条消息", duration_ms=1000)
        except Exception:
            pass

    def _on_next_message(self) -> None:
        """跳转到下一条消息（Alt+Down）。"""
        if not self._chat_widgets:
            return
        # 获取当前滚动位置，找到当前可见的消息
        try:
            self._root.update_idletasks()
            canvas = self._chat_scroll._canvas
            scroll_top = float(canvas.canvasy(0))
            current_idx = -1
            for i, (_, frame) in enumerate(self._chat_widgets):
                frame_y = frame.winfo_y()
                if frame_y >= scroll_top:
                    current_idx = i
                    break
            if current_idx >= 0 and current_idx < len(self._chat_widgets) - 1:
                self._on_jump_to_message_index(current_idx + 1)
            elif current_idx == len(self._chat_widgets) - 1:
                ToastNotification(self._root, "⬇️ 已是最后一条消息", duration_ms=1000)
        except Exception:
            pass

    def _flash_message_frame(self, frame: ctk.CTkFrame) -> None:
        """闪烁消息框以提供视觉反馈。"""
        try:
            # 保存原始背景色
            original_bg = frame.cget("fg_color")
            # 设置高亮色
            frame.configure(fg_color=("gray60", "gray40"))
            # 200ms 后恢复
            self._root.after(200, lambda: frame.configure(fg_color=original_bg))
        except Exception:
            pass

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
        self._start_loading_animation()  # v1.3.0: Start animation
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
        # v2.8.0: 重置分页到第一页
        self._pagination_current_page = 0
        self._refresh_sessions_list()
        self._refresh_chat_area()

    def _on_toggle_session_pinned(self, session_id: str) -> None:
        """切换会话置顶状态。"""
        new_pinned = self._app.toggle_session_pinned(session_id)
        icon = "📌" if new_pinned else "📍"
        status = "已置顶" if new_pinned else "已取消置顶"
        ToastNotification(self._root, f"{icon} {status}")
        self._refresh_sessions_list()

    # ========== v2.5.0: 会话归档 ==========

    def _on_toggle_session_archived(self, session_id: str) -> None:
        """切换会话归档状态。"""
        new_archived = self._app.toggle_session_archived(session_id)
        icon = "📦" if new_archived else "📂"
        status = "已归档" if new_archived else "已取消归档"
        ToastNotification(self._root, f"{icon} {status}")
        self._refresh_sessions_list()

    def _on_toggle_current_session_archived(self) -> None:
        """切换当前会话的归档状态（键盘快捷键 Ctrl+A，仅在选择模式外有效）。"""
        # 如果在选择模式下，执行全选操作
        if self._selection_mode:
            self._select_all_messages()
            return
        # 否则切换归档状态
        current_session_id = self._app.current_session_id()
        if current_session_id:
            self._on_toggle_session_archived(current_session_id)

    def _toggle_archived_filter(self) -> None:
        """v2.5.0: 切换仅显示归档会话过滤。"""
        self._show_archived_only = not self._show_archived_only
        # 更新按钮样式
        if self._show_archived_only:
            self._archived_filter_btn.configure(
                fg_color=Colors.BTN_DEFAULT if _HAS_DESIGN_SYSTEM else ("gray70", "gray35"),
                text_color=Colors.TEXT_HIGH_CONTRAST if _HAS_DESIGN_SYSTEM else ("gray10", "gray90")
            )
        else:
            self._archived_filter_btn.configure(
                fg_color="transparent",
                text_color=Colors.TEXT_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray40", "gray60")
            )
        # 刷新会话列表
        self._refresh_sessions_list()

    # ========== v2.5.0: 归档结束 ==========

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

    def _rename_session(self, session_id: str, current_title: str) -> None:
        """v2.7.0: 重命名会话标题。"""
        self._on_rename_session(session_id, current_title)

    def _show_session_context_menu(self, event, session_id: str, title: str) -> None:
        """v2.7.0: 显示会话的右键上下文菜单。"""
        import tkinter as tk
        # 创建右键菜单
        menu = tk.Menu(self._root, tearoff=0)
        if _HAS_DESIGN_SYSTEM:
            menu_bg = Colors.DROPDOWN_BG[0] if self._appearance == "Light" else Colors.DROPDOWN_BG[1]
            menu_fg = Colors.TEXT_PRIMARY[0] if self._appearance == "Light" else Colors.TEXT_PRIMARY[1]
            menu.configure(bg=menu_bg, fg=menu_fg, activebackground=Colors.PRIMARY[0], activeforeground="white")

        # 添加菜单项
        menu.add_command(label="✏️ 重命名", command=lambda: [self._rename_session(session_id, title), menu.destroy()])
        menu.add_separator()
        menu.add_command(label="🗑️ 删除", command=lambda: [self._on_delete_session(session_id), menu.destroy()])

        # 在鼠标位置显示菜单
        menu.tk_popup(event.x_root, event.y_root)

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

    def _on_show_statistics(self) -> None:
        """打开会话统计对话框。"""
        if not _HAS_STATISTICS:
            return
        stats = self._app.get_session_stats()
        if stats:
            open_statistics_dialog(self._root, stats)

    def _on_show_global_statistics(self) -> None:
        """打开全局统计对话框（Ctrl+Alt+S）。"""
        if not _HAS_STATISTICS:
            return
        stats = self._app.get_global_stats()
        open_global_statistics_dialog(self._root, stats)

    def _on_manage_folders(self) -> None:
        """打开文件夹管理对话框（Ctrl+Shift+F）。"""
        from src.ui.folder_dialog import FolderDialog, CreateFolderDialog, EditFolderDialog

        folders = self._app.list_folders()

        def on_create(name: str, color: str, icon: str) -> None:
            folder = self._app.create_folder(name, color, icon)
            ToastNotification(self._root, f"✅ 已创建文件夹「{name}」")
            self._refresh_sessions_list()

        def on_rename(folder_id: str, old_name: str, old_color: str) -> None:
            EditFolderDialog(
                self._root,
                self._app.get_folder(folder_id),
                lambda name, color, icon: self._do_rename_folder(folder_id, name, color, icon),
            )

        def on_delete(folder_id: str) -> None:
            folder = self._app.get_folder(folder_id)
            if folder:
                self._app.delete_folder(folder_id)
                ToastNotification(self._root, f"🗑️ 已删除文件夹「{folder.name}」")
                self._refresh_sessions_list()

        def on_move(folder_id: str, direction: str) -> list[Folder] | None:
            """移动文件夹排序（上移/下移）。"""
            updated_folders = self._app.swap_folder_order(folder_id, direction)
            if updated_folders is not None:
                self._refresh_sessions_list()
            return updated_folders

        FolderDialog(
            self._root,
            folders,
            on_create=on_create,
            on_rename=on_rename,
            on_delete=on_delete,
            on_move=on_move,
        )

    def _do_rename_folder(self, folder_id: str, new_name: str, new_color: str, new_icon: str) -> None:
        """执行文件夹重命名。"""
        self._app.update_folder_name(folder_id, new_name)
        self._app.update_folder_color(folder_id, new_color)
        self._app.update_folder_icon(folder_id, new_icon)
        ToastNotification(self._root, f"✅ 已更新文件夹「{new_name}」")
        self._refresh_sessions_list()

    def _on_toggle_folder_collapsed(self, folder_id: str) -> None:
        """切换文件夹折叠状态。"""
        new_state = self._app.toggle_folder_collapsed(folder_id)
        self._refresh_sessions_list()

    def _on_move_session_to_folder(self, session_id: str) -> None:
        """移动会话到文件夹。"""
        from src.ui.folder_dialog import FolderSelectDialog

        folders = self._app.list_folders()

        def on_select(folder_id: str | None) -> None:
            self._app.set_session_folder(session_id, folder_id)
            folder_name = "根目录" if folder_id is None else self._app.get_folder(folder_id).name
            ToastNotification(self._root, f"📁 已移动到「{folder_name}」")
            self._refresh_sessions_list()

        FolderSelectDialog(self._root, folders, on_select)

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
        """导出对话 - 选择当前会话或批量导出."""
        # 首先询问导出模式
        mode_dialog = ctk.CTkToplevel(self._root)
        mode_dialog.title("导出")
        mode_dialog.geometry("280x150")
        mode_dialog.transient(self._root)

        ctk.CTkLabel(mode_dialog, text="选择导出方式：", font=("", 14)).pack(pady=(20, 15))

        mode_result: list[str] = []

        def choose_current() -> None:
            mode_result.append("current")
            mode_dialog.destroy()

        def choose_batch() -> None:
            mode_result.append("batch")
            mode_dialog.destroy()

        btn_frame = ctk.CTkFrame(mode_dialog, fg_color="transparent")
        btn_frame.pack(pady=10)
        ctk.CTkButton(btn_frame, text="当前会话", width=100, command=choose_current).pack(side="left", padx=8)
        ctk.CTkButton(btn_frame, text="多个会话", width=100, command=choose_batch).pack(side="left", padx=8)

        mode_dialog.wait_window()

        if not mode_result:
            return  # 用户取消

        if mode_result[0] == "current":
            self._export_current_session()
        else:
            self._batch_export_sessions()

    def _export_current_session(self) -> None:
        """导出当前会话."""
        sid = self._app.current_session_id()
        if not sid:
            messagebox.showinfo("提示", "请先选择一个会话", parent=self._root)
            return

        # 创建导出对话框
        dialog = ctk.CTkToplevel(self._root)
        dialog.title("导出对话")
        dialog.geometry("300x340")
        dialog.transient(self._root)

        ctk.CTkLabel(dialog, text="选择导出格式：", anchor="w").pack(anchor="w", padx=12, pady=(12, 8))

        format_var = ctk.StringVar(value="md")
        txt_radio = ctk.CTkRadioButton(dialog, text="纯文本 (.txt)", variable=format_var, value="txt")
        txt_radio.pack(anchor="w", padx=12, pady=4)
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
            ext_map = {"txt": "txt", "md": "md", "json": "json", "pdf": "pdf", "html": "html", "docx": "docx"}
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

    def _batch_export_sessions(self) -> None:
        """批量导出多个会话."""
        sessions = self._app.load_sessions()
        if not sessions:
            messagebox.showinfo("提示", "没有可导出的会话", parent=self._root)
            return

        # 创建批量导出对话框
        dialog = ctk.CTkToplevel(self._root)
        dialog.title("批量导出")
        dialog.geometry("400x500")
        dialog.transient(self._root)

        # 标题和说明
        ctk.CTkLabel(dialog, text="选择要导出的会话：", font=("", 14)).pack(pady=(15, 8))
        ctk.CTkLabel(dialog, text="勾选会话后选择导出格式和保存位置", text_color="gray", font=("", 10)).pack()

        # 滚动框架用于会话列表
        scroll_frame = ctk.CTkScrollableFrame(dialog, height=250)
        scroll_frame.pack(fill="both", expand=True, padx=12, pady=10)

        # 会话复选框字典
        check_vars: dict[str, ctk.StringVar] = {}

        for session in sessions:
            var = ctk.BooleanVar(value=False)
            check_vars[session.id] = var
            title = session.title or "新对话"
            # 创建带复选框的行
            row = ctk.CTkFrame(scroll_frame, fg_color="transparent")
            row.pack(fill="x", pady=2)
            ctk.CTkCheckBox(row, text=title, variable=var).pack(side="left", padx=4)

        # 格式选择
        format_frame = ctk.CTkFrame(dialog, fg_color="transparent")
        format_frame.pack(fill="x", padx=12, pady=8)
        ctk.CTkLabel(format_frame, text="导出格式：").pack(side="left", padx=4)

        format_var = ctk.StringVar(value="md")
        formats = [("txt", "纯文本"), ("md", "Markdown"), ("json", "JSON"), ("html", "HTML")]

        for fmt, label in formats:
            ctk.CTkRadioButton(format_frame, text=label, variable=format_var, value=fmt).pack(side="left", padx=6)

        # 按钮
        result: list[tuple[str, str, list[str]]] = []  # (format, dir_path, session_ids)

        def do_export() -> None:
            selected = [sid for sid, var in check_vars.items() if var.get()]
            if not selected:
                messagebox.showwarning("提示", "请至少选择一个会话", parent=dialog)
                return

            fmt = format_var.get()
            # 选择保存目录
            dir_path = filedialog.askdirectory(title="选择保存目录", parent=self._root)
            if dir_path:
                result.append((fmt, dir_path, selected))
            dialog.destroy()

        def select_all() -> None:
            for var in check_vars.values():
                var.set(True)

        def deselect_all() -> None:
            for var in check_vars.values():
                var.set(False)

        btn_frame = ctk.CTkFrame(dialog, fg_color="transparent")
        btn_frame.pack(pady=10)
        ctk.CTkButton(btn_frame, text="全选", width=60, command=select_all).pack(side="left", padx=4)
        ctk.CTkButton(btn_frame, text="清空", width=60, command=deselect_all).pack(side="left", padx=4)
        ctk.CTkButton(btn_frame, text="导出", width=80, command=do_export).pack(side="left", padx=8)
        ctk.CTkButton(btn_frame, text="取消", width=80, command=dialog.destroy).pack(side="left", padx=4)

        dialog.wait_window()

        if result:
            fmt, dir_path, session_ids = result[0]
            exported = 0
            failed = 0
            for sid in session_ids:
                try:
                    session = self._app.get_session(sid)
                    messages = self._app.load_messages(sid)
                    exporter = ChatExporter(session, messages)
                    # 文件名: title_timestamp.ext
                    import re
                    safe_title = re.sub(r'[\\/*?:"<>|]', '_', session.title or "新对话")
                    timestamp = session.created_at[:19].replace(":", "-").replace("T", "_")
                    filename = f"{safe_title}_{timestamp}.{fmt}"
                    path = str(Path(dir_path) / filename)
                    exporter.save(path, fmt)
                    exported += 1
                except Exception as e:
                    failed += 1
                    logger.error("批量导出失败 sid=%s: %s", sid, e)

            messagebox.showinfo(
                "完成",
                f"批量导出完成！\n成功: {exported} 个\n失败: {failed} 个",
                parent=self._root,
            )

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

    def _on_input_key_release(self, event) -> None:
        """v1.3.0: Update character counter on input. v1.3.1: Auto-resize input height."""
        text = self._input.get("1.0", "end")
        char_count = len(text) - 1  # -1 because Text widget adds extra newline
        # Update character counter
        self._char_count_label.configure(text=f"{char_count} 字符")

        # v1.3.1: Auto-resize input height based on content
        # Count actual line breaks and estimate wrapped lines
        lines = text.strip().split('\n') if text.strip() else ['']
        # Base height on line count with wrapping consideration
        # Each line is approximately 20px tall with the default font
        min_height = 80
        max_height = 200
        line_height = 20

        # Calculate needed height based on line count and content
        # Consider wrapping: average ~80 characters per line at default width
        avg_chars_per_line = 80
        total_lines = 0
        for line in lines:
            if line:
                wrapped_lines = max(1, (len(line) + avg_chars_per_line - 1) // avg_chars_per_line)
                total_lines += wrapped_lines
            else:
                total_lines += 1

        # Calculate new height (min 1 line, but use min_height as baseline)
        new_height = max(min_height, min(max_height, total_lines * line_height + 40))

        # Only update if height changed significantly (avoid jitter)
        if abs(self._input.cget("height") - new_height) > 5:
            self._input.configure(height=new_height)

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
        # v2.8.0: 发送消息时跳转到最后一页
        if self._pagination_enabled and self._pagination_total_count > 0:
            total_pages = (self._pagination_total_count + self._pagination_page_size - 1) // self._pagination_page_size
            self._pagination_current_page = max(0, total_pages - 1)
        self._input.delete("1.0", "end")
        self._error_label.configure(text="")
        self._char_count_label.configure(text="0 字符")  # v1.3.0: Reset counter
        self._input.configure(height=80)  # v1.3.1: Reset input height after send
        self._start_loading_animation()  # v1.3.0: Start animation
        self._send_btn.configure(state="disabled")
        self._streaming_session_id = sid

        # 获取引用消息
        quoted_msg_id, quoted_content = self._quoted_message or (None, None)
        self._quoted_message = None  # 清除引用

        # 先追加用户消息到界面
        self._append_user_message(sid, text, quoted_content)
        self._app.send_message(
            sid,
            text,
            self._stream_queue,
            quoted_message_id=quoted_msg_id,
            quoted_content=quoted_content,
            on_done=self._on_stream_done,
            on_error=self._on_stream_error,
        )

    def _append_user_message(self, session_id: str, content: str, quoted_content: str | None = None) -> None:
        # v2.0.0: 使用设计系统
        # 外层容器
        outer_radius = Radius.XL if _HAS_DESIGN_SYSTEM else 12
        outer_frame = ctk.CTkFrame(self._chat_scroll, fg_color="transparent", corner_radius=outer_radius)
        outer_frame.grid(sticky="ew", pady=Spacing.SM if _HAS_DESIGN_SYSTEM else 6)
        outer_frame.grid_columnconfigure(0, weight=1)

        content_row = 0
        # 显示引用内容（如果有）
        if quoted_content:
            quote_bg = Colors.BG_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray70", "gray35")
            quote_frame = ctk.CTkFrame(
                outer_frame,
                fg_color=quote_bg,
                corner_radius=Radius.SM if _HAS_DESIGN_SYSTEM else 6,
            )
            quote_pad = MessageSpec.PADDING[1] if _HAS_DESIGN_SYSTEM else 16
            quote_frame.grid(row=content_row, column=0, sticky="ew", padx=quote_pad, pady=(Spacing.XS, 0))
            content_row += 1

            quote_label = ctk.CTkLabel(
                quote_frame,
                text=f"💬 {quoted_content[:100]}{'...' if len(quoted_content) > 100 else ''}",
                anchor="w",
                justify="left",
                text_color=Colors.TEXT_SECONDARY if _HAS_DESIGN_SYSTEM else ("gray40", "gray70"),
                font=("", FontSize.XS),
                padx=Spacing.MD,
                pady=Spacing.XS,
            )
            quote_label.pack(fill="x")

        # v2.0.0: 用户消息使用设计系统品牌色
        frame = ctk.CTkFrame(
            outer_frame,
            fg_color=Colors.USER_MSG_BG if _HAS_DESIGN_SYSTEM else ("#e8f4fd", "#1e3a5f"),
            corner_radius=MessageSpec.RADIUS_USER[0] if _HAS_DESIGN_SYSTEM else 12,
            border_width=0,
        )
        frame.grid(row=content_row, column=0, sticky="ew", padx=16, pady=(2, 0))
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
        self._chat_widgets.append(("user", outer_frame))
        self._chat_scroll.columnconfigure(0, weight=1)

    def _start_loading_animation(self) -> None:
        """v1.3.0: Start the animated loading indicator."""
        self._loading_anim_step = 0
        self._update_loading_animation()

    def _stop_loading_animation(self) -> None:
        """v1.3.0: Stop the animated loading indicator."""
        if self._loading_anim_job:
            self._root.after_cancel(self._loading_anim_job)
            self._loading_anim_job = None
        self._sending_label.configure(text="")

    def _update_loading_animation(self) -> None:
        """v1.3.0: Update the loading animation frame."""
        # Animated dots: ●○○ → ○●○ → ○○● → ●○○ ...
        dots = ["●○○", "○●○", "○○●"]
        text = dots[self._loading_anim_step % 3]
        self._sending_label.configure(text=f"思考中 {text}")
        self._loading_anim_step += 1
        self._loading_anim_job = self._root.after(500, self._update_loading_animation)

    def _on_stream_done(self) -> None:
        self._root.after(0, self._stream_done_ui)

    def _stream_done_ui(self) -> None:
        self._stop_loading_animation()  # v1.3.0: Stop animation
        self._send_btn.configure(state="normal")
        self._streaming_session_id = None
        self._streaming_textbox_id = None
        self._streaming_text = []
        self._refresh_sessions_list()

    def _on_stream_error(self, message: str) -> None:
        self._root.after(0, lambda: self._stream_error_ui(message))

    def _stream_error_ui(self, message: str) -> None:
        self._stop_loading_animation()  # v1.3.0: Stop animation
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
                    self._stop_loading_animation()  # v1.3.0: Stop animation
                    self._error_label.configure(text=chunk.message)
                    self._send_btn.configure(state="normal")
                    self._streaming_session_id = None
                    self._streaming_textbox_id = None
                    self._streaming_text = []
                    continue
                if isinstance(chunk, DoneChunk):
                    self._stop_loading_animation()  # v1.3.0: Stop animation
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
                        # v2.0.0: 使用设计系统
                        outer_radius = Radius.XL if _HAS_DESIGN_SYSTEM else 12
                        outer_frame = ctk.CTkFrame(
                            self._chat_scroll,
                            fg_color="transparent",
                            corner_radius=outer_radius
                        )
                        outer_frame.grid(sticky="ew", pady=Spacing.SM if _HAS_DESIGN_SYSTEM else 6)
                        outer_frame.grid_columnconfigure(0, weight=1)

                        frame = ctk.CTkFrame(
                            outer_frame,
                            fg_color=Colors.AI_MSG_BG if _HAS_DESIGN_SYSTEM else ("#f5f5f5", "#2d2d2d"),
                            corner_radius=MessageSpec.RADIUS_AI[1] if _HAS_DESIGN_SYSTEM else 12,
                            border_width=0,
                        )
                        frame.grid(sticky="ew", padx=16, pady=(2, 0))
                        frame.grid_columnconfigure(0, weight=1)
                        tb = ctk.CTkTextbox(
                            frame, wrap="word", height=280,
                            fg_color="transparent", border_width=0, state="normal"
                        )
                        tb.grid(row=0, column=0, sticky="ew", padx=12, pady=8)
                        tb.insert("1.0", "助手: ")
                        self._chat_widgets.append(("streaming", outer_frame))
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
