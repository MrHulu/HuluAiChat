"""提示词模板管理对话框。"""
import customtkinter as ctk

from src.app.service import AppService
from src.config.models import PromptTemplate


def open_templates_dialog(parent: ctk.CTk, app: AppService, on_close: callable) -> None:
    """打开提示词模板管理对话框。"""
    dialog = ctk.CTkToplevel(parent)
    dialog.title("提示词模板")
    dialog.geometry("700x500")
    dialog.transient(parent)
    dialog.grab_set()

    main = ctk.CTkFrame(dialog, fg_color="transparent")
    main.pack(fill="both", expand=True, padx=16, pady=16)

    # 标题栏
    header = ctk.CTkFrame(main, fg_color="transparent")
    header.pack(fill="x", pady=(0, 12))

    ctk.CTkLabel(header, text="提示词模板", font=("", 18, "bold")).pack(side="left")
    ctk.CTkButton(
        header,
        text="恢复默认",
        width=100,
        command=lambda: _restore_defaults(app, _refresh_list),
    ).pack(side="right", padx=(8, 0))

    # 模板列表区域
    list_frame = ctk.CTkScrollableFrame(main, height=300)
    list_frame.pack(fill="both", expand=True, pady=(0, 12))

    # 存储模板行组件
    template_rows: list[dict] = []

    def _refresh_list() -> None:
        """刷新模板列表。"""
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

    def _add_template_row(parent_frame, template: PromptTemplate, row_idx: int,
                          rows_list: list, refresh_cb: callable) -> None:
        """添加一个模板行。"""
        row = ctk.CTkFrame(parent_frame, fg_color=("gray90", "gray25"), corner_radius=8)
        row.pack(fill="x", pady=4)

        # 左侧：类别标签
        category_label = ctk.CTkLabel(
            row,
            text=template.category,
            width=60,
            fg_color=("gray70", "gray35"),
            corner_radius=4,
            font=("", 11),
        )
        category_label.pack(side="left", padx=8, pady=8)

        # 中间：标题和内容预览
        content_frame = ctk.CTkFrame(row, fg_color="transparent")
        content_frame.pack(side="left", fill="both", expand=True, padx=8, pady=8)

        title_label = ctk.CTkLabel(
            content_frame,
            text=template.title,
            font=("", 13, "bold"),
            anchor="w",
        )
        title_label.pack(fill="x")

        preview_text = template.content[:50] + "..." if len(template.content) > 50 else template.content
        preview_label = ctk.CTkLabel(
            content_frame,
            text=preview_text,
            font=("", 11),
            anchor="w",
            text_color=("gray50", "gray60"),
        )
        preview_label.pack(fill="x", pady=(2, 0))

        # 右侧：操作按钮
        btn_frame = ctk.CTkFrame(row, fg_color="transparent")
        btn_frame.pack(side="right", padx=8, pady=8)

        def _edit():
            _open_edit_dialog(dialog, app, template, refresh_cb)

        def _delete():
            _confirm_delete(dialog, app, template.id, refresh_cb)

        ctk.CTkButton(btn_frame, text="编辑", width=60, command=_edit).pack(side="left", padx=2)
        ctk.CTkButton(btn_frame, text="删除", width=60, command=_delete).pack(side="left", padx=2)

        rows_list.append({
            "frame": row,
            "category_label": category_label,
            "title_label": title_label,
            "preview_label": preview_label,
            "btn_frame": btn_frame,
        })

    def _restore_defaults(app_service: AppService, refresh_cb: callable) -> None:
        """恢复默认模板。"""
        from tkinter import messagebox
        if messagebox.askyesno("确认", "确定要恢复默认模板吗？这将删除所有自定义模板。", parent=dialog):
            app_service.restore_default_templates()
            refresh_cb()
            ToastNotification(dialog, "已恢复默认模板")

    # 新建模板按钮
    new_btn = ctk.CTkButton(
        main,
        text="+ 新建模板",
        height=36,
        command=lambda: _open_new_dialog(dialog, app, _refresh_list),
    )
    new_btn.pack(fill="x", pady=(0, 8))

    # 关闭按钮
    close_btn = ctk.CTkButton(
        main,
        text="关闭",
        height=36,
        command=lambda: [_on_close(dialog, on_close)],
    )
    close_btn.pack(fill="x")

    # 初始加载
    _refresh_list()


def _restore_defaults(app: AppService, refresh_cb: callable) -> None:
    """恢复默认模板。"""
    app.restore_default_templates()
    refresh_cb()


