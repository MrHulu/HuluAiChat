"""文件夹管理对话框 - 创建、重命名、删除文件夹。v2.0.0 使用设计系统。"""
from typing import Callable, Optional

import customtkinter as ctk

from src.persistence import Folder

# v2.0.0: 设计系统
try:
    from src.ui.design_system import Colors, Spacing, Radius, FontSize, Button
    _HAS_DESIGN_SYSTEM = True
except ImportError:
    _HAS_DESIGN_SYSTEM = False


class FolderDialog:
    """文件夹管理对话框。"""

    # 预设图标
    FOLDER_ICONS = [
        "📁", "📂", "🗂️", "📋",
        "📰", "📚", "💼", "🎯",
        "💡", "⭐", "🔥", "🎨",
        "💻", "📝", "🎮", "🏠",
        "🎵", "📖", "✅", "🚀",
    ]

    # 预设颜色（Tailwind 色系）
    FOLDER_COLORS = [
        ("🔵 蓝色", "#60A5FA"),  # blue-400
        ("🟢 绿色", "#34D399"),  # green-400
        ("🟡 黄色", "#FBBF24"),  # yellow-400
        ("🔴 红色", "#F87171"),  # red-400
        ("🟣 紫色", "#A78BFA"),  # purple-400
        ("🟠 橙色", "#FB923C"),  # orange-400
        ("🩷 粉色", "#F472B6"),  # pink-400
        ("⚫ 灰色", "#9CA3AF"),  # gray-400
    ]

    def __init__(
        self,
        parent: ctk.CTk,
        folders: list[Folder],
        on_create: Callable[[str, str, str], None] | None = None,
        on_rename: Callable[[str, str, str], None] | None = None,
        on_delete: Callable[[str], None] | None = None,
        on_move: Callable[[str, str], list[Folder] | None] | None = None,  # folder_id, direction -> updated_folders
    ) -> None:
        """初始化对话框。

        Args:
            parent: 父窗口
            folders: 文件夹列表
            on_create: 创建回调 (name, color, icon) -> None
            on_rename: 重命名回调 (folder_id, old_name, old_color) -> None (打开编辑对话框)
            on_delete: 删除回调 (folder_id) -> None
            on_move: 移动排序回调 (folder_id, direction) -> updated_folders | None
        """
        self._parent = parent
        self._folders = folders
        self._on_create = on_create
        self._on_rename = on_rename
        self._on_delete = on_delete
        self._on_move = on_move
        self._widget: ctk.CTkToplevel | None = None
        self._folder_frames: dict[str, ctk.CTkFrame] = {}
        self._create_dialog()

    def _create_dialog(self) -> None:
        """创建对话框。v2.0.0 使用设计系统优化样式。"""
        self._widget = ctk.CTkToplevel(self._parent)
        self._widget.title("管理文件夹")
        self._widget.geometry("500x450")
        self._widget.transient(self._parent)
        self._widget.grab_set()

        # 居中显示
        self._widget.update_idletasks()
        parent_x = self._parent.winfo_x()
        parent_y = self._parent.winfo_y()
        parent_w = self._parent.winfo_width()
        parent_h = self._parent.winfo_height()
        dlg_w, dlg_h = 500, 450
        self._widget.geometry(f"{dlg_w}x{dlg_h}+{parent_x + (parent_w - dlg_w) // 2}+{parent_y + (parent_h - dlg_h) // 2}")

        # v2.0.0: 主框架 - 使用设计系统间距
        main_pad = Spacing.XL if _HAS_DESIGN_SYSTEM else 16
        main = ctk.CTkFrame(self._widget, fg_color="transparent")
        main.pack(fill="both", expand=True, padx=main_pad, pady=main_pad)
        main.grid_columnconfigure(0, weight=1)
        main.grid_rowconfigure(1, weight=1)

        # v2.0.0: 标题 + 新建按钮 - 使用设计系统字体
        header = ctk.CTkFrame(main, fg_color="transparent")
        header.grid(row=0, column=0, sticky="ew", pady=(0, Spacing.MD if _HAS_DESIGN_SYSTEM else 12))
        header.grid_columnconfigure(0, weight=1)

        title_font = ("", FontSize.XL if _HAS_DESIGN_SYSTEM else 16, "bold")
        title = ctk.CTkLabel(
            header,
            text="📁 文件夹管理",
            font=title_font,
            anchor="w",
        )
        title.grid(row=0, column=0, sticky="w")

        # v2.0.0: 新建按钮 - 使用品牌色
        btn_new = ctk.CTkButton(
            header,
            text="+ 新建",
            width=Button.PRIMARY_HEIGHT if _HAS_DESIGN_SYSTEM else 80,
            height=Button.PRIMARY_HEIGHT if _HAS_DESIGN_SYSTEM else 28,
            fg_color=Colors.PRIMARY if _HAS_DESIGN_SYSTEM else ("gray70", "gray30"),
            hover_color=Colors.PRIMARY_HOVER if _HAS_DESIGN_SYSTEM else ("gray65", "gray28"),
            corner_radius=Radius.MD if _HAS_DESIGN_SYSTEM else 0,
            command=self._on_new_folder,
        )
        btn_new.grid(row=0, column=1, padx=(Spacing.SM if _HAS_DESIGN_SYSTEM else 8, 0))

        # v2.0.0: 文件夹列表（可滚动）- 使用设计系统
        list_bg = Colors.BG_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray85", "gray22")
        list_radius = Radius.LG if _HAS_DESIGN_SYSTEM else 8
        self._folder_list_frame = ctk.CTkScrollableFrame(
            main,
            fg_color=list_bg,
            corner_radius=list_radius,
        )
        self._folder_list_frame.grid(row=1, column=0, sticky="nsew")

        # v2.0.0: 关闭按钮 - 使用设计系统
        btn_close = ctk.CTkButton(
            main,
            text="关闭",
            command=self._close,
            width=Button.SECONDARY_HEIGHT if _HAS_DESIGN_SYSTEM else 100,
            height=Button.SECONDARY_HEIGHT if _HAS_DESIGN_SYSTEM else 28,
            corner_radius=Radius.MD if _HAS_DESIGN_SYSTEM else 0,
        )
        btn_close.grid(row=2, column=0, pady=(Spacing.MD if _HAS_DESIGN_SYSTEM else 12, 0))

        # 渲染文件夹列表
        self._render_folders()

        # ESC 关闭
        self._widget.bind("<Escape>", lambda e: self._close())

    def _render_folders(self) -> None:
        """渲染文件夹列表。v2.0.0 使用设计系统优化样式。"""
        if not self._folder_list_frame:
            return

        # 清空现有内容
        for frame in self._folder_frames.values():
            if frame.winfo_exists():
                frame.destroy()
        self._folder_frames.clear()

        # v2.0.0: 按钮样式 - 使用设计系统
        btn_hover = Colors.HOVER_LIGHT if _HAS_DESIGN_SYSTEM else ("gray75", "gray30")
        btn_size = Button.ICON_SIZE if _HAS_DESIGN_SYSTEM else 28
        btn_radius = Radius.SM if _HAS_DESIGN_SYSTEM else 0

        for folder in self._folders:
            row = ctk.CTkFrame(self._folder_list_frame, fg_color="transparent")
            row.pack(fill="x", padx=Spacing.SM if _HAS_DESIGN_SYSTEM else 8, pady=Spacing.XS if _HAS_DESIGN_SYSTEM else 6)
            row.grid_columnconfigure(1, weight=1)

            # v2.0.0: 图标指示器
            icon_font = ("", FontSize.XL if _HAS_DESIGN_SYSTEM else 16)
            icon_label = ctk.CTkLabel(
                row,
                text=folder.icon,
                font=icon_font,
                width=30,
            )
            icon_label.grid(row=0, column=0, padx=(0, Spacing.XS if _HAS_DESIGN_SYSTEM else 4))

            # v2.0.0: 名称
            name_font = ("", FontSize.MD if _HAS_DESIGN_SYSTEM else 13)
            name_label = ctk.CTkLabel(
                row,
                text=folder.name,
                anchor="w",
                font=name_font,
                text_color=folder.color,
            )
            name_label.grid(row=0, column=1, sticky="w")

            # v2.0.0: 上移按钮
            btn_up = ctk.CTkButton(
                row,
                text="↑",
                width=btn_size,
                height=btn_size,
                fg_color="transparent",
                hover_color=btn_hover,
                corner_radius=btn_radius,
                border_width=0,
                command=lambda f=folder: self._on_move_up(f),
            )
            btn_up.grid(row=0, column=2, padx=Spacing.XS if _HAS_DESIGN_SYSTEM else 2)

            # v2.0.0: 下移按钮
            btn_down = ctk.CTkButton(
                row,
                text="↓",
                width=btn_size,
                height=btn_size,
                fg_color="transparent",
                hover_color=btn_hover,
                corner_radius=btn_radius,
                border_width=0,
                command=lambda f=folder: self._on_move_down(f),
            )
            btn_down.grid(row=0, column=3, padx=Spacing.XS if _HAS_DESIGN_SYSTEM else 2)

            # v2.0.0: 编辑按钮
            btn_edit = ctk.CTkButton(
                row,
                text="✏️",
                width=btn_size,
                height=btn_size,
                fg_color="transparent",
                hover_color=btn_hover,
                corner_radius=btn_radius,
                border_width=0,
                command=lambda f=folder: self._on_edit_folder(f),
            )
            btn_edit.grid(row=0, column=4, padx=Spacing.XS if _HAS_DESIGN_SYSTEM else 2)

            # v2.0.0: 删除按钮 - 使用警告色
            delete_hover = Colors.ERROR if _HAS_DESIGN_SYSTEM else ("gray70", "gray28")
            btn_delete = ctk.CTkButton(
                row,
                text="🗑️",
                width=btn_size,
                height=btn_size,
                fg_color="transparent",
                hover_color=delete_hover,
                corner_radius=btn_radius,
                border_width=0,
                command=lambda f=folder: self._on_delete_folder(f),
            )
            btn_delete.grid(row=0, column=5, padx=Spacing.XS if _HAS_DESIGN_SYSTEM else 2)

            self._folder_frames[folder.id] = row

    def _on_new_folder(self) -> None:
        """创建新文件夹。"""
        self._close()
        if self._on_create:
            # 使用默认名称、颜色和图标
            self._on_create(f"新文件夹 {len(self._folders) + 1}", "#60A5FA", "📁")

    def _on_edit_folder(self, folder: Folder) -> None:
        """编辑文件夹。"""
        self._close()
        if self._on_rename:
            self._on_rename(folder.id, folder.name, folder.color)

    def _on_delete_folder(self, folder: Folder) -> None:
        """删除文件夹。"""
        # 确认对话框
        from tkinter import messagebox
        if messagebox.askyesno(
            "确认删除",
            f"确定要删除文件夹「{folder.name}」吗？\n\n该文件夹下的会话将移至根目录。",
            parent=self._widget,
        ):
            self._close()
            if self._on_delete:
                self._on_delete(folder.id)

    def _on_move_up(self, folder: Folder) -> None:
        """上移文件夹（不关闭对话框）。"""
        if self._on_move:
            updated_folders = self._on_move(folder.id, "up")
            if updated_folders is not None:
                self._folders = updated_folders
                self._render_folders()

    def _on_move_down(self, folder: Folder) -> None:
        """下移文件夹（不关闭对话框）。"""
        if self._on_move:
            updated_folders = self._on_move(folder.id, "down")
            if updated_folders is not None:
                self._folders = updated_folders
                self._render_folders()

    def _close(self) -> None:
        """关闭对话框。"""
        if self._widget and self._widget.winfo_exists():
            self._widget.destroy()


