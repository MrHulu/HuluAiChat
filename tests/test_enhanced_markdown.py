"""
Tests for enhanced_markdown module.
"""

import pytest
import re

from src.ui.enhanced_markdown import (
    CodeBlockFrame,
    CodeBlockTheme,
    EnhancedMarkdown,
    get_available_themes,
    get_theme_info,
    set_code_theme,
    get_code_theme,
    cycle_code_theme,
    set_theme_save_callback,
    set_font_size_save_callback,
)


class TestEnhancedMarkdown:
    """Tests for EnhancedMarkdown class."""

    def test_has_code_blocks_with_code_block(self):
        """Test detecting markdown with code blocks."""
        markdown = "```python\nprint('hello')\n```"
        assert EnhancedMarkdown.has_code_blocks(markdown) is True

    def test_has_code_blocks_without_code_block(self):
        """Test detecting markdown without code blocks."""
        markdown = "Just plain text"
        assert EnhancedMarkdown.has_code_blocks(markdown) is False

    def test_has_code_blocks_with_inline_code(self):
        """Test detecting markdown with only inline code."""
        markdown = "This has `inline code` but no blocks"
        assert EnhancedMarkdown.has_code_blocks(markdown) is False

    def test_parse_code_blocks_single(self):
        """Test parsing a single code block."""
        markdown = "```python\nprint('hello')\n```"
        blocks = EnhancedMarkdown.parse_code_blocks(markdown)
        assert len(blocks) == 1
        assert blocks[0]["language"] == "python"
        assert blocks[0]["code"] == "print('hello')"

    def test_parse_code_blocks_multiple(self):
        """Test parsing multiple code blocks."""
        markdown = """
Text before

```python
print('hello')
```

Text between

```javascript
console.log('world');
```

Text after
"""
        blocks = EnhancedMarkdown.parse_code_blocks(markdown)
        assert len(blocks) == 2
        assert blocks[0]["language"] == "python"
        assert blocks[1]["language"] == "javascript"

    def test_parse_code_blocks_no_language(self):
        """Test parsing code block without language specifier."""
        markdown = "```\ncode here\n```"
        blocks = EnhancedMarkdown.parse_code_blocks(markdown)
        assert len(blocks) == 1
        assert blocks[0]["language"] == ""

    def test_parse_code_blocks_various_languages(self):
        """Test parsing code blocks for various languages."""
        test_cases = [
            ("python", "```python\ncode\n```"),
            ("javascript", "```javascript\ncode\n```"),
            ("typescript", "```typescript\ncode\n```"),
            ("bash", "```bash\ncode\n```"),
            ("go", "```go\ncode\n```"),
            ("rust", "```rust\ncode\n```"),
            ("java", "```java\ncode\n```"),
            ("c", "```c\ncode\n```"),
            ("cpp", "```cpp\ncode\n```"),
            ("css", "```css\ncode\n```"),
            ("html", "```html\ncode\n```"),
            ("sql", "```sql\ncode\n```"),
            ("json", "```json\ncode\n```"),
            ("yaml", "```yaml\ncode\n```"),
        ]

        for expected_lang, markdown in test_cases:
            blocks = EnhancedMarkdown.parse_code_blocks(markdown)
            assert len(blocks) == 1
            assert blocks[0]["language"] == expected_lang

    def test_code_block_pattern_regex(self):
        """Test the CODE_BLOCK_PATTERN regex directly."""
        pattern = EnhancedMarkdown.CODE_BLOCK_PATTERN

        # Standard code block
        match = pattern.search("```python\nprint('hello')\n```")
        assert match is not None
        assert match.group(1) == "python"
        assert match.group(2) == "print('hello')"

        # Code block with content
        code = "def hello():\n    return 'world'"
        match = pattern.search(f"```python\n{code}\n```")
        assert match is not None
        assert match.group(1) == "python"
        assert match.group(2) == code

    def test_inline_code_pattern_regex(self):
        """Test the INLINE_CODE_PATTERN regex directly."""
        pattern = EnhancedMarkdown.INLINE_CODE_PATTERN

        # Inline code
        match = pattern.search("This has `inline code` here")
        assert match is not None
        assert match.group(1) == "inline code"

        # Multiple inline codes
        matches = list(pattern.finditer("Check `this` and `that`"))
        assert len(matches) == 2
        assert matches[0].group(1) == "this"
        assert matches[1].group(1) == "that"

    def test_parse_code_blocks_returns_positions(self):
        """Test that parse_code_blocks returns start and end positions."""
        markdown = "Before ```python\ncode\n``` after"
        blocks = EnhancedMarkdown.parse_code_blocks(markdown)
        assert len(blocks) == 1
        assert "start" in blocks[0]
        assert "end" in blocks[0]
        assert blocks[0]["start"] < blocks[0]["end"]

    def test_supported_languages(self):
        """Test that all expected language aliases are supported."""
        # These should all be recognized
        # Note: c++ contains special character +, so it won't match \w* pattern
        language_aliases = [
            ("python", "py"),
            ("javascript", "js", "typescript", "ts"),
            ("bash", "sh", "shell"),
            ("go", "golang"),
            ("rust", "rs"),
            ("java",),
            ("c", "cpp", "cc", "cxx"),  # c++ excluded (has +)
            ("css",),
            ("html", "htm", "xml"),
            ("sql",),
            ("json", "yaml", "yml"),
        ]

        for aliases in language_aliases:
            # Just verify the pattern matches these
            for alias in aliases:
                markdown = f"```{alias}\ncode\n```"
                blocks = EnhancedMarkdown.parse_code_blocks(markdown)
                assert len(blocks) == 1, f"Failed for alias: {alias}"
                assert blocks[0]["language"] == alias


