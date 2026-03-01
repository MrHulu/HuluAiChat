"""
Tests for enhanced_markdown module.
"""

import pytest
import re

from src.ui.enhanced_markdown import (
    CodeBlockFrame,
    EnhancedMarkdown,
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
