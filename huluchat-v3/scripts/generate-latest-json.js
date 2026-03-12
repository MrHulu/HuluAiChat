#!/usr/bin/env node
/**
 * Generate latest.json for Tauri auto-updater
 * Run this after building and before creating GitHub Release
 *
 * Usage: node scripts/generate-latest-json.js <version> [signature-dir]
 * Example: node scripts/generate-latest-json.js 3.52.0 ./src-tauri/target/release/bundle
 *
 * Note: Generates all platforms at once
 * Platform key format: OS-ARCH (e.g., "darwin-x86_64", "windows-x86_64")
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: node generate-latest-json.js <version> [signature-dir]');
  console.error('Example: node generate-latest-json.js 3.52.0 ./src-tauri/target/release/bundle');
  process.exit(1);
}

const [version, signatureDir] = args;

// Helper to read signature file
function readSignature(pattern) {
  if (!signatureDir) return '';

  try {
    const files = glob.sync(pattern, { cwd: signatureDir, absolute: true });
    if (files.length > 0) {
      return fs.readFileSync(files[0], 'utf-8').trim();
    }
  } catch (err) {
    console.warn(`Warning: Could not read signature from ${pattern}: ${err.message}`);
  }
  return '';
}

// Platform key format: OS-ARCH
// See: https://v2.tauri.app/plugin/updater/
const latestJson = {
  version: version,
  notes: 'See CHANGELOG for details.',
  pub_date: new Date().toISOString(),
  platforms: {
    // Windows x64
    'windows-x86_64': {
      signature: readSignature('**/msi/*.sig') || readSignature('**/nsis/*.sig'),
      url: `https://github.com/MrHulu/HuluAiChat/releases/download/v${version}/HuluChat_${version}_x64_en-US.msi`
    },
    // macOS Intel
    'darwin-x86_64': {
      signature: readSignature('**/macos/*.sig'),
      url: `https://github.com/MrHulu/HuluAiChat/releases/download/v${version}/HuluChat_${version}_x64.app.tar.gz`
    },
    // macOS ARM (Apple Silicon)
    'darwin-aarch64': {
      signature: readSignature('**/macos/*.sig'),
      url: `https://github.com/MrHulu/HuluAiChat/releases/download/v${version}/HuluChat_${version}_aarch64.app.tar.gz`
    },
    // Linux x64
    'linux-x86_64': {
      signature: readSignature('**/appimage/*.sig'),
      url: `https://github.com/MrHulu/HuluAiChat/releases/download/v${version}/HuluChat_${version}_amd64.AppImage`
    }
  }
};

const outputPath = path.join(__dirname, '..', 'latest.json');
fs.writeFileSync(outputPath, JSON.stringify(latestJson, null, 2));

console.log(`Generated latest.json for v${version} (all platforms)`);
console.log(`Output: ${outputPath}`);
console.log(JSON.stringify(latestJson, null, 2));
