"""v2.9.0: 动画按钮 - 平滑悬停过渡效果。

为 CustomTkinter 按钮添加：
1. 颜色渐变动画（淡入淡出）
2. 轻微缩放效果
3. 柔和的阴影变化
"""
from typing import Callable, Any

import customtkinter as ctk

try:
    from src.ui.design_system import (
        Colors, Spacing, Radius, FontSize, Button as ButtonSpec,
    )
    _HAS_DESIGN_SYSTEM = True
except ImportError:
    _HAS_DESIGN_SYSTEM = False


class AnimatedButton(ctk.CTkButton):
    """带平滑悬停动画的按钮。

    动画效果：
    - 颜色渐变（插值过渡）
    - 轻微缩放（1.0 → 1.02）
    - 阴影变化

    Args:
        parent: 父容器
        text: 按钮文字
        command: 点击回调
        animation_speed: 动画速度（ms/帧），默认 16ms (~60fps）
        scale_amount: 缩放比例，默认 1.02
        enable_shadow: 是否启用阴影效果
        **kwargs: 其他 CTkButton 参数
    """

    # 动画状态
    _animating_buttons = set()

    def __init__(
        self,
        parent: ctk.CTk,
        text: str = "",
        command: Callable[[], Any] | None = None,
        animation_speed: int = 16,
        scale_amount: float = 1.02,
        enable_shadow: bool = True,
        **kwargs,
    ) -> None:
        # 提取颜色参数用于动画
        self._normal_fg = kwargs.pop("fg_color", None)
        self._hover_fg = kwargs.pop("hover_color", None)

        # 应用默认颜色（如果有设计系统）
        if self._normal_fg is None and _HAS_DESIGN_SYSTEM:
            self._normal_fg = Colors.BTN_SECONDARY
        if self._hover_fg is None and _HAS_DESIGN_SYSTEM:
            self._hover_fg = Colors.BTN_SECONDARY_HOVER

        # 动画参数
        self._animation_speed = animation_speed
        self._scale_amount = scale_amount
        self._enable_shadow = enable_shadow
        self._current_scale = 1.0
        self._target_scale = 1.0
        self._is_hovering = False
        self._anim_id: str | None = None

        # 阴影容器
        self._shadow_frame: ctk.CTkFrame | None = None
        self._shadow_inner: ctk.CTkFrame | None = None

        # 初始化父类
        super().__init__(
            parent,
            text=text,
            command=command,
            fg_color=self._normal_fg,
            hover_color=self._hover_fg,
            **kwargs,
        )

        # 绑定悬停事件
        self.bind("<Enter>", self._on_enter, add="+")
        self.bind("<Leave>", self._on_leave, add="+")

        # 创建阴影层
        if self._enable_shadow:
            self._create_shadow()

    def _create_shadow(self) -> None:
        """创建阴影层（用于动画效果）。"""
        # 获取父容器
        parent = self.master

        # 阴影容器
        self._shadow_frame = ctk.CTkFrame(
            parent,
            fg_color="transparent",
            corner_radius=self.cget("corner_radius") + 2,
        )
        self._shadow_inner = ctk.CTkFrame(
            self._shadow_frame,
            fg_color=("gray50", "gray15") if not _HAS_DESIGN_SYSTEM else ("#1A202C", "#0D1117"),
            corner_radius=self.cget("corner_radius"),
        )
        self._shadow_inner.pack(fill="both", expand=True, padx=1, pady=1)

    def _update_shadow(self, scale: float) -> None:
        """更新阴影位置和大小。"""
        if not self._enable_shadow or not self._shadow_frame or not self._shadow_frame.winfo_exists():
            return

        # 阴影偏移随缩放变化
        offset = int(4 * scale)
        self._shadow_frame.place(
            in_=self,
            relx=0.5,
            rely=0.5,
            x=offset,
            y=offset,
            anchor="center",
        )

    def _on_enter(self, event) -> None:
        """鼠标进入 - 开始悬停动画。"""
        self._is_hovering = True
        self._target_scale = self._scale_amount
        self._start_animation()

    def _on_leave(self, event) -> None:
        """鼠标离开 - 开始恢复动画。"""
        self._is_hovering = False
        self._target_scale = 1.0
        self._start_animation()

    def _start_animation(self) -> None:
        """开始/继续动画循环。"""
        # 避免重复调度
        anim_key = id(self)
        if anim_key in self._animating_buttons:
            return

        self._animating_buttons.add(anim_key)
        self._animate_step()

    def _animate_step(self) -> None:
        """动画单步。"""
        anim_key = id(self)

        # 检查是否需要继续动画
        if abs(self._current_scale - self._target_scale) < 0.001:
            self._current_scale = self._target_scale
            self._apply_scale()
            self._animating_buttons.discard(anim_key)
            return

        # 平滑插值
        diff = self._target_scale - self._current_scale
        step = diff * 0.25  # 25% 的距离每帧
        if abs(step) < 0.002:
            step = diff  # 接近目标时直接到达

        self._current_scale += step
        self._apply_scale()

        # 继续动画
        if self.winfo_exists():
            self.after(self._animation_speed, self._animate_step)

    def _apply_scale(self) -> None:
        """应用当前缩放。"""
        if not self.winfo_exists():
            return

        # 使用 place 方法的 relwidth/relheight 实现缩放
        # 注意：这只是视觉缩放，不影响实际布局
        scale = self._current_scale

        # 更新阴影
        self._update_shadow(scale)

        # 通过配置 font 实现轻微的文字缩放效果
        # CustomTkinter 不直接支持缩放，我们用配置更新
        current_font = self.cget("font")
        if isinstance(current_font, tuple) and len(current_font) >= 2:
            base_size = current_font[1]
            scaled_size = int(base_size * (0.99 + 0.01 * scale))
            new_font = (current_font[0], scaled_size) + current_font[2:]
            self.configure(font=new_font)

    def destroy(self) -> None:
        """清理动画资源。"""
        anim_key = id(self)
        self._animating_buttons.discard(anim_key)

        # 清理阴影
        if self._shadow_frame and self._shadow_frame.winfo_exists():
            self._shadow_frame.destroy()
            self._shadow_frame = None
            self._shadow_inner = None

        super().destroy()


