import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const SVG_PATH = path.join(process.cwd(), 'public', 'favicon.svg');
const OUT_DIR = path.join(process.cwd(), 'public');

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

async function generateIcons() {
  try {
    const svgBuffer = fs.readFileSync(SVG_PATH);
    
    for (const { name, size } of sizes) {
      const outPath = path.join(OUT_DIR, name);
      console.log(`Generating ${name} (${size}x${size})...`);
      
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outPath);
        
      console.log(`✅ Created ${name}`);
    }
    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
