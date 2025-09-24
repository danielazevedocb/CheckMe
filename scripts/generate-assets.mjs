import { resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const IMAGES_DIR = resolve('assets', 'images');
const SOURCE = resolve(IMAGES_DIR, 'logo.png');

const palette = {
  primary: '#12D49F',
  fallback: { r: 18, g: 212, b: 159, alpha: 1 },
};

async function ensureDir() {
  await mkdir(IMAGES_DIR, { recursive: true });
}

async function createIcon() {
  await sharp(SOURCE)
    .resize(1024, 1024, {
      fit: 'contain',
      background: palette.primary,
    })
    .png()
    .toFile(resolve(IMAGES_DIR, 'icon.png'));
}

async function createAndroidForeground() {
  await sharp(SOURCE)
    .resize(1080, 1080, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(resolve(IMAGES_DIR, 'android-icon-foreground.png'));
}

async function createAndroidBackground() {
  await sharp({
    create: {
      width: 1080,
      height: 1080,
      channels: 4,
      background: palette.fallback,
    },
  })
    .png()
    .toFile(resolve(IMAGES_DIR, 'android-icon-background.png'));
}

async function createAndroidMonochrome() {
  await sharp(SOURCE)
    .resize(1080, 1080, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .grayscale()
    .png()
    .toFile(resolve(IMAGES_DIR, 'android-icon-monochrome.png'));
}

async function createSplash() {
  await sharp(SOURCE)
    .resize(1500, 1500, {
      fit: 'contain',
      background: palette.primary,
    })
    .png()
    .toFile(resolve(IMAGES_DIR, 'splash-icon.png'));
}

async function createFavicon() {
  await sharp(SOURCE)
    .resize(256, 256, {
      fit: 'contain',
      background: palette.primary,
    })
    .png()
    .toFile(resolve(IMAGES_DIR, 'favicon.png'));
}

async function main() {
  await ensureDir();
  await Promise.all([
    createIcon(),
    createAndroidForeground(),
    createAndroidBackground(),
    createAndroidMonochrome(),
    createSplash(),
    createFavicon(),
  ]);
  console.log('✔ Assets atualizados a partir de logo.png');
}

main().catch((error) => {
  console.error('Erro ao gerar assets', error);
  process.exitCode = 1;
});
