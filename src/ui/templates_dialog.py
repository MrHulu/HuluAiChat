"""提示词模板管理对话框 - v2.0.0 使用设计系统。"""
from typing import Callable

import customtkinter as ctk

from src.app.service import AppService
from src.config.models import PromptTemplate

# v2.0.0: 设计系统
try:
    from src.ui.design_system import (
        Colors, Spacing, Radius, FontSize, Button,
    )
    _HAS_DESIGN_SYSTEM = True
except ImportError:
    _HAS_DESIGN_SYSTEM = False


# v2.0.0: 按钮微交互 - 按下效果
def _bind_pressed_style(btn: ctk.CTkButton) -> None:
    """绑定按钮按下/释放的视觉反馈。"""
    original_fg = None

    def on_press(_e: object) -> None:
        nonlocal original_fg
        if original_fg is None:
            original_fg = btn.cget("fg_color")
        btn.configure(fg_color=Colors.BTN_PRESSED if _HAS_DESIGN_SYSTEM else ("gray60", "gray40"))

    def on_release(_e: object) -> None:
        if original_fg is not None:
            btn.configure(fg_color=original_fg)

    btn.bind("<Button-1>", on_press)
    btn.bind("<ButtonRelease-1>", on_release)
    btn.bind("<Leave>", on_release)