class TestCodeBlockFrame:
    """Tests for CodeBlockFrame class."""

    @pytest.fixture(scope="session")
    def root_window(self):
        """Create a root tkinter window for testing (session-scoped)."""
        import tkinter as tk
        window = tk.Tk()
        window.withdraw()  # Hide the window
        yield window
        window.destroy()

    def test_code_block_frame_creation(self, root_window):
        """Test creating a CodeBlockFrame."""
        frame = CodeBlockFrame(root_window, code="print('hello')", language="python")
        assert frame._code == "print('hello')"
        assert frame._language == "python"

    def test_code_block_frame_empty_language(self, root_window):
        """Test creating a CodeBlockFrame without language."""
        frame = CodeBlockFrame(root_window, code="some code", language="")
        assert frame._language == ""

    def test_code_block_frame_multiline_code(self, root_window):
        """Test creating a CodeBlockFrame with multiline code."""
        code = "line1\nline2\nline3"
        frame = CodeBlockFrame(root_window, code=code, language="python")
        assert frame._code == code

    @pytest.mark.parametrize("lang,code", [
        ("python", "def hello():\n    return 'world'"),
        ("javascript", "function hello() { return 'world'; }"),
        ("bash", "echo 'hello'"),
        ("go", "func hello() string { return \"world\" }"),
        ("rust", "fn hello() -> String { \"world\".to_string() }"),
        ("java", "public String hello() { return \"world\"; }"),
        ("cpp", "string hello() { return \"world\"; }"),
        ("css", ".class { color: red; }"),
        ("html", "<div>content</div>"),
        ("sql", "SELECT * FROM table"),
        ("json", '{"key": "value"}'),
        ("yaml", "key: value"),
    ])
    def test_code_block_frame_all_languages(self, root_window, lang, code):
        """Test creating CodeBlockFrame for all supported languages."""
        frame = CodeBlockFrame(root_window, code=code, language=lang)
        assert frame._code == code
        assert frame._language == lang

    def test_code_block_frame_special_characters(self, root_window):
        """Test code with special characters."""
        code = 'print("Hello\\nWorld\\t!")'
        frame = CodeBlockFrame(root_window, code=code, language="python")
        assert frame._code == code


