#!/bin/bash
# HuluChat Build Script for macOS
# Usage: ./build-macos.sh [app|clean]

set -e

TARGET=${1:-app}

if [ "$TARGET" = "clean" ]; then
    echo "Cleaning build artifacts..."
    rm -rf dist build *.AppImage
    echo "[+] Cleaned"
    exit 0
fi

echo "Building HuluChat for macOS..."

# Check if icon.icns exists, create from png if not
if [ ! -f assets/icon.icns ]; then
    echo "Creating icon.icns from icon.png..."
    mkdir -p assets/icon.iconset
    sips -z 16 16     assets/icon.png --out assets/icon.iconset/icon_16x16.png 2>/dev/null || true
    sips -z 32 32     assets/icon.png --out assets/icon.iconset/icon_16x16@2x.png 2>/dev/null || true
    sips -z 32 32     assets/icon.png --out assets/icon.iconset/icon_32x32.png 2>/dev/null || true
    sips -z 64 64     assets/icon.png --out assets/icon.iconset/icon_32x32@2x.png 2>/dev/null || true
    sips -z 128 128   assets/icon.png --out assets/icon.iconset/icon_128x128.png 2>/dev/null || true
    sips -z 256 256   assets/icon.png --out assets/icon.iconset/icon_128x128@2x.png 2>/dev/null || true
    sips -z 256 256   assets/icon.png --out assets/icon.iconset/icon_256x256.png 2>/dev/null || true
    sips -z 512 512   assets/icon.png --out assets/icon.iconset/icon_256x256@2x.png 2>/dev/null || true
    sips -z 512 512   assets/icon.png --out assets/icon.iconset/icon_512x512.png 2>/dev/null || true
    sips -z 1024 1024 assets/icon.png --out assets/icon.iconset/icon_512x512@2x.png 2>/dev/null || true
    iconutil -c icns assets/icon.iconset -o assets/icon.icns 2>/dev/null || echo "Warning: iconutil failed, using default"
fi

# Create macOS spec
cat > HuluChat-mac.spec << 'EOF'
a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=[('assets/icon.png', 'assets'), ('assets/icon.icns', 'assets')],
    hiddenimports=['customtkinter', 'openai', 'PIL', 'PIL._tkinter_finder'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)
exe = EXE(
    pyz,
    a.scripts,
    [],
    name='HuluChat',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    target_arch='universal2',
    codesign_identity=None,
    entitlements_file=None,
)
coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='HuluChat',
)
app = BUNDLE(
    coll,
    name='HuluChat.app',
    icon='assets/icon.icns',
    bundle_identifier='com.huluchat.app',
    info_plist={
        'CFBundleName': 'HuluChat',
        'CFBundleDisplayName': 'HuluChat',
        'NSHighResolutionCapable': True,
    },
)
EOF

pyinstaller HuluChat-mac.spec --clean

echo "[+] Built dist/HuluChat.app"
echo "Run with: open dist/HuluChat.app"