def open_templates_dialog(parent: ctk.CTk, app: AppService, on_close: Callable) -> None:
    """打开提示词模板管理对话框。v2.0.0 使用设计系统优化样式。"""
    dialog = ctk.CTkToplevel(parent)
    dialog.title("提示词模板")
    dialog.geometry("720x520")
    dialog.transient(parent)
    dialog.grab_set()

    # 居中显示
    dialog.update_idletasks()
    parent_x = parent.winfo_x()
    parent_y = parent.winfo_y()
    parent_w = parent.winfo_width()
    parent_h = parent.winfo_height()
    dlg_w, dlg_h = 720, 520
    dialog.geometry(f"{dlg_w}x{dlg_h}+{parent_x + (parent_w - dlg_w) // 2}+{parent_y + (parent_h - dlg_h) // 2}")

    # v2.0.0: 主框架 - 使用设计系统间距
    main_pad = Spacing.XL if _HAS_DESIGN_SYSTEM else 16
    main = ctk.CTkFrame(dialog, fg_color="transparent")
    main.pack(fill="both", expand=True, padx=main_pad, pady=main_pad)
    main.grid_columnconfigure(0, weight=1)
    main.grid_rowconfigure(1, weight=1)

    # v2.0.0: 标题栏 - 使用设计系统
    header = ctk.CTkFrame(main, fg_color="transparent")
    header.grid(row=0, column=0, sticky="ew", pady=(0, Spacing.MD))
    header.grid_columnconfigure(0, weight=1)

    title_font = ("", FontSize.XXL if _HAS_DESIGN_SYSTEM else 18, "bold")
    title = ctk.CTkLabel(
        header,
        text="📋 提示词模板",
        font=title_font,
        anchor="w",
    )
    title.grid(row=0, column=0, sticky="w")

    # v2.0.0: 恢复默认按钮
    restore_btn = ctk.CTkButton(
        header,
        text="恢复默认",
        width=Button.SECONDARY_HEIGHT if _HAS_DESIGN_SYSTEM else 100,
        height=Button.SECONDARY_HEIGHT if _HAS_DESIGN_SYSTEM else 28,
        corner_radius=Radius.MD if _HAS_DESIGN_SYSTEM else 0,
        command=lambda: _restore_defaults(app, _refresh_list),
    )
    restore_btn.grid(row=0, column=1, padx=(Spacing.SM, 0))
    _bind_pressed_style(restore_btn)

    # v2.0.0: 模板列表区域 - 使用设计系统
    list_bg = Colors.BG_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray85", "gray22")
    list_radius = Radius.LG if _HAS_DESIGN_SYSTEM else 8
    list_frame = ctk.CTkScrollableFrame(
        main,
        fg_color=list_bg,
        corner_radius=list_radius,
    )
    list_frame.grid(row=1, column=0, sticky="nsew", pady=(0, Spacing.MD))

    # 存储模板行组件
    template_rows: list[dict] = []

    def _refresh_list() -> None:
        """刷新模板列表。v2.0.0 使用设计系统优化样式。"""
        # 清空现有列表
        for row in template_rows:
            for widget in row.values():
                if hasattr(widget, "destroy"):
                    widget.destroy()
        template_rows.clear()

        # 重新加载模板
        templates = app.list_prompt_templates()
        for idx, template in enumerate(templates):
            _add_template_row(list_frame, template, idx, template_rows, _refresh_list)

    def _add_template_row(
        parent_frame,
        template: PromptTemplate,
        row_idx: int,
        rows_list: list,
        refresh_cb: Callable,
    ) -> None:
        """添加一个模板行。v2.0.0 使用设计系统优化样式。"""
        # v2.0.0: 行容器 - 使用设计系统
        row_bg = Colors.BG_ELEVATED if _HAS_DESIGN_SYSTEM else ("gray95", "gray20")
        row_border = Colors.BORDER_SUBTLE if _HAS_DESIGN_SYSTEM else ("gray80", "gray30")
        row_radius = Radius.MD if _HAS_DESIGN_SYSTEM else 8
        row = ctk.CTkFrame(
            parent_frame,
            fg_color=row_bg,
            corner_radius=row_radius,
            border_width=1 if _HAS_DESIGN_SYSTEM else 0,
            border_color=row_border if _HAS_DESIGN_SYSTEM else "transparent",
        )
        row.pack(fill="x", padx=Spacing.SM, pady=Spacing.XS)
        row.grid_columnconfigure(1, weight=1)

        # v2.0.0: 类别标签 - 使用品牌色
        category_fg = Colors.PRIMARY if _HAS_DESIGN_SYSTEM else ("#60a5fa", "#3b82f6")
        category_bg = Colors.PRIMARY_SUBTLE if _HAS_DESIGN_SYSTEM else ("gray70", "gray35")
        category_font = ("", FontSize.SM, FontWeight.SEMIBOLD) if _HAS_DESIGN_SYSTEM else ("", 11)
        category_label = ctk.CTkLabel(
            row,
            text=template.category,
            width=70,
            fg_color=category_bg,
            text_color=category_fg,
            corner_radius=Radius.SM,
            font=category_font,
        )
        category_label.grid(row=0, column=0, padx=Spacing.MD, pady=Spacing.MD)

        # v2.0.0: 内容区域
        content_frame = ctk.CTkFrame(row, fg_color="transparent")
        content_frame.grid(row=0, column=1, sticky="ew", padx=(0, Spacing.SM), pady=Spacing.MD)

        title_font = ("", FontSize.MD, FontWeight.SEMIBOLD) if _HAS_DESIGN_SYSTEM else ("", 13, "bold")
        title_label = ctk.CTkLabel(
            content_frame,
            text=template.title,
            font=title_font,
            anchor="w",
        )
        title_label.pack(fill="x")

        preview_text = template.content[:60] + "..." if len(template.content) > 60 else template.content
        preview_font = ("", FontSize.SM) if _HAS_DESIGN_SYSTEM else ("", 11)
        preview_color = Colors.TEXT_TERTIARY if _HAS_DESIGN_SYSTEM else ("gray50", "gray60")
        preview_label = ctk.CTkLabel(
            content_frame,
            text=preview_text,
            font=preview_font,
            anchor="w",
            text_color=preview_color,
        )
        preview_label.pack(fill="x", pady=(Spacing.XS, 0))

        # v2.0.0: 操作按钮
        btn_frame = ctk.CTkFrame(row, fg_color="transparent")
        btn_frame.grid(row=0, column=2, padx=(0, Spacing.MD), pady=Spacing.MD)

        def _edit():
            _open_edit_dialog(dialog, app, template, refresh_cb)

        def _delete():
            _confirm_delete(dialog, app, template.id, refresh_cb)

        # v2.0.0: 编辑按钮 - 使用品牌色
        btn_size = Button.GHOST_HEIGHT if _HAS_DESIGN_SYSTEM else 60
        edit_btn = ctk.CTkButton(
            btn_frame,
            text="编辑",
            width=btn_size,
            height=Button.GHOST_HEIGHT if _HAS_DESIGN_SYSTEM else 28,
            fg_color=Colors.PRIMARY if _HAS_DESIGN_SYSTEM else ("gray70", "gray30"),
            hover_color=Colors.PRIMARY_HOVER if _HAS_DESIGN_SYSTEM else ("gray65", "gray28"),
            corner_radius=Radius.SM if _HAS_DESIGN_SYSTEM else 0,
            command=_edit,
        )
        edit_btn.pack(side="left", padx=Spacing.XS)
        _bind_pressed_style(edit_btn)

        # v2.0.0: 删除按钮 - 使用警告色
        delete_btn = ctk.CTkButton(
            btn_frame,
            text="删除",
            width=btn_size,
            height=Button.GHOST_HEIGHT if _HAS_DESIGN_SYSTEM else 28,
            fg_color="transparent",
            hover_color=Colors.ERROR if _HAS_DESIGN_SYSTEM else ("#dc2626", "#ef4444"),
            text_color=Colors.ERROR if _HAS_DESIGN_SYSTEM else ("#dc2626", "#ef4444"),
            corner_radius=Radius.SM if _HAS_DESIGN_SYSTEM else 0,
            border_width=1 if _HAS_DESIGN_SYSTEM else 0,
            border_color=Colors.ERROR if _HAS_DESIGN_SYSTEM else "transparent",
            command=_delete,
        )
        delete_btn.pack(side="left", padx=Spacing.XS)
        _bind_pressed_style(delete_btn)

        rows_list.append({
            "frame": row,
            "category_label": category_label,
            "title_label": title_label,
            "preview_label": preview_label,
            "btn_frame": btn_frame,
        })

    def _restore_defaults(app_service: AppService, refresh_cb: Callable) -> None:
        """恢复默认模板。"""
        from tkinter import messagebox
        if messagebox.askyesno("确认", "确定要恢复默认模板吗？这将删除所有自定义模板。", parent=dialog):
            app_service.restore_default_templates()
            refresh_cb()
            ToastNotification(dialog, "已恢复默认模板")

    # v2.0.0: 底部按钮栏
    btn_bar = ctk.CTkFrame(main, fg_color="transparent")
    btn_bar.grid(row=2, column=0, sticky="ew")

    # v2.0.0: 新建模板按钮 - 使用品牌色
    new_btn = ctk.CTkButton(
        btn_bar,
        text="+ 新建模板",
        height=Button.PRIMARY_HEIGHT if _HAS_DESIGN_SYSTEM else 36,
        fg_color=Colors.PRIMARY if _HAS_DESIGN_SYSTEM else ("gray70", "gray30"),
        hover_color=Colors.PRIMARY_HOVER if _HAS_DESIGN_SYSTEM else ("gray65", "gray28"),
        corner_radius=Radius.MD if _HAS_DESIGN_SYSTEM else 0,
        command=lambda: _open_new_dialog(dialog, app, _refresh_list),
    )
    new_btn.pack(side="left", fill="x", expand=True, padx=(0, Spacing.SM))
    _bind_pressed_style(new_btn)

    # v2.0.0: 关闭按钮
    close_btn = ctk.CTkButton(
        btn_bar,
        text="关闭",
        width=100,
        height=Button.PRIMARY_HEIGHT if _HAS_DESIGN_SYSTEM else 36,
        corner_radius=Radius.MD if _HAS_DESIGN_SYSTEM else 0,
        command=lambda: [_on_close(dialog, on_close)],
    )
    close_btn.pack(side="right")
    _bind_pressed_style(close_btn)

    # ESC 关闭
    dialog.bind("<Escape>", lambda e: _on_close(dialog, on_close))

    # 初始加载
    _refresh_list()


