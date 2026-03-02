"""会话统计对话框 - 显示会话的使用数据。"""
from datetime import datetime
import customtkinter as ctk
from tkinter import filedialog

from src.app.statistics import (
    save_session_stats,
    save_global_stats,
)

# v2.0.0: 设计系统
try:
    from src.ui.design_system import Colors, Spacing, Radius, FontSize
    _HAS_DESIGN_SYSTEM = True
except ImportError:
    _HAS_DESIGN_SYSTEM = False


def _get_color_for_level(level: int, max_level: int) -> tuple[str, str]:
    """根据活跃程度获取颜色。

    Args:
        level: 当前值
        max_level: 最大值

    Returns:
        (light_color, dark_color) 元组
    """
    if max_level == 0:
        return ("#d1d5db", "#4b5563")

    ratio = level / max_level
    if ratio >= 0.8:
        return ("#60a5fa", "#3b82f6")  # 高活跃 - 蓝色
    elif ratio >= 0.5:
        return ("#34d399", "#10b981")  # 中活跃 - 绿色
    elif ratio >= 0.3:
        return ("#fbbf24", "#f59e0b")  # 低活跃 - 黄色
    else:
        return ("#9ca3af", "#6b7280")  # 极低活跃 - 灰色


class StatisticsDialog:
    """会话统计对话框。"""

    def __init__(self, parent: ctk.CTk, stats) -> None:
        """创建统计对话框。

        Args:
            parent: 父窗口
            stats: SessionStats 统计数据对象
        """
        self._parent = parent
        self._stats = stats
        self._widget: ctk.CTkToplevel | None = None
        self._create_dialog()

    def _create_dialog(self) -> None:
        """创建对话框。"""
        self._widget = ctk.CTkToplevel(self._parent)
        self._widget.title("会话统计")
        self._widget.geometry("520x450")
        self._widget.transient(self._parent)
        self._widget.grab_set()

        # 居中显示
        self._widget.update_idletasks()
        parent_x = self._parent.winfo_x()
        parent_y = self._parent.winfo_y()
        parent_w = self._parent.winfo_width()
        parent_h = self._parent.winfo_height()
        dlg_w = 520
        dlg_h = 450
        self._widget.geometry(f"{dlg_w}x{dlg_h}+{parent_x + (parent_w - dlg_w) // 2}+{parent_y + (parent_h - dlg_h) // 2}")

        # 主容器
        main = ctk.CTkFrame(self._widget, fg_color="transparent")
        main.pack(fill="both", expand=True, padx=24, pady=24)

        # 标题栏
        header = ctk.CTkFrame(main, fg_color="transparent")
        header.pack(fill="x", pady=(0, 20))

        ctk.CTkLabel(
            header,
            text="📊 会话统计",
            font=("", 18, "bold"),
        ).pack(side="left")

        # 会话标题
        if self._stats.session_title:
            ctk.CTkLabel(
                header,
                text=self._stats.session_title,
                font=("", 12),
                text_color=("gray50", "gray60"),
            ).pack(side="left", padx=(8, 0))

        # 主要统计卡片（3列）
        cards_frame = ctk.CTkFrame(main, fg_color="transparent")
        cards_frame.pack(fill="x", pady=(0, 16))

        # 总字数卡片
        self._create_stat_card(
            cards_frame,
            icon="📝",
            value=self._format_number(self._stats.word_count_total),
            label="总字数",
            color=("#60a5fa", "#3b82f6"),
        )

        # 消息数卡片
        self._create_stat_card(
            cards_frame,
            icon="💬",
            value=str(self._stats.message_count_total),
            label="消息数",
            color=("#34d399", "#10b981"),
        )

        # 时长卡片
        self._create_stat_card(
            cards_frame,
            icon="⏱",
            value=self._stats.duration_formatted,
            label="时长",
            color=("#fbbf24", "#f59e0b"),
        )

        # 详细统计（2列）
        detail_frame = ctk.CTkFrame(main, fg_color="transparent")
        detail_frame.pack(fill="x", pady=(0, 16))

        # 用户统计
        self._create_detail_card(
            detail_frame,
            icon="👤",
            title="你",
            word_count=self._stats.word_count_user,
            message_count=self._stats.message_count_user,
        )

        # AI 统计
        self._create_detail_card(
            detail_frame,
            icon="🤖",
            title="AI",
            word_count=self._stats.word_count_ai,
            message_count=self._stats.message_count_ai,
        )

        # v2.0.0: 时间范围信息 - 使用设计系统
        if self._stats.first_message_time or self._stats.last_message_time:
            time_bg = Colors.BG_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray90", "gray25")
            time_radius = Radius.MD if _HAS_DESIGN_SYSTEM else 8
            time_frame = ctk.CTkFrame(
                main,
                fg_color=time_bg,
                corner_radius=time_radius,
            )
            time_frame.pack(fill="x", pady=(0, 16))

            ctk.CTkLabel(
                time_frame,
                text="📅 时间范围",
                font=("", FontSize.LG, "bold"),
            ).pack(anchor="w", padx=Spacing.MD, pady=(Spacing.SM, Spacing.XS))

            if self._stats.first_message_time:
                ctk.CTkLabel(
                    time_frame,
                    text=f"开始: {self._stats.first_message_time}",
                    font=("", FontSize.SM),
                    text_color=Colors.TEXT_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray50", "gray60"),
                ).pack(anchor="w", padx=Spacing.MD, pady=2)

            if self._stats.last_message_time:
                ctk.CTkLabel(
                    time_frame,
                    text=f"结束: {self._stats.last_message_time}",
                    font=("", FontSize.SM),
                    text_color=Colors.TEXT_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray50", "gray60"),
                ).pack(anchor="w", padx=Spacing.MD, pady=(2, Spacing.SM))

        # 每日活动图表
        if self._stats.daily_stats:
            self._create_daily_chart(main)

        # v2.0.0: 提示信息 - 使用设计系统
        if not self._stats.has_data:
            hint_bg = Colors.BG_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray90", "gray25")
            hint_radius = Radius.MD if _HAS_DESIGN_SYSTEM else 8
            hint_frame = ctk.CTkFrame(
                main,
                fg_color=hint_bg,
                corner_radius=hint_radius,
            )
            hint_frame.pack(fill="x", pady=(0, 16))

            ctk.CTkLabel(
                hint_frame,
                text="💡 此会话还没有消息",
                font=("", FontSize.SM),
                text_color=Colors.TEXT_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray50", "gray60"),
                padx=Spacing.MD,
                pady=Spacing.SM,
            ).pack()

        # 按钮容器
        button_frame = ctk.CTkFrame(main, fg_color="transparent")
        button_frame.pack(pady=(Spacing.XS, 0))

        # v2.0.0: 导出按钮 - 使用品牌色
        export_btn = ctk.CTkButton(
            button_frame,
            text="📤 导出",
            width=100,
            command=self._export,
            fg_color=Colors.PRIMARY if _HAS_DESIGN_SYSTEM else ("#60a5fa", "#3b82f6"),
            hover_color=Colors.PRIMARY_HOVER if _HAS_DESIGN_SYSTEM else ("#3b82f6", "#2563eb"),
        )
        export_btn.pack(side="left", padx=(0, 8))

        # 关闭按钮
        close_btn = ctk.CTkButton(
            button_frame,
            text="关闭",
            width=100,
            command=self._close,
        )
        close_btn.pack(side="left")

        # ESC 关闭
        self._widget.bind("<Escape>", lambda e: self._close())

    def _export(self) -> None:
        """导出统计数据到文件。"""
        # 生成默认文件名
        safe_title = "".join(c for c in self._stats.session_title if c.isalnum() or c in (" ", "-", "_")).strip()
        if not safe_title:
            safe_title = "session"
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        default_name = f"{safe_title}_stats_{timestamp}"

        # 文件类型选择
        file_types = [
            ("JSON 文件", "*.json"),
            ("CSV 文件", "*.csv"),
            ("文本文件", "*.txt"),
        ]

        file_path = filedialog.asksaveasfilename(
            title="导出统计数据",
            initialfile=default_name,
            defaultextension=".json",
            filetypes=file_types,
        )

        if not file_path:
            return  # 用户取消

        # 根据扩展名确定格式
        if isinstance(file_path, str):
            ext = file_path.split(".")[-1].lower() if "." in file_path else "json"
        else:
            ext = "json"

        if ext == "csv":
            format_type = "csv"
        elif ext == "txt":
            format_type = "txt"
        else:
            format_type = "json"

        try:
            save_session_stats(self._stats, file_path, format_type)
            # 显示成功提示
            self._show_success_message(f"统计数据已导出到:\n{file_path}")
        except Exception as e:
            self._show_error_message(f"导出失败: {e}")

    def _show_success_message(self, message: str) -> None:
        """显示成功消息。"""
        if self._widget and self._widget.winfo_exists():
            dialog = ctk.CTkToplevel(self._widget)
            dialog.title("成功")
            dialog.geometry("400x120")
            dialog.transient(self._widget)
            dialog.grab_set()

            # 居中
            dialog.update_idletasks()
            parent_x = self._widget.winfo_x()
            parent_y = self._widget.winfo_y()
            parent_w = self._widget.winfo_width()
            parent_h = self._widget.winfo_height()
            dlg_w = 400
            dlg_h = 120
            dialog.geometry(f"{dlg_w}x{dlg_h}+{parent_x + (parent_w - dlg_w) // 2}+{parent_y + (parent_h - dlg_h) // 2}")

            frame = ctk.CTkFrame(dialog, fg_color="transparent")
            frame.pack(fill="both", expand=True, padx=24, pady=24)

            ctk.CTkLabel(
                frame,
                text="✅ " + message,
                font=("", 12),
            ).pack(expand=True)

            ctk.CTkButton(
                frame,
                text="确定",
                width=80,
                command=dialog.destroy,
            ).pack(pady=(8, 0))

    def _show_error_message(self, message: str) -> None:
        """显示错误消息。"""
        if self._widget and self._widget.winfo_exists():
            dialog = ctk.CTkToplevel(self._widget)
            dialog.title("错误")
            dialog.geometry("400x120")
            dialog.transient(self._widget)
            dialog.grab_set()

            # 居中
            dialog.update_idletasks()
            parent_x = self._widget.winfo_x()
            parent_y = self._widget.winfo_y()
            parent_w = self._widget.winfo_width()
            parent_h = self._widget.winfo_height()
            dlg_w = 400
            dlg_h = 120
            dialog.geometry(f"{dlg_w}x{dlg_h}+{parent_x + (parent_w - dlg_w) // 2}+{parent_y + (parent_h - dlg_h) // 2}")

            frame = ctk.CTkFrame(dialog, fg_color="transparent")
            frame.pack(fill="both", expand=True, padx=24, pady=24)

            ctk.CTkLabel(
                frame,
                text="❌ " + message,
                font=("", 12),
                text_color=("#dc2626", "#ef4444"),
            ).pack(expand=True)

            ctk.CTkButton(
                frame,
                text="确定",
                width=80,
                command=dialog.destroy,
            ).pack(pady=(8, 0))

    def _create_stat_card(
        self,
        parent: ctk.CTkFrame,
        icon: str,
        value: str,
        label: str,
        color: tuple[str, str],
    ) -> None:
        """v2.0.0: 创建统计卡片 - 使用设计系统。"""
        card_bg = Colors.BG_ELEVATED if _HAS_DESIGN_SYSTEM else ("gray95", "gray20")
        card_border = Colors.BORDER_SUBTLE if _HAS_DESIGN_SYSTEM else ("gray80", "gray30")
        card_radius = Radius.LG if _HAS_DESIGN_SYSTEM else 12
        card = ctk.CTkFrame(
            parent,
            fg_color=card_bg,
            corner_radius=card_radius,
            border_width=1,
            border_color=card_border,
        )
        card.pack(side="left", expand=True, fill="both", padx=Spacing.XS)

        # 图标
        ctk.CTkLabel(
            card,
            text=icon,
            font=("", 20),
        ).pack(pady=(Spacing.MD, Spacing.XS))

        # 数值
        ctk.CTkLabel(
            card,
            text=value,
            font=("", 24, "bold"),
            text_color=color,
        ).pack(pady=(Spacing.XS, 2))

        # 标签
        ctk.CTkLabel(
            card,
            text=label,
            font=("", 12),
            text_color=("gray50", "gray60"),
        ).pack(pady=(2, 12))

    def _create_detail_card(
        self,
        parent: ctk.CTkFrame,
        icon: str,
        title: str,
        word_count: int,
        message_count: int,
    ) -> None:
        """v2.0.0: 创建详细统计卡片 - 使用设计系统。"""
        card_bg = Colors.BG_ELEVATED if _HAS_DESIGN_SYSTEM else ("gray95", "gray20")
        card_border = Colors.BORDER_SUBTLE if _HAS_DESIGN_SYSTEM else ("gray80", "gray30")
        card_radius = Radius.LG if _HAS_DESIGN_SYSTEM else 12
        card = ctk.CTkFrame(
            parent,
            fg_color=card_bg,
            corner_radius=card_radius,
            border_width=1,
            border_color=card_border,
        )
        card.pack(side="left", expand=True, fill="both", padx=Spacing.XS)

        # 标题行
        header = ctk.CTkFrame(card, fg_color="transparent")
        header.pack(pady=(Spacing.MD, Spacing.SM))
        ctk.CTkLabel(header, text=icon, font=("", FontSize.XL)).pack(side="left", padx=(Spacing.MD, Spacing.XS))
        ctk.CTkLabel(header, text=title, font=("", FontSize.LG, "bold")).pack(side="left")

        # 字数
        ctk.CTkLabel(
            card,
            text=f"{self._format_number(word_count)} 字",
            font=("", FontSize.XL, "bold"),
            text_color=Colors.PRIMARY if _HAS_DESIGN_SYSTEM else ("#60a5fa", "#3b82f6"),
        ).pack(anchor="w", padx=Spacing.MD, pady=2)

        # 消息数
        ctk.CTkLabel(
            card,
            text=f"{message_count} 条消息",
            font=("", FontSize.SM),
            text_color=Colors.TEXT_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray50", "gray60"),
        ).pack(anchor="w", padx=Spacing.MD, pady=(2, Spacing.MD))

    def _format_number(self, num: int) -> str:
        """格式化数字（K/M 后缀）。"""
        if num >= 1_000_000:
            return f"{num / 1_000_000:.1f}M"
        if num >= 1_000:
            return f"{num / 1_000:.1f}K"
        return str(num)

    def _create_daily_chart(self, parent: ctk.CTkFrame) -> None:
        """创建每日活动图表。"""
        daily_stats = self._stats.daily_stats
        if not daily_stats:
            return

        # 获取最大消息数用于计算比例
        max_messages = max(s.message_count for s in daily_stats)

        # 图表容器
        chart_frame = ctk.CTkFrame(
            parent,
            fg_color=("gray90", "gray25"),
            corner_radius=8,
        )
        chart_frame.pack(fill="x", pady=(0, 16))

        # 标题
        ctk.CTkLabel(
            chart_frame,
            text="📈 每日活动",
            font=("", 13, "bold"),
        ).pack(anchor="w", padx=12, pady=(8, 4))

        # 图表区域
        chart_area = ctk.CTkFrame(chart_frame, fg_color="transparent")
        chart_area.pack(fill="x", padx=12, pady=(4, 8))

        # 显示最近最多 7 天（或全部天数，如果少于 7 天）
        display_stats = daily_stats[-7:] if len(daily_stats) > 7 else daily_stats

        # 计算每列宽度
        cols = len(display_stats)
        bar_width = max(24, min(40, 300 // cols)) if cols > 0 else 30

        for i, day_stat in enumerate(display_stats):
            # 每列容器
            col_frame = ctk.CTkFrame(chart_area, fg_color="transparent")
            col_frame.pack(side="left", expand=True, padx=2)

            # 消息数标签
            msg_color = _get_color_for_level(day_stat.message_count, max_messages)
            ctk.CTkLabel(
                col_frame,
                text=str(day_stat.message_count),
                font=("", 10, "bold"),
                text_color=msg_color,
            ).pack(pady=(0, 2))

            # 柱状图
            bar_height = max(8, min(60, int(day_stat.message_count / max_messages * 60))) if max_messages > 0 else 8
            bar = ctk.CTkFrame(
                col_frame,
                fg_color=msg_color,
                corner_radius=3,
                width=bar_width,
            )
            bar.pack(pady=(0, 2))

            # 日期标签
            ctk.CTkLabel(
                col_frame,
                text=day_stat.get_day_label(),
                font=("", 9),
                text_color=("gray50", "gray60"),
            ).pack()

            # 星期标签
            ctk.CTkLabel(
                col_frame,
                text=day_stat.get_weekday(),
                font=("", 8),
                text_color=("gray40", "gray50"),
            ).pack(pady=(0, 4))

    def _close(self) -> None:
        """关闭对话框。"""
        if self._widget and self._widget.winfo_exists():
            self._widget.destroy()
            self._widget = None


def open_statistics_dialog(parent: ctk.CTk, stats) -> None:
    """打开统计对话框的便捷函数。"""
    StatisticsDialog(parent, stats)


class GlobalStatisticsDialog:
    """全局统计对话框（跨所有会话）。"""

    def __init__(self, parent: ctk.CTk, stats) -> None:
        """创建全局统计对话框。

        Args:
            parent: 父窗口
            stats: GlobalStats 统计数据对象
        """
        self._parent = parent
        self._stats = stats
        self._widget: ctk.CTkToplevel | None = None
        self._create_dialog()

    def _create_dialog(self) -> None:
        """创建对话框。"""
        self._widget = ctk.CTkToplevel(self._parent)
        self._widget.title("全局统计")
        self._widget.geometry("560x600")
        self._widget.transient(self._parent)
        self._widget.grab_set()

        # 居中显示
        self._widget.update_idletasks()
        parent_x = self._parent.winfo_x()
        parent_y = self._parent.winfo_y()
        parent_w = self._parent.winfo_width()
        parent_h = self._parent.winfo_height()
        dlg_w = 560
        dlg_h = 600
        self._widget.geometry(f"{dlg_w}x{dlg_h}+{parent_x + (parent_w - dlg_w) // 2}+{parent_y + (parent_h - dlg_h) // 2}")

        # 滚动容器
        scroll_frame = ctk.CTkScrollableFrame(
            self._widget,
            fg_color="transparent",
        )
        scroll_frame.pack(fill="both", expand=True, padx=24, pady=24)

        # 标题栏
        header = ctk.CTkFrame(scroll_frame, fg_color="transparent")
        header.pack(fill="x", pady=(0, 20))

        ctk.CTkLabel(
            header,
            text="📊 全局统计",
            font=("", 18, "bold"),
        ).pack(side="left")

        # 主要统计卡片（4列）
        cards_frame = ctk.CTkFrame(scroll_frame, fg_color="transparent")
        cards_frame.pack(fill="x", pady=(0, 16))

        self._create_stat_card(
            cards_frame,
            icon="💬",
            value=self._format_number(self._stats.message_count_total),
            label="总消息数",
            color=("#60a5fa", "#3b82f6"),
        )

        self._create_stat_card(
            cards_frame,
            icon="📝",
            value=self._format_number(self._stats.total_words),
            label="总字数",
            color=("#34d399", "#10b981"),
        )

        self._create_stat_card(
            cards_frame,
            icon="📁",
            value=str(self._stats.total_sessions),
            label="会话数",
            color=("#fbbf24", "#f59e0b"),
        )

        self._create_stat_card(
            cards_frame,
            icon="📅",
            value=str(self._stats.active_days),
            label="活跃天数",
            color=("#a78bfa", "#8b5cf6"),
        )

        # 详细统计（3列）
        detail_frame = ctk.CTkFrame(scroll_frame, fg_color="transparent")
        detail_frame.pack(fill="x", pady=(0, 16))

        # 用户统计
        self._create_detail_card(
            detail_frame,
            icon="👤",
            title="你",
            word_count=self._stats.word_count_user,
            message_count=self._stats.message_count_user,
        )

        # AI 统计
        self._create_detail_card(
            detail_frame,
            icon="🤖",
            title="AI",
            word_count=self._stats.word_count_ai,
            message_count=self._stats.message_count_ai,
        )

        # 平均值统计
        self._create_avg_card(
            detail_frame,
            icon="📈",
            avg_per_session=self._stats.avg_messages_per_session,
            avg_per_day=self._stats.avg_messages_per_day,
        )

        # 时间范围信息
        if self._stats.first_message_time or self._stats.last_message_time:
            time_frame = ctk.CTkFrame(
                scroll_frame,
                fg_color=("gray90", "gray25"),
                corner_radius=8,
            )
            time_frame.pack(fill="x", pady=(0, 16))

            ctk.CTkLabel(
                time_frame,
                text="⏱ 时间范围",
                font=("", 13, "bold"),
            ).pack(anchor="w", padx=12, pady=(8, 4))

            if self._stats.first_message_time:
                ctk.CTkLabel(
                    time_frame,
                    text=f"开始: {self._stats.first_message_time}",
                    font=("", 11),
                    text_color=("gray50", "gray60"),
                ).pack(anchor="w", padx=12, pady=2)

            if self._stats.last_message_time:
                ctk.CTkLabel(
                    time_frame,
                    text=f"结束: {self._stats.last_message_time}",
                    font=("", 11),
                    text_color=("gray50", "gray60"),
                ).pack(anchor="w", padx=12, pady=(2, 8))

            ctk.CTkLabel(
                time_frame,
                text=f"总时长: {self._stats.duration_formatted}",
                font=("", 11),
                text_color=("gray50", "gray60"),
            ).pack(anchor="w", padx=12, pady=(2, 8))

        # 热门会话
        if self._stats.top_sessions:
            top_frame = ctk.CTkFrame(
                scroll_frame,
                fg_color=("gray90", "gray25"),
                corner_radius=8,
            )
            top_frame.pack(fill="x", pady=(0, 16))

            ctk.CTkLabel(
                top_frame,
                text="🔥 热门会话",
                font=("", 13, "bold"),
            ).pack(anchor="w", padx=12, pady=(8, 4))

            for idx, (sid, title, count) in enumerate(self._stats.top_sessions):
                row = ctk.CTkFrame(top_frame, fg_color="transparent")
                row.pack(fill="x", padx=12, pady=2)

                # 排名
                ctk.CTkLabel(
                    row,
                    text=f"{idx + 1}",
                    font=("", 11, "bold"),
                    text_color=("#60a5fa", "#3b82f6"),
                    width=20,
                ).pack(side="left")

                # 标题（截断长标题）
                display_title = title[:20] + "..." if len(title) > 20 else title
                ctk.CTkLabel(
                    row,
                    text=display_title,
                    font=("", 11),
                ).pack(side="left", fill="x", expand=True)

                # 消息数
                ctk.CTkLabel(
                    row,
                    text=f"{count} 条",
                    font=("", 11),
                    text_color=("gray50", "gray60"),
                ).pack(side="right")

            top_frame.pack(pady=(0, 16))

        # 每日活动图表
        if self._stats.daily_stats:
            self._create_daily_chart(scroll_frame)

        # 提示信息
        if not self._stats.has_data:
            hint_frame = ctk.CTkFrame(
                scroll_frame,
                fg_color=("gray90", "gray25"),
                corner_radius=8,
            )
            hint_frame.pack(fill="x", pady=(0, 16))

            ctk.CTkLabel(
                hint_frame,
                text="💡 还没有消息数据",
                font=("", 11),
                text_color=("gray50", "gray60"),
                padx=12,
                pady=8,
            ).pack()

        # 按钮容器
        button_frame = ctk.CTkFrame(scroll_frame, fg_color="transparent")
        button_frame.pack(pady=(8, 0))

        # 导出按钮
        export_btn = ctk.CTkButton(
            button_frame,
            text="📤 导出",
            width=100,
            command=self._export,
            fg_color=("#60a5fa", "#3b82f6"),
            hover_color=("#3b82f6", "#2563eb"),
        )
        export_btn.pack(side="left", padx=(0, 8))

        # 关闭按钮
        close_btn = ctk.CTkButton(
            button_frame,
            text="关闭",
            width=100,
            command=self._close,
        )
        close_btn.pack(side="left")

        # ESC 关闭
        self._widget.bind("<Escape>", lambda e: self._close())

    def _export(self) -> None:
        """导出全局统计数据到文件。"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        default_name = f"global_stats_{timestamp}"

        # 文件类型选择
        file_types = [
            ("JSON 文件", "*.json"),
            ("CSV 文件", "*.csv"),
            ("文本文件", "*.txt"),
        ]

        file_path = filedialog.asksaveasfilename(
            title="导出全局统计数据",
            initialfile=default_name,
            defaultextension=".json",
            filetypes=file_types,
        )

        if not file_path:
            return  # 用户取消

        # 根据扩展名确定格式
        if isinstance(file_path, str):
            ext = file_path.split(".")[-1].lower() if "." in file_path else "json"
        else:
            ext = "json"

        if ext == "csv":
            format_type = "csv"
        elif ext == "txt":
            format_type = "txt"
        else:
            format_type = "json"

        try:
            save_global_stats(self._stats, file_path, format_type)
            # 显示成功提示
            self._show_success_message(f"全局统计数据已导出到:\n{file_path}")
        except Exception as e:
            self._show_error_message(f"导出失败: {e}")

    def _show_success_message(self, message: str) -> None:
        """显示成功消息。"""
        if self._widget and self._widget.winfo_exists():
            dialog = ctk.CTkToplevel(self._widget)
            dialog.title("成功")
            dialog.geometry("400x120")
            dialog.transient(self._widget)
            dialog.grab_set()

            # 居中
            dialog.update_idletasks()
            parent_x = self._widget.winfo_x()
            parent_y = self._widget.winfo_y()
            parent_w = self._widget.winfo_width()
            parent_h = self._widget.winfo_height()
            dlg_w = 400
            dlg_h = 120
            dialog.geometry(f"{dlg_w}x{dlg_h}+{parent_x + (parent_w - dlg_w) // 2}+{parent_y + (parent_h - dlg_h) // 2}")

            frame = ctk.CTkFrame(dialog, fg_color="transparent")
            frame.pack(fill="both", expand=True, padx=24, pady=24)

            ctk.CTkLabel(
                frame,
                text="✅ " + message,
                font=("", 12),
            ).pack(expand=True)

            ctk.CTkButton(
                frame,
                text="确定",
                width=80,
                command=dialog.destroy,
            ).pack(pady=(8, 0))

    def _show_error_message(self, message: str) -> None:
        """显示错误消息。"""
        if self._widget and self._widget.winfo_exists():
            dialog = ctk.CTkToplevel(self._widget)
            dialog.title("错误")
            dialog.geometry("400x120")
            dialog.transient(self._widget)
            dialog.grab_set()

            # 居中
            dialog.update_idletasks()
            parent_x = self._widget.winfo_x()
            parent_y = self._widget.winfo_y()
            parent_w = self._widget.winfo_width()
            parent_h = self._widget.winfo_height()
            dlg_w = 400
            dlg_h = 120
            dialog.geometry(f"{dlg_w}x{dlg_h}+{parent_x + (parent_w - dlg_w) // 2}+{parent_y + (parent_h - dlg_h) // 2}")

            frame = ctk.CTkFrame(dialog, fg_color="transparent")
            frame.pack(fill="both", expand=True, padx=24, pady=24)

            ctk.CTkLabel(
                frame,
                text="❌ " + message,
                font=("", 12),
                text_color=("#dc2626", "#ef4444"),
            ).pack(expand=True)

            ctk.CTkButton(
                frame,
                text="确定",
                width=80,
                command=dialog.destroy,
            ).pack(pady=(8, 0))

    def _create_stat_card(
        self,
        parent: ctk.CTkFrame,
        icon: str,
        value: str,
        label: str,
        color: tuple[str, str],
    ) -> None:
        """创建统计卡片。"""
        card = ctk.CTkFrame(
            parent,
            fg_color=("gray95", "gray20"),
            corner_radius=12,
            border_width=1,
            border_color=("gray80", "gray30"),
        )
        card.pack(side="left", expand=True, fill="both", padx=4)

        # 图标
        ctk.CTkLabel(
            card,
            text=icon,
            font=("", 18),
        ).pack(pady=(10, 4))

        # 数值
        ctk.CTkLabel(
            card,
            text=value,
            font=("", 20, "bold"),
            text_color=color,
        ).pack(pady=(4, 2))

        # 标签
        ctk.CTkLabel(
            card,
            text=label,
            font=("", 11),
            text_color=("gray50", "gray60"),
        ).pack(pady=(2, 10))

    def _create_detail_card(
        self,
        parent: ctk.CTkFrame,
        icon: str,
        title: str,
        word_count: int,
        message_count: int,
    ) -> None:
        """创建详细统计卡片。"""
        card = ctk.CTkFrame(
            parent,
            fg_color=("gray95", "gray20"),
            corner_radius=12,
            border_width=1,
            border_color=("gray80", "gray30"),
        )
        card.pack(side="left", expand=True, fill="both", padx=4)

        # 标题行
        header = ctk.CTkFrame(card, fg_color="transparent")
        header.pack(pady=(10, 6))
        ctk.CTkLabel(header, text=icon, font=("", 14)).pack(side="left", padx=(10, 4))
        ctk.CTkLabel(header, text=title, font=("", 12, "bold")).pack(side="left")

        # 字数
        ctk.CTkLabel(
            card,
            text=f"{self._format_number(word_count)} 字",
            font=("", 14, "bold"),
            text_color=("#60a5fa", "#3b82f6"),
        ).pack(anchor="w", padx=10, pady=2)

        # 消息数
        ctk.CTkLabel(
            card,
            text=f"{message_count} 条",
            font=("", 10),
            text_color=("gray50", "gray60"),
        ).pack(anchor="w", padx=10, pady=(2, 10))

    def _create_avg_card(
        self,
        parent: ctk.CTkFrame,
        icon: str,
        avg_per_session: float,
        avg_per_day: float,
    ) -> None:
        """创建平均值卡片。"""
        card = ctk.CTkFrame(
            parent,
            fg_color=("gray95", "gray20"),
            corner_radius=12,
            border_width=1,
            border_color=("gray80", "gray30"),
        )
        card.pack(side="left", expand=True, fill="both", padx=4)

        # 标题行
        header = ctk.CTkFrame(card, fg_color="transparent")
        header.pack(pady=(10, 6))
        ctk.CTkLabel(header, text=icon, font=("", 14)).pack(side="left", padx=(10, 4))
        ctk.CTkLabel(header, text="平均值", font=("", 12, "bold")).pack(side="left")

        # 每会话平均
        ctk.CTkLabel(
            card,
            text=f"{avg_per_session} 条/会话",
            font=("", 10),
            text_color=("gray50", "gray60"),
        ).pack(anchor="w", padx=10, pady=2)

        # 每日平均
        ctk.CTkLabel(
            card,
            text=f"{avg_per_day} 条/天",
            font=("", 10),
            text_color=("gray50", "gray60"),
        ).pack(anchor="w", padx=10, pady=(2, 10))

    def _format_number(self, num: int) -> str:
        """格式化数字（K/M 后缀）。"""
        if num >= 1_000_000:
            return f"{num / 1_000_000:.1f}M"
        if num >= 1_000:
            return f"{num / 1_000:.1f}K"
        return str(num)

    def _create_daily_chart(self, parent: ctk.CTkFrame) -> None:
        """创建每日活动图表。"""
        daily_stats = self._stats.daily_stats
        if not daily_stats:
            return

        # 获取最大消息数用于计算比例
        max_messages = max(s.message_count for s in daily_stats)

        # 图表容器
        chart_frame = ctk.CTkFrame(
            parent,
            fg_color=("gray90", "gray25"),
            corner_radius=8,
        )
        chart_frame.pack(fill="x", pady=(0, 16))

        # 标题
        ctk.CTkLabel(
            chart_frame,
            text="📈 每日活动趋势",
            font=("", 13, "bold"),
        ).pack(anchor="w", padx=12, pady=(8, 4))

        # 图表区域
        chart_area = ctk.CTkFrame(chart_frame, fg_color="transparent")
        chart_area.pack(fill="x", padx=12, pady=(4, 8))

        # 显示最近最多 14 天
        display_stats = daily_stats[-14:] if len(daily_stats) > 14 else daily_stats

        # 计算每列宽度
        cols = len(display_stats)
        bar_width = max(20, min(32, 400 // cols)) if cols > 0 else 24

        for i, day_stat in enumerate(display_stats):
            # 每列容器
            col_frame = ctk.CTkFrame(chart_area, fg_color="transparent")
            col_frame.pack(side="left", expand=True, padx=2)

            # 消息数标签
            msg_color = _get_color_for_level(day_stat.message_count, max_messages)
            ctk.CTkLabel(
                col_frame,
                text=str(day_stat.message_count),
                font=("", 9, "bold"),
                text_color=msg_color,
            ).pack(pady=(0, 2))

            # 柱状图
            bar_height = max(8, min(60, int(day_stat.message_count / max_messages * 60))) if max_messages > 0 else 8
            bar = ctk.CTkFrame(
                col_frame,
                fg_color=msg_color,
                corner_radius=3,
                width=bar_width,
            )
            bar.pack(pady=(0, 2))

            # 日期标签
            ctk.CTkLabel(
                col_frame,
                text=day_stat.get_day_label(),
                font=("", 8),
                text_color=("gray50", "gray60"),
            ).pack()

            # 星期标签
            ctk.CTkLabel(
                col_frame,
                text=day_stat.get_weekday(),
                font=("", 7),
                text_color=("gray40", "gray50"),
            ).pack(pady=(0, 4))

    def _close(self) -> None:
        """关闭对话框。"""
        if self._widget and self._widget.winfo_exists():
            self._widget.destroy()
            self._widget = None


def open_global_statistics_dialog(parent: ctk.CTk, stats) -> None:
    """打开全局统计对话框的便捷函数。"""
    GlobalStatisticsDialog(parent, stats)
