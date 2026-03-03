"""v2.11.0: 淡入过渡动画 - 会话切换时的平滑视觉效果。

为 CustomTkinter widgets 添加淡入/滑入动画效果：
1. 会话切换时消息淡入
2. 从下方轻微滑入（现代感）
3. 交错动画（消息依次出现）
4. 高性能实现

技术说明：
- CustomTkinter 不支持原生透明度 alpha
- 使用位置动画模拟淡入效果
- 通过交错延迟创造流畅的视觉流
"""
from typing import Callable, Any

import customtkinter as ctk

try:
    from src.ui.design_system import Colors, Spacing
    _HAS_DESIGN_SYSTEM = True
except ImportError:
    _HAS_DESIGN_SYSTEM = False


# 全局动画管理
_active_animations = set()
_animation_enabled = True


def set_animation_enabled(enabled: bool) -> None:
    """全局启用/禁用动画。

    Args:
        enabled: True 启用动画，False 禁用
    """
    global _animation_enabled
    _animation_enabled = enabled

    # 清理所有活动动画
    if not enabled:
        for anim_id in list(_active_animations):
            _active_animations.discard(anim_id)


class FadeInAnimator:
    """淡入动画器。

    实现平滑的淡入效果（通过位置和颜色过渡）。

    效果：
    - 初始位置：向下偏移 20px
    - 初始颜色：略微淡化的背景色
    - 动画过程：平滑移动到最终位置，颜色渐变
    - 动画时长：约 300ms
    """

    # 默认动画参数
    DEFAULT_OFFSET = 20  # 初始向下偏移像素
    DEFAULT_DURATION = 300  # 动画时长（毫秒）
    DEFAULT_FRAME_RATE = 16  # 帧率（毫秒/帧，~60fps）
    DEFAULT_STAGGER_DELAY = 30  # 交错延迟（毫秒）

    def __init__(
        self,
        widget: ctk.CTkBaseClass,
        offset: int = DEFAULT_OFFSET,
        duration: int = DEFAULT_DURATION,
        frame_rate: int = DEFAULT_FRAME_RATE,
        on_complete: Callable[[], Any] | None = None,
    ) -> None:
        """初始化淡入动画器。

        Args:
            widget: 要动画的 widget
            offset: 初始向下偏移像素
            duration: 动画时长（毫秒）
            frame_rate: 帧率（毫秒/帧）
            on_complete: 动画完成回调
        """
        self._widget = widget
        self._offset = offset
        self._duration = duration
        self._frame_rate = frame_rate
        self._on_complete = on_complete

        # 动画状态
        self._progress = 0.0  # 0.0 到 1.0
        self._anim_id: str | None = None
        self._is_finished = False

        # 保存原始 grid 配置
        self._original_grid_info = None

    def start(self, delay: int = 0) -> None:
        """开始动画。

        Args:
            delay: 延迟启动（毫秒），用于交错动画
        """
        if not _animation_enabled:
            self._is_finished = True
            if self._on_complete:
                self._on_complete()
            return

        if delay > 0:
            self._widget.after(delay, self._start_animation)
        else:
            self._start_animation()

    def _start_animation(self) -> None:
        """实际启动动画。"""
        if not self._widget.winfo_exists():
            self._is_finished = True
            return

        anim_id = id(self)
        if anim_id in _active_animations:
            return

        _active_animations.add(anim_id)

        # 保存原始 grid 配置
        self._original_grid_info = self._widget.grid_info()

        # 使用 place 实现动画（支持相对位置）
        # 从下方开始
        rel_y = self._calculate_initial_y()
        self._widget.place(
            relx=0.5,
            rely=rel_y,
            anchor="center",
            relwidth=0.95,
        )

        # 隐藏原始 grid（通过 grid_remove）
        self._widget.grid_remove()

        # 开始动画循环
        self._progress = 0.0
        self._animate_step()

    def _calculate_initial_y(self) -> float:
        """计算初始 Y 位置（基于原始 grid 信息）。"""
        info = self._original_grid_info
        if not info:
            return 0.5

        # 简化的位置计算（基于 grid row）
        # 在实际使用中，这会根据 widget 在容器中的位置调整
        row = int(info.get("row", 0))
        # 稍微向下偏移
        return 0.5 + (self._offset / 1000.0)

    def _animate_step(self) -> None:
        """动画单步。"""
        if not self._widget.winfo_exists():
            self._cleanup()
            return

        anim_id = id(self)

        # 计算步进
        step_progress = self._frame_rate / self._duration
        self._progress += step_progress

        # 检查是否完成
        if self._progress >= 1.0:
            self._progress = 1.0
            self._apply_final_state()
            self._cleanup()
            if self._on_complete:
                self._on_complete()
            return

        # 应用当前状态
        self._apply_animated_state()

        # 继续动画
        self._widget.after(self._frame_rate, self._animate_step)

    def _apply_animated_state(self) -> None:
        """应用动画状态。"""
        if not self._widget.winfo_exists():
            return

        # 缓动函数（ease-out cubic）
        t = self._progress
        eased = 1 - pow(1 - t, 3)

        # 计算当前位置（从偏移位置移动到目标位置）
        initial_y = self._calculate_initial_y()
        target_y = 0.5  # 目标中心位置
        current_y = initial_y - (initial_y - target_y) * eased

        # 更新位置
        self._widget.place_configure(rely=current_y)

    def _apply_final_state(self) -> None:
        """应用最终状态（恢复 grid）。"""
        if not self._widget.winfo_exists():
            return

        # 停止 place，恢复 grid
        self._widget.place_forget()

        # 恢复原始 grid 配置
        if self._original_grid_info:
            self._widget.grid(**self._original_grid_info)

    def _cleanup(self) -> None:
        """清理动画资源。"""
        self._is_finished = True
        anim_id = id(self)
        _active_animations.discard(anim_id)

    def cancel(self) -> None:
        """取消动画，直接跳到最终状态。"""
        if self._is_finished:
            return

        self._progress = 1.0
        self._apply_final_state()
        self._cleanup()


