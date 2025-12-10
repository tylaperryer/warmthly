/**
 * PageSpeed Insights Test Script
 * Tests pages with Google PageSpeed Insights API (optional)
 *
 * Note: Requires PageSpeed Insights API key (free tier available)
 * Set PAGESPEED_API_KEY environment variable
 *
 * Usage: npm run test:pagespeed
 */

interface PageSpeedResult {
  url: string;
  mobile?: {
    score: number;
    lcp?: number;
    fid?: number;
    cls?: number;
  };
  desktop?: {
    score: number;
    lcp?: number;
    fid?: number;
    cls?: number;
  };
}

/**
 * Test URL with PageSpeed Insights
 */
async function testPageSpeed(
  url: string,
  strategy: 'mobile' | 'desktop'
): Promise<PageSpeedResult | null> {
  const apiKey = process.env.PAGESPEED_API_KEY;

  if (!apiKey) {
    console.warn(`⚠️  PAGESPEED_API_KEY not set. Skipping PageSpeed Insights test for ${url}`);
    console.warn(
      '   Get a free API key at: https://developers.google.com/speed/docs/insights/v5/get-started'
    );
    return null;
  }

  try {
    // Validate API key format (basic check)
    if (typeof apiKey !== 'string' || apiKey.length < 10) {
      console.error(`❌ Invalid API key format for ${url}`);
      return null;
    }

    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
      url
    )}&strategy=${strategy}&key=${apiKey}`;

    const response = await fetch(apiUrl, {
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      console.error(`❌ PageSpeed API error for ${url}: ${response.status} ${errorText}`);
      return null;
    }

    const data = (await response.json()) as {
      lighthouseResult?: {
        categories?: {
          performance?: { score?: number };
        };
        audits?: {
          'largest-contentful-paint'?: { numericValue?: number };
          'max-potential-fid'?: { numericValue?: number };
          'cumulative-layout-shift'?: { numericValue?: number };
        };
      };
      error?: { message?: string };
    };

    // Check for API errors in response
    if (data.error) {
      console.error(`❌ PageSpeed API returned error: ${data.error.message || 'Unknown error'}`);
      return null;
    }

    const lighthouse = data.lighthouseResult;
    if (!lighthouse) {
      console.error(`❌ No lighthouse result in API response for ${url}`);
      return null;
    }

    const categories = lighthouse.categories;
    const audits = lighthouse.audits;

    if (!categories?.performance?.score) {
      console.error(`❌ No performance score in API response for ${url}`);
      return null;
    }

    const score = Math.round(categories.performance.score * 100);
    const lcp = audits?.['largest-contentful-paint']?.numericValue;
    const fid = audits?.['max-potential-fid']?.numericValue;
    const cls = audits?.['cumulative-layout-shift']?.numericValue;

    return {
      url,
      [strategy]: {
        score,
        lcp,
        fid,
        cls,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error(`❌ Request timeout for ${url}`);
      } else {
        console.error(`❌ Error testing ${url}: ${error.message}`);
      }
    } else {
      console.error(`❌ Error testing ${url}:`, error);
    }
    return null;
  }
}

/**
 * Test all pages
 */
async function testAllPages(): Promise<void> {
  console.log('🚀 Testing pages with PageSpeed Insights...\n');

  const pages = [
    { name: 'Main', url: 'https://www.warmthly.org' },
    { name: 'Help', url: 'https://www.warmthly.org/help.html' },
    { name: 'Privacy', url: 'https://www.warmthly.org/privacy.html' },
    { name: 'Mint', url: 'https://mint.warmthly.org' },
    { name: 'Post', url: 'https://post.warmthly.org' },
  ];

  const results: PageSpeedResult[] = [];

  for (const page of pages) {
    console.log(`Testing ${page.name} (${page.url})...`);

    const mobileResult = await testPageSpeed(page.url, 'mobile');
    const desktopResult = await testPageSpeed(page.url, 'desktop');

    if (mobileResult || desktopResult) {
      const combined: PageSpeedResult = {
        url: page.url,
        ...(mobileResult?.mobile && { mobile: mobileResult.mobile }),
        ...(desktopResult?.desktop && { desktop: desktopResult.desktop }),
      };
      results.push(combined);
    }

    // Rate limiting - wait between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Report results
  console.log('\n📊 PageSpeed Insights Results:\n');

  results.forEach(result => {
    console.log(`\n${result.url}:`);

    if (result.mobile) {
      console.log(`  Mobile:`);
      console.log(`    Performance Score: ${result.mobile.score}/100`);
      if (result.mobile.lcp) console.log(`    LCP: ${result.mobile.lcp.toFixed(0)}ms`);
      if (result.mobile.fid) console.log(`    FID: ${result.mobile.fid.toFixed(0)}ms`);
      if (result.mobile.cls) console.log(`    CLS: ${result.mobile.cls.toFixed(3)}`);
    }

    if (result.desktop) {
      console.log(`  Desktop:`);
      console.log(`    Performance Score: ${result.desktop.score}/100`);
      if (result.desktop.lcp) console.log(`    LCP: ${result.desktop.lcp.toFixed(0)}ms`);
      if (result.desktop.fid) console.log(`    FID: ${result.desktop.fid.toFixed(0)}ms`);
      if (result.desktop.cls) console.log(`    CLS: ${result.desktop.cls.toFixed(3)}`);
    }
  });

  // Summary
  const avgMobileScore =
    results.filter(r => r.mobile).reduce((sum, r) => sum + (r.mobile?.score || 0), 0) /
    results.filter(r => r.mobile).length;

  const avgDesktopScore =
    results.filter(r => r.desktop).reduce((sum, r) => sum + (r.desktop?.score || 0), 0) /
    results.filter(r => r.desktop).length;

  console.log('\n📈 Average Scores:');
  if (!isNaN(avgMobileScore)) {
    console.log(`  Mobile: ${avgMobileScore.toFixed(1)}/100`);
  }
  if (!isNaN(avgDesktopScore)) {
    console.log(`  Desktop: ${avgDesktopScore.toFixed(1)}/100`);
  }

  console.log('\n💡 Tips:');
  console.log('   - Aim for 90+ score on both mobile and desktop');
  console.log('   - LCP should be under 2.5s');
  console.log('   - FID should be under 100ms');
  console.log('   - CLS should be under 0.1');
  console.log('\n   Get detailed reports at: https://pagespeed.web.dev/');
}

// Run tests
testAllPages().catch(error => {
  console.error('❌ Error running PageSpeed tests:', error);
  process.exit(1);
});

export { testAllPages };
