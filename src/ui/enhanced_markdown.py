"""
增强版 Markdown 渲染器 - 支持代码块复制按钮和主题切换。

基于 CTkMarkdown 扩展，为每个代码块添加一键复制功能和多主题支持。
"""

import re
import tkinter as tk
import customtkinter as ctk
from dataclasses import dataclass
from typing import ClassVar

try:
    from ctk_markdown import CTkMarkdown as BaseCTkMarkdown
    _HAS_BASE = True
except ImportError:
    _HAS_BASE = False
    BaseCTkMarkdown = object  # type: ignore[misc, assignment]


@dataclass(frozen=True)
class CodeBlockTheme:
    """代码块主题配置。"""

    name: str
    display_name: str
    # 背景色
    bg: str
    fg: str
    # 行号背景
    line_bg: str
    line_fg: str
    # 边框和分隔线
    border: str
    separator: str
    # 语法高亮颜色
    keyword: str
    string: str
    comment: str
    number: str
    function: str

    # 类变量：所有可用主题
    THEMES: ClassVar[dict[str, "CodeBlockTheme"]] = {}

    @classmethod
    def register(cls, theme: "CodeBlockTheme") -> "CodeBlockTheme":
        """注册主题。"""
        cls.THEMES[theme.name] = theme
        return theme

    @classmethod
    def get(cls, name: str, default: "CodeBlockTheme | None" = None) -> "CodeBlockTheme | None":
        """获取主题。"""
        return cls.THEMES.get(name, default)

    @classmethod
    def all(cls) -> list["CodeBlockTheme"]:
        """获取所有主题。"""
        return list(cls.THEMES.values())

    @classmethod
    def next(cls, current: str) -> "CodeBlockTheme":
        """获取下一个主题（循环）。"""
        themes = cls.all()
        if not themes:
            return cls._default_theme()
        try:
            idx = themes.index(cls.THEMES[current])
            return themes[(idx + 1) % len(themes)]
        except (ValueError, KeyError):
            return themes[0]

    @classmethod
    def _default_theme(cls) -> "CodeBlockTheme":
        """获取默认主题。"""
        themes = cls.all()
        return themes[0] if themes else cls._fallback_theme()

    @staticmethod
    def _fallback_theme() -> "CodeBlockTheme":
        """回退主题（确保总是有主题可用）。"""
        return CodeBlockTheme(
            name="fallback",
            display_name="Fallback",
            bg="#212121",
            fg="#f0f6fc",
            line_bg="#2D2D2D",
            line_fg="#666666",
            border="#gray35",
            separator="#gray35",
            keyword="#569cd6",
            string="#ce9178",
            comment="#6a9955",
            number="#b5cea8",
            function="#dcdcaa",
        )


# 注册内置主题

CodeBlockTheme.register(CodeBlockTheme(
    name="github_dark",
    display_name="GitHub Dark",
    bg="#0d1117",
    fg="#c9d1d9",
    line_bg="#161b22",
    line_fg="#6e7681",
    border="#30363d",
    separator="#30363d",
    keyword="#ff7b72",
    string="#a5d6ff",
    comment="#8b949e",
    number="#79c0ff",
    function="#d2a8ff",
))

CodeBlockTheme.register(CodeBlockTheme(
    name="github_light",
    display_name="GitHub Light",
    bg="#ffffff",
    fg="#24292f",
    line_bg="#f6f8fa",
    line_fg="#57606a",
    border="#d0d7de",
    separator="#d0d7de",
    keyword="#cf222e",
    string="#0a3069",
    comment="#6e7781",
    number="#0550ae",
    function="#8250df",
))

CodeBlockTheme.register(CodeBlockTheme(
    name="monokai",
    display_name="Monokai",
    bg="#272822",
    fg="#f8f8f2",
    line_bg="#3e3d32",
    line_fg="#75715e",
    border="#49483e",
    separator="#49483e",
    keyword="#f92672",
    string="#e6db74",
    comment="#75715e",
    number="#ae81ff",
    function="#a6e22e",
))

CodeBlockTheme.register(CodeBlockTheme(
    name="nord",
    display_name="Nord",
    bg="#2e3440",
    fg="#d8dee9",
    line_bg="#3b4252",
    line_fg="#4c566a",
    border="#4c566a",
    separator="#4c566a",
    keyword="#81a1c1",
    string="#a3be8c",
    comment="#616e88",
    number="#b48ead",
    function="#88c0d0",
))

CodeBlockTheme.register(CodeBlockTheme(
    name="dracula",
    display_name="Dracula",
    bg="#282a36",
    fg="#f8f8f2",
    line_bg="#343746",
    line_fg="#6272a4",
    border="#44475a",
    separator="#44475a",
    keyword="#ff79c6",
    string="#f1fa8c",
    comment="#6272a4",
    number="#bd93f9",
    function="#50fa7b",
))

CodeBlockTheme.register(CodeBlockTheme(
    name="vscode_dark",
    display_name="VS Code Dark",
    bg="#1e1e1e",
    fg="#d4d4d4",
    line_bg="#252526",
    line_fg="#858585",
    border="#3c3c3c",
    separator="#3c3c3c",
    keyword="#569cd6",
    string="#ce9178",
    comment="#6a9955",
    number="#b5cea8",
    function="#dcdcaa",
))

CodeBlockTheme.register(CodeBlockTheme(
    name="one_dark",
    display_name="One Dark",
    bg="#282c34",
    fg="#abb2bf",
    line_bg="#323842",
    line_fg="#5c6370",
    border="#3e4451",
    separator="#3e4451",
    keyword="#c678dd",
    string="#98c379",
    comment="#5c6370",
    number="#d19a66",
    function="#61afef",
))

CodeBlockTheme.register(CodeBlockTheme(
    name="solarized_dark",
    display_name="Solarized Dark",
    bg="#002b36",
    fg="#839496",
    line_bg="#073642",
    line_fg="#586e75",
    border="#073642",
    separator="#073642",
    keyword="#859900",
    string="#2aa198",
    comment="#586e75",
    number="#d33682",
    function="#268bd2",
))

