import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Map of pages to their SEO metadata
const pageMetadata: Record<string, { title: string; description: string }> = {
  'apps/admin/emails/index.html': {
    title: 'Admin Email Sender - Warmthly',
    description:
      'Administrative email management interface for sending and viewing received emails in the Warmthly system.',
  },
  'apps/admin/index.html': {
    title: 'Admin Dashboard - Warmthly',
    description:
      'Administrative dashboard for managing Warmthly operations, settings, and administrative tools.',
  },
  'apps/main/404.html': {
    title: '404 - Page Not Found - Warmthly',
    description:
      "The page you're looking for doesn't exist. Return to the Warmthly homepage or navigate to another page.",
  },
  'apps/main/easy-read.html': {
    title: 'Easy Read Version - Warmthly',
    description:
      'Easy read version of Warmthly content designed for accessibility and readability. Simplified language and clear formatting.',
  },
  'apps/main/help.html': {
    title: 'Help & FAQ - Warmthly',
    description:
      'Get help and find answers to frequently asked questions about Warmthly, donations, the movement, and how to get involved.',
  },
  'apps/main/privacy.html': {
    title: 'Privacy Policy - Warmthly',
    description:
      "Learn about Warmthly's privacy policy, how we handle your data, and your rights regarding information privacy and protection.",
  },
  'apps/main/source/index.html': {
    title: 'Source Code - Warmthly',
    description:
      "View the open source code for Warmthly. Our work is not ours, it's yours. Explore the codebase on GitHub.",
  },
  'apps/mint/index.html': {
    title: 'Mint - Transparency Tracking - Warmthly',
    description:
      "Track Warmthly's financial transparency in real-time. View donations, expenses, and receipts with complete accountability.",
  },
  'apps/mint/research/index.html': {
    title: 'Research - Mint - Warmthly',
    description:
      "Research and documentation for Warmthly's transparency tracking system and financial accountability measures.",
  },
  'apps/post/index.html': {
    title: 'Post - Updates & Timeline - Warmthly',
    description:
      "Stay updated with Warmthly's progress, timeline, and updates. Follow our journey as we rehumanize our world.",
  },
  'apps/post/report/index.html': {
    title: 'Report Submission - Post - Warmthly',
    description:
      'Submit reports and share your experiences with Warmthly. Help us document impact and improve our systems.',
  },
  'apps/post/vote/index.html': {
    title: 'Vote - Post - Warmthly',
    description:
      "Participate in Warmthly's democratic processes. Vote on important decisions and help shape the movement's direction.",
  },
  'apps/post/your-data/index.html': {
    title: 'Your Data - Post - Warmthly',
    description:
      'Access and manage your personal data with Warmthly. View what information we have and exercise your data rights.',
  },
};

console.log('Fixing SEO tags in HTML files...');

for (const [filePath, metadata] of Object.entries(pageMetadata)) {
  const fullPath = join(rootDir, filePath);
  let content = readFileSync(fullPath, 'utf-8');
  let modified = false;

  // Check if title tag already exists
  if (!content.includes('<title>')) {
    // Find the position after the closing script tag and before warmthly-head
    const warmthlyHeadIndex = content.indexOf('<warmthly-head');
    if (warmthlyHeadIndex !== -1) {
      // Find the line before warmthly-head to insert title and meta
      const insertPosition = content.lastIndexOf('</script>', warmthlyHeadIndex);
      if (insertPosition !== -1) {
        const insertPoint = content.indexOf('\n', insertPosition) + 1;
        const titleTag = `  <!-- Static title for SEO and accessibility - will be updated by warmthly-head component -->\n  <title>${metadata.title}</title>\n  <meta name="description" content="${metadata.description}">\n  \n`;
        content = content.slice(0, insertPoint) + titleTag + content.slice(insertPoint);
        modified = true;
      }
    } else {
      // If no warmthly-head, try to find a good insertion point after scripts
      const lastScriptIndex = content.lastIndexOf('</script>');
      if (lastScriptIndex !== -1) {
        const insertPoint = content.indexOf('\n', lastScriptIndex) + 1;
        const titleTag = `  <!-- Static title for SEO and accessibility -->\n  <title>${metadata.title}</title>\n  <meta name="description" content="${metadata.description}">\n  \n`;
        content = content.slice(0, insertPoint) + titleTag + content.slice(insertPoint);
        modified = true;
      }
    }
  }

  if (modified) {
    writeFileSync(fullPath, content, 'utf-8');
    console.log(`Fixed: ${filePath}`);
  } else if (content.includes('<title>')) {
    console.log(`Skipped (already has title): ${filePath}`);
  } else {
    console.log(`Warning: Could not find insertion point for: ${filePath}`);
  }
}

console.log('Done fixing SEO tags!');