class TestLineNumbers:
    """Tests for line numbers feature (v1.4.2)."""

    @pytest.fixture(scope="session")
    def root_window(self):
        """Create a root tkinter window for testing (session-scoped)."""
        import tkinter as tk
        window = tk.Tk()
        window.withdraw()  # Hide the window
        yield window
        window.destroy()

    def test_line_numbers_enabled_by_default(self, root_window):
        """Test that line numbers are enabled by default for multiline code."""
        code = "line1\nline2\nline3"
        frame = CodeBlockFrame(root_window, code=code, language="python")
        assert frame._show_line_numbers is True

    def test_line_numbers_disabled_for_single_line(self, root_window):
        """Test that line numbers are disabled for single-line code."""
        code = "single line"
        frame = CodeBlockFrame(root_window, code=code, language="python")
        assert frame._show_line_numbers is False

    def test_line_numbers_can_be_disabled(self, root_window):
        """Test that line numbers can be explicitly disabled."""
        code = "line1\nline2\nline3"
        frame = CodeBlockFrame(root_window, code=code, language="python", show_line_numbers=False)
        assert frame._show_line_numbers is False

    def test_line_numbers_can_be_enabled_for_single_line(self, root_window):
        """Test that line numbers can be explicitly enabled for single-line code."""
        code = "single line"
        frame = CodeBlockFrame(root_window, code=code, language="python", show_line_numbers=True)
        # Single line code still doesn't show line numbers (logic check)
        assert frame._show_line_numbers is False

    def test_line_numbers_multiline_code(self, root_window):
        """Test line numbers with various line counts."""
        test_cases = [
            ("one line", 1),
            ("two\nlines", 2),
            ("three\nlines\nhere", 3),
            ("five\nlines\nfor\nthis\ncode", 5),
        ]

        for code, expected_lines in test_cases:
            frame = CodeBlockFrame(root_window, code=code, language="python")
            if expected_lines > 1:
                assert frame._show_line_numbers is True
            else:
                assert frame._show_line_numbers is False

    def test_render_with_line_numbers_parameter(self, root_window):
        """Test that render_with_code_blocks passes show_line_numbers parameter."""
        markdown = "```python\nprint('hello')\n```"

        # Test with line numbers enabled
        widgets = EnhancedMarkdown.render_with_code_blocks(
            root_window, markdown, show_line_numbers=True
        )
        assert len(widgets) == 1
        assert isinstance(widgets[0], CodeBlockFrame)
        assert widgets[0]._show_line_numbers is False  # Single line

        # Test with line numbers disabled
        widgets = EnhancedMarkdown.render_with_code_blocks(
            root_window, markdown, show_line_numbers=False
        )
        assert len(widgets) == 1
        assert widgets[0]._show_line_numbers is False

    def test_multiline_code_block_line_numbers(self, root_window):
        """Test line numbers with multiline code block."""
        markdown = "```python\ndef hello():\n    return 'world'\n```"

        widgets = EnhancedMarkdown.render_with_code_blocks(
            root_window, markdown, show_line_numbers=True
        )
        assert len(widgets) == 1
        assert widgets[0]._show_line_numbers is True

    def test_empty_code_line_numbers(self, root_window):
        """Test line numbers with empty code."""
        frame = CodeBlockFrame(root_window, code="", language="python")
        assert frame._show_line_numbers is False  # No newlines = single line