class AnimatedIconButton(ctk.CTkButton):
    """带动画的图标按钮（小尺寸，用于工具栏等）。

    更小的动画效果，适合紧凑空间。
    """

    def __init__(
        self,
        parent: ctk.CTk,
        text: str = "",
        command: Callable[[], Any] | None = None,
        width: int = 32,
        height: int = 32,
        **kwargs,
    ) -> None:
        # 默认样式
        if _HAS_DESIGN_SYSTEM:
            fg_color = kwargs.pop("fg_color", "transparent")
            hover_color = kwargs.pop("hover_color", Colors.HOVER_LIGHT)
            text_color = kwargs.pop("text_color", Colors.TEXT_PRIMARY)
            corner_radius = kwargs.pop("corner_radius", Radius.SM)
        else:
            fg_color = kwargs.pop("fg_color", "transparent")
            hover_color = kwargs.pop("hover_color", ("gray85", "gray30"))
            text_color = kwargs.pop("text_color", ("gray15", "gray88"))
            corner_radius = kwargs.pop("corner_radius", 6)

        # 动画参数
        self._scale_normal = 1.0
        self._scale_hover = 1.1  # 图标按钮用更大缩放
        self._current_scale = 1.0
        self._animating = False

        super().__init__(
            parent,
            text=text,
            command=command,
            width=width,
            height=height,
            fg_color=fg_color,
            hover_color=hover_color,
            text_color=text_color,
            corner_radius=corner_radius,
            **kwargs,
        )

        # 绑定事件
        self.bind("<Enter>", self._on_enter, add="+")
        self.bind("<Leave>", self._on_leave, add="+")

    def _on_enter(self, event) -> None:
        """悬停 - 缩放动画。"""
        if not self._animating:
            self._animating = True
            self._animate(self._scale_hover)

    def _on_leave(self, event) -> None:
        """离开 - 恢复动画。"""
        if self._animating:
            self._animate(self._scale_normal)

    def _animate(self, target: float) -> None:
        """执行缩放动画。"""
        current = self._current_scale

        if abs(current - target) < 0.01:
            self._current_scale = target
            if target == self._scale_normal:
                self._animating = False
            return

        # 插值
        new_scale = current + (target - current) * 0.3
        self._current_scale = new_scale

        # 应用缩放（通过字体大小）
        font = self.cget("font")
        if isinstance(font, tuple) and len(font) >= 2:
            base_size = font[1]
            scaled = int(base_size * (0.9 + 0.1 * new_scale))
            self.configure(font=(font[0], scaled) + font[2:])

        # 继续动画
        if self.winfo_exists():
            self.after(16, lambda: self._animate(target))


