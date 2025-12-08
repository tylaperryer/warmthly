/**
 * Sitemap Generator
 * Generates XML sitemaps for all Warmthly applications
 *
 * Usage: npm run generate:sitemap
 *
 * This script generates sitemap.xml files for:
 * - Main site (www.warmthly.org)
 * - Mint site (mint.warmthly.org)
 * - Post site (post.warmthly.org)
 * - Admin site (admin.warmthly.org)
 */

// Type declarations for Node.js globals
declare const process: {
  exit: (code: number) => never;
  cwd: () => string;
};

declare const console: {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { WARMTHLY_CONFIG } from '../lego/config/warmthly-config.js';

/**
 * Get current directory (ESM compatible)
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

/**
 * Sitemap URL entry
 */
interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  images?: SitemapImage[];
  videos?: SitemapVideo[];
}

/**
 * Sitemap image entry
 */
interface SitemapImage {
  loc: string;
  title?: string;
  caption?: string;
  geoLocation?: string;
  license?: string;
}

/**
 * Sitemap video entry
 */
interface SitemapVideo {
  thumbnailLoc: string;
  title: string;
  description: string;
  contentLoc?: string;
  playerLoc?: string;
  duration?: number;
  expirationDate?: string;
  rating?: number;
  viewCount?: number;
  publicationDate?: string;
  familyFriendly?: boolean;
  requiresSubscription?: boolean;
  live?: boolean;
  tag?: string[];
  category?: string;
}

/**
 * Generate XML sitemap from URLs with image and video support
 */