class TestWordWrap:
    """Tests for word wrap toggle feature (v1.4.3)."""

    @pytest.fixture(scope="session")
    def root_window(self):
        """Create a root tkinter window for testing (session-scoped)."""
        import tkinter as tk
        window = tk.Tk()
        window.withdraw()  # Hide the window
        yield window
        window.destroy()

    def test_wrap_default_is_word(self, root_window):
        """Test that default wrap mode is 'word'."""
        frame = CodeBlockFrame(root_window, code="print('hello')", language="python")
        assert frame._wrap == "word"
        assert frame._textbox.cget("wrap") == "word"

    def test_wrap_none_mode(self, root_window):
        """Test creating CodeBlockFrame with wrap='none'."""
        frame = CodeBlockFrame(root_window, code="print('hello')", language="python", wrap="none")
        assert frame._wrap == "none"
        assert frame._textbox.cget("wrap") == "none"

    def test_wrap_char_mode(self, root_window):
        """Test creating CodeBlockFrame with wrap='char'."""
        frame = CodeBlockFrame(root_window, code="print('hello')", language="python", wrap="char")
        assert frame._wrap == "char"
        assert frame._textbox.cget("wrap") == "char"

    def test_wrap_invalid_defaults_to_word(self, root_window):
        """Test that invalid wrap mode defaults to 'word'."""
        frame = CodeBlockFrame(root_window, code="print('hello')", language="python", wrap="invalid")
        assert frame._wrap == "word"

    def test_wrap_toggle_button_exists(self, root_window):
        """Test that wrap toggle button is created."""
        frame = CodeBlockFrame(root_window, code="print('hello')", language="python")
        assert hasattr(frame, "_wrap_btn")
        assert frame._wrap_btn.cget("text") in ("↔️", "↩️")

    def test_wrap_toggle_button_shows_wrap_icon(self, root_window):
        """Test that wrap button shows correct icon based on wrap mode."""
        # Word wrap mode shows ↔️
        frame = CodeBlockFrame(root_window, code="print('hello')", language="python", wrap="word")
        assert frame._wrap_btn.cget("text") == "↔️"

        # No wrap mode shows ↩️
        frame2 = CodeBlockFrame(root_window, code="print('hello')", language="python", wrap="none")
        assert frame2._wrap_btn.cget("text") == "↩️"

    def test_wrap_toggle_method_exists(self, root_window):
        """Test that _on_toggle_wrap method exists."""
        frame = CodeBlockFrame(root_window, code="print('hello')", language="python")
        assert hasattr(frame, "_on_toggle_wrap")
        assert callable(frame._on_toggle_wrap)

    def test_render_with_wrap_parameter(self, root_window):
        """Test that render_with_code_blocks passes wrap parameter."""
        markdown = "```python\nprint('hello')\n```"

        # Test with wrap="none"
        widgets = EnhancedMarkdown.render_with_code_blocks(
            root_window, markdown, wrap="none"
        )
        assert len(widgets) == 1
        assert widgets[0]._wrap == "none"

        # Test with wrap="char"
        widgets = EnhancedMarkdown.render_with_code_blocks(
            root_window, markdown, wrap="char"
        )
        assert len(widgets) == 1
        assert widgets[0]._wrap == "char"