def create_animated_button(
    parent: ctk.CTk,
    text: str,
    command: Callable[[], Any] | None = None,
    style: str = "secondary",
    **kwargs,
) -> AnimatedButton:
    """工厂函数：创建预设样式的动画按钮。

    Args:
        parent: 父容器
        text: 按钮文字
        command: 点击回调
        style: 样式类型 (primary/secondary/ghost)
        **kwargs: 其他参数

    Returns:
        AnimatedButton 实例
    """
    if not _HAS_DESIGN_SYSTEM:
        return AnimatedButton(parent, text=text, command=command, **kwargs)

    # 应用预设样式
    style = style.lower()
    if style == "primary":
        kwargs.setdefault("fg_color", Colors.PRIMARY)
        kwargs.setdefault("hover_color", Colors.PRIMARY_HOVER)
        kwargs.setdefault("text_color", ("#FFFFFF", "#FFFFFF"))
        kwargs.setdefault("height", ButtonSpec.PRIMARY_HEIGHT)
        kwargs.setdefault("corner_radius", ButtonSpec.PRIMARY_RADIUS)
    elif style == "secondary":
        kwargs.setdefault("fg_color", Colors.BTN_SECONDARY)
        kwargs.setdefault("hover_color", Colors.BTN_SECONDARY_HOVER)
        kwargs.setdefault("text_color", Colors.TEXT_PRIMARY)
        kwargs.setdefault("height", ButtonSpec.SECONDARY_HEIGHT)
        kwargs.setdefault("corner_radius", ButtonSpec.SECONDARY_RADIUS)
    elif style == "ghost":
        kwargs.setdefault("fg_color", "transparent")
        kwargs.setdefault("hover_color", Colors.HOVER_LIGHT)
        kwargs.setdefault("text_color", Colors.TEXT_PRIMARY)
        kwargs.setdefault("height", ButtonSpec.GHOST_HEIGHT)
        kwargs.setdefault("corner_radius", ButtonSpec.GHOST_RADIUS)

    kwargs.setdefault("font", ("", FontSize.SM))

    return AnimatedButton(parent, text=text, command=command, **kwargs)


def create_icon_button(
    parent: ctk.CTk,
    icon: str,
    command: Callable[[], Any] | None = None,
    tooltip: str = "",
    **kwargs,
) -> AnimatedIconButton:
    """工厂函数：创建图标按钮。

    Args:
        parent: 父容器
        icon: 图标文字（emoji 或字符）
        command: 点击回调
        tooltip: 工具提示
        **kwargs: 其他参数

    Returns:
        AnimatedIconButton 实例
    """
    btn = AnimatedIconButton(
        parent,
        text=icon,
        command=command,
        **kwargs,
    )

    # TODO: 添加 tooltip 支持

    return btn


# ============================================================================
# 侧边栏会话行动画 (v2.9.0)
# ============================================================================