CodeBlockTheme.register(CodeBlockTheme(
    name="solarized_light",
    display_name="Solarized Light",
    bg="#fdf6e3",
    fg="#657b83",
    line_bg="#eee8d5",
    line_fg="#93a1a1",
    border="#d3cbb8",
    separator="#d3cbb8",
    keyword="#859900",
    string="#2aa198",
    comment="#93a1a1",
    number="#d33682",
    function="#268bd2",
))


# 默认主题（基于应用外观模式选择）
def _get_default_theme_name() -> str:
    """根据当前应用外观模式获取默认主题。"""
    return "github_dark" if ctk.get_appearance_mode() == "Dark" else "github_light"


# 当前全局主题设置（可以后续迁移到设置系统）
_current_theme_name: str = _get_default_theme_name()


def set_code_theme(name: str) -> bool:
    """设置全局代码块主题。"""
    global _current_theme_name
    if name in CodeBlockTheme.THEMES:
        _current_theme_name = name
        return True
    return False


def get_code_theme() -> str:
    """获取当前全局代码块主题。"""
    return _current_theme_name


def cycle_code_theme() -> CodeBlockTheme:
    """循环切换到下一个主题。"""
    global _current_theme_name
    next_theme = CodeBlockTheme.next(_current_theme_name)
    _current_theme_name = next_theme.name
    return next_theme


# v1.4.5: 主题变更回调（用于保存到配置）
_theme_save_callback: callable[[str], None] | None = None


def set_theme_save_callback(callback: callable[[str], None] | None) -> None:
    """设置主题保存回调函数。当主题变更时会被调用。"""
    global _theme_save_callback
    _theme_save_callback = callback


# v1.4.6: 字号变更回调（用于保存到配置）
_font_size_save_callback: callable[[int], None] | None = None


def set_font_size_save_callback(callback: callable[[int], None] | None) -> None:
    """设置字号保存回调函数。当字号变更时会被调用。"""
    global _font_size_save_callback
    _font_size_save_callback = callback