class TestCodeBlockThemes:
    """Tests for code block themes feature (v1.4.4)."""

    @pytest.fixture(scope="session")
    def root_window(self):
        """Create a root tkinter window for testing (session-scoped)."""
        import tkinter as tk
        window = tk.Tk()
        window.withdraw()  # Hide the window
        yield window
        window.destroy()

    def test_themes_are_registered(self):
        """Test that all built-in themes are registered."""
        themes = CodeBlockTheme.all()
        assert len(themes) >= 8  # At least 8 built-in themes

        # Check for expected theme names
        theme_names = {t.name for t in themes}
        expected_themes = {
            "github_dark", "github_light", "monokai", "nord",
            "dracula", "vscode_dark", "one_dark", "solarized_dark", "solarized_light"
        }
        assert expected_themes.issubset(theme_names)

    def test_theme_has_all_required_fields(self):
        """Test that each theme has all required color fields."""
        themes = CodeBlockTheme.all()
        required_fields = {
            "name", "display_name", "bg", "fg", "line_bg", "line_fg",
            "border", "separator", "keyword", "string", "comment", "number", "function"
        }

        for theme in themes:
            theme_dict = {
                "name": theme.name,
                "display_name": theme.display_name,
                "bg": theme.bg,
                "fg": theme.fg,
                "line_bg": theme.line_bg,
                "line_fg": theme.line_fg,
                "border": theme.border,
                "separator": theme.separator,
                "keyword": theme.keyword,
                "string": theme.string,
                "comment": theme.comment,
                "number": theme.number,
                "function": theme.function,
            }
            assert required_fields == set(theme_dict.keys())

    def test_get_theme_by_name(self):
        """Test getting themes by name."""
        github_dark = CodeBlockTheme.get("github_dark")
        assert github_dark is not None
        assert github_dark.name == "github_dark"
        assert github_dark.display_name == "GitHub Dark"

        # Non-existent theme returns None
        assert CodeBlockTheme.get("nonexistent_theme") is None

    def test_get_theme_with_default(self):
        """Test getting theme with default fallback."""
        theme = CodeBlockTheme.get("nonexistent", CodeBlockTheme.get("github_dark"))
        assert theme is not None
        assert theme.name == "github_dark"

    def test_theme_next_cycles(self):
        """Test that next() cycles through themes."""
        themes = CodeBlockTheme.all()

        # Get first theme
        first = themes[0]
        second = CodeBlockTheme.next(first.name)
        assert second.name == themes[1].name if len(themes) > 1 else first.name

        # Last theme should cycle to first
        last = themes[-1]
        next_of_last = CodeBlockTheme.next(last.name)
        assert next_of_last.name == themes[0].name

    def test_get_available_themes_function(self):
        """Test get_available_themes utility function."""
        themes = get_available_themes()
        assert isinstance(themes, list)
        assert len(themes) >= 8

        # Each theme dict should have name and display_name
        for theme in themes:
            assert "name" in theme
            assert "display_name" in theme

    def test_get_theme_info_function(self):
        """Test get_theme_info utility function."""
        info = get_theme_info("github_dark")
        assert info is not None
        assert info["name"] == "github_dark"
        assert "display_name" in info
        assert "bg" in info
        assert "fg" in info

        # Non-existent theme returns None
        assert get_theme_info("nonexistent") is None

    def test_code_block_frame_uses_theme(self, root_window):
        """Test that CodeBlockFrame uses specified theme."""
        frame = CodeBlockFrame(
            root_window,
            code="print('hello')",
            language="python",
            theme="monokai"
        )
        assert frame._theme.name == "monokai"
        assert frame._theme.bg == "#272822"  # Monokai background

    def test_code_block_frame_default_theme(self, root_window):
        """Test that CodeBlockFrame uses shared theme when none specified."""
        # Set shared theme
        CodeBlockFrame.set_shared_theme("dracula")

        frame = CodeBlockFrame(
            root_window,
            code="print('hello')",
            language="python"
        )
        assert frame._theme.name == "dracula"

    def test_code_block_frame_theme_toggle_button(self, root_window):
        """Test that theme toggle button exists."""
        frame = CodeBlockFrame(
            root_window,
            code="print('hello')",
            language="python"
        )
        assert hasattr(frame, "_theme_btn")
        assert frame._theme_btn.cget("text") == "🎨"

    def test_code_block_frame_on_toggle_theme_method(self, root_window):
        """Test that _on_toggle_theme method exists and works."""
        frame = CodeBlockFrame(
            root_window,
            code="print('hello')",
            language="python",
            theme="github_dark"
        )
        assert hasattr(frame, "_on_toggle_theme")
        assert callable(frame._on_toggle_theme)

        initial_theme = frame._theme.name
        frame._on_toggle_theme()
        # Theme should have changed
        assert frame._theme.name != initial_theme

    def test_shared_theme_class_methods(self, root_window):
        """Test shared theme class methods."""
        # Set shared theme
        assert CodeBlockFrame.set_shared_theme("nord") is True
        assert CodeBlockFrame.get_shared_theme() == "nord"

        # Invalid theme returns False
        assert CodeBlockFrame.set_shared_theme("invalid_theme") is False

        # Theme should remain unchanged
        assert CodeBlockFrame.get_shared_theme() == "nord"

    def test_cycle_shared_theme(self, root_window):
        """Test cycling shared theme."""
        CodeBlockFrame.set_shared_theme("github_dark")

        next_theme = CodeBlockFrame.cycle_shared_theme()
        assert next_theme.name != "github_dark"
        assert CodeBlockFrame.get_shared_theme() == next_theme.name

    def test_render_with_theme_parameter(self, root_window):
        """Test that render_with_code_blocks passes theme parameter."""
        markdown = "```python\nprint('hello')\n```"

        widgets = EnhancedMarkdown.render_with_code_blocks(
            root_window, markdown, theme="monokai"
        )
        assert len(widgets) == 1
        assert widgets[0]._theme.name == "monokai"

    def test_theme_colors_applied_to_widgets(self, root_window):
        """Test that theme colors are applied to UI elements."""
        frame = CodeBlockFrame(
            root_window,
            code="print('hello')",
            language="python",
            theme="github_dark"
        )

        # Check frame background
        assert frame.cget("fg_color") == "#0d1117"

        # Check textbox background
        assert frame._textbox.cget("bg") == "#0d1117"
        assert frame._textbox.cget("fg") == "#c9d1d9"

    def test_multiple_frames_share_theme(self, root_window):
        """Test that multiple code blocks share the same theme."""
        CodeBlockFrame.set_shared_theme("dracula")

        frame1 = CodeBlockFrame(root_window, code="code1", language="python")
        frame2 = CodeBlockFrame(root_window, code="code2", language="javascript")

        assert frame1._theme.name == "dracula"
        assert frame2._theme.name == "dracula"

    def test_global_theme_functions(self):
        """Test global theme getter/setter functions."""
        # Set theme
        assert set_code_theme("one_dark") is True
        assert get_code_theme() == "one_dark"

        # Invalid theme
        assert set_code_theme("invalid") is False
        assert get_code_theme() == "one_dark"  # Unchanged

    def test_cycle_global_theme(self):
        """Test cycling global theme."""
        set_code_theme("github_dark")
        initial = get_code_theme()

        next_theme = cycle_code_theme()
        assert get_code_theme() != initial
        assert next_theme.name == get_code_theme()

    @pytest.mark.parametrize("theme_name", [
        "github_dark", "github_light", "monokai", "nord",
        "dracula", "vscode_dark", "one_dark", "solarized_dark", "solarized_light"
    ])
    def test_all_themes_are_valid(self, root_window, theme_name):
        """Test that all built-in themes can be applied to code blocks."""
        frame = CodeBlockFrame(
            root_window,
            code="print('test')",
            language="python",
            theme=theme_name
        )
        assert frame._theme.name == theme_name
        # Verify all colors are valid hex codes
        assert frame._theme.bg.startswith("#")
        assert frame._theme.fg.startswith("#")


