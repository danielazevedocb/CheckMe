const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts = config.resolver.assetExts ?? [];
config.resolver.sourceExts = config.resolver.sourceExts ?? [];

// Ensure Metro treats SQLite databases and WASM binaries as static assets.
config.resolver.assetExts = [...new Set([...config.resolver.assetExts, 'db', 'sqlite', 'wasm'])];
config.resolver.sourceExts = config.resolver.sourceExts.filter((ext) => ext !== 'wasm');

// Allow CommonJS modules that some Expo packages ship.
if (!config.resolver.sourceExts.includes('cjs')) {
  config.resolver.sourceExts.push('cjs');
}

module.exports = config;
