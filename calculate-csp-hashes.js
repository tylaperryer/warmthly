const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Function to calculate SHA-256 hash
function calculateHash(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('base64');
}

// Function to extract and hash inline scripts and styles from HTML
function processHTMLFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const hashes = { scripts: [], styles: [] };
  
  // Extract inline scripts
  const scriptMatches = content.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of scriptMatches) {
    const scriptContent = match[1].trim();
    if (scriptContent && !match[0].includes('src=')) {
      const hash = calculateHash(scriptContent);
      hashes.scripts.push(`'sha256-${hash}'`);
      console.log(`Script hash for ${filePath}: sha256-${hash}`);
    }
  }
  
  // Extract inline styles
  const styleMatches = content.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi);
  for (const match of styleMatches) {
    const styleContent = match[1].trim();
    if (styleContent) {
      const hash = calculateHash(styleContent);
      hashes.styles.push(`'sha256-${hash}'`);
      console.log(`Style hash for ${filePath}: sha256-${hash}`);
    }
  }
  
  return hashes;
}

// Find all HTML files
function findHTMLFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
      files.push(...findHTMLFiles(fullPath));
    } else if (item.isFile() && item.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Main execution
const htmlFiles = findHTMLFiles('.');
const allScriptHashes = new Set();
const allStyleHashes = new Set();

console.log('Calculating CSP hashes for inline scripts and styles...\n');

for (const file of htmlFiles) {
  const hashes = processHTMLFile(file);
  hashes.scripts.forEach(h => allScriptHashes.add(h));
  hashes.styles.forEach(h => allStyleHashes.add(h));
}

console.log('\n=== CSP Configuration ===');
console.log('\nscript-src hashes:');
console.log(Array.from(allScriptHashes).join(' '));
console.log('\nstyle-src hashes:');
console.log(Array.from(allStyleHashes).join(' '));

