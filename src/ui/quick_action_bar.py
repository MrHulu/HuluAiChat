"""快捷操作栏 - v2.3.0。位于输入框上方，提供常用功能的快速访问。

v2.9.0: 使用 AnimatedButton 实现平滑悬停动画。
"""
from typing import Callable, TYPE_CHECKING

import customtkinter as ctk

from src.config.models import PromptTemplate

# v2.0.0: 设计系统
try:
    from src.ui.design_system import (
        Colors, Spacing, Radius, FontSize, Button,
    )
    _HAS_DESIGN_SYSTEM = True
except ImportError:
    _HAS_DESIGN_SYSTEM = False

# v2.9.0: 动画按钮
try:
    from src.ui.animated_button import create_animated_button, AnimatedIconButton
    _HAS_ANIMATED_BUTTON = True
except ImportError:
    _HAS_ANIMATED_BUTTON = False

if TYPE_CHECKING:
    from src.app.service import AppService


# 默认模板快捷按钮图标
TEMPLATE_ICONS = {
    "代码解释": "💻",
    "代码优化": "⚡",
    "翻译中英": "🌐",
    "总结摘要": "📝",
    "扩写润色": "✍️",
    "Bug 诊断": "🐛",
}


class QuickActionBar(ctk.CTkFrame):
    """快捷操作栏：模板快捷访问、星标切换、最近会话。"""

    def __init__(
        self,
        parent: ctk.CTk,
        app: "AppService",
        on_template_apply: Callable[[str], None],
        on_toggle_starred: Callable[[], None],
        on_recent_session: Callable[[str], None],
        **kwargs,
    ) -> None:
        """初始化快捷操作栏。

        Args:
            parent: 父容器
            app: 应用服务
            on_template_apply: 应用模板回调 (content)
            on_toggle_starred: 切换星标视图回调
            on_recent_session: 最近会话回调 (session_id)
        """
        # v2.0.0: 使用设计系统样式
        fg_color = kwargs.pop("fg_color", Colors.BG_SECONDARY if _HAS_DESIGN_SYSTEM else "transparent")
        corner_radius = kwargs.pop("corner_radius", Radius.SM if _HAS_DESIGN_SYSTEM else 0)

        super().__init__(
            parent,
            fg_color=fg_color,
            corner_radius=corner_radius,
            **kwargs,
        )

        self._app = app
        self._on_template_apply = on_template_apply
        self._on_toggle_starred = on_toggle_starred
        self._on_recent_session = on_recent_session
        self._show_starred_only = False

        self._build()

    def _build(self) -> None:
        """构建 UI。"""
        # 配置列：模板区 | 弹簧 | 星标 | 最近会话
        self.grid_columnconfigure(0, weight=0)
        self.grid_columnconfigure(1, weight=1)
        self.grid_columnconfigure(2, weight=0)
        self.grid_columnconfigure(3, weight=0)

        # 模板快捷按钮区域
        self._build_template_section()

        # 星标切换按钮
        self._build_star_button()

        # 最近会话按钮
        self._build_recent_sessions_button()

    def _build_template_section(self) -> None:
        """构建模板快捷按钮区域。v2.9.0: 使用动画按钮。"""
        container = ctk.CTkFrame(self, fg_color="transparent")
        container.grid(row=0, column=0, sticky="w", padx=(Spacing.SM, 0), pady=Spacing.XS)

        # 获取前4个模板
        templates = self._app.list_prompt_templates()[:4]

        for i, template in enumerate(templates):
            icon = TEMPLATE_ICONS.get(template.title, "📋")
            text = f"{icon} {template.title[:4]}"

            # v2.9.0: 使用动画按钮
            if _HAS_ANIMATED_BUTTON and _HAS_DESIGN_SYSTEM:
                btn = create_animated_button(
                    container,
                    text=text,
                    command=lambda t=template: self._on_template_apply(t.content),
                    style="secondary",
                    width=Button.ICON_SIZE,
                )
            else:
                btn = ctk.CTkButton(
                    container,
                    text=text,
                    width=Button.ICON_SIZE if _HAS_DESIGN_SYSTEM else 70,
                    height=Button.SECONDARY_HEIGHT if _HAS_DESIGN_SYSTEM else 28,
                    corner_radius=Radius.SM if _HAS_DESIGN_SYSTEM else 4,
                    fg_color=Colors.BTN_SECONDARY if _HAS_DESIGN_SYSTEM else ("gray70", "gray35"),
                    hover_color=Colors.BTN_SECONDARY_HOVER if _HAS_DESIGN_SYSTEM else ("gray60", "gray30"),
                    text_color=Colors.TEXT_PRIMARY if _HAS_DESIGN_SYSTEM else ("gray15", "gray88"),
                    font=("", FontSize.XS if _HAS_DESIGN_SYSTEM else 10),
                )
                btn.configure(command=lambda t=template: self._on_template_apply(t.content))

            btn.grid(row=0, column=i, padx=(0, Spacing.XS))

    def _build_star_button(self) -> None:
        """构建星标切换按钮。v2.9.0: 使用动画按钮。"""
        if _HAS_ANIMATED_BUTTON and _HAS_DESIGN_SYSTEM:
            self._star_btn = create_animated_button(
                self,
                text="⭐ 收藏",
                command=self._toggle_starred,
                style="secondary",
                width=Button.ICON_SIZE,
            )
        else:
            self._star_btn = ctk.CTkButton(
                self,
                text="⭐ 收藏",
                width=Button.ICON_SIZE if _HAS_DESIGN_SYSTEM else 70,
                height=Button.SECONDARY_HEIGHT if _HAS_DESIGN_SYSTEM else 28,
                corner_radius=Radius.SM if _HAS_DESIGN_SYSTEM else 4,
                fg_color=Colors.BTN_SECONDARY if _HAS_DESIGN_SYSTEM else ("gray70", "gray35"),
                hover_color=Colors.BTN_SECONDARY_HOVER if _HAS_DESIGN_SYSTEM else ("gray60", "gray30"),
                text_color=Colors.TEXT_PRIMARY if _HAS_DESIGN_SYSTEM else ("gray15", "gray88"),
                font=("", FontSize.XS if _HAS_DESIGN_SYSTEM else 10),
                command=self._toggle_starred,
            )
        self._star_btn.grid(row=0, column=2, padx=Spacing.XS, pady=Spacing.XS)

    def _build_recent_sessions_button(self) -> None:
        """构建最近会话按钮。v2.9.0: 使用动画按钮。"""
        if _HAS_ANIMATED_BUTTON and _HAS_DESIGN_SYSTEM:
            self._recent_btn = create_animated_button(
                self,
                text="🕐 最近",
                command=self._show_recent_sessions,
                style="secondary",
                width=Button.ICON_SIZE,
            )
        else:
            self._recent_btn = ctk.CTkButton(
                self,
                text="🕐 最近",
                width=Button.ICON_SIZE if _HAS_DESIGN_SYSTEM else 70,
                height=Button.SECONDARY_HEIGHT if _HAS_DESIGN_SYSTEM else 28,
                corner_radius=Radius.SM if _HAS_DESIGN_SYSTEM else 4,
                fg_color=Colors.BTN_SECONDARY if _HAS_DESIGN_SYSTEM else ("gray70", "gray35"),
                hover_color=Colors.BTN_SECONDARY_HOVER if _HAS_DESIGN_SYSTEM else ("gray60", "gray30"),
                text_color=Colors.TEXT_PRIMARY if _HAS_DESIGN_SYSTEM else ("gray15", "gray88"),
                font=("", FontSize.XS if _HAS_DESIGN_SYSTEM else 10),
                command=self._show_recent_sessions,
            )
        self._recent_btn.grid(row=0, column=3, padx=(Spacing.XS, Spacing.SM), pady=Spacing.XS)

        # 最近会话下拉菜单
        self._recent_menu: ctk.CTkFrame | None = None
        self._recent_menu_open = False

    def _toggle_starred(self) -> None:
        """切换星标视图。"""
        self._show_starred_only = not self._show_starred_only
        # 更新按钮样式
        if self._show_starred_only:
            self._star_btn.configure(
                text="⭐ 全部",
                fg_color=Colors.PRIMARY if _HAS_DESIGN_SYSTEM else ("#60a5fa", "#3b82f6"),
            )
        else:
            self._star_btn.configure(
                text="⭐ 收藏",
                fg_color=Colors.BTN_SECONDARY if _HAS_DESIGN_SYSTEM else ("gray70", "gray35"),
            )
        self._on_toggle_starred()

    def _show_recent_sessions(self) -> None:
        """显示最近会话下拉菜单。"""
        # 如果已打开，关闭
        if self._recent_menu_open:
            self._hide_recent_menu()
            return

        # 获取最近5个会话
        sessions = self._app.list_sessions(sort_by="updated", limit=5)
        if not sessions:
            return  # 没有会话

        # 计算位置
        x = self._recent_btn.winfo_x()
        y = self.winfo_y() + self.winfo_height() + self._recent_btn.winfo_height()
        width = 200

        # 创建下拉菜单
        self._recent_menu = ctk.CTkFrame(
            self._recent_btn.winfo_toplevel(),
            fg_color=Colors.DROPDOWN_BG if _HAS_DESIGN_SYSTEM else ("gray95", "gray22"),
            border_width=1,
            border_color=Colors.BORDER_DEFAULT if _HAS_DESIGN_SYSTEM else ("gray70", "gray40"),
            corner_radius=Radius.SM if _HAS_DESIGN_SYSTEM else 6,
        )
        self._recent_menu.place(x=x, y=y, width=width, anchor="nw")
        self._recent_menu_open = True

        # 添加会话项
        for session in sessions:
            # 截断标题
            title = session.title[:20] + "..." if len(session.title) > 20 else session.title
            btn = ctk.CTkButton(
                self._recent_menu,
                text=title,
                fg_color="transparent",
                hover_color=Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray85", "gray30"),
                text_color=Colors.TEXT_PRIMARY if _HAS_DESIGN_SYSTEM else ("gray15", "gray88"),
                height=28,
                anchor="w",
                corner_radius=0,
            )
            btn.pack(fill="x", padx=0, pady=0)
            btn.configure(command=lambda s=session: self._select_recent_session(s))

        # 点击外部关闭
        self._recent_menu.winfo_toplevel().bind("<Button-1>", self._on_menu_click_outside, add="+")

    def _hide_recent_menu(self) -> None:
        """隐藏最近会话菜单。"""
        if self._recent_menu:
            self._recent_menu.place_forget()
            self._recent_menu = None
        self._recent_menu_open = False

    def _on_menu_click_outside(self, event) -> None:
        """点击菜单外部时关闭。"""
        if self._recent_menu and self._recent_menu.winfo_exists():
            x = self._recent_menu.winfo_x()
            y = self._recent_menu.winfo_y()
            w = self._recent_menu.winfo_width()
            h = self._recent_menu.winfo_height()
            if not (x <= event.x <= x + w and y <= event.y <= y + h):
                self._hide_recent_menu()

    def _select_recent_session(self, session) -> None:
        """选择一个最近会话。"""
        self._hide_recent_menu()
        self._on_recent_session(session.id)

    def refresh_templates(self) -> None:
        """刷新模板按钮（当模板列表变化时调用）。"""
        # 清除模板区域
        for widget in self.winfo_children():
            if isinstance(widget, ctk.CTkFrame) and widget.grid_info()["column"] == 0:
                for child in widget.winfo_children():
                    child.destroy()
                widget.destroy()
                break

        # 重建模板区域
        self._build_template_section()

    def is_showing_starred_only(self) -> bool:
        """是否仅显示星标消息。"""
        return self._show_starred_only

    def set_show_starred_only(self, value: bool) -> None:
        """设置星标视图状态。"""
        if self._show_starred_only != value:
            self._toggle_starred()
