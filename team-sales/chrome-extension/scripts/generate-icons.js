/**
 * Icon Generator Script for LeaderReps Sales Hub Chrome Extension
 * 
 * Generates PNG icons using sharp or canvas-based approach.
 * Run: node scripts/generate-icons.js
 * 
 * Dependencies: npm install canvas
 */

import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// LeaderReps brand colors
const BRAND_TEAL = '#47A88D';
const BRAND_NAVY = '#002E47';

const sizes = [16, 48, 128];

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background - rounded rectangle with teal fill
  const radius = size * 0.2;
  ctx.fillStyle = BRAND_TEAL;
  
  // Draw rounded rectangle
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();

  // Draw "LR" text
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Scale font based on icon size
  const fontSize = Math.floor(size * 0.45);
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillText('LR', size / 2, size / 2 + 1);

  return canvas.toBuffer('image/png');
}

// Create icons directory if it doesn't exist
const iconsDir = join(__dirname, '..', 'icons');
if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

// Generate each size
sizes.forEach(size => {
  const buffer = generateIcon(size);
  const filename = join(iconsDir, `icon${size}.png`);
  writeFileSync(filename, buffer);
  console.log(`Generated: icon${size}.png`);
});

console.log('\n✅ All icons generated successfully!');
console.log('Icons are in:', iconsDir);