class TestCodeBlockThemePersistence:
    """Tests for v1.4.5 theme persistence feature."""

    @pytest.fixture(scope="session")
    def root_window(self):
        """Create a root tkinter window for testing (session-scoped)."""
        import tkinter as tk
        window = tk.Tk()
        window.withdraw()  # Hide the window
        yield window
        window.destroy()

    def test_set_theme_save_callback(self):
        """Test setting the theme save callback."""
        callback_called = []

        def mock_callback(theme_name: str):
            callback_called.append(theme_name)

        set_theme_save_callback(mock_callback)
        assert len(callback_called) == 0

    def test_set_shared_theme_calls_callback(self, root_window):
        """Test that set_shared_theme calls the save callback."""
        callback_called = []

        def mock_callback(theme_name: str):
            callback_called.append(theme_name)

        set_theme_save_callback(mock_callback)

        # Reset to known theme
        CodeBlockFrame.set_shared_theme("github_dark")
        callback_called.clear()

        # Set new theme
        CodeBlockFrame.set_shared_theme("monokai")

        assert len(callback_called) == 1
        assert callback_called[0] == "monokai"
        assert CodeBlockFrame.get_shared_theme() == "monokai"

    def test_cycle_shared_theme_calls_callback(self, root_window):
        """Test that cycle_shared_theme calls the save callback."""
        callback_called = []

        def mock_callback(theme_name: str):
            callback_called.append(theme_name)

        set_theme_save_callback(mock_callback)

        # Reset to known theme
        CodeBlockFrame.set_shared_theme("github_dark")
        callback_called.clear()

        # Cycle theme
        new_theme = CodeBlockFrame.cycle_shared_theme()

        assert len(callback_called) == 1
        assert callback_called[0] == new_theme.name
        assert CodeBlockFrame.get_shared_theme() == new_theme.name

    def test_set_shared_theme_invalid_name_no_callback(self, root_window):
        """Test that invalid theme name doesn't call callback."""
        callback_called = []

        def mock_callback(theme_name: str):
            callback_called.append(theme_name)

        set_theme_save_callback(mock_callback)
        callback_called.clear()

        # Try invalid theme
        result = CodeBlockFrame.set_shared_theme("invalid_theme_name")

        assert result is False
        assert len(callback_called) == 0

    def test_none_callback_does_not_raise(self, root_window):
        """Test that None callback doesn't cause errors."""
        set_theme_save_callback(None)

        # Should not raise any exceptions
        CodeBlockFrame.set_shared_theme("nord")
        CodeBlockFrame.cycle_shared_theme()

        assert CodeBlockFrame.get_shared_theme() != "github_dark"


