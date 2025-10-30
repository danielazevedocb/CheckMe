#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Read package.json and app.json
const packageJsonPath = join(rootDir, 'package.json');
const appJsonPath = join(rootDir, 'app.json');

const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const appJson = JSON.parse(readFileSync(appJsonPath, 'utf8'));

// Get current version
const currentVersion = packageJson.version || '1.0.0';

// Parse version (e.g., "1.0.0" -> [1, 0, 0])
const versionParts = currentVersion.split('.').map(Number);

// Increment patch version (e.g., 1.0.0 -> 1.0.1)
versionParts[2] += 1;

// Generate new version string
const newVersion = versionParts.join('.');

console.log(`📦 Versão: ${currentVersion} → ${newVersion}`);

// Update package.json
packageJson.version = newVersion;
writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

// Update app.json
appJson.expo.version = newVersion;
writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');

console.log('✅ Versão atualizada com sucesso!');
