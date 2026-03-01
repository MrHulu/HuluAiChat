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