class CodeBlockFrame(ctk.CTkFrame):
    """代码块容器，包含复制按钮、行号、换行切换、主题切换和字号调整。"""

    # 类变量：共享主题状态（所有代码块使用相同主题）
    _shared_theme_name: str = _get_default_theme_name()
    # 类变量：共享字号状态（所有代码块使用相同字号，范围 8-16）
    _shared_font_size: int = 10

    def __init__(self, parent, code: str, language: str = "", show_line_numbers: bool = True,
                 wrap: str = "word", theme: str | None = None, font_size: int | None = None, **kwargs):
        """
        初始化代码块。

        Args:
            parent: 父容器
            code: 代码内容
            language: 编程语言
            show_line_numbers: 是否显示行号
            wrap: 换行模式 ("word", "char", "none")
            theme: 主题名称（None 使用共享主题）
            font_size: 字号（None 使用共享字号，范围 8-16）
        """
        super().__init__(parent, **kwargs)
        self._code = code
        self._language = language
        self._show_line_numbers = show_line_numbers and code.count('\n') > 0
        self._wrap = wrap if wrap in ("word", "char", "none") else "word"
        self._theme_name = theme if theme else self._shared_theme_name
        self._theme = CodeBlockTheme.get(self._theme_name, CodeBlockTheme._default_theme())
        self._font_size = font_size if font_size is not None else self._shared_font_size

        # 主题图标
        self._theme_icon = "🎨"

        # 配置 - 使用主题颜色
        self.configure(
            fg_color=self._theme.bg,
            corner_radius=8,
            border_width=1,
            border_color=self._theme.border
        )

        # 顶部栏 - 语言标签 + 换行按钮 + 主题按钮 + 复制按钮
        header_frame = ctk.CTkFrame(self, fg_color="transparent")
        header_frame.grid(row=0, column=0, columnspan=2, sticky="ew", padx=8, pady=(6, 0))
        header_frame.grid_columnconfigure(1, weight=1)

        # 语言标签
        if language:
            lang_label = ctk.CTkLabel(
                header_frame,
                text=language.upper(),
                font=("Consolas", self._font_size, "bold"),
                text_color=self._theme.line_fg,
                anchor="w"
            )
            lang_label.grid(row=0, column=0, sticky="w")

        # 右侧按钮容器
        btn_container = ctk.CTkFrame(header_frame, fg_color="transparent")
        btn_container.grid(row=0, column=1, sticky="e")

        # 换行切换按钮
        wrap_text = "↩️" if self._wrap == "none" else "↔️"
        self._wrap_btn = ctk.CTkButton(
            btn_container,
            text=wrap_text,
            width=28,
            height=22,
            font=("Segoe UI", 11),
            fg_color=self._theme.separator,
            hover_color=self._theme.line_bg,
            text_color=self._theme.fg,
            corner_radius=4,
            command=self._on_toggle_wrap
        )
        self._wrap_btn.pack(side="left", padx=(0, 2))

        # 主题切换按钮
        self._theme_btn = ctk.CTkButton(
            btn_container,
            text=self._theme_icon,
            width=28,
            height=22,
            font=("Segoe UI", 11),
            fg_color=self._theme.separator,
            hover_color=self._theme.line_bg,
            text_color=self._theme.fg,
            corner_radius=4,
            command=self._on_toggle_theme
        )
        self._theme_btn.pack(side="left", padx=(0, 2))

        # v1.4.6: 字号减小按钮
        self._font_dec_btn = ctk.CTkButton(
            btn_container,
            text="A-",
            width=28,
            height=22,
            font=("Segoe UI", 9),
            fg_color=self._theme.separator,
            hover_color=self._theme.line_bg,
            text_color=self._theme.fg,
            corner_radius=4,
            command=self._on_decrease_font
        )
        self._font_dec_btn.pack(side="left", padx=(0, 2))

        # v1.4.6: 字号增大按钮
        self._font_inc_btn = ctk.CTkButton(
            btn_container,
            text="A+",
            width=28,
            height=22,
            font=("Segoe UI", 11),
            fg_color=self._theme.separator,
            hover_color=self._theme.line_bg,
            text_color=self._theme.fg,
            corner_radius=4,
            command=self._on_increase_font
        )
        self._font_inc_btn.pack(side="left", padx=(0, 2))

        # 复制按钮
        self._copy_btn = ctk.CTkButton(
            btn_container,
            text="📋",
            width=28,
            height=22,
            font=("Segoe UI", 10),
            fg_color=self._theme.separator,
            hover_color=self._theme.line_bg,
            text_color=self._theme.fg,
            corner_radius=4,
            command=self._on_copy
        )
        self._copy_btn.pack(side="left")

        # 分隔线
        separator = ctk.CTkFrame(self, height=1, fg_color=self._theme.separator)
        separator.grid(row=1, column=0, columnspan=2, sticky="ew", padx=8, pady=(4, 0))

        # 代码内容容器
        code_container = ctk.CTkFrame(self, fg_color="transparent")
        code_container.grid(row=2, column=0, sticky="nsew", padx=4, pady=(0, 4))
        self.grid_rowconfigure(2, weight=1)
        self.grid_columnconfigure(0, weight=1)

        if self._show_line_numbers:
            # 行号列
            self._line_numbers = tk.Text(
                code_container,
                width=4,
                wrap="none",
                font=("Consolas", self._font_size),
                bg=self._theme.line_bg,
                fg=self._theme.line_fg,
                relief="flat",
                borderwidth=0,
                padx=4,
                pady=8,
                state="disabled",
                cursor="arrow"
            )
            self._line_numbers.grid(row=0, column=0, sticky="ns")

            # 分隔线
            ln_separator = ctk.CTkFrame(
                code_container,
                width=1,
                fg_color=self._theme.separator
            )
            ln_separator.grid(row=0, column=1, sticky="ns")

        # 代码内容显示
        self._textbox = tk.Text(
            code_container,
            wrap=self._wrap,
            font=("Consolas", self._font_size),
            bg=self._theme.bg,
            fg=self._theme.fg,
            relief="flat",
            borderwidth=0,
            padx=12,
            pady=8,
            state="disabled",
            cursor="arrow"
        )
        self._textbox.grid(row=0, column=2, sticky="nsew")

        if self._show_line_numbers:
            code_container.grid_columnconfigure(2, weight=1)
        else:
            code_container.grid_columnconfigure(0, weight=1)

        code_container.grid_rowconfigure(0, weight=1)

        # 同步滚动
        if self._show_line_numbers:
            self._sync_scroll()

        # 插入代码并应用语法高亮
        self._insert_highlighted_code()

        # 填充行号
        if self._show_line_numbers:
            self._populate_line_numbers()

        # v1.4.6: 初始化字号按钮状态
        self._font_dec_btn.configure(
            state="normal" if self._font_size > 8 else "disabled"
        )
        self._font_inc_btn.configure(
            state="normal" if self._font_size < 16 else "disabled"
        )

    @classmethod
    def set_shared_theme(cls, theme_name: str) -> bool:
        """设置所有代码块的共享主题。"""
        if theme_name in CodeBlockTheme.THEMES:
            cls._shared_theme_name = theme_name
            # v1.4.5: 调用保存回调
            global _theme_save_callback
            if _theme_save_callback:
                _theme_save_callback(theme_name)
            return True
        return False

    @classmethod
    def get_shared_theme(cls) -> str:
        """获取当前共享主题名称。"""
        return cls._shared_theme_name

    @classmethod
    def cycle_shared_theme(cls) -> CodeBlockTheme:
        """循环切换共享主题。"""
        current = cls._shared_theme_name
        next_theme = CodeBlockTheme.next(current)
        cls._shared_theme_name = next_theme.name
        # v1.4.5: 调用保存回调
        global _theme_save_callback
        if _theme_save_callback:
            _theme_save_callback(next_theme.name)
        return next_theme

    # ========== v1.4.6: 字号管理 ==========

    @classmethod
    def set_shared_font_size(cls, font_size: int) -> bool:
        """设置所有代码块的共享字号。"""
        if isinstance(font_size, int) and 8 <= font_size <= 16:
            cls._shared_font_size = font_size
            # 调用保存回调
            global _font_size_save_callback
            if _font_size_save_callback:
                _font_size_save_callback(font_size)
            return True
        return False

    @classmethod
    def get_shared_font_size(cls) -> int:
        """获取当前共享字号。"""
        return cls._shared_font_size

    def _sync_scroll(self):
        """同步行号和代码区域的垂直滚动。"""
        def on_text_scroll(*args):
            """代码区域滚动时同步行号。"""
            self._line_numbers.yview_moveto(args[0])

        def on_linenum_scroll(*args):
            """行号滚动时同步代码区域。"""
            self._textbox.yview_moveto(args[0])

        # 连接滚动事件
        self._textbox.configure(yscrollcommand=on_text_scroll)
        self._line_numbers.configure(yscrollcommand=on_linenum_scroll)

    def _populate_line_numbers(self):
        """填充行号。"""
        line_count = self._code.count('\n') + 1
        line_nums = '\n'.join(str(i) for i in range(1, line_count + 1))

        self._line_numbers.configure(state="normal")
        self._line_numbers.delete("1.0", "end")
        self._line_numbers.insert("1.0", line_nums)
        self._line_numbers.configure(state="disabled")

    def _on_copy(self):
        """复制代码到剪贴板。"""
        try:
            # Windows 优先
            import win32clipboard
            win32clipboard.OpenClipboard()
            win32clipboard.EmptyClipboard()
            win32clipboard.SetClipboardText(self._code, win32clipboard.CF_UNICODETEXT)
            win32clipboard.CloseClipboard()
        except Exception:
            # 回退
            self.clipboard_clear()
            self.clipboard_append(self._code)
            self.update()

        # 更新按钮状态（使用主题适配的绿色）
        self._copy_btn.configure(
            text="✓",
            fg_color="#2ea043" if self._theme.name.endswith("dark") or self._theme.name in ("monokai", "dracula", "nord", "one_dark", "vscode_dark", "solarized_dark") else "#2da44e"
        )
        self.after(1500, lambda: self._copy_btn.configure(
            text="📋",
            fg_color=self._theme.separator
        ))

    def _on_toggle_wrap(self):
        """切换代码换行模式。"""
        # 切换换行模式: word <-> none
        self._wrap = "none" if self._wrap == "word" else "word"

        # 更新 textbox 配置
        self._textbox.configure(wrap=self._wrap)

        # 更新按钮图标
        wrap_text = "↩️" if self._wrap == "none" else "↔️"
        self._wrap_btn.configure(text=wrap_text)

    def _on_toggle_theme(self):
        """切换代码块主题。"""
        # 切换到下一个主题
        new_theme = self.cycle_shared_theme()
        self._apply_theme(new_theme)

    # ========== v1.4.6: 字号调整方法 ==========

    def _on_increase_font(self):
        """增大字号。"""
        current = self._font_size
        if current < 16:
            new_size = current + 1
            self.set_shared_font_size(new_size)
            self._apply_font_size(new_size)

    def _on_decrease_font(self):
        """减小字号。"""
        current = self._font_size
        if current > 8:
            new_size = current - 1
            self.set_shared_font_size(new_size)
            self._apply_font_size(new_size)

    def _apply_font_size(self, font_size: int):
        """应用新字号到当前代码块。"""
        self._font_size = font_size

        # 更新语言标签字体
        if hasattr(self, '_lang_label'):
            # 语言标签可能不存在（如果没有语言）
            pass

        # 更新行号字体
        if self._show_line_numbers and hasattr(self, '_line_numbers'):
            self._line_numbers.configure(font=("Consolas", font_size))

        # 更新代码区域字体
        self._textbox.configure(font=("Consolas", font_size))

        # 更新按钮状态（禁用不可用操作）
        self._font_dec_btn.configure(
            state="normal" if font_size > 8 else "disabled"
        )
        self._font_inc_btn.configure(
            state="normal" if font_size < 16 else "disabled"
        )

    def _apply_theme(self, theme: CodeBlockTheme):
        """应用新主题到当前代码块。"""
        self._theme = theme
        self._theme_name = theme.name

        # 更新容器背景
        self.configure(fg_color=theme.bg, border_color=theme.border)

        # 更新按钮颜色
        for btn in (self._wrap_btn, self._theme_btn, self._copy_btn):
            btn.configure(fg_color=theme.separator, hover_color=theme.line_bg, text_color=theme.fg)

        # 更新分隔线
        for widget in self.winfo_children():
            if isinstance(widget, ctk.CTkFrame) and widget.winfo_height() <= 2:
                widget.configure(fg_color=theme.separator)

        # 更新代码区域背景
        self._textbox.configure(bg=theme.bg, fg=theme.fg)

        # 更新行号背景
        if self._show_line_numbers and hasattr(self, '_line_numbers'):
            self._line_numbers.configure(bg=theme.line_bg, fg=theme.line_fg)

        # 重新应用语法高亮
        self._insert_highlighted_code()

    def _insert_highlighted_code(self):
        """插入带语法高亮的代码。"""
        self._textbox.configure(state="normal")
        self._textbox.delete("1.0", "end")

        # 使用主题配置
        theme = self._theme

        # 配置标签
        self._textbox.tag_config("keyword", foreground=theme.keyword)
        self._textbox.tag_config("string", foreground=theme.string)
        self._textbox.tag_config("comment", foreground=theme.comment)
        self._textbox.tag_config("number", foreground=theme.number)
        self._textbox.tag_config("function", foreground=theme.function)

        # 根据语言应用高亮
        lang = self._language.lower()
        if lang in ("python", "py"):
            self._highlight_python()
        elif lang in ("javascript", "js", "typescript", "ts"):
            self._highlight_javascript()
        elif lang in ("bash", "sh", "shell"):
            self._highlight_bash()
        elif lang in ("go", "golang"):
            self._highlight_go()
        elif lang in ("rust", "rs"):
            self._highlight_rust()
        elif lang in ("java",):
            self._highlight_java()
        elif lang in ("c", "cpp", "c++", "cc", "cxx"):
            self._highlight_c_cpp()
        elif lang in ("css",):
            self._highlight_css()
        elif lang in ("html", "htm", "xml"):
            self._highlight_html()
        elif lang in ("sql",):
            self._highlight_sql()
        elif lang in ("json", "yaml", "yml"):
            self._highlight_data_format()
        else:
            # 无高亮，纯文本
            self._textbox.insert("1.0", self._code)

        self._textbox.configure(state="disabled")

    def _highlight_python(self):
        """Python 语法高亮。"""
        keywords = {
            'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
            'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
            'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
            'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try',
            'while', 'with', 'yield', 'print', 'len', 'range', 'str', 'int',
            'float', 'list', 'dict', 'set', 'tuple', 'open', 'type'
        }

        for line in self._code.split('\n'):
            self._highlight_line(line, keywords)

    def _highlight_javascript(self):
        """JavaScript 语法高亮。"""
        keywords = {
            'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue',
            'debugger', 'default', 'delete', 'do', 'else', 'export', 'extends',
            'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof',
            'let', 'new', 'return', 'static', 'super', 'switch', 'this', 'throw',
            'try', 'typeof', 'var', 'void', 'while', 'with', 'yield', 'console',
            'log', 'true', 'false', 'null', 'undefined'
        }

        for line in self._code.split('\n'):
            self._highlight_line(line, keywords, js_style=True)

    def _highlight_bash(self):
        """Bash 语法高亮。"""
        keywords = {'if', 'then', 'else', 'fi', 'for', 'do', 'done', 'while', 'case', 'esac',
                    'function', 'return', 'local', 'export', 'echo', 'cd', 'ls', 'pwd', 'cat',
                    'grep', 'sed', 'awk', 'find', 'mkdir', 'rm', 'cp', 'mv', 'chmod', 'chown',
                    'sudo', 'apt', 'npm', 'pip', 'python', 'python3', 'git', 'docker', 'curl',
                    'wget', 'tar', 'unzip', 'zip', 'ssh', 'exit', 'true', 'false', 'test'}
        for line in self._code.split('\n'):
            self._highlight_line(line, keywords)

    def _highlight_go(self):
        """Go 语法高亮。"""
        keywords = {
            'break', 'case', 'chan', 'const', 'continue', 'default', 'defer', 'else',
            'fallthrough', 'for', 'func', 'go', 'goto', 'if', 'import', 'interface',
            'map', 'package', 'range', 'return', 'select', 'struct', 'switch', 'type',
            'var', 'true', 'false', 'nil', 'iota', 'len', 'cap', 'make', 'new',
            'append', 'copy', 'delete', 'print', 'println', 'close', 'complex',
            'real', 'imag', 'panic', 'recover'
        }
        # Go 风格注释用 //
        for line in self._code.split('\n'):
            self._highlight_line(line, keywords, js_style=True)

    def _highlight_rust(self):
        """Rust 语法高亮。"""
        keywords = {
            'as', 'async', 'await', 'break', 'const', 'continue', 'crate', 'else',
            'enum', 'extern', 'false', 'fn', 'for', 'if', 'impl', 'in', 'let',
            'loop', 'match', 'mod', 'move', 'mut', 'pub', 'ref', 'return', 'self',
            'Self', 'static', 'struct', 'super', 'trait', 'true', 'type', 'union',
            'unsafe', 'use', 'where', 'while', 'abstract', 'become', 'box', 'do',
            'final', 'macro', 'override', 'priv', 'typeof', 'unsized', 'virtual',
            'yield', 'dyn', 'try', 'String', 'Vec', 'HashMap', 'Option', 'Result',
            'Some', 'None', 'Ok', 'Err', 'print', 'println', 'eprint', 'eprintln',
            'vec', 'format'
        }
        # Rust 风格注释用 //
        for line in self._code.split('\n'):
            self._highlight_line(line, keywords, js_style=True)

    def _highlight_java(self):
        """Java 语法高亮。"""
        keywords = {
            'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char',
            'class', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum',
            'extends', 'final', 'finally', 'float', 'for', 'goto', 'if', 'implements',
            'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new',
            'package', 'private', 'protected', 'public', 'return', 'short', 'static',
            'strictfp', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws',
            'transient', 'try', 'void', 'volatile', 'while', 'true', 'false', 'null',
            'System', 'out', 'println', 'String', 'Integer', 'Double', 'Float', 'Long',
            'Boolean', 'Character', 'Byte', 'Short', 'List', 'ArrayList', 'Map',
            'HashMap', 'Set', 'HashSet', 'Object', 'Class', 'Math'
        }
        # Java 风格注释用 //
        for line in self._code.split('\n'):
            self._highlight_line(line, keywords, js_style=True)

    def _highlight_c_cpp(self):
        """C/C++ 语法高亮。"""
        keywords = {
            'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do',
            'double', 'else', 'enum', 'extern', 'float', 'for', 'goto', 'if', 'int',
            'long', 'register', 'return', 'short', 'signed', 'sizeof', 'static',
            'struct', 'switch', 'typedef', 'union', 'unsigned', 'void', 'volatile',
            'while', 'true', 'false', 'nullptr', 'nullptr_t', 'class', 'private',
            'protected', 'public', 'template', 'typename', 'namespace', 'using',
            'virtual', 'override', 'final', 'constexpr', 'nullptr', 'std', 'cout',
            'cin', 'endl', 'printf', 'scanf', 'malloc', 'free', 'new', 'delete',
            'vector', 'string', 'map', 'set', 'array', 'shared_ptr', 'unique_ptr'
        }
        # C++ 风格注释用 //
        for line in self._code.split('\n'):
            self._highlight_line(line, keywords, js_style=True)

    def _highlight_css(self):
        """CSS 语法高亮。"""
        keywords = {'important', 'auto', 'inherit', 'none', 'normal', 'unset', 'initial'}
        css_properties = {
            'color', 'background', 'width', 'height', 'margin', 'padding', 'border',
            'display', 'position', 'float', 'clear', 'font', 'text', 'line', 'letter',
            'word', 'white', 'vertical', 'overflow', 'visibility', 'opacity', 'z',
            'flex', 'grid', 'min', 'max', 'box', 'shadow', 'transform', 'transition',
            'animation', 'cursor', 'pointer', 'list', 'table', 'caption', 'border',
            'outline', 'content', 'align', 'justify', 'justify', 'gap', 'wrap',
            'top', 'right', 'bottom', 'left', 'center', 'stretch', 'start', 'end'
        }

        for line in self._code.split('\n'):
            pos = 0
            while pos < len(line):
                # 跳过空白
                while pos < len(line) and line[pos].isspace():
                    self._textbox.insert("end", line[pos])
                    pos += 1

                if pos >= len(line):
                    break

                # 检查注释
                if pos + 1 < len(line) and line[pos:pos + 2] == '/*':
                    end = line.find('*/', pos)
                    if end >= 0:
                        self._textbox.insert("end", line[pos:end + 2], "comment")
                        pos = end + 2
                    else:
                        self._textbox.insert("end", line[pos:], "comment")
                        break
                    continue

                # 检查字符串
                if line[pos] in ('"', "'"):
                    quote = line[pos]
                    end = pos + 1
                    while end < len(line) and line[end] != quote:
                        if line[end] == '\\':
                            end += 2
                        else:
                            end += 1
                    if end < len(line):
                        self._textbox.insert("end", line[pos:end + 1], "string")
                        pos = end + 1
                        continue

                # 检查选择器 {
                if line[pos] == '{':
                    self._textbox.insert("end", line[pos], "keyword")
                    pos += 1
                    continue

                if line[pos] == '}':
                    self._textbox.insert("end", line[pos], "keyword")
                    pos += 1
                    continue

                # 检查属性名
                match = re.match(r'[a-zA-Z-]+', line[pos:])
                if match:
                    word = match.group(0)
                    if word in css_properties or word.endswith('-'):
                        self._textbox.insert("end", word, "function")
                    else:
                        self._textbox.insert("end", word)
                    pos += len(word)
                    continue

                # 检查颜色值
                if line[pos] == '#':
                    match = re.match(r'#[0-9a-fA-F]+', line[pos:])
                    if match:
                        self._textbox.insert("end", match.group(0), "number")
                        pos += len(match.group(0))
                        continue

                # 检查数字
                if line[pos].isdigit():
                    end = pos
                    while end < len(line) and (line[end].isdigit() or line[end] == '.'):
                        end += 1
                    if end < len(line) and line[end] in 'pxemremvwvh%':
                        end += 2
                    self._textbox.insert("end", line[pos:end], "number")
                    pos = end
                    continue

                self._textbox.insert("end", line[pos])
                pos += 1

            self._textbox.insert("end", "\n")

    def _highlight_html(self):
        """HTML/XML 语法高亮。"""
        for line in self._code.split('\n'):
            pos = 0
            while pos < len(line):
                # 标签开始 <
                if line[pos] == '<':
                    end = line.find('>', pos)
                    if end >= 0:
                        tag_content = line[pos:end + 1]
                        # 高亮标签名
                        tag_match = re.match(r'<\s*/?\s*([a-zA-Z][a-zA-Z0-9]*)', tag_content)
                        if tag_match:
                            self._textbox.insert("end", '<', "keyword")
                            rest = tag_content[1:]
                            tag_name = tag_match.group(1)
                            self._textbox.insert("end", tag_name, "function")
                            pos_after_tag = pos + 1 + len(tag_name)

                            # 处理属性
                            attr_part = line[pos_after_tag:end]
                            attr_pos = 0
                            while attr_pos < len(attr_part):
                                if attr_part[attr_pos].isspace():
                                    self._textbox.insert("end", attr_part[attr_pos])
                                    attr_pos += 1
                                elif attr_part[attr_pos] == '=':
                                    self._textbox.insert("end", '=', "keyword")
                                    attr_pos += 1
                                elif attr_part[attr_pos] in ('"', "'"):
                                    quote = attr_part[attr_pos]
                                    quote_end = attr_part.find(quote, attr_pos + 1)
                                    if quote_end >= 0:
                                        self._textbox.insert("end", attr_part[attr_pos:quote_end + 1], "string")
                                        attr_pos = quote_end + 1
                                    else:
                                        self._textbox.insert("end", attr_part[attr_pos:], "string")
                                        break
                                else:
                                    # 属性名
                                    attr_match = re.match(r'[a-zA-Z-]+', attr_part[attr_pos:])
                                    if attr_match:
                                        self._textbox.insert("end", attr_match.group(0), "keyword")
                                        attr_pos += len(attr_match.group(0))
                                    else:
                                        attr_pos += 1

                            self._textbox.insert("end", '>', "keyword")
                            pos = end + 1
                        else:
                            self._textbox.insert("end", line[pos:end + 1], "keyword")
                            pos = end + 1
                    else:
                        self._textbox.insert("end", line[pos:], "keyword")
                        pos = len(line)
                    continue

                # 注释
                if pos + 3 < len(line) and line[pos:pos + 4] == '<!--':
                    end = line.find('-->', pos)
                    if end >= 0:
                        self._textbox.insert("end", line[pos:end + 3], "comment")
                        pos = end + 3
                    else:
                        self._textbox.insert("end", line[pos:], "comment")
                        pos = len(line)
                    continue

                self._textbox.insert("end", line[pos])
                pos += 1

            self._textbox.insert("end", "\n")

    def _highlight_sql(self):
        """SQL 语法高亮。"""
        keywords = {
            'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET',
            'DELETE', 'CREATE', 'TABLE', 'DROP', 'ALTER', 'INDEX', 'JOIN', 'INNER',
            'LEFT', 'RIGHT', 'FULL', 'OUTER', 'ON', 'AS', 'ORDER', 'BY', 'GROUP',
            'HAVING', 'LIMIT', 'OFFSET', 'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL',
            'LIKE', 'BETWEEN', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
            'UNION', 'ALL', 'EXISTS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
            'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'UNIQUE', 'DEFAULT',
            'CASCADE', 'RESTRICT', 'CHECK', 'VARCHAR', 'INT', 'INTEGER', 'TEXT',
            'BOOLEAN', 'DATE', 'DATETIME', 'TIMESTAMP', 'DECIMAL', 'FLOAT'
        }

        for line in self._code.split('\n'):
            pos = 0
            while pos < len(line):
                # 跳过空白
                while pos < len(line) and line[pos].isspace():
                    self._textbox.insert("end", line[pos])
                    pos += 1

                if pos >= len(line):
                    break

                # 注释 --
                if pos + 1 < len(line) and line[pos:pos + 2] == '--':
                    self._textbox.insert("end", line[pos:], "comment")
                    break

                # 字符串
                if line[pos] == "'":
                    end = pos + 1
                    while end < len(line) and line[end] != "'":
                        if line[end] == '\\' and end + 1 < len(line):
                            end += 2
                        else:
                            end += 1
                    if end < len(line):
                        self._textbox.insert("end", line[pos:end + 1], "string")
                        pos = end + 1
                    else:
                        self._textbox.insert("end", line[pos:], "string")
                        pos = len(line)
                    continue

                # 关键字
                match = re.match(r'[a-zA-Z_]\w*', line[pos:])
                if match:
                    word = match.group(0).upper()
                    if word in keywords:
                        self._textbox.insert("end", match.group(0), "keyword")
                    else:
                        self._textbox.insert("end", match.group(0))
                    pos += len(match.group(0))
                    continue

                self._textbox.insert("end", line[pos])
                pos += 1

            self._textbox.insert("end", "\n")

    def _highlight_data_format(self):
        """JSON/YAML 语法高亮。"""
        is_json = self._language.lower() == 'json'
        keywords = {'true', 'false', 'null', 'True', 'False', 'None'}

        for line in self._code.split('\n'):
            pos = 0
            while pos < len(line):
                # 跳过空白
                while pos < len(line) and line[pos].isspace():
                    self._textbox.insert("end", line[pos])
                    pos += 1

                if pos >= len(line):
                    break

                # YAML 注释
                if not is_json and line[pos] == '#':
                    self._textbox.insert("end", line[pos:], "comment")
                    break

                # 字符串
                if line[pos] in ('"', "'"):
                    quote = line[pos]
                    end = pos + 1
                    while end < len(line) and line[end] != quote:
                        if line[end] == '\\':
                            end += 2
                        else:
                            end += 1
                    if end < len(line):
                        # JSON key (before :)
                        if is_json and ':' in line[end:]:
                            self._textbox.insert("end", line[pos:end + 1], "function")
                        else:
                            self._textbox.insert("end", line[pos:end + 1], "string")
                        pos = end + 1
                    else:
                        self._textbox.insert("end", line[pos:], "string")
                        pos = len(line)
                    continue

                # 数字
                if line[pos].isdigit() or (line[pos] == '-' and pos + 1 < len(line) and line[pos + 1].isdigit()):
                    end = pos
                    while end < len(line) and (line[end].isdigit() or line[end] in '.-+eE'):
                        end += 1
                    self._textbox.insert("end", line[pos:end], "number")
                    pos = end
                    continue

                # 关键字
                match = re.match(r'[a-zA-Z_]\w*', line[pos:])
                if match:
                    word = match.group(0)
                    if word in keywords:
                        self._textbox.insert("end", word, "keyword")
                    else:
                        self._textbox.insert("end", word)
                    pos += len(word)
                    continue

                # 冒号和逗号
                if line[pos] in ':,':
                    self._textbox.insert("end", line[pos], "keyword")
                    pos += 1
                    continue

                self._textbox.insert("end", line[pos])
                pos += 1

            self._textbox.insert("end", "\n")

    def _highlight_line(self, line: str, keywords: set, js_style: bool = False):
        """高亮单行代码。"""
        pos = 0

        while pos < len(line):
            # 跳过空白
            while pos < len(line) and line[pos].isspace():
                self._textbox.insert("end", line[pos])
                pos += 1

            if pos >= len(line):
                break

            # 检查字符串
            if line[pos] in ('"', "'"):
                quote = line[pos]
                end = pos + 1
                while end < len(line) and line[end] != quote:
                    if line[end] == '\\':
                        end += 2
                    else:
                        end += 1
                if end < len(line):
                    self._textbox.insert("end", line[pos:end + 1], "string")
                    pos = end + 1
                    continue

            # 检查注释 (非 JS 风格，JS 风格用 //)
            if line[pos] == '#':
                self._textbox.insert("end", line[pos:], "comment")
                break

            if js_style and pos + 1 < len(line) and line[pos:pos + 2] == '//':
                self._textbox.insert("end", line[pos:], "comment")
                break

            # 检查数字
            if line[pos].isdigit():
                end = pos
                while end < len(line) and (line[end].isdigit() or line[end] == '.'):
                    end += 1
                self._textbox.insert("end", line[pos:end], "number")
                pos = end
                continue

            # 检查关键字和函数
            match = re.match(r'[a-zA-Z_]\w*', line[pos:])
            if match:
                word = match.group(0)
                if word in keywords:
                    self._textbox.insert("end", word, "keyword")
                elif word.isidentifier() and pos + len(word) < len(line) and line[pos + len(word)] == '(':
                    self._textbox.insert("end", word, "function")
                else:
                    self._textbox.insert("end", word)
                pos += len(word)
                continue

            # 其他字符
            self._textbox.insert("end", line[pos])
            pos += 1

        self._textbox.insert("end", "\n")