function generateSitemapXml(urls: SitemapUrl[]): string {
  const urlEntries = urls
    .map(url => {
      const lastmod = url.lastmod ? `    <lastmod>${url.lastmod}</lastmod>\n` : '';
      const changefreq = url.changefreq ? `    <changefreq>${url.changefreq}</changefreq>\n` : '';
      const priority =
        url.priority !== undefined ? `    <priority>${url.priority}</priority>\n` : '';

      // Generate image entries
      const imageEntries =
        url.images
          ?.map(img => {
            const title = img.title
              ? `      <image:title>${escapeXml(img.title)}</image:title>\n`
              : '';
            const caption = img.caption
              ? `      <image:caption>${escapeXml(img.caption)}</image:caption>\n`
              : '';
            const geoLocation = img.geoLocation
              ? `      <image:geo_location>${escapeXml(img.geoLocation)}</image:geo_location>\n`
              : '';
            const license = img.license
              ? `      <image:license>${escapeXml(img.license)}</image:license>\n`
              : '';

            return `    <image:image>\n      <image:loc>${escapeXml(
              img.loc
            )}</image:loc>\n${title}${caption}${geoLocation}${license}    </image:image>`;
          })
          .join('\n') || '';

      // Generate video entries
      const videoEntries =
        url.videos
          ?.map(video => {
            const contentLoc = video.contentLoc
              ? `      <video:content_loc>${escapeXml(video.contentLoc)}</video:content_loc>\n`
              : '';
            const playerLoc = video.playerLoc
              ? `      <video:player_loc>${escapeXml(video.playerLoc)}</video:player_loc>\n`
              : '';
            const duration = video.duration
              ? `      <video:duration>${video.duration}</video:duration>\n`
              : '';
            const expirationDate = video.expirationDate
              ? `      <video:expiration_date>${video.expirationDate}</video:expirationDate>\n`
              : '';
            const rating = video.rating
              ? `      <video:rating>${video.rating}</video:rating>\n`
              : '';
            const viewCount = video.viewCount
              ? `      <video:view_count>${video.viewCount}</video:view_count>\n`
              : '';
            const publicationDate = video.publicationDate
              ? `      <video:publication_date>${video.publicationDate}</video:publicationDate>\n`
              : '';
            const familyFriendly =
              video.familyFriendly !== undefined
                ? `      <video:family_friendly>${
                    video.familyFriendly ? 'yes' : 'no'
                  }</video:family_friendly>\n`
                : '';
            const requiresSubscription =
              video.requiresSubscription !== undefined
                ? `      <video:requires_subscription>${
                    video.requiresSubscription ? 'yes' : 'no'
                  }</video:requires_subscription>\n`
                : '';
            const live =
              video.live !== undefined
                ? `      <video:live>${video.live ? 'yes' : 'no'}</video:live>\n`
                : '';
            const tags =
              video.tag?.map(tag => `      <video:tag>${escapeXml(tag)}</video:tag>\n`).join('') ||
              '';
            const category = video.category
              ? `      <video:category>${escapeXml(video.category)}</video:category>\n`
              : '';

            return `    <video:video>\n      <video:thumbnail_loc>${escapeXml(
              video.thumbnailLoc
            )}</video:thumbnail_loc>\n      <video:title>${escapeXml(
              video.title
            )}</video:title>\n      <video:description>${escapeXml(
              video.description
            )}</video:description>\n${contentLoc}${playerLoc}${duration}${expirationDate}${rating}${viewCount}${publicationDate}${familyFriendly}${requiresSubscription}${live}${tags}${category}    </video:video>`;
          })
          .join('\n') || '';

      const imageSection = imageEntries ? `\n${imageEntries}\n` : '';
      const videoSection = videoEntries ? `\n${videoEntries}\n` : '';

      return `  <url>\n    <loc>${escapeXml(
        url.loc
      )}</loc>\n${lastmod}${changefreq}${priority}${imageSection}${videoSection}  </url>`;
    })
    .join('\n');

  // Add namespaces for images and videos
  const namespaces = [
    'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"',
    'xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"',
  ].join(' ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset ${namespaces}>
${urlEntries}
</urlset>`;
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Get current date in ISO format (YYYY-MM-DD)
 */
function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Generate sitemap for main site
 */
function generateMainSitemap(): string {
  const baseUrl = WARMTHLY_CONFIG.urls.main;
  const urls: SitemapUrl[] = [
    {
      loc: baseUrl,
      lastmod: getCurrentDate(),
      changefreq: 'weekly',
      priority: 1.0,
      images: [
        {
          loc: `${baseUrl}/assets/images/signature.png`,
          title: "Warmthly Founder's Signature",
          caption: 'Handwritten signature of the Warmthly founder',
        },
        {
          loc: `${baseUrl}/favicon.svg`,
          title: 'Warmthly Logo',
          caption: 'Warmthly brand logo',
        },
      ],
      videos: [
        {
          thumbnailLoc: `${baseUrl}/assets/images/video-thumbnail.jpg`,
          title: 'Warmthly - Rehumanize Our World',
          description:
            'Warmthly is a global movement to make empathy a measurable part of our systems.',
          playerLoc: 'https://www.youtube-nocookie.com/embed/kVausES-mjk',
          duration: 210, // 3 minutes 30 seconds
          familyFriendly: true,
          requiresSubscription: false,
          live: false,
          tag: ['empathy', 'transparency', 'social impact', 'donation'],
          category: 'Nonprofit',
          publicationDate: '2024-01-01T00:00:00+00:00',
        },
      ],
    },
    {
      loc: `${baseUrl}/privacy.html`,
      lastmod: getCurrentDate(),
      changefreq: 'monthly',
      priority: 0.5,
      images: [
        {
          loc: `${baseUrl}/favicon.svg`,
          title: 'Warmthly Privacy Policy',
          caption: 'Privacy policy page',
        },
      ],
    },
    {
      loc: `${baseUrl}/easy-read.html`,
      lastmod: getCurrentDate(),
      changefreq: 'monthly',
      priority: 0.7,
      images: [
        {
          loc: `${baseUrl}/favicon.svg`,
          title: 'Warmthly Easy Read',
          caption: 'Easy Read version of Warmthly content',
        },
      ],
    },
    {
      loc: `${baseUrl}/help.html`,
      lastmod: getCurrentDate(),
      changefreq: 'monthly',
      priority: 0.8,
      images: [
        {
          loc: `${baseUrl}/favicon.svg`,
          title: 'Warmthly Help',
          caption: 'Help and FAQ page for Warmthly',
        },
      ],
    },
    {
      loc: `${baseUrl}/404.html`,
      lastmod: getCurrentDate(),
      changefreq: 'monthly',
      priority: 0.1,
    },
  ];

  return generateSitemapXml(urls);
}

/**
 * Generate sitemap for mint site
 */
function generateMintSitemap(): string {
  const baseUrl = WARMTHLY_CONFIG.urls.mint;
  const urls: SitemapUrl[] = [
    {
      loc: baseUrl,
      lastmod: getCurrentDate(),
      changefreq: 'daily',
      priority: 0.9,
    },
    {
      loc: `${baseUrl}/research`,
      lastmod: getCurrentDate(),
      changefreq: 'weekly',
      priority: 0.7,
    },
  ];

  return generateSitemapXml(urls);
}

/**
 * Generate sitemap for post site
 */
function generatePostSitemap(): string {
  const baseUrl = WARMTHLY_CONFIG.urls.post;
  const routes = WARMTHLY_CONFIG.routes.post;

  const urls: SitemapUrl[] = [
    {
      loc: baseUrl,
      lastmod: getCurrentDate(),
      changefreq: 'daily',
      priority: 0.9,
      images: [
        {
          loc: `${WARMTHLY_CONFIG.urls.main}/assets/images/worlddots.svg`,
          title: 'World Map - Warmthly Activity',
          caption: 'Interactive world map showing Warmthly activity locations',
        },
        {
          loc: `${WARMTHLY_CONFIG.urls.main}/assets/images/signature.png`,
          title: "Founder's Signature",
          caption: 'Handwritten signature',
        },
      ],
    },
  ];

  if (routes) {
    if (routes.report) {
      urls.push({
        loc: `${baseUrl}${routes.report}`,
        lastmod: getCurrentDate(),
        changefreq: 'monthly',
        priority: 0.6,
        images: [
          {
            loc: `${WARMTHLY_CONFIG.urls.main}/favicon.svg`,
            title: 'Report to Warmthly',
            caption: 'Reporting page',
          },
        ],
      });
    }
    if (routes.yourData) {
      urls.push({
        loc: `${baseUrl}${routes.yourData}`,
        lastmod: getCurrentDate(),
        changefreq: 'weekly',
        priority: 0.7,
        images: [
          {
            loc: `${WARMTHLY_CONFIG.urls.main}/favicon.svg`,
            title: 'Your Data',
            caption: 'Data management page',
          },
        ],
      });
    }
    if (routes.vote) {
      urls.push({
        loc: `${baseUrl}${routes.vote}`,
        lastmod: getCurrentDate(),
        changefreq: 'monthly',
        priority: 0.8,
        images: [
          {
            loc: `${WARMTHLY_CONFIG.urls.main}/favicon.svg`,
            title: 'Dissolution Vote',
            caption: 'Voting page',
          },
        ],
      });
    }
  }

  return generateSitemapXml(urls);
}

/**
 * Generate sitemap for admin site
 */
function generateAdminSitemap(): string {
  const baseUrl = WARMTHLY_CONFIG.urls.admin;
  const routes = WARMTHLY_CONFIG.routes.admin;

  const urls: SitemapUrl[] = [
    {
      loc: baseUrl,
      lastmod: getCurrentDate(),
      changefreq: 'daily',
      priority: 0.5, // Lower priority - admin area
    },
  ];

  if (routes) {
    if (routes.emails) {
      urls.push({
        loc: `${baseUrl}${routes.emails}`,
        lastmod: getCurrentDate(),
        changefreq: 'daily',
        priority: 0.4,
      });
    }
  }

  return generateSitemapXml(urls);
}

/**
 * Write sitemap to file
 */
function writeSitemap(app: string, content: string): void {
  const outputDir = join(projectRoot, 'apps', app);
  const outputPath = join(outputDir, 'sitemap.xml');

  // Ensure directory exists
  mkdirSync(outputDir, { recursive: true });

  // Write file
  writeFileSync(outputPath, content, 'utf-8');
  console.log(`✅ Generated sitemap: ${outputPath}`);
}

/**
 * Main function
 */
function generateSitemaps(): void {
  console.log('🗺️  Generating sitemaps for all Warmthly applications...\n');

  try {
    // Generate sitemaps
    writeSitemap('main', generateMainSitemap());
    writeSitemap('mint', generateMintSitemap());
    writeSitemap('post', generatePostSitemap());
    writeSitemap('admin', generateAdminSitemap());

    console.log('\n✨ All sitemaps generated successfully!');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error generating sitemaps:', errorMessage);
    process.exit(1);
  }
}

// Run if executed directly
generateSitemaps();

export { generateSitemaps };