def _restore_defaults(app: AppService, refresh_cb: Callable) -> None:
    """恢复默认模板。"""
    app.restore_default_templates()
    refresh_cb()


def _open_new_dialog(parent: ctk.CTk, app: AppService, on_saved: Callable) -> None:
    """打开新建模板对话框。v2.0.0 使用设计系统优化样式。"""
    dialog = ctk.CTkToplevel(parent)
    dialog.title("新建模板")
    dialog.geometry("520x400")
    dialog.transient(parent)
    dialog.grab_set()

    # 居中显示
    dialog.update_idletasks()
    parent_x = parent.winfo_x()
    parent_y = parent.winfo_y()
    parent_w = parent.winfo_width()
    parent_h = parent.winfo_height()
    dlg_w, dlg_h = 520, 400
    dialog.geometry(f"{dlg_w}x{dlg_h}+{parent_x + (parent_w - dlg_w) // 2}+{parent_y + (parent_h - dlg_h) // 2}")

    # v2.0.0: 主框架
    main_pad = Spacing.XL if _HAS_DESIGN_SYSTEM else 20
    main = ctk.CTkFrame(dialog, fg_color="transparent")
    main.pack(fill="both", expand=True, padx=main_pad, pady=main_pad)

    # v2.0.0: 标题
    title_font = ("", FontSize.XL if _HAS_DESIGN_SYSTEM else 16, "bold")
    ctk.CTkLabel(
        main,
        text="📝 新建模板",
        font=title_font,
    ).pack(pady=(0, Spacing.LG))

    # v2.0.0: 表单标签颜色
    label_color = Colors.TEXT_PRIMARY if _HAS_DESIGN_SYSTEM else ("gray10", "gray90")
    label_font = ("", FontSize.SM) if _HAS_DESIGN_SYSTEM else ("", 11)

    # 标题输入
    ctk.CTkLabel(
        main,
        text="标题",
        anchor="w",
        font=label_font,
        text_color=label_color,
    ).pack(fill="x", pady=(0, Spacing.XS))
    title_var = ctk.StringVar(value="")
    title_entry = ctk.CTkEntry(main, textvariable=title_var, height=Input.HEIGHT)
    title_entry.pack(fill="x", pady=(0, Spacing.MD))
    title_entry.focus_set()

    # 类别选择
    ctk.CTkLabel(
        main,
        text="类别",
        anchor="w",
        font=label_font,
        text_color=label_color,
    ).pack(fill="x", pady=(0, Spacing.XS))
    category_var = ctk.StringVar(value="通用")
    category_options = ["通用", "代码", "写作", "翻译", "其他"]
    category_menu = ctk.CTkOptionMenu(
        main,
        variable=category_var,
        values=category_options,
        height=Input.HEIGHT,
        corner_radius=Radius.SM if _HAS_DESIGN_SYSTEM else 0,
    )
    category_menu.pack(fill="x", pady=(0, Spacing.MD))

    # 内容输入
    ctk.CTkLabel(
        main,
        text="内容（使用 {selection} 作为选中内容的占位符）",
        anchor="w",
        font=label_font,
        text_color=label_color,
    ).pack(fill="x", pady=(0, Spacing.XS))
    content_text = ctk.CTkTextbox(main, height=140, corner_radius=Radius.SM if _HAS_DESIGN_SYSTEM else 0)
    content_text.pack(fill="both", expand=True, pady=(0, Spacing.LG))

    # 按钮栏
    btn_frame = ctk.CTkFrame(main, fg_color="transparent")
    btn_frame.pack(fill="x")

    def _save():
        title = title_var.get().strip()
        content = content_text.get("1.0", "end").strip()
        category = category_var.get()

        if not title:
            ToastNotification(dialog, "请输入标题", duration_ms=2000)
            return
        if not content:
            ToastNotification(dialog, "请输入内容", duration_ms=2000)
            return

        app.add_prompt_template(title, content, category)
        on_saved()
        dialog.destroy()
        ToastNotification(parent, "模板已添加")

    # v2.0.0: 取消按钮
    ctk.CTkButton(
        btn_frame,
        text="取消",
        width=100,
        height=Button.SECONDARY_HEIGHT,
        corner_radius=Radius.MD,
        command=dialog.destroy,
    ).pack(side="right", padx=(Spacing.SM, 0))

    # v2.0.0: 保存按钮 - 使用品牌色
    save_btn = ctk.CTkButton(
        btn_frame,
        text="保存",
        width=100,
        height=Button.SECONDARY_HEIGHT,
        fg_color=Colors.PRIMARY if _HAS_DESIGN_SYSTEM else ("gray70", "gray30"),
        hover_color=Colors.PRIMARY_HOVER if _HAS_DESIGN_SYSTEM else ("gray65", "gray28"),
        corner_radius=Radius.MD,
        command=_save,
    )
    save_btn.pack(side="right")
    _bind_pressed_style(save_btn)

    # Enter 保存（Ctrl+Enter 避免在文本框中换行时误触发）
    dialog.bind("<Escape>", lambda e: dialog.destroy())