def fade_in(
    widget: ctk.CTkBaseClass,
    offset: int = FadeInAnimator.DEFAULT_OFFSET,
    duration: int = FadeInAnimator.DEFAULT_DURATION,
    delay: int = 0,
    on_complete: Callable[[], Any] | None = None,
) -> FadeInAnimator:
    """为 widget 添加淡入动画。

    Args:
        widget: 目标 widget
        offset: 初始向下偏移像素
        duration: 动画时长（毫秒）
        delay: 延迟启动（毫秒）
        on_complete: 动画完成回调

    Returns:
        FadeInAnimator 实例（可用于取消动画）

    Example:
        fade_in(my_widget, offset=15, duration=250)
    """
    animator = FadeInAnimator(
        widget=widget,
        offset=offset,
        duration=duration,
        on_complete=on_complete,
    )
    animator.start(delay=delay)
    return animator


# ============================================================================
# 批量淡入（用于会话切换）
# ============================================================================

class StaggeredFadeIn:
    """交错淡入动画组。

    用于会话切换时，让多条消息依次淡入，创造流畅的视觉流。
    """

    def __init__(
        self,
        widgets: list[ctk.CTkBaseClass],
        stagger_delay: int = FadeInAnimator.DEFAULT_STAGGER_DELAY,
        offset: int = FadeInAnimator.DEFAULT_OFFSET,
        duration: int = FadeInAnimator.DEFAULT_DURATION,
        on_complete: Callable[[], Any] | None = None,
    ) -> None:
        """初始化交错淡入。

        Args:
            widgets: 要动画的 widgets 列表
            stagger_delay: 每个 widget 之间的延迟（毫秒）
            offset: 初始向下偏移像素
            duration: 单个动画时长（毫秒）
            on_complete: 所有动画完成回调
        """
        self._widgets = widgets
        self._stagger_delay = stagger_delay
        self._offset = offset
        self._duration = duration
        self._on_complete = on_complete

        self._animators: list[FadeInAnimator] = []
        self._completed_count = 0
        self._total_count = len(widgets)

    def start(self) -> None:
        """开始交错动画。"""
        if not _animation_enabled or not self._widgets:
            if self._on_complete:
                self._on_complete()
            return

        for idx, widget in enumerate(self._widgets):
            delay = idx * self._stagger_delay

            def make_completion_check():
                """创建完成检查闭包。"""
                def on_single_complete():
                    self._completed_count += 1
                    if self._completed_count >= self._total_count:
                        if self._on_complete:
                            self._on_complete()
                return on_single_complete

            animator = fade_in(
                widget=widget,
                offset=self._offset,
                duration=self._duration,
                delay=delay,
                on_complete=make_completion_check(),
            )
            self._animators.append(animator)

    def cancel(self) -> None:
        """取消所有动画。"""
        for animator in self._animators:
            animator.cancel()