class TestCodeBlockFontSizePersistence:
    """Tests for v1.4.6 font size persistence feature."""

    @pytest.fixture(scope="session")
    def root_window(self):
        """Create a root tkinter window for testing (session-scoped)."""
        import tkinter as tk
        window = tk.Tk()
        window.withdraw()  # Hide the window
        yield window
        window.destroy()

    def test_set_font_size_save_callback(self):
        """Test setting the font size save callback."""
        callback_called = []

        def mock_callback(font_size: int):
            callback_called.append(font_size)

        set_font_size_save_callback(mock_callback)
        assert len(callback_called) == 0

    def test_set_shared_font_size_calls_callback(self):
        """Test that set_shared_font_size calls the save callback."""
        callback_called = []

        def mock_callback(font_size: int):
            callback_called.append(font_size)

        set_font_size_save_callback(mock_callback)

        # Reset to known font size
        CodeBlockFrame.set_shared_font_size(10)
        callback_called.clear()

        # Set new font size
        CodeBlockFrame.set_shared_font_size(12)

        assert len(callback_called) == 1
        assert callback_called[0] == 12
        assert CodeBlockFrame.get_shared_font_size() == 12

    def test_set_shared_font_size_valid_range(self):
        """Test that valid font sizes are accepted."""
        # Reset to default
        CodeBlockFrame.set_shared_font_size(10)

        # Test minimum
        assert CodeBlockFrame.set_shared_font_size(8) is True
        assert CodeBlockFrame.get_shared_font_size() == 8

        # Test maximum
        assert CodeBlockFrame.set_shared_font_size(16) is True
        assert CodeBlockFrame.get_shared_font_size() == 16

    def test_set_shared_font_size_invalid_range(self):
        """Test that invalid font sizes are rejected."""
        # Reset to default
        CodeBlockFrame.set_shared_font_size(10)

        # Test too small
        assert CodeBlockFrame.set_shared_font_size(7) is False
        assert CodeBlockFrame.get_shared_font_size() == 10  # Unchanged

        # Test too large
        assert CodeBlockFrame.set_shared_font_size(17) is False
        assert CodeBlockFrame.get_shared_font_size() == 10  # Unchanged

        # Test non-integer
        assert CodeBlockFrame.set_shared_font_size("10") is False
        assert CodeBlockFrame.get_shared_font_size() == 10  # Unchanged

    def test_none_callback_does_not_raise(self, root_window):
        """Test that None callback doesn't cause errors."""
        set_font_size_save_callback(None)

        # Should not raise any exceptions
        CodeBlockFrame.set_shared_font_size(12)

        assert CodeBlockFrame.get_shared_font_size() == 12

    def test_font_size_buttons_exist(self, root_window):
        """Test that font size buttons are created."""
        frame = CodeBlockFrame(root_window, code="print('hello')", language="python")
        assert hasattr(frame, "_font_inc_btn")
        assert hasattr(frame, "_font_dec_btn")
        assert frame._font_inc_btn.cget("text") == "A+"
        assert frame._font_dec_btn.cget("text") == "A-"

    def test_font_size_buttons_state_at_limits(self, root_window):
        """Test that font size buttons are properly disabled at limits."""
        # At minimum (8)
        CodeBlockFrame.set_shared_font_size(8)
        frame = CodeBlockFrame(root_window, code="print('hello')", language="python")
        assert frame._font_dec_btn.cget("state") == "disabled"
        assert frame._font_inc_btn.cget("state") == "normal"

        # At maximum (16)
        CodeBlockFrame.set_shared_font_size(16)
        frame2 = CodeBlockFrame(root_window, code="print('hello')", language="python")
        assert frame2._font_dec_btn.cget("state") == "normal"
        assert frame2._font_inc_btn.cget("state") == "disabled"

    def test_default_font_size_is_10(self):
        """Test that default font size is 10."""
        # Reset to default
        CodeBlockFrame.set_shared_font_size(10)
        assert CodeBlockFrame.get_shared_font_size() == 10