def _open_edit_dialog(parent: ctk.CTk, app: AppService, template: PromptTemplate, on_saved: Callable) -> None:
    """打开编辑模板对话框。v2.0.0 使用设计系统优化样式。"""
    dialog = ctk.CTkToplevel(parent)
    dialog.title("编辑模板")
    dialog.geometry("520x400")
    dialog.transient(parent)
    dialog.grab_set()

    # 居中显示
    dialog.update_idletasks()
    parent_x = parent.winfo_x()
    parent_y = parent.winfo_y()
    parent_w = parent.winfo_width()
    parent_h = parent.winfo_height()
    dlg_w, dlg_h = 520, 400
    dialog.geometry(f"{dlg_w}x{dlg_h}+{parent_x + (parent_w - dlg_w) // 2}+{parent_y + (parent_h - dlg_h) // 2}")

    # 主框架
    main_pad = Spacing.XL if _HAS_DESIGN_SYSTEM else 20
    main = ctk.CTkFrame(dialog, fg_color="transparent")
    main.pack(fill="both", expand=True, padx=main_pad, pady=main_pad)

    # 标题
    title_font = ("", FontSize.XL if _HAS_DESIGN_SYSTEM else 16, "bold")
    ctk.CTkLabel(
        main,
        text="✏️ 编辑模板",
        font=title_font,
    ).pack(pady=(0, Spacing.LG))

    # 表单标签颜色
    label_color = Colors.TEXT_PRIMARY if _HAS_DESIGN_SYSTEM else ("gray10", "gray90")
    label_font = ("", FontSize.SM) if _HAS_DESIGN_SYSTEM else ("", 11)

    # 标题输入
    ctk.CTkLabel(
        main,
        text="标题",
        anchor="w",
        font=label_font,
        text_color=label_color,
    ).pack(fill="x", pady=(0, Spacing.XS))
    title_var = ctk.StringVar(value=template.title)
    title_entry = ctk.CTkEntry(main, textvariable=title_var, height=Input.HEIGHT)
    title_entry.pack(fill="x", pady=(0, Spacing.MD))
    title_entry.select_range(0, "end")
    title_entry.focus_set()

    # 类别选择
    ctk.CTkLabel(
        main,
        text="类别",
        anchor="w",
        font=label_font,
        text_color=label_color,
    ).pack(fill="x", pady=(0, Spacing.XS))
    category_var = ctk.StringVar(value=template.category)
    category_options = ["通用", "代码", "写作", "翻译", "其他"]
    category_menu = ctk.CTkOptionMenu(
        main,
        variable=category_var,
        values=category_options,
        height=Input.HEIGHT,
        corner_radius=Radius.SM if _HAS_DESIGN_SYSTEM else 0,
    )
    category_menu.pack(fill="x", pady=(0, Spacing.MD))

    # 内容输入
    ctk.CTkLabel(
        main,
        text="内容（使用 {selection} 作为选中内容的占位符）",
        anchor="w",
        font=label_font,
        text_color=label_color,
    ).pack(fill="x", pady=(0, Spacing.XS))
    content_text = ctk.CTkTextbox(main, height=140, corner_radius=Radius.SM if _HAS_DESIGN_SYSTEM else 0)
    content_text.pack(fill="both", expand=True, pady=(0, Spacing.LG))
    content_text.insert("1.0", template.content)

    # 按钮栏
    btn_frame = ctk.CTkFrame(main, fg_color="transparent")
    btn_frame.pack(fill="x")

    def _save():
        title = title_var.get().strip()
        content = content_text.get("1.0", "end").strip()
        category = category_var.get()

        if not title:
            ToastNotification(dialog, "请输入标题", duration_ms=2000)
            return
        if not content:
            ToastNotification(dialog, "请输入内容", duration_ms=2000)
            return

        app.update_prompt_template(template.id, title, content, category)
        on_saved()
        dialog.destroy()
        ToastNotification(parent, "模板已更新")

    # 取消按钮
    ctk.CTkButton(
        btn_frame,
        text="取消",
        width=100,
        height=Button.SECONDARY_HEIGHT,
        corner_radius=Radius.MD,
        command=dialog.destroy,
    ).pack(side="right", padx=(Spacing.SM, 0))

    # 保存按钮 - 使用品牌色
    save_btn = ctk.CTkButton(
        btn_frame,
        text="保存",
        width=100,
        height=Button.SECONDARY_HEIGHT,
        fg_color=Colors.PRIMARY if _HAS_DESIGN_SYSTEM else ("gray70", "gray30"),
        hover_color=Colors.PRIMARY_HOVER if _HAS_DESIGN_SYSTEM else ("gray65", "gray28"),
        corner_radius=Radius.MD,
        command=_save,
    )
    save_btn.pack(side="right")
    _bind_pressed_style(save_btn)

    # Enter 保存
    title_entry.bind("<Return>", lambda e: _save())
    dialog.bind("<Escape>", lambda e: dialog.destroy())