class AnimatedSessionRow(ctk.CTkFrame):
    """带动画的侧边栏会话行。

    动画效果：
    - 悬停时背景色平滑过渡
    - 选中状态柔和渐变
    - 轻微缩放效果

    设计理念：轻量级、高性能，适合列表场景。
    """

    # 全局动画管理（避免过多并发动画）
    _animating_rows = set()

    def __init__(
        self,
        parent: ctk.CTk,
        title: str,
        message_count: int,
        is_selected: bool = False,
        is_pinned: bool = False,
        is_archived: bool = False,
        on_click: Callable[[], Any] | None = None,
        on_toggle_pin: Callable[[], Any] | None = None,
        on_toggle_archive: Callable[[], Any] | None = None,
        **kwargs,
    ) -> None:
        # 颜色配置
        self._bg_normal = "transparent"
        self._bg_hover = Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray78", "gray28")
        self._bg_selected = Colors.SELECTED_BG if _HAS_DESIGN_SYSTEM else ("gray75", "gray30")
        self._text_color = Colors.TEXT_PRIMARY if _HAS_DESIGN_SYSTEM else ("gray15", "gray88")
        self._count_color = Colors.TEXT_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray50", "gray65")
        self._btn_hover = Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray80", "gray28")

        # 状态
        self._is_selected = is_selected
        self._is_pinned = is_pinned
        self._is_archived = is_archived
        self._is_hovering = False
        self._hover_progress = 0.0  # 0.0 = normal, 1.0 = hover
        self._anim_id: str | None = None

        # 初始化父类
        super().__init__(
            parent,
            fg_color="transparent",
            corner_radius=Radius.SM if _HAS_DESIGN_SYSTEM else 0,
            **kwargs,
        )

        # 创建内部按钮容器（用于背景动画）
        self._bg_frame = ctk.CTkFrame(
            self,
            fg_color=self._bg_selected if is_selected else self._bg_normal,
            corner_radius=Radius.SM if _HAS_DESIGN_SYSTEM else 0,
        )
        self._bg_frame.pack(fill="both", expand=True)

        # 标题按钮
        title_text = (title or "新对话")[:20]
        self._btn_title = ctk.CTkButton(
            self._bg_frame,
            text=title_text,
            anchor="w",
            fg_color="transparent",
            text_color=self._text_color,
            hover_color="transparent",  # 禁用默认悬停，使用自定义
            border_width=0,
            corner_radius=0,
            command=on_click,
        )
        self._btn_title.pack(side="left", fill="both", expand=True, padx=(0, Spacing.XS if _HAS_DESIGN_SYSTEM else 4))

        # 消息数量标签
        self._count_label = ctk.CTkLabel(
            self._bg_frame,
            text=str(message_count),
            font=("", FontSize.XS),
            text_color=self._count_color,
            width=20,
        )
        self._count_label.pack(side="left", padx=(0, 2))

        # 置顶按钮
        pin_text = "📌" if is_pinned else "📍"
        self._btn_pin = ctk.CTkButton(
            self._bg_frame,
            text=pin_text,
            width=26,
            height=26,
            fg_color="transparent",
            hover_color=self._btn_hover,
            border_width=0,
            text_color=self._text_color,
            command=on_toggle_pin,
        )
        self._btn_pin.pack(side="left", padx=2)

        # 归档按钮
        archive_text = "📦" if is_archived else "📂"
        self._btn_archive = ctk.CTkButton(
            self._bg_frame,
            text=archive_text,
            width=26,
            height=26,
            fg_color="transparent",
            hover_color=self._btn_hover,
            border_width=0,
            text_color=self._text_color,
            command=on_toggle_archive,
        )
        self._btn_archive.pack(side="left", padx=2)

        # 绑定悬停事件
        self.bind("<Enter>", self._on_enter, add="+")
        self.bind("<Leave>", self._on_leave, add="+")

    def _on_enter(self, event) -> None:
        """鼠标进入 - 开始悬停动画。"""
        self._is_hovering = True
        self._start_hover_animation()

    def _on_leave(self, event) -> None:
        """鼠标离开 - 开始恢复动画。"""
        self._is_hovering = False
        self._start_hover_animation()

    def _start_hover_animation(self) -> None:
        """开始/继续悬停动画循环。"""
        anim_key = id(self)
        if anim_key in self._animating_rows:
            return

        self._animating_rows.add(anim_key)
        self._animate_hover_step()

    def _animate_hover_step(self) -> None:
        """悬停动画单步。"""
        anim_key = id(self)

        # 计算目标进度
        target = 1.0 if self._is_hovering else 0.0
        diff = target - self._hover_progress

        # 检查是否完成
        if abs(diff) < 0.05:
            self._hover_progress = target
            self._apply_hover_color()
            self._animating_rows.discard(anim_key)
            return

        # 平滑插值（25% 步长）
        step = diff * 0.25
        self._hover_progress += step
        self._apply_hover_color()

        # 继续动画
        if self.winfo_exists():
            self.after(20, self._animate_hover_step)

    def _apply_hover_color(self) -> None:
        """应用当前悬停进度对应的颜色。"""
        if not self._bg_frame or not self._bg_frame.winfo_exists():
            return

        # 获取基础颜色（选中或普通）
        base_bg = self._bg_selected if self._is_selected else self._bg_normal

        # 如果是透明背景，不需要插值
        if base_bg == "transparent":
            # 悬停时显示悬停色
            if self._hover_progress > 0.5:
                self._bg_frame.configure(fg_color=self._bg_hover)
            else:
                self._bg_frame.configure(fg_color="transparent")
            return

        # 颜色插值（简化版本 - 仅对命名颜色有效）
        # 对于 CustomTkinter，我们直接切换以保证性能
        if self._hover_progress > 0.3:
            target_bg = self._bg_hover
        else:
            target_bg = base_bg

        self._bg_frame.configure(fg_color=target_bg)

    def set_selected(self, selected: bool) -> None:
        """更新选中状态。"""
        self._is_selected = selected
        bg = self._bg_selected if selected else self._bg_normal
        self._bg_frame.configure(fg_color=bg)

    def set_pinned(self, pinned: bool) -> None:
        """更新置顶状态。"""
        self._is_pinned = pinned
        self._btn_pin.configure(text="📌" if pinned else "📍")

    def set_archived(self, archived: bool) -> None:
        """更新归档状态。"""
        self._is_archived = archived
        self._btn_archive.configure(text="📦" if archived else "📂")

    def destroy(self) -> None:
        """清理动画资源。"""
        anim_key = id(self)
        self._animating_rows.discard(anim_key)
        super().destroy()