class CreateFolderDialog:
    """创建文件夹对话框。"""

    def __init__(
        self,
        parent: ctk.CTk,
        on_confirm: Callable[[str, str, str], None],
    ) -> None:
        """初始化对话框。

        Args:
            parent: 父窗口
            on_confirm: 确认回调 (name, color, icon) -> None
        """
        self._parent = parent
        self._on_confirm = on_confirm
        self._widget: ctk.CTkToplevel | None = None
        self._name_var: ctk.StringVar | None = None
        self._selected_color = "#60A5FA"
        self._selected_icon = "📁"
        self._create_dialog()

    def _create_dialog(self) -> None:
        """创建对话框。v2.0.0 使用设计系统优化样式。"""
        self._widget = ctk.CTkToplevel(self._parent)
        self._widget.title("新建文件夹")
        self._widget.geometry("450x420")
        self._widget.transient(self._parent)
        self._widget.grab_set()

        # 居中显示
        self._widget.update_idletasks()
        parent_x = self._parent.winfo_x()
        parent_y = self._parent.winfo_y()
        parent_w = self._parent.winfo_width()
        parent_h = self._parent.winfo_height()
        dlg_w, dlg_h = 450, 420
        self._widget.geometry(f"{dlg_w}x{dlg_h}+{parent_x + (parent_w - dlg_w) // 2}+{parent_y + (parent_h - dlg_h) // 2}")

        # v2.0.0: 主框架 - 使用设计系统间距
        main_pad = Spacing.XL if _HAS_DESIGN_SYSTEM else 20
        main = ctk.CTkFrame(self._widget, fg_color="transparent")
        main.pack(fill="both", expand=True, padx=main_pad, pady=main_pad)

        # v2.0.0: 标题
        title_font = ("", FontSize.XL if _HAS_DESIGN_SYSTEM else 16, "bold")
        ctk.CTkLabel(
            main,
            text="📁 新建文件夹",
            font=title_font,
        ).pack(pady=(0, Spacing.LG if _HAS_DESIGN_SYSTEM else 16))

        # v2.0.0: 名称输入
        label_font = ("", FontSize.SM if _HAS_DESIGN_SYSTEM else 11)
        label_color = Colors.TEXT_PRIMARY if _HAS_DESIGN_SYSTEM else ("gray10", "gray90")
        ctk.CTkLabel(main, text="文件夹名称：", anchor="w", font=label_font, text_color=label_color).pack(fill="x", pady=(0, Spacing.XS if _HAS_DESIGN_SYSTEM else 4))
        self._name_var = ctk.StringVar(value="新文件夹")
        name_entry = ctk.CTkEntry(main, textvariable=self._name_var)
        name_entry.pack(fill="x", pady=(0, Spacing.MD if _HAS_DESIGN_SYSTEM else 12))
        name_entry.select_range(0, "end")
        name_entry.focus_set()

        # v2.0.0: 图标选择
        ctk.CTkLabel(main, text="选择图标：", anchor="w", font=label_font, text_color=label_color).pack(fill="x", pady=(0, Spacing.XS if _HAS_DESIGN_SYSTEM else 8))
        icon_frame = ctk.CTkScrollableFrame(main, height=100, fg_color="transparent")
        icon_frame.pack(fill="x", pady=(0, Spacing.MD if _HAS_DESIGN_SYSTEM else 12))

        # v2.0.0: 图标按钮样式
        icon_selected = Colors.BG_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray70", "gray30")
        self._icon_buttons: list[ctk.CTkButton] = []
        for i, icon in enumerate(FolderDialog.FOLDER_ICONS):
            btn = ctk.CTkButton(
                icon_frame,
                text=icon,
                font=("", FontSize.XL if _HAS_DESIGN_SYSTEM else 18),
                width=45,
                height=40,
                fg_color=icon_selected if icon == self._selected_icon else "transparent",
                corner_radius=Radius.SM if _HAS_DESIGN_SYSTEM else 0,
                command=lambda ic=icon, b=btn: self._select_icon(ic, b),
            )
            btn.grid(row=i // 8, column=i % 8, padx=Spacing.XS if _HAS_DESIGN_SYSTEM else 3, pady=Spacing.XS if _HAS_DESIGN_SYSTEM else 3)
            self._icon_buttons.append((btn, icon))

        # v2.0.0: 颜色选择
        ctk.CTkLabel(main, text="选择颜色：", anchor="w", font=label_font, text_color=label_color).pack(fill="x", pady=(0, Spacing.XS if _HAS_DESIGN_SYSTEM else 8))
        color_frame = ctk.CTkFrame(main, fg_color="transparent")
        color_frame.pack(fill="x", pady=(0, Spacing.LG if _HAS_DESIGN_SYSTEM else 16))

        # v2.0.0: 颜色按钮样式
        border_color = Colors.BORDER_FOCUS if _HAS_DESIGN_SYSTEM else ("gray50", "gray40")
        self._color_buttons: list[tuple[ctk.CTkButton, str]] = []
        for i, (label, color) in enumerate(FolderDialog.FOLDER_COLORS):
            btn = ctk.CTkButton(
                color_frame,
                text="●",
                font=("", FontSize.XL if _HAS_DESIGN_SYSTEM else 18),
                width=40,
                fg_color=color if color == self._selected_color else "transparent",
                border_width=2 if color == self._selected_color else 0,
                border_color=border_color if color == self._selected_color else "transparent",
                corner_radius=Radius.MD if _HAS_DESIGN_SYSTEM else 0,
                command=lambda c=color, b=btn: self._select_color(c, b),
            )
            btn.grid(row=i // 4, column=i % 4, padx=Spacing.XS if _HAS_DESIGN_SYSTEM else 4, pady=Spacing.XS if _HAS_DESIGN_SYSTEM else 4)
            self._color_buttons.append((btn, color))

        # v2.0.0: 按钮栏
        btn_frame = ctk.CTkFrame(main, fg_color="transparent")
        btn_frame.pack(fill="x", pady=(Spacing.SM if _HAS_DESIGN_SYSTEM else 8, 0))

        ctk.CTkButton(
            btn_frame,
            text="取消",
            command=self._close,
            width=Button.SECONDARY_HEIGHT if _HAS_DESIGN_SYSTEM else 100,
            height=Button.SECONDARY_HEIGHT if _HAS_DESIGN_SYSTEM else 28,
            corner_radius=Radius.MD if _HAS_DESIGN_SYSTEM else 0,
        ).pack(side="right", padx=(Spacing.SM if _HAS_DESIGN_SYSTEM else 8, 0))

        ctk.CTkButton(
            btn_frame,
            text="创建",
            command=self._on_confirm_click,
            width=Button.PRIMARY_HEIGHT if _HAS_DESIGN_SYSTEM else 100,
            height=Button.PRIMARY_HEIGHT if _HAS_DESIGN_SYSTEM else 28,
            fg_color=Colors.PRIMARY if _HAS_DESIGN_SYSTEM else ("gray70", "gray30"),
            hover_color=Colors.PRIMARY_HOVER if _HAS_DESIGN_SYSTEM else ("gray65", "gray28"),
            corner_radius=Radius.MD if _HAS_DESIGN_SYSTEM else 0,
        ).pack(side="right")

        # Enter 确认
        name_entry.bind("<Return>", lambda e: self._on_confirm_click())
        self._widget.bind("<Escape>", lambda e: self._close())

    def _select_color(self, color: str, btn: ctk.CTkButton) -> None:
        """选择颜色。"""
        self._selected_color = color
        for b, c in self._color_buttons:
            if c == color:
                b.configure(fg_color=color, border_width=2, border_color=("gray50", "gray40"))
            else:
                b.configure(fg_color="transparent", border_width=0, border_color="transparent")

    def _select_icon(self, icon: str, btn: ctk.CTkButton) -> None:
        """选择图标。"""
        self._selected_icon = icon
        for b, i in self._icon_buttons:
            if i == icon:
                b.configure(fg_color=("gray70", "gray30"))
            else:
                b.configure(fg_color="transparent")

    def _on_confirm_click(self) -> None:
        """确认创建。"""
        name = self._name_var.get().strip()
        if not name:
            return
        self._close()
        self._on_confirm(name, self._selected_color, self._selected_icon)

    def _close(self) -> None:
        """关闭对话框。"""
        if self._widget and self._widget.winfo_exists():
            self._widget.destroy()


class EditFolderDialog:
    """编辑文件夹对话框。"""

    def __init__(
        self,
        parent: ctk.CTk,
        folder: Folder,
        on_confirm: Callable[[str, str, str], None],
    ) -> None:
        """初始化对话框。

        Args:
            parent: 父窗口
            folder: 要编辑的文件夹
            on_confirm: 确认回调 (new_name, new_color, new_icon) -> None
        """
        self._parent = parent
        self._folder = folder
        self._on_confirm = on_confirm
        self._widget: ctk.CTkToplevel | None = None
        self._name_var: ctk.StringVar | None = None
        self._selected_color = folder.color
        self._selected_icon = folder.icon
        self._create_dialog()

    def _create_dialog(self) -> None:
        """创建对话框。v2.0.0 使用设计系统优化样式。"""
        self._widget = ctk.CTkToplevel(self._parent)
        self._widget.title("编辑文件夹")
        self._widget.geometry("450x420")
        self._widget.transient(self._parent)
        self._widget.grab_set()

        # 居中显示
        self._widget.update_idletasks()
        parent_x = self._parent.winfo_x()
        parent_y = self._parent.winfo_y()
        parent_w = self._parent.winfo_width()
        parent_h = self._parent.winfo_height()
        dlg_w, dlg_h = 450, 420
        self._widget.geometry(f"{dlg_w}x{dlg_h}+{parent_x + (parent_w - dlg_w) // 2}+{parent_y + (parent_h - dlg_h) // 2}")

        # v2.0.0: 主框架 - 使用设计系统间距
        main_pad = Spacing.XL if _HAS_DESIGN_SYSTEM else 20
        main = ctk.CTkFrame(self._widget, fg_color="transparent")
        main.pack(fill="both", expand=True, padx=main_pad, pady=main_pad)

        # v2.0.0: 标题 - 使用设计系统字体
        title_font = ("", FontSize.XL if _HAS_DESIGN_SYSTEM else 16, "bold")
        ctk.CTkLabel(
            main,
            text="✏️ 编辑文件夹",
            font=title_font,
        ).pack(pady=(0, Spacing.LG if _HAS_DESIGN_SYSTEM else 16))

        # v2.0.0: 表单标签颜色
        label_color = Colors.TEXT_PRIMARY if _HAS_DESIGN_SYSTEM else ("gray10", "gray90")
        label_font = ("", FontSize.SM if _HAS_DESIGN_SYSTEM else 11)

        # 名称输入
        ctk.CTkLabel(main, text="文件夹名称：", anchor="w", font=label_font, text_color=label_color).pack(fill="x", pady=(0, Spacing.XS if _HAS_DESIGN_SYSTEM else 4))
        self._name_var = ctk.StringVar(value=self._folder.name)
        name_entry = ctk.CTkEntry(main, textvariable=self._name_var, height=Input.HEIGHT if _HAS_DESIGN_SYSTEM else 28)
        name_entry.pack(fill="x", pady=(0, Spacing.MD if _HAS_DESIGN_SYSTEM else 12))
        name_entry.select_range(0, "end")
        name_entry.focus_set()

        # 图标选择
        ctk.CTkLabel(main, text="选择图标：", anchor="w", font=label_font, text_color=label_color).pack(fill="x", pady=(0, Spacing.XS if _HAS_DESIGN_SYSTEM else 8))
        icon_frame = ctk.CTkScrollableFrame(main, height=100, fg_color="transparent")
        icon_frame.pack(fill="x", pady=(0, Spacing.MD if _HAS_DESIGN_SYSTEM else 12))

        # v2.0.0: 图标按钮样式
        icon_selected = Colors.BG_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray70", "gray30")
        self._icon_buttons: list[tuple[ctk.CTkButton, str]] = []
        for i, icon in enumerate(FolderDialog.FOLDER_ICONS):
            btn = ctk.CTkButton(
                icon_frame,
                text=icon,
                font=("", FontSize.XL if _HAS_DESIGN_SYSTEM else 18),
                width=45,
                height=40,
                fg_color=icon_selected if icon == self._selected_icon else "transparent",
                corner_radius=Radius.SM if _HAS_DESIGN_SYSTEM else 0,
                command=lambda ic=icon, b=btn: self._select_icon(ic, b),
            )
            btn.grid(row=i // 8, column=i % 8, padx=Spacing.XS if _HAS_DESIGN_SYSTEM else 3, pady=Spacing.XS if _HAS_DESIGN_SYSTEM else 3)
            self._icon_buttons.append((btn, icon))

        # 颜色选择
        ctk.CTkLabel(main, text="选择颜色：", anchor="w", font=label_font, text_color=label_color).pack(fill="x", pady=(0, Spacing.XS if _HAS_DESIGN_SYSTEM else 8))
        color_frame = ctk.CTkFrame(main, fg_color="transparent")
        color_frame.pack(fill="x", pady=(0, Spacing.LG if _HAS_DESIGN_SYSTEM else 16))

        # v2.0.0: 颜色按钮样式
        border_color = Colors.BORDER_FOCUS if _HAS_DESIGN_SYSTEM else ("gray50", "gray40")
        self._color_buttons: list[tuple[ctk.CTkButton, str]] = []
        for i, (label, color) in enumerate(FolderDialog.FOLDER_COLORS):
            btn = ctk.CTkButton(
                color_frame,
                text="●",
                font=("", FontSize.XL if _HAS_DESIGN_SYSTEM else 18),
                width=40,
                fg_color=color if color == self._selected_color else "transparent",
                border_width=2 if color == self._selected_color else 0,
                border_color=border_color if color == self._selected_color else "transparent",
                corner_radius=Radius.MD if _HAS_DESIGN_SYSTEM else 0,
                command=lambda c=color, b=btn: self._select_color(c, b),
            )
            btn.grid(row=i // 4, column=i % 4, padx=Spacing.XS if _HAS_DESIGN_SYSTEM else 4, pady=Spacing.XS if _HAS_DESIGN_SYSTEM else 4)
            self._color_buttons.append((btn, color))

        # v2.0.0: 按钮栏
        btn_frame = ctk.CTkFrame(main, fg_color="transparent")
        btn_frame.pack(fill="x", pady=(Spacing.SM if _HAS_DESIGN_SYSTEM else 8, 0))

        ctk.CTkButton(
            btn_frame,
            text="取消",
            command=self._close,
            width=Button.SECONDARY_HEIGHT if _HAS_DESIGN_SYSTEM else 100,
            height=Button.SECONDARY_HEIGHT if _HAS_DESIGN_SYSTEM else 28,
            corner_radius=Radius.MD if _HAS_DESIGN_SYSTEM else 0,
        ).pack(side="right", padx=(Spacing.SM if _HAS_DESIGN_SYSTEM else 8, 0))

        ctk.CTkButton(
            btn_frame,
            text="保存",
            command=self._on_confirm_click,
            width=Button.PRIMARY_HEIGHT if _HAS_DESIGN_SYSTEM else 100,
            height=Button.PRIMARY_HEIGHT if _HAS_DESIGN_SYSTEM else 28,
            fg_color=Colors.PRIMARY if _HAS_DESIGN_SYSTEM else ("gray70", "gray30"),
            hover_color=Colors.PRIMARY_HOVER if _HAS_DESIGN_SYSTEM else ("gray65", "gray28"),
            corner_radius=Radius.MD if _HAS_DESIGN_SYSTEM else 0,
        ).pack(side="right")

        # Enter 确认
        name_entry.bind("<Return>", lambda e: self._on_confirm_click())
        self._widget.bind("<Escape>", lambda e: self._close())

    def _select_color(self, color: str, btn: ctk.CTkButton) -> None:
        """选择颜色。"""
        self._selected_color = color
        border_color = Colors.BORDER_FOCUS if _HAS_DESIGN_SYSTEM else ("gray50", "gray40")
        for b, c in self._color_buttons:
            if c == color:
                b.configure(fg_color=color, border_width=2, border_color=border_color)
            else:
                b.configure(fg_color="transparent", border_width=0, border_color="transparent")

    def _select_icon(self, icon: str, btn: ctk.CTkButton) -> None:
        """选择图标。v2.0.0 使用设计系统。"""
        self._selected_icon = icon
        icon_selected = Colors.BG_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray70", "gray30")
        for b, i in self._icon_buttons:
            if i == icon:
                b.configure(fg_color=icon_selected)
            else:
                b.configure(fg_color="transparent")

    def _on_confirm_click(self) -> None:
        """确认修改。"""
        name = self._name_var.get().strip()
        if not name:
            return
        self._close()
        self._on_confirm(name, self._selected_color, self._selected_icon)

    def _close(self) -> None:
        """关闭对话框。"""
        if self._widget and self._widget.winfo_exists():
            self._widget.destroy()


class FolderSelectDialog:
    """选择文件夹对话框 - 用于移动会话。"""

    def __init__(
        self,
        parent: ctk.CTk,
        folders: list[Folder],
        on_select: Callable[[str | None], None],
    ) -> None:
        """初始化对话框。

        Args:
            parent: 父窗口
            folders: 文件夹列表
            on_select: 选择回调 (folder_id | None) -> None, None 表示根目录
        """
        self._parent = parent
        self._folders = folders
        self._on_select = on_select
        self._widget: ctk.CTkToplevel | None = None
        self._create_dialog()

    def _create_dialog(self) -> None:
        """创建对话框。v2.0.0 使用设计系统优化样式。"""
        self._widget = ctk.CTkToplevel(self._parent)
        self._widget.title("选择文件夹")
        self._widget.geometry("360x400")
        self._widget.transient(self._parent)
        self._widget.grab_set()

        # 居中显示
        self._widget.update_idletasks()
        parent_x = self._parent.winfo_x()
        parent_y = self._parent.winfo_y()
        parent_w = self._parent.winfo_width()
        parent_h = self._parent.winfo_height()
        dlg_w, dlg_h = 360, 400
        self._widget.geometry(f"{dlg_w}x{dlg_h}+{parent_x + (parent_w - dlg_w) // 2}+{parent_y + (parent_h - dlg_h) // 2}")

        # v2.0.0: 主框架 - 使用设计系统间距
        main_pad = Spacing.XL if _HAS_DESIGN_SYSTEM else 16
        main = ctk.CTkFrame(self._widget, fg_color="transparent")
        main.pack(fill="both", expand=True, padx=main_pad, pady=main_pad)
        main.grid_columnconfigure(0, weight=1)
        main.grid_rowconfigure(1, weight=1)

        # v2.0.0: 标题 - 使用设计系统字体
        title_font = ("", FontSize.XL if _HAS_DESIGN_SYSTEM else 16, "bold")
        title = ctk.CTkLabel(
            main,
            text="📁 选择文件夹",
            font=title_font,
        )
        title.grid(row=0, column=0, pady=(0, Spacing.MD), sticky="w")

        # v2.0.0: 文件夹列表 - 使用设计系统
        list_bg = Colors.BG_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray85", "gray22")
        list_radius = Radius.LG if _HAS_DESIGN_SYSTEM else 8
        list_frame = ctk.CTkScrollableFrame(
            main,
            fg_color=list_bg,
            corner_radius=list_radius,
        )
        list_frame.grid(row=1, column=0, sticky="nsew", pady=(0, Spacing.MD))

        # v2.0.0: 按钮样式 - 使用设计系统
        btn_hover = Colors.HOVER_BG if _HAS_DESIGN_SYSTEM else ("gray70", "gray28")
        btn_height = Button.GHOST_HEIGHT if _HAS_DESIGN_SYSTEM else 40
        btn_radius = Radius.SM if _HAS_DESIGN_SYSTEM else 0

        # 根目录选项
        root_btn = ctk.CTkButton(
            list_frame,
            text="📂 根目录",
            height=btn_height,
            anchor="w",
            fg_color="transparent",
            hover_color=btn_hover,
            corner_radius=btn_radius,
            command=lambda: self._select(None),
        )
        root_btn.pack(fill="x", padx=Spacing.SM, pady=(Spacing.SM, Spacing.XS))

        # 文件夹选项
        for folder in self._folders:
            btn = ctk.CTkButton(
                list_frame,
                text=f"{folder.icon}  {folder.name}",
                height=btn_height,
                anchor="w",
                fg_color="transparent",
                hover_color=btn_hover,
                corner_radius=btn_radius,
                command=lambda f=folder: self._select(f.id),
            )
            btn.pack(fill="x", padx=Spacing.SM, pady=Spacing.XS)

        # v2.0.0: 取消按钮 - 使用设计系统
        cancel_btn = ctk.CTkButton(
            main,
            text="取消",
            command=self._close,
            width=Button.SECONDARY_HEIGHT if _HAS_DESIGN_SYSTEM else 100,
            height=Button.SECONDARY_HEIGHT if _HAS_DESIGN_SYSTEM else 28,
            corner_radius=Radius.MD if _HAS_DESIGN_SYSTEM else 0,
        )
        cancel_btn.grid(row=2, column=0)

        # ESC 关闭
        self._widget.bind("<Escape>", lambda e: self._close())

    def _select(self, folder_id: str | None) -> None:
        """选择文件夹。"""
        self._close()
        self._on_select(folder_id)

    def _close(self) -> None:
        """关闭对话框。"""
        if self._widget and self._widget.winfo_exists():
            self._widget.destroy()
