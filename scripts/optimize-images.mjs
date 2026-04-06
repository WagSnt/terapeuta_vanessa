/**
 * Image optimization script
 * Converts heavy site images to AVIF + WebP for better performance
 * Run: node scripts/optimize-images.mjs
 */
import sharp from 'sharp';
import { join, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const IMAGES_DIR = join(__dirname, '..', 'images');

const images = [
  // input filename, output base name (null = same), max width
  { input: 'new-home.jpg',          out: null,               width: 640  },
  { input: 'img-about-me.png',      out: null,               width: 600  },
  { input: 'consulta oraculos.jpg', out: 'consulta-oraculos', width: 800  },
  { input: 'terapiaenergetica.jpg', out: null,               width: 800  },
  { input: 'voltandoservc.png',     out: null,               width: 600  },
  { input: 'ebook2.png',            out: null,               width: 560  },
  { input: 'bg-coletivo2t.png',     out: null,               width: 1920 },
  { input: 'reikiwagner-1900.jpg',  out: null,               width: 1920 },
  { input: 'favicon.png',           out: 'favicon-180',      width: 180, pngOnly: true },
];

async function convert({ input, out, width, pngOnly }) {
  const inputPath  = join(IMAGES_DIR, input);
  const baseName   = out ?? basename(input, extname(input));

  const base = sharp(inputPath).resize(width, null, {
    withoutEnlargement: true,
    fit: 'inside',
  });

  if (pngOnly) {
    const outPath = join(IMAGES_DIR, `${baseName}.png`);
    await base.png({ compressionLevel: 9, effort: 10 }).toFile(outPath);
    console.log(`✓ ${baseName}.png`);
    return;
  }

  // AVIF — best compression, modern browsers
  await base.clone().avif({ quality: 55, effort: 6 }).toFile(join(IMAGES_DIR, `${baseName}.avif`));
  console.log(`✓ ${baseName}.avif`);

  // WebP — wide support fallback
  await base.clone().webp({ quality: 78, effort: 5 }).toFile(join(IMAGES_DIR, `${baseName}.webp`));
  console.log(`✓ ${baseName}.webp`);
}

console.log('Iniciando otimização de imagens…\n');

const results = await Promise.allSettled(images.map(convert));

results.forEach((r, i) => {
  if (r.status === 'rejected') {
    console.error(`✗ ${images[i].input}: ${r.reason.message}`);
  }
});

console.log('\nConcluído.');
