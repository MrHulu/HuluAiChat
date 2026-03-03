"""
HuluChat v2.4.0 - 搜索结果面板

在右侧显示搜索结果，按会话分组，支持快速跳转。

v2.9.0: 使用 AnimatedButton 实现平滑悬停动画。
"""
import re
from typing import Callable
from dataclasses import dataclass

import customtkinter as ctk

from src.persistence import Message, Session
from src.app.service import AppService

# v2.9.0: 动画按钮
try:
    from src.ui.animated_button import AnimatedIconButton
    _HAS_ANIMATED_BUTTON = True
except ImportError:
    _HAS_ANIMATED_BUTTON = False


@dataclass
class SearchResultItem:
    """搜索结果项"""
    message: Message
    session: Session
    preview_text: str
    match_index: int  # 匹配位置


class SearchResultsPanel(ctk.CTkFrame):
    """v2.4.0: 搜索结果侧边面板"""

    DEFAULT_WIDTH = 320
    MIN_WIDTH = 280
    MAX_WIDTH = 500

    def __init__(
        self,
        parent: ctk.CTk,
        app_service: AppService,
        on_message_click: Callable[[str, str], None],  # (session_id, message_id) -> None
        on_close: Callable[[], None],
    ):
        self._app = app_service
        self._on_message_click = on_message_click
        self._on_close = on_close
        self._results: list[SearchResultItem] = []
        self._grouped_results: dict[str, list[SearchResultItem]] = {}  # session_id -> items

        # 尝试加载设计系统
        self._has_design_system = False
        try:
            from src.ui.design_system import Colors, Spacing, Radius, FontSize
            self._Colors = Colors
            self._Spacing = Spacing
            self._Radius = Radius
            self._FontSize = FontSize
            self._has_design_system = True
        except ImportError:
            # 回退值
            class _Colors:
                BG_SECONDARY = ("gray90", "gray17")
                BG_TERTIARY = ("gray85", "gray22")
                TEXT_PRIMARY = ("gray15", "gray88")
                TEXT_SECONDARY = ("gray50", "gray60")
                TEXT_TERTIARY = ("gray40", "gray65")
                BORDER_SUBTLE = ("gray75", "gray30")
                HOVER_BG = ("gray80", "gray28")
                PRIMARY = ("#6D3ECC", "#8C67D7")
                SEARCH_HIGHLIGHT = ("#FEF08A", "#854D0E")
            class _Spacing:
                SM = 8
                MD = 12
                LG = 16
            class _Radius:
                SM = 6
                MD = 8
            class _FontSize:
                SM = 12
                BASE = 14
            self._Colors = _Colors
            self._Spacing = _Spacing
            self._Radius = _Radius
            self._FontSize = _FontSize

        bg_color = self._Colors.BG_SECONDARY if self._has_design_system else ("gray90", "gray17")

        super().__init__(
            parent,
            width=self.DEFAULT_WIDTH,
            fg_color=bg_color,
            corner_radius=0,
        )

        self._setup_ui()

    def _setup_ui(self):
        """设置 UI"""
        # 配置网格
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=1)

        # 头部：标题 + 关闭按钮
        header = ctk.CTkFrame(self, fg_color="transparent", height=48)
        header.grid(row=0, column=0, sticky="ew", padx=self._Spacing.MD, pady=(self._Spacing.MD, 0))
        header.grid_columnconfigure(0, weight=1)

        # 标题
        title_text = ctk.CTkLabel(
            header,
            text="搜索结果",
            font=("", self._FontSize.BASE, "bold"),
            text_color=self._Colors.TEXT_PRIMARY if self._has_design_system else ("gray15", "gray88"),
            anchor="w",
        )
        title_text.grid(row=0, column=0, sticky="w")

        # 计数器
        self._counter_label = ctk.CTkLabel(
            header,
            text="0 个结果",
            font=("", self._FontSize.SM),
            text_color=self._Colors.TEXT_TERTIARY if self._has_design_system else ("gray50", "gray65"),
        )
        self._counter_label.grid(row=0, column=1, sticky="e", padx=(self._Spacing.SM, 0))

        # 关闭按钮 - v2.9.0: 使用动画按钮
        if _HAS_ANIMATED_BUTTON:
            close_btn = AnimatedIconButton(
                header,
                text="✕",
                width=32,
                height=32,
                fg_color="transparent",
                hover_color=self._Colors.HOVER_BG if self._has_design_system else ("gray80", "gray28"),
                text_color=self._Colors.TEXT_SECONDARY if self._has_design_system else ("gray50", "gray60"),
                font=("", 14),
                command=self._on_close,
            )
        else:
            close_btn = ctk.CTkButton(
                header,
                text="✕",
                width=32,
                height=32,
                fg_color="transparent",
                hover_color=self._Colors.HOVER_BG if self._has_design_system else ("gray80", "gray28"),
                border_width=0,
                text_color=self._Colors.TEXT_SECONDARY if self._has_design_system else ("gray50", "gray60"),
                font=("", 14),
                command=self._on_close,
            )
        close_btn.grid(row=0, column=2, padx=(self._Spacing.SM, 0))

        # 分隔线
        separator = ctk.CTkFrame(
            self,
            height=1,
            fg_color=self._Colors.BORDER_SUBTLE if self._has_design_system else ("gray75", "gray30"),
        )
        separator.grid(row=0, column=0, sticky="ew", pady=(48, 0))

        # 结果滚动区域
        self._scroll_frame = ctk.CTkScrollableFrame(
            self,
            fg_color="transparent",
        )
        self._scroll_frame.grid(row=1, column=0, sticky="nsew", padx=self._Spacing.MD, pady=self._Spacing.MD)

        # 无结果提示
        self._no_results_label = ctk.CTkLabel(
            self._scroll_frame,
            text="输入关键词开始搜索",
            font=("", self._FontSize.SM),
            text_color=self._Colors.TEXT_TERTIARY if self._has_design_system else ("gray50", "gray65"),
        )
        self._no_results_label.grid(row=0, column=0, pady=self._Spacing.LG)

    def set_results(
        self,
        messages: list[Message],
        sessions: dict[str, Session],
        query: str = "",
    ):
        """设置搜索结果

        Args:
            messages: 匹配的消息列表
            sessions: session_id -> Session 映射
            query: 搜索关键词（用于高亮）
        """
        self._results.clear()
        self._grouped_results.clear()

        if not messages:
            self._show_no_results("没有找到匹配结果")
            return

        # 构建搜索结果项并按会话分组
        for msg in messages:
            session = sessions.get(msg.session_id)
            if not session:
                continue

            # 生成预览文本（高亮匹配部分）
            preview = self._generate_preview(msg.content, query, max_length=150)

            # 找到第一个匹配位置
            match_index = -1
            if query and not self._app._search_regex:
                # 简单搜索：找到匹配位置
                content_lower = msg.content.lower()
                query_lower = query.lower()
                match_index = content_lower.find(query_lower)

            item = SearchResultItem(
                message=msg,
                session=session,
                preview_text=preview,
                match_index=match_index,
            )

            if msg.session_id not in self._grouped_results:
                self._grouped_results[msg.session_id] = []
            self._grouped_results[msg.session_id].append(item)
            self._results.append(item)

        # 更新计数器
        self._counter_label.configure(text=f"{len(self._results)} 个结果")

        # 渲染结果
        self._render_results(query)

    def _show_no_results(self, message: str):
        """显示无结果提示"""
        self._counter_label.configure(text="0 个结果")
        self._no_results_label.configure(text=message)
        self._no_results_label.grid(row=0, column=0, pady=self._Spacing.LG)

        # 清除现有结果
        for widget in self._scroll_frame.winfo_children():
            if widget != self._no_results_label:
                widget.destroy()

    def _generate_preview(self, content: str, query: str, max_length: int = 150) -> str:
        """生成带高亮的预览文本

        Args:
            content: 原始内容
            query: 搜索关键词
            max_length: 最大长度

        Returns:
            预览文本（不含 HTML 标签，显示纯文本）
        """
        if not content:
            return ""

        # 移除 Markdown 标记，获得纯文本
        text = self._strip_markdown(content)

        if len(text) <= max_length:
            return text

        # 如果有查询词，尝试在匹配位置截取
        if query:
            query_lower = query.lower()
            text_lower = text.lower()
            idx = text_lower.find(query_lower)

            if idx != -1:
                # 在匹配位置附近截取
                context_len = (max_length - len(query)) // 2
                start = max(0, idx - context_len)
                end = min(len(text), idx + len(query) + context_len)

                prefix = "..." if start > 0 else ""
                suffix = "..." if end < len(text) else ""
                return prefix + text[start:end] + suffix

        # 默认截取开头
        return text[:max_length] + "..."

    def _strip_markdown(self, text: str) -> str:
        """移除常见的 Markdown 标记"""
        # 移除代码块
        text = re.sub(r'```[\s\S]*?```', '[代码]', text)
        # 移除行内代码
        text = re.sub(r'`([^`]+)`', r'\1', text)
        # 移除加粗
        text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)
        # 移除斜体
        text = re.sub(r'\*([^*]+)\*', r'\1', text)
        # 移除链接
        text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
        # 移除标题
        text = re.sub(r'^#+\s+', '', text, flags=re.MULTILINE)
        return text.strip()

    def _render_results(self, query: str):
        """渲染搜索结果"""
        # 隐藏无结果提示
        self._no_results_label.grid_forget()

        # 清除现有结果
        for widget in self._scroll_frame.winfo_children():
            widget.destroy()

        row = 0

        # 按会话分组显示
        for session_id, items in self._grouped_results.items():
            # 会话标题
            session = items[0].session
            session_header = ctk.CTkFrame(
                self._scroll_frame,
                fg_color=self._Colors.BG_TERTIARY if self._has_design_system else ("gray85", "gray22"),
                corner_radius=self._Radius.SM if self._has_design_system else 6,
            )
            session_header.grid(row=row, column=0, sticky="ew", pady=(self._Spacing.SM, self._Spacing.XS))
            row += 1

            session_title = ctk.CTkLabel(
                session_header,
                text=f"📁 {session.title or '未命名会话'} ({len(items)})",
                font=("", self._FontSize.SM, "bold"),
                text_color=self._Colors.TEXT_PRIMARY if self._has_design_system else ("gray15", "gray88"),
                anchor="w",
            )
            session_title.pack(side="left", padx=self._Spacing.SM, pady=self._Spacing.SM)

            # 渲染该会话下的所有消息
            for item in items:
                msg = item.message
                preview = item.preview_text

                # 结果卡片
                card = ctk.CTkFrame(
                    self._scroll_frame,
                    fg_color="transparent",
                    border_width=1,
                    border_color=self._Colors.BORDER_SUBTLE if self._has_design_system else ("gray75", "gray30"),
                    corner_radius=self._Radius.SM if self._has_design_system else 6,
                )
                card.grid(row=row, column=0, sticky="ew", pady=(0, self._Spacing.XS), padx=(self._Spacing.SM, 0))
                row += 1

                # 点击绑定
                card.bind(
                    "<Button-1>",
                    lambda e, sid=msg.session_id, mid=msg.id: self._on_message_click(sid, mid)
                )

                # 消息头信息
                header_frame = ctk.CTkFrame(card, fg_color="transparent")
                header_frame.pack(fill="x", padx=self._Spacing.SM, pady=(self._Spacing.SM, self._Spacing.XS))

                # 角色标识
                role_text = "👤 用户" if msg.role == "user" else "🤖 AI"
                role_color = self._Colors.TEXT_SECONDARY if self._has_design_system else ("gray50", "gray60")

                role_label = ctk.CTkLabel(
                    header_frame,
                    text=role_text,
                    font=("", self._FontSize.SM - 1),
                    text_color=role_color,
                )
                role_label.pack(side="left")

                # 时间
                from datetime import datetime
                try:
                    dt = datetime.fromisoformat(msg.created_at.replace('Z', '+00:00'))
                    time_str = dt.strftime("%H:%M")
                except:
                    time_str = ""

                if time_str:
                    time_label = ctk.CTkLabel(
                        header_frame,
                        text=time_str,
                        font=("", self._FontSize.SM - 1),
                        text_color=self._Colors.TEXT_TERTIARY if self._has_design_system else ("gray40", "gray65"),
                    )
                    time_label.pack(side="right")

                # 预览文本
                preview_label = ctk.CTkLabel(
                    card,
                    text=preview,
                    font=("", self._FontSize.SM),
                    text_color=self._Colors.TEXT_SECONDARY if self._has_design_system else ("gray50", "gray60"),
                    anchor="w",
                    justify="left",
                    wraplength=self.DEFAULT_WIDTH - 40,
                )
                preview_label.pack(fill="x", padx=self._Spacing.SM, pady=(0, self._Spacing.SM))
                preview_label.bind(
                    "<Button-1>",
                    lambda e, sid=msg.session_id, mid=msg.id: self._on_message_click(sid, mid)
                )

    def clear(self):
        """清除搜索结果"""
        self._results.clear()
        self._grouped_results.clear()
        self._show_no_results("输入关键词开始搜索")

    def get_result_count(self) -> int:
        """获取结果数量"""
        return len(self._results)


def _bind_pressed_style(button: ctk.CTkButton) -> None:
    """绑定按钮按压效果"""
    def on_press(e):
        button.configure(fg_color=("gray60", "gray40"))

    def on_release(e):
        button.configure(fg_color=("gray70", "gray35"))

    button.bind("<ButtonPress-1>", on_press)
    button.bind("<ButtonRelease-1>", on_release)