def create_animated_session_row(
    parent: ctk.CTk,
    title: str,
    message_count: int,
    is_selected: bool = False,
    is_pinned: bool = False,
    is_archived: bool = False,
    on_click: Callable[[], Any] | None = None,
    on_toggle_pin: Callable[[], Any] | None = None,
    on_toggle_archive: Callable[[], Any] | None = None,
) -> AnimatedSessionRow:
    """工厂函数：创建动画会话行。

    Args:
        parent: 父容器（通常是 session_list_frame）
        title: 会话标题
        message_count: 消息数量
        is_selected: 是否选中
        is_pinned: 是否置顶
        is_archived: 是否归档
        on_click: 点击回调
        on_toggle_pin: 置顶切换回调
        on_toggle_archive: 归档切换回调

    Returns:
        AnimatedSessionRow 实例
    """
    return AnimatedSessionRow(
        parent,
        title=title,
        message_count=message_count,
        is_selected=is_selected,
        is_pinned=is_pinned,
        is_archived=is_archived,
        on_click=on_click,
        on_toggle_pin=on_toggle_pin,
        on_toggle_archive=on_toggle_archive,
    )


# ============================================================================
# 轻量级悬停动画助手 (v2.9.0)
# ============================================================================

# 全局动画状态管理
_hover_animating_buttons = {}