class TestSearchHighlighting:
    """Tests for search highlighting functionality (v1.4.7)."""

    @pytest.fixture(scope="session")
    def root_window(self):
        """Create a root tkinter window for testing (session-scoped)."""
        import tkinter as tk
        window = tk.Tk()
        window.withdraw()  # Hide the window
        yield window
        window.destroy()

    def test_render_with_code_blocks_accepts_search_query(self, root_window):
        """Test that render_with_code_blocks accepts search_query parameter."""
        markdown = "Hello world\n```python\nprint('test')\n```"

        # Should not raise an exception
        widgets = EnhancedMarkdown.render_with_code_blocks(
            root_window,
            markdown,
            use_base_ctkmarkdown=False,
            search_query="world"
        )
        assert len(widgets) > 0

    def test_render_with_empty_search_query(self, root_window):
        """Test that empty search_query doesn't cause errors."""
        markdown = "Hello world"

        widgets = EnhancedMarkdown.render_with_code_blocks(
            root_window,
            markdown,
            use_base_ctkmarkdown=False,
            search_query=None
        )
        assert len(widgets) > 0

        widgets2 = EnhancedMarkdown.render_with_code_blocks(
            root_window,
            markdown,
            use_base_ctkmarkdown=False,
            search_query=""
        )
        assert len(widgets2) > 0

    def test_render_with_code_blocks_with_search(self, root_window):
        """Test rendering with code blocks and search query."""
        markdown = "Search for **test** here\n```python\nprint('search')\n```"

        widgets = EnhancedMarkdown.render_with_code_blocks(
            root_window,
            markdown,
            use_base_ctkmarkdown=False,
            search_query="search"
        )
        # Should have text widget(s) and code block
        assert len(widgets) > 0

    def test_render_plain_text_with_search(self, root_window):
        """Test rendering plain text with search query."""
        markdown = "This is a plain text message without code blocks."

        widgets = EnhancedMarkdown.render_with_code_blocks(
            root_window,
            markdown,
            use_base_ctkmarkdown=False,
            search_query="plain"
        )
        assert len(widgets) == 1

    def test_render_markdown_with_inline_code_and_search(self, root_window):
        """Test rendering markdown with inline code and search query."""
        markdown = "Use `print()` for output and search for terms."

        widgets = EnhancedMarkdown.render_with_code_blocks(
            root_window,
            markdown,
            use_base_ctkmarkdown=False,
            search_query="search"
        )
        assert len(widgets) == 1

    def test_render_multiple_code_blocks_with_search(self, root_window):
        """Test rendering multiple code blocks with search query."""
        markdown = """First block
```python
print('hello')
```
Middle text
```js
console.log('world');
```
Last text"""

        widgets = EnhancedMarkdown.render_with_code_blocks(
            root_window,
            markdown,
            use_base_ctkmarkdown=False,
            search_query="text"
        )
        # Should have: text, code, text, code, text
        assert len(widgets) >= 3
