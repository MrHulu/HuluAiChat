# Demo Assets

This directory contains demo assets for HuluChat.

## Required Files

| File | Dimensions | Duration | Description |
|------|------------|----------|-------------|
| `huluchat-demo-30s.gif` | 1280x800 | 20-30s | Main demo GIF for README |

## How to Create Demo GIF

### Option 1: ScreenToGif (Windows)

1. Download [ScreenToGif](https://www.screentogif.com/)
2. Record the app following the script in `docs/v3.53.0-community-launch-assets.md`
3. Export as GIF (15-20 fps, < 5MB)

### Option 2: Peek (Linux)

```bash
# Install Peek
sudo apt install peek  # Ubuntu/Debian
sudo dnf install peek  # Fedora

# Record and export as GIF
```

### Option 3: QuickTime + Gifski (macOS)

1. Record screen with QuickTime
2. Convert to GIF with [Gifski](https://gif.ski/)

## Demo Script

See: `docs/v3.53.0-community-launch-assets.md` Section 2

### Quick Script Summary

| Scene | Duration | Action |
|-------|----------|--------|
| 1 | 0-3s | App launch |
| 2 | 3-8s | Chat demo |
| 3 | 8-12s | Model switch |
| 4 | 12-16s | Session folders |
| 5 | 16-20s | Search (Ctrl+K) |
| 6 | 20-25s | Export menu |
| 7 | 25-30s | End screen |

## Tips

- Use dark theme
- Show realistic content (code blocks, markdown)
- Smooth mouse movements
- No API keys visible
- End with GitHub URL

---

*Created for v3.53.0 Community Launch Sprint*