def apply_smooth_hover(
    button: ctk.CTkButton,
    normal_color: str | tuple = "transparent",
    hover_color: str | tuple | None = None,
    animation_speed: int = 20,
) -> None:
    """为按钮添加平滑悬停动画。

    这是一个轻量级的增强函数，可以在不改变现有代码结构的情况下
    为 CustomTkinter 按钮添加平滑的悬停过渡效果。

    Args:
        button: 目标按钮
        normal_color: 正常状态颜色
        hover_color: 悬停状态颜色（如果为 None，使用按钮原有 hover_color）
        animation_speed: 动画速度（毫秒/帧）

    Example:
        btn = ctk.CTkButton(parent, text="Click me")
        apply_smooth_hover(btn, "transparent", ("gray80", "gray28"))
    """
    if hover_color is None:
        hover_color = button.cget("hover_color")

    # 存储动画状态
    btn_id = id(button)
    _hover_animating_buttons[btn_id] = {
        "is_hovering": False,
        "progress": 0.0,
        "normal_color": normal_color,
        "hover_color": hover_color,
        "animation_id": None,
    }

    # 保存原始悬停颜色（禁用默认悬停效果）
    _hover_animating_buttons[btn_id]["original_hover"] = button.cget("hover_color")

    def on_enter(event):
        """鼠标进入事件。"""
        if btn_id not in _hover_animating_buttons:
            return
        _hover_animating_buttons[btn_id]["is_hovering"] = True
        _animate_hover(button, btn_id, animation_speed)

    def on_leave(event):
        """鼠标离开事件。"""
        if btn_id not in _hover_animating_buttons:
            return
        _hover_animating_buttons[btn_id]["is_hovering"] = False
        _animate_hover(button, btn_id, animation_speed)

    # 绑定事件
    button.bind("<Enter>", on_enter, add="+")
    button.bind("<Leave>", on_leave, add="+")


def _animate_hover(button: ctk.CTkButton, btn_id: int, speed: int) -> None:
    """执行悬停动画单步。"""
    if btn_id not in _hover_animating_buttons:
        return

    state = _hover_animating_buttons[btn_id]
    target = 1.0 if state["is_hovering"] else 0.0
    current = state["progress"]

    # 检查是否完成
    if abs(current - target) < 0.1:
        state["progress"] = target
        _apply_hover_color(button, state)
        return

    # 平滑插值
    new_progress = current + (target - current) * 0.3
    state["progress"] = new_progress
    _apply_hover_color(button, state)

    # 继续动画
    if button.winfo_exists():
        button.after(speed, lambda: _animate_hover(button, btn_id, speed))


def _apply_hover_color(button: ctk.CTkButton, state: dict) -> None:
    """应用当前悬停进度对应的颜色。"""
    progress = state["progress"]
    normal = state["normal_color"]
    hover = state["hover_color"]

    # 简单的阈值切换（避免复杂的颜色插值）
    if progress > 0.5:
        button.configure(fg_color=hover)
    else:
        button.configure(fg_color=normal)


def cleanup_hover_animation(button: ctk.CTkButton) -> None:
    """清理按钮的悬停动画资源。"""
    btn_id = id(button)
    if btn_id in _hover_animating_buttons:
        del _hover_animating_buttons[btn_id]


# ============================================================================
# 批量应用悬停动画到会话列表
# ============================================================================

def enhance_sidebar_buttons(
    session_list_frame: ctk.CTkScrollableFrame,
) -> None:
    """为会话列表中的所有按钮添加悬停动画。

    这是一个便捷函数，可以在会话列表渲染完成后调用，
    为所有会话按钮添加平滑的悬停效果。

    Args:
        session_list_frame: 会话列表容器

    Example:
        _refresh_session_list(...)
        enhance_sidebar_buttons(self._session_list_frame)
    """
    # 获取所有按钮
    buttons = session_list_frame.winfo_children()

    for widget in buttons:
        # 递归查找按钮
        if hasattr(widget, 'winfo_children'):
            for child in widget.winfo_children():
                if isinstance(child, ctk.CTkButton):
                    # 为会话标题按钮添加动画
                    text = child.cget("text")
                    # 跳过图标按钮（emoji）
                    if text and not any(ord(c) > 127 for c in text[:5]):
                        apply_smooth_hover(
                            child,
                            normal_color="transparent",
                            hover_color=Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray78", "gray28"),
                        )