class EnhancedMarkdown:
    """
    增强版 Markdown 渲染器工厂。

    解析 Markdown 并使用合适的渲染器（代码块使用 CodeBlockFrame）。
    """

    # 支持 Fenced Code Block 的正则
    CODE_BLOCK_PATTERN = re.compile(r'```(\w*)\n(.*?)\n```', re.DOTALL)
    INLINE_CODE_PATTERN = re.compile(r'`([^`]+)`')

    @staticmethod
    def has_code_blocks(markdown: str) -> bool:
        """检查是否包含代码块。"""
        return '```' in markdown

    @staticmethod
    def parse_code_blocks(markdown: str) -> list[dict]:
        """
        解析所有代码块。

        返回: [{"language": str, "code": str, "start": int, "end": int}, ...]
        """
        blocks = []
        for match in EnhancedMarkdown.CODE_BLOCK_PATTERN.finditer(markdown):
            blocks.append({
                "language": match.group(1),
                "code": match.group(2),
                "start": match.start(),
                "end": match.end()
            })
        return blocks

    @staticmethod
    def _apply_search_highlight(text_widget, content: str, search_query: str) -> None:
        """
        对文本 widget 应用搜索高亮（v1.4.7）。

        Args:
            text_widget: CTkTextbox 或底层 Tkinter Text widget
            content: 原始文本内容
            search_query: 搜索关键词
        """
        if not search_query:
            return

        try:
            # 获取底层 Tkinter Text widget
            if hasattr(text_widget, '_textbox'):
                tk_text = text_widget._textbox
            elif hasattr(text_widget, '_text'):
                tk_text = text_widget._text
            else:
                tk_text = text_widget
        except Exception:
            return

        # 配置高亮标签（主题感知）
        try:
            is_dark = ctk.get_appearance_mode() == "Dark"
            if is_dark:
                tk_text.tag_config("search_highlight", background="#E65100", foreground="white")
            else:
                tk_text.tag_config("search_highlight", background="#FFEB3B", foreground="black")
        except Exception:
            pass

        # 查找并高亮所有匹配
        content_lower = content.lower()
        query_lower = search_query.lower()
        start = 0

        while True:
            pos = content_lower.find(query_lower, start)
            if pos == -1:
                break

            try:
                # 计算在文本框中的位置
                line_start = f"1.0 + {pos} chars"
                line_end = f"1.0 + {pos + len(search_query)} chars"
                tk_text.tag_add("search_highlight", line_start, line_end)
            except Exception:
                pass

            start = pos + len(search_query)

    @staticmethod
    def _apply_search_highlight_to_markdown(md_widget, content: str, search_query: str) -> None:
        """
        对 CTkMarkdown widget 应用搜索高亮（v1.4.7）。

        CTkMarkdown 内部使用多个 Text widget 来渲染格式化内容，
        我们尝试遍历其子组件并应用高亮。

        Args:
            md_widget: CTkMarkdown widget
            content: 原始 Markdown 内容
            search_query: 搜索关键词
        """
        if not search_query or not _HAS_BASE:
            return

        try:
            # CTkMarkdown 的内部结构：frame -> textbox(s)
            # 尝试找到内部的 Text widget
            def search_and_highlight(widget) -> None:
                try:
                    # 如果是 CTkTextbox，尝试应用高亮
                    if hasattr(widget, '_textbox'):
                        EnhancedMarkdown._apply_search_highlight(widget, content, search_query)
                    # 递归搜索子组件
                    for child in widget.winfo_children():
                        search_and_highlight(child)
                except Exception:
                    pass

            # 延迟执行，等待 Markdown 渲染完成
            import tkinter as tk
            widget_root = md_widget.winfo_toplevel()
            widget_root.after(10, lambda: search_and_highlight(md_widget))
        except Exception:
            pass

    @staticmethod
    def render_with_code_blocks(
        parent,
        markdown: str,
        use_base_ctkmarkdown: bool = True,
        show_line_numbers: bool = True,
        wrap: str = "word",
        theme: str | None = None,
        search_query: str | None = None
    ) -> list:
        """
        渲染 Markdown，代码块用 CodeBlockFrame，其他用基础渲染器。

        Args:
            parent: 父容器
            markdown: Markdown 文本
            use_base_ctkmarkdown: 是否使用 CTkMarkdown
            show_line_numbers: 是否显示行号
            wrap: 换行模式 ("word", "char", "none")
            theme: 主题名称（None 使用共享主题）
            search_query: 搜索关键词（用于高亮显示，v1.4.7）

        返回: [创建的 widget 列表]
        """
        widgets = []

        # 如果没有代码块，使用基础渲染器
        if not EnhancedMarkdown.has_code_blocks(markdown):
            if use_base_ctkmarkdown and _HAS_BASE:
                md = BaseCTkMarkdown(parent, width=400)
                md.set_markdown(markdown)
                # v1.4.7: 尝试对 CTkMarkdown 应用搜索高亮
                if search_query:
                    EnhancedMarkdown._apply_search_highlight_to_markdown(md, markdown, search_query)
                widgets.append(md)
            else:
                # 纯文本回退
                tb = ctk.CTkTextbox(parent, wrap="word")
                tb.insert("1.0", markdown)
                # v1.4.7: 应用搜索高亮
                if search_query:
                    EnhancedMarkdown._apply_search_highlight(tb, markdown, search_query)
                tb.configure(state="disabled")
                widgets.append(tb)
            return widgets

        # 有代码块，分段渲染
        pos = 0
        for block in EnhancedMarkdown.parse_code_blocks(markdown):
            # 代码块前的内容
            if block["start"] > pos:
                before_text = markdown[pos:block["start"]]
                if before_text.strip():
                    if use_base_ctkmarkdown and _HAS_BASE:
                        md = BaseCTkMarkdown(parent, width=400)
                        md.set_markdown(before_text)
                        if search_query:
                            EnhancedMarkdown._apply_search_highlight_to_markdown(md, before_text, search_query)
                        widgets.append(md)
                    else:
                        tb = ctk.CTkTextbox(parent, wrap="word")
                        tb.insert("1.0", before_text)
                        if search_query:
                            EnhancedMarkdown._apply_search_highlight(tb, before_text, search_query)
                        tb.configure(state="disabled")
                        widgets.append(tb)

            # 代码块
            code_frame = CodeBlockFrame(
                parent,
                code=block["code"],
                language=block["language"],
                show_line_numbers=show_line_numbers,
                wrap=wrap,
                theme=theme
            )
            widgets.append(code_frame)

            pos = block["end"]

        # 代码块后的内容
        if pos < len(markdown):
            after_text = markdown[pos:]
            if after_text.strip():
                if use_base_ctkmarkdown and _HAS_BASE:
                    md = BaseCTkMarkdown(parent, width=400)
                    md.set_markdown(after_text)
                    if search_query:
                        EnhancedMarkdown._apply_search_highlight_to_markdown(md, after_text, search_query)
                    widgets.append(md)
                else:
                    tb = ctk.CTkTextbox(parent, wrap="word")
                    tb.insert("1.0", after_text)
                    if search_query:
                        EnhancedMarkdown._apply_search_highlight(tb, after_text, search_query)
                    tb.configure(state="disabled")
                    widgets.append(tb)

        return widgets


