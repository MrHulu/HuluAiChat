"""
增强版 Markdown 渲染器 - 支持代码块复制按钮。

基于 CTkMarkdown 扩展，为每个代码块添加一键复制功能。
"""

import re
import tkinter as tk
import customtkinter as ctk

try:
    from ctk_markdown import CTkMarkdown as BaseCTkMarkdown
    _HAS_BASE = True
except ImportError:
    _HAS_BASE = False
    BaseCTkMarkdown = object  # type: ignore[misc, assignment]


class CodeBlockFrame(ctk.CTkFrame):
    """代码块容器，包含复制按钮。"""

    def __init__(self, parent, code: str, language: str = "", **kwargs):
        super().__init__(parent, **kwargs)
        self._code = code
        self._language = language

        # 配置
        self.configure(
            fg_color=("gray95", "gray20"),
            corner_radius=8,
            border_width=1,
            border_color=("gray70", "gray35")
        )

        # 顶部栏 - 语言标签 + 复制按钮
        header_frame = ctk.CTkFrame(self, fg_color="transparent")
        header_frame.grid(row=0, column=0, sticky="ew", padx=8, pady=(6, 0))
        header_frame.grid_columnconfigure(1, weight=1)

        # 语言标签
        if language:
            lang_label = ctk.CTkLabel(
                header_frame,
                text=language.upper(),
                font=("Consolas", 10, "bold"),
                text_color=("gray50", "gray65"),
                anchor="w"
            )
            lang_label.grid(row=0, column=0, sticky="w")

        # 复制按钮
        self._copy_btn = ctk.CTkButton(
            header_frame,
            text="📋 复制",
            width=70,
            height=24,
            font=("Segoe UI", 9),
            fg_color=("gray70", "gray35"),
            hover_color=("gray60", "gray30"),
            corner_radius=4,
            command=self._on_copy
        )
        self._copy_btn.grid(row=0, column=2, sticky="e")

        # 分隔线
        separator = ctk.CTkFrame(self, height=1, fg_color=("gray70", "gray35"))
        separator.grid(row=1, column=0, sticky="ew", padx=8, pady=(4, 0))

        # 代码内容显示
        self._textbox = tk.Text(
            self,
            wrap="word",
            font=("Consolas", 10),
            bg="#EEEEEE" if ctk.get_appearance_mode() == "Light" else "#212121",
            fg="#1f2328" if ctk.get_appearance_mode() == "Light" else "#f0f6fc",
            relief="flat",
            borderwidth=0,
            padx=12,
            pady=8,
            state="disabled",
            cursor="arrow"
        )
        self._textbox.grid(row=2, column=0, sticky="nsew", padx=4, pady=(0, 4))
        self.grid_rowconfigure(2, weight=1)
        self.grid_columnconfigure(0, weight=1)

        # 插入代码并应用语法高亮
        self._insert_highlighted_code()

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

        # 更新按钮状态
        self._copy_btn.configure(text="✓ 已复制", fg_color=("green4", "green2"))
        self.after(1500, lambda: self._copy_btn.configure(
            text="📋 复制",
            fg_color=("gray70", "gray35")
        ))

    def _insert_highlighted_code(self):
        """插入带语法高亮的代码。"""
        self._textbox.configure(state="normal")
        self._textbox.delete("1.0", "end")

        # 简单的语法高亮配置
        colors = {
            "light": {
                "keyword": "#0550ae",
                "string": "#0a3069",
                "comment": "#6e7781",
                "number": "#953800",
                "function": "#8250df",
            },
            "dark": {
                "keyword": "#569cd6",
                "string": "#ce9178",
                "comment": "#6a9955",
                "number": "#b5cea8",
                "function": "#dcdcaa",
            }
        }
        mode = "dark" if ctk.get_appearance_mode() == "Dark" else "light"
        theme = colors[mode]

        # 配置标签
        self._textbox.tag_config("keyword", foreground=theme["keyword"])
        self._textbox.tag_config("string", foreground=theme["string"])
        self._textbox.tag_config("comment", foreground=theme["comment"])
        self._textbox.tag_config("number", foreground=theme["number"])
        self._textbox.tag_config("function", foreground=theme["function"])

        # 根据语言应用高亮
        lang = self._language.lower()
        if lang in ("python", "py"):
            self._highlight_python()
        elif lang in ("javascript", "js", "typescript", "ts"):
            self._highlight_javascript()
        elif lang in ("bash", "sh", "shell"):
            self._highlight_bash()
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
        # Bash 简单高亮：注释
        for line in self._code.split('\n'):
            # 查找注释位置
            comment_pos = line.find('#')
            if comment_pos >= 0:
                # 注释前的内容
                if comment_pos > 0:
                    self._textbox.insert("end", line[:comment_pos])
                # 注释
                self._textbox.insert("end", line[comment_pos:], "comment")
            else:
                self._textbox.insert("end", line)
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
    def render_with_code_blocks(
        parent,
        markdown: str,
        use_base_ctkmarkdown: bool = True
    ) -> list:
        """
        渲染 Markdown，代码块用 CodeBlockFrame，其他用基础渲染器。

        返回: [创建的 widget 列表]
        """
        widgets = []

        # 如果没有代码块，使用基础渲染器
        if not EnhancedMarkdown.has_code_blocks(markdown):
            if use_base_ctkmarkdown and _HAS_BASE:
                md = BaseCTkMarkdown(parent, width=400)
                md.set_markdown(markdown)
                widgets.append(md)
            else:
                # 纯文本回退
                tb = ctk.CTkTextbox(parent, wrap="word")
                tb.insert("1.0", markdown)
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
                        widgets.append(md)
                    else:
                        tb = ctk.CTkTextbox(parent, wrap="word")
                        tb.insert("1.0", before_text)
                        tb.configure(state="disabled")
                        widgets.append(tb)

            # 代码块
            code_frame = CodeBlockFrame(
                parent,
                code=block["code"],
                language=block["language"]
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
                    widgets.append(md)
                else:
                    tb = ctk.CTkTextbox(parent, wrap="word")
                    tb.insert("1.0", after_text)
                    tb.configure(state="disabled")
                    widgets.append(tb)

        return widgets


# 便捷函数
def create_enhanced_markdown(parent, markdown: str, width: int = 400) -> ctk.CTkFrame:
    """
    创建增强版 Markdown 渲染容器。

    返回包含所有渲染内容的 Frame。
    """
    container = ctk.CTkFrame(parent, fg_color="transparent")
    container.grid_columnconfigure(0, weight=1)

    widgets = EnhancedMarkdown.render_with_code_blocks(container, markdown)
    for i, widget in enumerate(widgets):
        widget.grid(row=i, column=0, sticky="ew", pady=2)

    return container
