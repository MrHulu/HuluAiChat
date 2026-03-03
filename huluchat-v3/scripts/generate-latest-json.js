#!/usr/bin/env node
/**
 * Generate latest.json for Tauri auto-updater
 * Run this after building and before creating GitHub Release
 *
 * Usage: node scripts/generate-latest-json.js <version> <platform> <arch>
 * Example: node scripts/generate-latest-json.js 3.0.2 windows x86_64
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
if (args.length < 3) {
  console.error('Usage: node generate-latest-json.js <version> <platform> <arch>');
  console.error('Example: node generate-latest-json.js 3.0.2 windows x86_64');
  process.exit(1);
}

const [version, platform, arch] = args;

// Map platform to Tauri target
const platformMap = {
  'windows': 'pc-windows-msvc',
  'macos': 'apple-darwin',
  'linux': 'unknown-linux-gnu'
};

const target = `${arch}-${platformMap[platform] || platform}`;

// Determine file extension
const ext = platform === 'windows' ? 'msi' : 'dmg';

const latestJson = {
  version: version,
  date: new Date().toISOString(),
  platforms: {
    [target]: {
      signature: '',
      url: `https://github.com/MrHulu/HuluAiChat/releases/download/v${version}/HuluChat_${version}_${arch}.${ext}`
    }
  }
};

const outputPath = path.join(__dirname, '..', 'latest.json');
fs.writeFileSync(outputPath, JSON.stringify(latestJson, null, 2));

console.log(`Generated latest.json for v${version} (${platform}/${arch})`);
console.log(`Output: ${outputPath}`);
console.log(JSON.stringify(latestJson, null, 2));
