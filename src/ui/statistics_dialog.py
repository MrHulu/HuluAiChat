"""会话统计对话框 - 显示会话的使用数据。"""
import customtkinter as ctk


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

        # 时间范围信息
        if self._stats.first_message_time or self._stats.last_message_time:
            time_frame = ctk.CTkFrame(
                main,
                fg_color=("gray90", "gray25"),
                corner_radius=8,
            )
            time_frame.pack(fill="x", pady=(0, 16))

            ctk.CTkLabel(
                time_frame,
                text="📅 时间范围",
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

        # 提示信息
        if not self._stats.has_data:
            hint_frame = ctk.CTkFrame(
                main,
                fg_color=("gray90", "gray25"),
                corner_radius=8,
            )
            hint_frame.pack(fill="x", pady=(0, 16))

            ctk.CTkLabel(
                hint_frame,
                text="💡 此会话还没有消息",
                font=("", 11),
                text_color=("gray50", "gray60"),
                padx=12,
                pady=8,
            ).pack()

        # 关闭按钮
        close_btn = ctk.CTkButton(
            main,
            text="关闭",
            width=100,
            command=self._close,
        )
        close_btn.pack()

        # ESC 关闭
        self._widget.bind("<Escape>", lambda e: self._close())

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
            font=("", 20),
        ).pack(pady=(12, 4))

        # 数值
        ctk.CTkLabel(
            card,
            text=value,
            font=("", 24, "bold"),
            text_color=color,
        ).pack(pady=(4, 2))

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
        header.pack(pady=(12, 8))
        ctk.CTkLabel(header, text=icon, font=("", 16)).pack(side="left", padx=(12, 4))
        ctk.CTkLabel(header, text=title, font=("", 13, "bold")).pack(side="left")

        # 字数
        ctk.CTkLabel(
            card,
            text=f"{self._format_number(word_count)} 字",
            font=("", 16, "bold"),
            text_color=("#60a5fa", "#3b82f6"),
        ).pack(anchor="w", padx=12, pady=2)

        # 消息数
        ctk.CTkLabel(
            card,
            text=f"{message_count} 条消息",
            font=("", 11),
            text_color=("gray50", "gray60"),
        ).pack(anchor="w", padx=12, pady=(2, 12))

    def _format_number(self, num: int) -> str:
        """格式化数字（K/M 后缀）。"""
        if num >= 1_000_000:
            return f"{num / 1_000_000:.1f}M"
        if num >= 1_000:
            return f"{num / 1_000:.1f}K"
        return str(num)

    def _close(self) -> None:
        """关闭对话框。"""
        if self._widget and self._widget.winfo_exists():
            self._widget.destroy()
            self._widget = None


def open_statistics_dialog(parent: ctk.CTk, stats) -> None:
    """打开统计对话框的便捷函数。"""
    StatisticsDialog(parent, stats)