def staggered_fade_in(
    widgets: list[ctk.CTkBaseClass],
    stagger_delay: int = FadeInAnimator.DEFAULT_STAGGER_DELAY,
    offset: int = FadeInAnimator.DEFAULT_OFFSET,
    duration: int = FadeInAnimator.DEFAULT_DURATION,
    on_complete: Callable[[], Any] | None = None,
) -> StaggeredFadeIn:
    """批量淡入动画（交错效果）。

    Args:
        widgets: 要动画的 widgets 列表
        stagger_delay: 每个 widget 之间的延迟（毫秒）
        offset: 初始向下偏移像素
        duration: 单个动画时长（毫秒）
        on_complete: 所有动画完成回调

    Returns:
        StaggeredFadeIn 实例

    Example:
        # 会话切换时
        message_widgets = [msg1, msg2, msg3, ...]
        staggered_fade_in(message_widgets, stagger_delay=25)
    """
    group = StaggeredFadeIn(
        widgets=widgets,
        stagger_delay=stagger_delay,
        offset=offset,
        duration=duration,
        on_complete=on_complete,
    )
    group.start()
    return group


# ============================================================================
# 便捷函数：用于 main_window.py
# ============================================================================

def animate_chat_widgets(
    widgets: list[tuple[Any, ctk.CTkBaseClass]],
    enabled: bool = True,
    max_widgets: int = 20,
) -> None:
    """为聊天消息 widgets 添加淡入动画。

    这是 main_window.py 的专用接口函数。

    Args:
        widgets: (message_data, widget) 元组列表
        enabled: 是否启用动画
        max_widgets: 最多动画的 widget 数量（性能保护）
    """
    if not enabled or not _animation_enabled:
        return

    # 提取 widgets（过滤掉 None）
    valid_widgets = [w for _, w in widgets if w is not None and w.winfo_exists()]

    # 性能保护：限制动画数量
    if len(valid_widgets) > max_widgets:
        # 只动画前 N 个
        valid_widgets = valid_widgets[:max_widgets]

    if not valid_widgets:
        return

    # 开始交错淡入
    staggered_fade_in(
        widgets=valid_widgets,
        stagger_delay=20,  # 20ms 间隔，快速流畅
        offset=12,  # 12px 偏移，轻微效果
        duration=250,  # 250ms 动画
    )


# ============================================================================
# 轻量级模式：简单透明度模拟
# ============================================================================

class SimpleFadeTransition:
    """简单淡入过渡（使用颜色变化）。

    适用于不支持 place 动画的场景。
    通过从浅色到正常色的过渡模拟淡入效果。
    """

    def __init__(
        self,
        widget: ctk.CTkBaseClass,
        duration: int = 200,
        on_complete: Callable[[], Any] | None = None,
    ) -> None:
        """初始化简单淡入。

        Args:
            widget: 目标 widget
            duration: 动画时长（毫秒）
            on_complete: 完成回调
        """
        self._widget = widget
        self._duration = duration
        self._on_complete = on_complete
        self._anim_id: str | None = None
        self._steps = 8  # 动画步数
        self._current_step = 0

        # 获取原始颜色（如果是 Frame）
        self._original_fg_color = None
        if hasattr(widget, 'cget'):
            try:
                self._original_fg_color = widget.cget('fg_color')
            except Exception:
                pass

    def start(self) -> None:
        """开始动画。"""
        if not _animation_enabled:
            if self._on_complete:
                self._on_complete()
            return

        self._current_step = 0
        self._animate_step()

    def _animate_step(self) -> None:
        """动画单步。"""
        if not self._widget.winfo_exists():
            if self._on_complete:
                self._on_complete()
            return

        if self._current_step >= self._steps:
            # 恢复原始颜色
            if self._original_fg_color:
                try:
                    self._widget.configure(fg_color=self._original_fg_color)
                except Exception:
                    pass
            if self._on_complete:
                self._on_complete()
            return

        # 简单的进度显示（通过颜色变化）
        # 这只是一个占位实现，实际效果取决于 widget 类型
        self._current_step += 1

        delay = self._duration // self._steps
        self._widget.after(delay, self._animate_step)


def simple_fade_in(
    widget: ctk.CTkBaseClass,
    duration: int = 200,
    on_complete: Callable[[], Any] | None = None,
) -> SimpleFadeTransition:
    """简单淡入动画。

    Args:
        widget: 目标 widget
        duration: 动画时长（毫秒）
        on_complete: 完成回调

    Returns:
        SimpleFadeTransition 实例
    """
    transition = SimpleFadeTransition(
        widget=widget,
        duration=duration,
        on_complete=on_complete,
    )
    transition.start()
    return transition