# 便捷函数
def create_enhanced_markdown(
    parent,
    markdown: str,
    width: int = 400,
    show_line_numbers: bool = True,
    wrap: str = "word",
    theme: str | None = None
) -> ctk.CTkFrame:
    """
    创建增强版 Markdown 渲染容器。

    Args:
        parent: 父容器
        markdown: Markdown 文本
        width: 宽度
        show_line_numbers: 是否显示行号
        wrap: 换行模式 ("word", "char", "none")
        theme: 主题名称（None 使用共享主题）

    返回包含所有渲染内容的 Frame。
    """
    container = ctk.CTkFrame(parent, fg_color="transparent")
    container.grid_columnconfigure(0, weight=1)

    widgets = EnhancedMarkdown.render_with_code_blocks(
        container, markdown, show_line_numbers=show_line_numbers, wrap=wrap, theme=theme
    )
    for i, widget in enumerate(widgets):
        widget.grid(row=i, column=0, sticky="ew", pady=2)

    return container


# 获取所有可用主题
def get_available_themes() -> list[dict]:
    """获取所有可用主题的信息。"""
    return [
        {"name": t.name, "display_name": t.display_name}
        for t in CodeBlockTheme.all()
    ]


def get_theme_info(name: str) -> dict | None:
    """获取指定主题的信息。"""
    theme = CodeBlockTheme.get(name)
    if theme:
        return {
            "name": theme.name,
            "display_name": theme.display_name,
            "bg": theme.bg,
            "fg": theme.fg,
        }
    return None
