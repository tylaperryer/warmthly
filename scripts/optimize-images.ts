/**
 * Image Optimization Script
 * Automatically converts images to WebP and AVIF formats during build
 *
 * Usage: npm run optimize:images
 *
 * Note: Requires sharp package for image processing
 * Install: npm install --save-dev sharp
 */

import { readdirSync, statSync, existsSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

interface ImageFile {
  path: string;
  name: string;
  ext: string;
  size: number;
}

/**
 * Check if sharp is available
 */
async function checkSharpAvailable(): Promise<boolean> {
  try {
    // @ts-expect-error - sharp is an optional dependency, may not be installed
    await import('sharp');
    return true;
  } catch {
    return false;
  }
}

/**
 * Find all image files recursively
 */
function findImageFiles(dir: string, fileList: ImageFile[] = []): ImageFile[] {
  const files = readdirSync(dir);

  files.forEach((file: string) => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist' && file !== 'build') {
        findImageFiles(filePath, fileList);
      }
    } else {
      const ext = extname(file).toLowerCase();
      if (['.png', '.jpg', '.jpeg'].includes(ext)) {
        fileList.push({
          path: filePath,
          name: file,
          ext,
          size: stat.size,
        });
      }
    }
  });

  return fileList;
}

/**
 * Convert image to WebP
 */
async function convertToWebP(inputPath: string, outputPath: string): Promise<void> {
  try {
    // @ts-expect-error - sharp is an optional dependency, may not be installed
    const sharp = await import('sharp');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
    const sharpInstance = (sharp as any).default || sharp;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await sharpInstance(inputPath).webp({ quality: 85, effort: 6 }).toFile(outputPath);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'MODULE_NOT_FOUND') {
      throw new Error('sharp package not found. Install with: npm install --save-dev sharp');
    }
    throw error;
  }
}

/**
 * Convert image to AVIF
 */
async function convertToAVIF(inputPath: string, outputPath: string): Promise<void> {
  try {
    // @ts-expect-error - sharp is an optional dependency, may not be installed
    const sharp = await import('sharp');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
    const sharpInstance = (sharp as any).default || sharp;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await sharpInstance(inputPath).avif({ quality: 80, effort: 4 }).toFile(outputPath);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'MODULE_NOT_FOUND') {
      throw new Error('sharp package not found. Install with: npm install --save-dev sharp');
    }
    throw error;
  }
}

/**
 * Optimize images
 */
async function optimizeImages(): Promise<void> {
  console.log('🖼️  Optimizing images...\n');

  // Check if sharp is available
  const hasSharp = await checkSharpAvailable();
  if (!hasSharp) {
    console.log('⚠️  Sharp package not found. Installing...\n');
    console.log('   Run: npm install --save-dev sharp\n');
    console.log('   Or use online tools to convert images manually.\n');
    console.log('   See: warmthly/docs/RESPONSIVE-IMAGES-GUIDE.md\n');
    return;
  }

  const imagesDir = join(projectRoot, 'assets', 'images');

  if (!existsSync(imagesDir)) {
    console.log(`⚠️  Images directory not found: ${imagesDir}\n`);
    return;
  }

  const imageFiles = findImageFiles(imagesDir);

  if (imageFiles.length === 0) {
    console.log('✅ No images found to optimize.\n');
    return;
  }

  console.log(`Found ${imageFiles.length} image(s) to optimize\n`);

  let converted = 0;
  let skipped = 0;
  let errors = 0;

  for (const image of imageFiles) {
    const baseName = image.path.replace(/\.[^.]+$/, '');
    const webpPath = `${baseName}.webp`;
    const avifPath = `${baseName}.avif`;

    try {
      // Convert to WebP
      if (!existsSync(webpPath)) {
        await convertToWebP(image.path, webpPath);
        console.log(`✅ Created: ${webpPath.replace(projectRoot, '').replace(/\\/g, '/')}`);
        converted++;
      } else {
        console.log(
          `⏭️  Skipped (exists): ${webpPath.replace(projectRoot, '').replace(/\\/g, '/')}`
        );
        skipped++;
      }

      // Convert to AVIF
      if (!existsSync(avifPath)) {
        await convertToAVIF(image.path, avifPath);
        console.log(`✅ Created: ${avifPath.replace(projectRoot, '').replace(/\\/g, '/')}`);
        converted++;
      } else {
        console.log(
          `⏭️  Skipped (exists): ${avifPath.replace(projectRoot, '').replace(/\\/g, '/')}`
        );
        skipped++;
      }
    } catch (error) {
      console.error(`❌ Error converting ${image.name}:`, error);
      errors++;
    }
  }

  console.log(`\n📊 Summary:\n`);
  console.log(`   Converted: ${converted} file(s)`);
  console.log(`   Skipped: ${skipped} file(s)`);
  console.log(`   Errors: ${errors} file(s)\n`);

  if (converted > 0) {
    console.log('💡 Next steps:');
    console.log('   - Update HTML to use <picture> elements with new formats');
    console.log('   - Test images in different browsers');
    console.log('   - Verify file size reductions\n');
  }
}

// Run optimization
optimizeImages().catch(error => {
  console.error('❌ Error optimizing images:', error);
  process.exit(1);
});

export { optimizeImages };
