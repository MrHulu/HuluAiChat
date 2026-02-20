"""设置弹窗：主题（第一项，下拉+图标）、Provider 列表（草稿/校验、Model ID 预设）；保存后写回 config。"""
import customtkinter as ctk
from typing import Callable

from src.app.service import AppService
from src.config.models import AppConfig, Provider
from src.ui.settings_constants import MODEL_ID_CUSTOM_VALUE, MODEL_ID_PRESETS
from src.ui.settings_validation import validate_provider

# 主题显示：文字+图标，随当前外观区分
THEME_LIGHT_DISPLAY = "☀️ 明亮"
THEME_DARK_DISPLAY = "🌙 暗夜"
THEME_TO_DISPLAY = {"light": THEME_LIGHT_DISPLAY, "dark": THEME_DARK_DISPLAY}
DISPLAY_TO_THEME = {THEME_LIGHT_DISPLAY: "light", THEME_DARK_DISPLAY: "dark"}


def open_settings(parent: ctk.CTk, app: AppService, on_save: Callable[[], None] | None = None) -> None:
    """打开设置弹窗；保存后调用 on_save 以刷新主窗口。"""
    config = app.config()
    dialog = ctk.CTkToplevel(parent)
    dialog.title("设置")
    dialog.geometry("600x480")
    dialog.transient(parent)
    dialog.grab_set()

    main = ctk.CTkScrollableFrame(dialog, fg_color="transparent")
    main.pack(fill="both", expand=True, padx=16, pady=16)
    main.grid_columnconfigure(0, weight=1)

    # ---------- 第一项：主题（下拉 + 文字+图标，图标随主题） ----------
    ctk.CTkLabel(main, text="主题", font=("", 14, "bold")).grid(row=0, column=0, sticky="w", pady=(0, 8))
    theme_var = ctk.StringVar(value=THEME_TO_DISPLAY.get(config.theme, THEME_DARK_DISPLAY))
    theme_options = [THEME_LIGHT_DISPLAY, THEME_DARK_DISPLAY]
    theme_menu = ctk.CTkOptionMenu(main, variable=theme_var, values=theme_options, width=180)
    theme_menu.grid(row=1, column=0, sticky="w")
    # 图标随主题：用当前选中项的 emoji 做小标签并随外观变色（通过 fg_color）
    def _theme_icon_color() -> str:
        return "#e0e0e0" if (ctk.get_appearance_mode() or "").lower() == "dark" else "#2b2b2b"
    theme_icon_label = ctk.CTkLabel(main, text="🌙" if config.theme == "dark" else "☀️", font=("", 16), text_color=_theme_icon_color())
    theme_icon_label.grid(row=1, column=0, sticky="w", padx=(190, 0))

    def _on_theme_change(*args: object) -> None:
        v = theme_var.get()
        theme_icon_label.configure(text="🌙" if DISPLAY_TO_THEME.get(v) == "dark" else "☀️", text_color=_theme_icon_color())
    theme_var.trace_add("write", _on_theme_change)

    # ---------- 模型 (Provider) ----------
    ctk.CTkLabel(main, text="模型 (Provider)", font=("", 14, "bold")).grid(row=2, column=0, sticky="w", pady=(16, 8))
    providers: list[Provider] = list(config.providers)
    draft_ids: set[str] = set()
    providers_frame = ctk.CTkFrame(main, fg_color="transparent")
    providers_frame.grid(row=3, column=0, sticky="nsew")
    providers_frame.grid_columnconfigure(0, weight=1)
    row_widgets: list[dict] = []  # 每行：provider, vars, is_draft -> widgets (frame, confirm_btn, del_btn, model_combo, custom_entry)

    def _get_model_display_value(p: Provider) -> str:
        if p.model_id in MODEL_ID_PRESETS:
            return p.model_id
        return MODEL_ID_CUSTOM_VALUE

    def _run_validation(row_index: int) -> bool:
        if row_index >= len(row_widgets):
            return False
        r = row_widgets[row_index]
        p, v = r["provider"], r["vars"]
        name = v["name"].get()
        base_url = v["base_url"].get()
        model_choice = v["model_choice"].get()
        is_custom = model_choice == MODEL_ID_CUSTOM_VALUE
        model_id = (v["custom_model"].get() if is_custom else model_choice).strip()
        api_key = v["api_key"].get()
        return validate_provider(name, base_url, model_id, is_custom, api_key)

    def _update_confirm_button(row_index: int) -> None:
        if row_index >= len(row_widgets):
            return
        r = row_widgets[row_index]
        if not r.get("is_draft"):
            return
        ok = _run_validation(row_index)
        r["confirm_btn"].configure(state="normal" if ok else "disabled")

    def _on_row_var_change(row_index: int, *args: object) -> None:
        _update_confirm_button(row_index)

    def add_provider_row(p: Provider, row: int, is_draft: bool = False) -> None:
        f = ctk.CTkFrame(
            providers_frame,
            fg_color=("gray90", "gray25") if not is_draft else ("gray95", "gray20"),
            corner_radius=8,
            border_width=2 if is_draft else 0,
            border_color=("gray70", "gray40"),
        )
        f.grid(row=row, column=0, sticky="ew", pady=4, padx=0)
        f.grid_rowconfigure((0, 1, 2, 3, 4), pad=8)
        f.grid_columnconfigure(0, pad=8)
        f.grid_columnconfigure(1, weight=1, pad=8)
        f.grid_columnconfigure(2, pad=8)

        name_var = ctk.StringVar(value=p.name)
        base_var = ctk.StringVar(value=p.base_url)
        model_choice_var = ctk.StringVar(value=_get_model_display_value(p))
        custom_model_var = ctk.StringVar(value=p.model_id if p.model_id not in MODEL_ID_PRESETS else "")
        key_var = ctk.StringVar(value=p.api_key)

        ctk.CTkLabel(f, text="名称").grid(row=0, column=0, sticky="w", padx=(0, 8), pady=2)
        name_e = ctk.CTkEntry(f, textvariable=name_var, width=200)
        name_e.grid(row=0, column=1, sticky="ew", pady=2)
        ctk.CTkLabel(f, text="Base URL").grid(row=1, column=0, sticky="w", padx=(0, 8), pady=2)
        base_e = ctk.CTkEntry(f, textvariable=base_var)
        base_e.grid(row=1, column=1, sticky="ew", pady=2)
        ctk.CTkLabel(f, text="Model ID").grid(row=2, column=0, sticky="w", padx=(0, 8), pady=2)
        model_combo_values = MODEL_ID_PRESETS + [MODEL_ID_CUSTOM_VALUE]
        model_combo = ctk.CTkOptionMenu(f, variable=model_choice_var, values=model_combo_values, width=220)
        model_combo.grid(row=2, column=1, sticky="ew", pady=2)
        custom_model_e = ctk.CTkEntry(f, textvariable=custom_model_var, width=220, placeholder_text="自定义 Model ID")
        custom_model_e.grid(row=3, column=1, sticky="ew", pady=2)
        if model_choice_var.get() != MODEL_ID_CUSTOM_VALUE:
            custom_model_e.grid_remove()
        ctk.CTkLabel(f, text="API Key").grid(row=4, column=0, sticky="w", padx=(0, 8), pady=2)
        key_e = ctk.CTkEntry(f, textvariable=key_var, show="*")
        key_e.grid(row=4, column=1, sticky="ew", pady=2)

        vars_dict = {
            "name": name_var,
            "base_url": base_var,
            "model_choice": model_choice_var,
            "custom_model": custom_model_var,
            "api_key": key_var,
        }

        def _toggle_custom_model() -> None:
            if model_choice_var.get() == MODEL_ID_CUSTOM_VALUE:
                custom_model_e.grid()
            else:
                custom_model_e.grid_remove()
            _update_confirm_button(row)

        model_choice_var.trace_add("write", lambda *a: _toggle_custom_model())

        for var in (name_var, base_var, custom_model_var, key_var):
            var.trace_add("write", lambda *a, ri=row: _on_row_var_change(ri))

        confirm_btn = ctk.CTkButton(f, text="确定" if is_draft else "设为当前", width=80)
        del_btn = ctk.CTkButton(f, text="删除", width=60, fg_color=("red", "darkred"))

        if is_draft:
            confirm_btn.configure(state="disabled", command=lambda: _confirm_draft(row))
            confirm_btn.grid(row=0, column=2, padx=8)
            _update_confirm_button(row)
        else:
            confirm_btn.configure(command=lambda: _set_current(p.id))
            confirm_btn.grid(row=0, column=2, padx=8)
            del_btn.configure(command=lambda: _del_row(row))
            del_btn.grid(row=1, column=2, padx=8)

        row_widgets.append({
            "provider": p,
            "vars": vars_dict,
            "is_draft": is_draft,
            "frame": f,
            "confirm_btn": confirm_btn,
            "del_btn": del_btn,
            "model_combo": model_combo,
            "custom_model_e": custom_model_e,
        })

    def _set_current(pid: str) -> None:
        app.set_current_provider(pid)
        if on_save:
            on_save()

    def _confirm_draft(row_index: int) -> None:
        if row_index >= len(row_widgets) or not _run_validation(row_index):
            return
        r = row_widgets[row_index]
        p, v = r["provider"], r["vars"]
        model_choice = v["model_choice"].get()
        model_id = (v["custom_model"].get() if model_choice == MODEL_ID_CUSTOM_VALUE else model_choice).strip()
        p.name = v["name"].get().strip()
        p.base_url = v["base_url"].get().strip()
        p.model_id = model_id
        p.api_key = v["api_key"].get()
        draft_ids.discard(p.id)
        r["is_draft"] = False
        r["confirm_btn"].configure(text="设为当前", state="normal", command=lambda: _set_current(p.id))
        r["del_btn"].configure(command=lambda: _del_row(row_index))
        r["del_btn"].grid(row=1, column=2, padx=8)
        r["frame"].configure(fg_color=("gray90", "gray25"), border_width=0)

    def _del_row(row_index: int) -> None:
        if 0 <= row_index < len(providers):
            providers.pop(row_index)
            draft_ids.clear()
            _rebuild_provider_rows()
            add_btn_widget.grid(row=4 + len(providers), column=0, sticky="w", pady=8)
            save_btn.grid(row=5 + len(providers), column=0, sticky="w", pady=16)

    def _rebuild_provider_rows() -> None:
        for w in providers_frame.winfo_children():
            w.destroy()
        row_widgets.clear()
        for i, p in enumerate(providers):
            add_provider_row(p, i, is_draft=(p.id in draft_ids))

    for i, p in enumerate(providers):
        add_provider_row(p, i, is_draft=False)

    add_btn_row = len(providers)
    def _add_provider() -> None:
        import uuid
        new_id = str(uuid.uuid4())[:8]
        new_p = Provider(id=new_id, name="", base_url="", api_key="", model_id="")
        providers.append(new_p)
        draft_ids.add(new_id)
        add_provider_row(new_p, len(providers) - 1, is_draft=True)
        add_btn_widget.grid(row=4 + len(providers), column=0, sticky="w", pady=8)
        save_btn.grid(row=5 + len(providers), column=0, sticky="w", pady=16)

    add_btn_widget = ctk.CTkButton(main, text="＋ 新增 Provider", command=_add_provider)
    add_btn_widget.grid(row=4 + add_btn_row, column=0, sticky="w", pady=8)

    def save() -> None:
        new_providers = []
        for r in row_widgets:
            if r.get("is_draft"):
                continue  # 未确定的草稿不写入
            p, v = r["provider"], r["vars"]
            model_choice = v["model_choice"].get()
            model_id = (v["custom_model"].get() if model_choice == MODEL_ID_CUSTOM_VALUE else model_choice).strip()
            new_providers.append(Provider(
                id=p.id,
                name=v["name"].get().strip(),
                base_url=v["base_url"].get().strip(),
                api_key=v["api_key"].get(),
                model_id=model_id or model_choice,
            ))
        theme_value = DISPLAY_TO_THEME.get(theme_var.get(), "dark")
        new_config = AppConfig(
            providers=new_providers,
            current_provider_id=app.config().current_provider_id,
            theme=theme_value,
            sidebar_expanded=app.config().sidebar_expanded,
        )
        app.save_config(new_config)
        ctk.set_appearance_mode(theme_value)
        if on_save:
            on_save()
        dialog.destroy()

    save_btn = ctk.CTkButton(main, text="保存", command=save)
    save_btn.grid(row=5 + add_btn_row, column=0, sticky="w", pady=16)