def _open_new_dialog(parent: ctk.CTk, app: AppService, on_saved: callable) -> None:
    """打开新建模板对话框。"""
    dialog = ctk.CTkToplevel(parent)
    dialog.title("新建模板")
    dialog.geometry("500x350")
    dialog.transient(parent)

    main = ctk.CTkFrame(dialog, fg_color="transparent")
    main.pack(fill="both", expand=True, padx=20, pady=20)

    # 标题输入
    ctk.CTkLabel(main, text="标题", anchor="w").pack(fill="x", pady=(0, 4))
    title_var = ctk.StringVar(value="")
    title_entry = ctk.CTkEntry(main, textvariable=title_var)
    title_entry.pack(fill="x", pady=(0, 12))

    # 类别选择
    ctk.CTkLabel(main, text="类别", anchor="w").pack(fill="x", pady=(0, 4))
    category_var = ctk.StringVar(value="通用")
    category_options = ["通用", "代码", "写作", "翻译", "其他"]
    category_menu = ctk.CTkOptionMenu(main, variable=category_var, values=category_options)
    category_menu.pack(fill="x", pady=(0, 12))

    # 内容输入
    ctk.CTkLabel(main, text="内容（使用 {selection} 作为选中内容的占位符）", anchor="w").pack(fill="x", pady=(0, 4))
    content_text = ctk.CTkTextbox(main, height=150)
    content_text.pack(fill="both", expand=True, pady=(0, 12))

    # 按钮
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

    ctk.CTkButton(btn_frame, text="取消", width=100, command=dialog.destroy).pack(side="right", padx=(8, 0))
    ctk.CTkButton(btn_frame, text="保存", width=100, command=_save).pack(side="right")


def _open_edit_dialog(parent: ctk.CTk, app: AppService, template: PromptTemplate, on_saved: callable) -> None:
    """打开编辑模板对话框。"""
    dialog = ctk.CTkToplevel(parent)
    dialog.title("编辑模板")
    dialog.geometry("500x350")
    dialog.transient(parent)

    main = ctk.CTkFrame(dialog, fg_color="transparent")
    main.pack(fill="both", expand=True, padx=20, pady=20)

    # 标题输入
    ctk.CTkLabel(main, text="标题", anchor="w").pack(fill="x", pady=(0, 4))
    title_var = ctk.StringVar(value=template.title)
    title_entry = ctk.CTkEntry(main, textvariable=title_var)
    title_entry.pack(fill="x", pady=(0, 12))

    # 类别选择
    ctk.CTkLabel(main, text="类别", anchor="w").pack(fill="x", pady=(0, 4))
    category_var = ctk.StringVar(value=template.category)
    category_options = ["通用", "代码", "写作", "翻译", "其他"]
    category_menu = ctk.CTkOptionMenu(main, variable=category_var, values=category_options)
    category_menu.pack(fill="x", pady=(0, 12))

    # 内容输入
    ctk.CTkLabel(main, text="内容（使用 {selection} 作为选中内容的占位符）", anchor="w").pack(fill="x", pady=(0, 4))
    content_text = ctk.CTkTextbox(main, height=150)
    content_text.pack(fill="both", expand=True, pady=(0, 12))
    content_text.insert("1.0", template.content)

    # 按钮
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

    ctk.CTkButton(btn_frame, text="取消", width=100, command=dialog.destroy).pack(side="right", padx=(8, 0))
    ctk.CTkButton(btn_frame, text="保存", width=100, command=_save).pack(side="right")


def _confirm_delete(parent: ctk.CTk, app: AppService, template_id: str, on_deleted: callable) -> None:
    """确认删除模板。"""
    from tkinter import messagebox

    if messagebox.askyesno("确认删除", "确定要删除这个模板吗？", parent=parent):
        app.delete_prompt_template(template_id)
        on_deleted()
        ToastNotification(parent, "模板已删除")


def _on_close(dialog: ctk.CTkToplevel, on_close_callback: callable) -> None:
    """关闭对话框。"""
    dialog.destroy()
    if on_close_callback:
        on_close_callback()


class ToastNotification:
    """简单的浮动提示框。"""
    def __init__(self, parent: ctk.CTk, message: str, duration_ms: int = 1500) -> None:
        self._parent = parent
        self._duration = duration_ms
        self._widget: ctk.CTkFrame | None = None

        self._widget = ctk.CTkFrame(
            parent,
            fg_color=("gray80", "gray30"),
            corner_radius=8,
        )
        self._widget.place(relx=0.5, rely=0.85, anchor="center")

        label = ctk.CTkLabel(
            self._widget,
            text=message,
            font=("", 12),
            padx=16,
            pady=8
        )
        label.pack()

        self._widget.after(duration_ms, self._destroy)

    def _destroy(self) -> None:
        if self._widget and self._widget.winfo_exists():
            self._widget.place_forget()
            self._widget = None
