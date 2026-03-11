#!/usr/bin/env node
/**
 * Generate latest.json for Tauri auto-updater
 * Run this after building and before creating GitHub Release
 *
 * Usage: node scripts/generate-latest-json.js <version>
 * Example: node scripts/generate-latest-json.js 3.52.0
 *
 * Note: Generates all platforms at once
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: node generate-latest-json.js <version>');
  console.error('Example: node generate-latest-json.js 3.52.0');
  process.exit(1);
}

const [version] = args;

// Actual file naming from GitHub Releases:
// - Windows: HuluChat_${version}_x64_en-US.msi
// - macOS Intel: HuluChat_${version}_x64.dmg
// - macOS ARM: HuluChat_${version}_aarch64.dmg
// - Linux: HuluChat_${version}_amd64.AppImage

const latestJson = {
  version: version,
  date: new Date().toISOString(),
  platforms: {
    // Windows x64
    'x86_64-pc-windows-msvc': {
      signature: '',
      url: `https://github.com/MrHulu/HuluAiChat/releases/download/v${version}/HuluChat_${version}_x64_en-US.msi`
    },
    // macOS Intel
    'x86_64-apple-darwin': {
      signature: '',
      url: `https://github.com/MrHulu/HuluAiChat/releases/download/v${version}/HuluChat_${version}_x64.dmg`
    },
    // macOS ARM (Apple Silicon)
    'aarch64-apple-darwin': {
      signature: '',
      url: `https://github.com/MrHulu/HuluAiChat/releases/download/v${version}/HuluChat_${version}_aarch64.dmg`
    },
    // Linux x64
    'x86_64-unknown-linux-gnu': {
      signature: '',
      url: `https://github.com/MrHulu/HuluAiChat/releases/download/v${version}/HuluChat_${version}_amd64.AppImage`
    }
  }
};

const outputPath = path.join(__dirname, '..', 'latest.json');
fs.writeFileSync(outputPath, JSON.stringify(latestJson, null, 2));

console.log(`Generated latest.json for v${version} (all platforms)`);
console.log(`Output: ${outputPath}`);
console.log(JSON.stringify(latestJson, null, 2));
