// Simple script to generate PWA icons
const fs = require('fs');
const { createCanvas } = require('canvas');

function generateIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#FF6B35';
  ctx.fillRect(0, 0, size, size);

  // Text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${size * 0.3}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('KBM', size / 2, size / 2);

  // Save
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`public/${filename}`, buffer);
  console.log(`✓ Generated ${filename} (${size}x${size})`);
}

try {
  generateIcon(192, 'icon-192.png');
  generateIcon(512, 'icon-512.png');
  console.log('\n✓ All icons generated successfully!');
} catch (error) {
  console.error('Error:', error.message);
  console.log('\nNote: If canvas module is missing, run: npm install canvas');
  console.log('Alternatively, use the icon-generator.html in your browser.');
}
