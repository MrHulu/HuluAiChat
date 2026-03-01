#!/bin/bash
# HuluChat Build Script for Linux
# Usage: ./build-linux.sh [appimage|clean]

set -e

TARGET=${1:-appimage}
APP_VERSION=${2:-dev}

if [ "$TARGET" = "clean" ]; then
    echo "Cleaning build artifacts..."
    rm -rf dist build *.AppImage AppDir
    echo "[+] Cleaned"
    exit 0
fi

echo "Building HuluChat for Linux..."

# Check for required tools
command -v wget >/dev/null 2>&1 || { echo "wget not found. Install: sudo apt install wget"; exit 1; }

# Create Linux spec
cat > HuluChat-linux.spec << 'EOF'
a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=[('assets/icon.png', 'assets')],
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
    a.binaries,
    a.datas,
    [],
    name='huluchat',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
)
EOF

pyinstaller HuluChat-linux.spec --clean

# Create AppDir
echo "Creating AppImage..."
mkdir -p AppDir/usr/bin
mkdir -p AppDir/usr/share/applications
mkdir -p AppDir/usr/share/icons/hicolor/256x256/apps
mkdir -p AppDir/usr/share/metainfo

# Copy built files
cp dist/huluchat AppDir/usr/bin/
cp assets/icon.png AppDir/usr/share/icons/hicolor/256x256/apps/huluchat.png

# Create desktop file
cat > AppDir/huluchat.desktop << 'DESKTOP'
[Desktop Entry]
Name=HuluChat
Comment=AI Chat Desktop Application
Exec=huluchat
Icon=huluchat
Type=Application
Categories=Utility;Network;
StartupNotify=true
DESKTOP

cp AppDir/huluchat.desktop AppDir/usr/share/applications/

# Create AppRun
cat > AppDir/AppRun << 'APPRUN'
#!/bin/bash
SELF=$(readlink -f "$0")
HERE=${SELF%/*}
export LD_LIBRARY_PATH="${HERE}/usr/lib:${HERE}/usr/lib/x86_64-linux-gnu:${LD_LIBRARY_PATH}"
export PATH="${HERE}/usr/bin:${PATH}"
export PYTHONPATH="${HERE}/usr/bin:${PYTHONPATH}"
exec "${HERE}/usr/bin/huluchat" "$@"
APPRUN

chmod +x AppDir/AppRun

# Download appimagetool if not exists
if [ ! -f appimagetool-x86_64.AppImage ]; then
    echo "Downloading appimagetool..."
    wget -q https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage
    chmod +x appimagetool-x86_64.AppImage
fi

# Build AppImage
./appimagetool-x86_64.AppImage AppDir "HuluChat-x86_64.AppImage"

echo "[+] Built HuluChat-x86_64.AppImage"
echo "Run with: ./HuluChat-x86_64.AppImage"