def _confirm_delete(parent: ctk.CTk, app: AppService, template_id: str, on_deleted: Callable) -> None:
    """确认删除模板。"""
    from tkinter import messagebox

    if messagebox.askyesno("确认删除", "确定要删除这个模板吗？", parent=parent):
        app.delete_prompt_template(template_id)
        on_deleted()
        ToastNotification(parent, "模板已删除")


def _on_close(dialog: ctk.CTkToplevel, on_close_callback: Callable) -> None:
    """关闭对话框。"""
    dialog.destroy()
    if on_close_callback:
        on_close_callback()


class ToastNotification:
    """v2.0.0: 浮动提示框，使用设计系统优化样式。"""
    def __init__(self, parent: ctk.CTk, message: str, duration_ms: int = 1500) -> None:
        self._parent = parent
        self._duration = duration_ms
        self._widget: ctk.CTkFrame | None = None

        # v2.0.0: 使用设计系统配色
        bg_color = Colors.TOAST_BG if _HAS_DESIGN_SYSTEM else ("gray80", "gray30")
        text_color = Colors.TOAST_TEXT if _HAS_DESIGN_SYSTEM else ("gray15", "gray88")
        border_color = Colors.TOAST_BORDER if _HAS_DESIGN_SYSTEM else ("gray70", "gray40")
        radius = Radius.MD if _HAS_DESIGN_SYSTEM else 8

        self._widget = ctk.CTkFrame(
            parent,
            fg_color=bg_color,
            corner_radius=radius,
            border_width=1 if _HAS_DESIGN_SYSTEM else 0,
            border_color=border_color if _HAS_DESIGN_SYSTEM else "transparent",
        )
        self._widget.place(relx=0.5, rely=0.85, anchor="center")

        label = ctk.CTkLabel(
            self._widget,
            text=message,
            font=("", FontSize.SM),
            text_color=text_color,
            padx=Spacing.LG,
            pady=Spacing.SM,
        )
        label.pack()

        self._widget.after(duration_ms, self._destroy)

    def _destroy(self) -> None:
        if self._widget and self._widget.winfo_exists():
            self._widget.place_forget()
            self._widget = None
