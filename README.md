# Warmthly

Warmthly is a global movement to make empathy a measurable part of our systems. This repository contains the frontend applications for the Warmthly platform.

## 🏗️ Architecture

The Warmthly frontend consists of **4 separate websites** that share common code:

- **Main** (`apps/main`) - Landing page at www.warmthly.org
- **Mint** (`apps/mint`) - Transaction minting interface at mint.warmthly.org
- **Post** (`apps/post`) - Posting and reporting interface at post.warmthly.org
- **Admin** (`apps/admin`) - Administrative dashboard at admin.warmthly.org

All applications share a common component library called **"Lego"** located in `lego/`, which provides:
- **Components** - Reusable custom HTML elements
- **Styles** - Shared CSS with design tokens
- **Utils** - Utility functions and helpers
- **Config** - Centralized configuration

## 🚀 Getting Started

### For GitHub + Cloudflare Pages Users

**Everything runs automatically!** When you push code to GitHub:
- ✅ Tests run automatically
- ✅ Code is checked automatically  
- ✅ Builds happen automatically
- ✅ Deployment happens automatically

**You don't need to do anything locally.** Just push your code!

### For Local Development (Optional)

**Prerequisites:**
- Node.js 20 or higher
- npm or yarn

**Installation:**
```bash
npm install
npx playwright install --with-deps
```

**Development:**
```bash
npm run dev
```

This starts Vite dev server on `http://localhost:3000`

**Building:**
```bash
npm run build
```

**Preview:**
```bash
npm run preview
```

## 🧪 Testing - Why and How

### Why Do We Need Testing?

**Testing is like a safety net for your code:**

1. **Catches bugs before users do** - Tests find problems before code goes live
2. **Prevents breaking changes** - When you change code, tests make sure nothing else broke
3. **Documents how code works** - Tests show what your code is supposed to do
4. **Saves time** - Finding bugs early is faster than fixing them in production
5. **Confidence** - You can change code knowing tests will catch mistakes

**Real example:**
- Without tests: You change a function, deploy it, users report it's broken 😞
- With tests: You change a function, tests fail, you fix it before deploying 😊

### How Testing Works Here

Tests run **automatically** in GitHub Actions when you push code. You don't need to do anything!

**What gets tested:**
- ✅ **Unit tests** - Test individual functions/components
- ✅ **E2E tests** - Test full user workflows (like clicking buttons, filling forms)
- ✅ **Accessibility tests** - Make sure your site works for everyone

**If tests fail:**
- Deployment is blocked (broken code won't go live)
- You get an error message showing what broke
- Fix the issue and push again

### Running Tests Locally (Optional)

If you want to run tests on your computer:

```bash
# Run unit tests
npm run test

# Run with visual UI
npm run test:ui

# Run end-to-end tests
npm run test:e2e

# Run with Playwright UI (see tests run in browser)
npm run test:e2e:ui

# Run accessibility tests
npm run test:a11y

# Generate coverage report
npm run test:coverage
```

**You don't need to run tests locally** - GitHub Actions does it automatically!

### Writing Tests (Optional)

If you want to add tests for new code:

**Unit Test Example:**
```typescript
// tests/unit/my-function.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from '@utils/my-function.js';

describe('myFunction', () => {
  it('should return correct value', () => {
    expect(myFunction('input')).toBe('expected output');
  });
});
```

**E2E Test Example:**
```typescript
// tests/e2e/my-page.spec.ts
import { test, expect } from '@playwright/test';

test('should load page correctly', async ({ page }) => {
  await page.goto('/apps/main/');
  await expect(page).toHaveTitle(/Warmthly/i);
});
```

## 📝 Code Quality

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues
```

### Formatting
```bash
npm run format        # Format code
npm run format:check  # Check formatting
```

## ⚡ Performance

### Build Analysis
```bash
# Analyze bundle sizes after build
npm run build:analyze

# Check build sizes only
npm run build:size
```

### Performance Budgets
The project enforces performance budgets to ensure fast load times:
- **JavaScript files**: Max 500KB per file
- **CSS files**: Max 100KB per file
- **Total app size**: Max 2MB per app

Builds will warn if these budgets are exceeded.


### Performance Best Practices
- ✅ Code splitting is automatic (vendor, components, utils chunks)
- ✅ Tree shaking removes unused code
- ✅ CSS and JS are minified in production
- ✅ Assets are optimized with hashed filenames for caching
- ✅ Modern ES2022 target for smaller bundles

## 🔧 Configuration

All configuration files are organized in `.config/` folder:

- `.config/tsconfig.json` - TypeScript settings
- `.config/vite.config.ts` - Build tool config
- `.config/vitest.config.ts` - Unit test config
- `.config/playwright.config.ts` - E2E test config
- `.config/.eslintrc.json` - Code quality rules
- `.config/.prettierrc.json` - Formatting rules
- `.config/wrangler.toml` - Cloudflare deployment config

## 📦 Project Structure

```
warmthly/
├── .config/              # All configuration files
├── apps/                 # Your 4 websites
│   ├── main/            # Main site
│   ├── mint/            # Mint site
│   ├── post/            # Post site
│   └── admin/           # Admin site
├── lego/                 # Shared component library
│   ├── components/      # Web components
│   ├── utils/           # Helper functions
│   ├── config/          # App configuration
│   └── styles/          # CSS files
├── assets/               # Static assets
│   ├── fonts/          # Font files
│   └── images/         # Image files
├── api/                  # Backend functions
├── tests/                # Test files
│   ├── unit/           # Unit tests
│   └── e2e/            # E2E tests
└── scripts/             # Build scripts
```

## 🎨 Web Components

The project uses native Web Components. Key components:

- `<warmthly-head>` - Dynamic head element with SEO meta tags
- `<warmthly-header>` - Site header with navigation
- `<warmthly-stoplight>` - Status indicator
- `<warmthly-font-loader>` - Font loading utility

**Usage:**
```html
<warmthly-head 
  title="Page Title"
  description="Page description"
  app="main">
</warmthly-head>
```

## 🚢 Deployment

Deployment is handled automatically via GitHub Actions. The workflow:

1. Runs CI checks (tests, linting, type checking)
2. Builds all applications in parallel
3. Copies API functions to each site
4. Deploys pre-built static files to Cloudflare Pages

The build process:
- Compiles TypeScript (including all lego components like `warmthly-head-helper.ts`)
- Bundles and optimizes assets
- Minifies HTML, CSS, and JavaScript
- Copies API functions from `warmthly-api/functions/` to each site's build directory
- Deploys pre-built static files to Cloudflare Pages (no build time used)

**Deployment Architecture:**
- Each site deploys to its own Cloudflare Pages project:
  - `build/main` → `warmthly` project → `www.warmthly.org`
  - `build/mint` → `warmthly-mint` project → `mint.warmthly.org`
  - `build/post` → `warmthly-post` project → `post.warmthly.org`
  - `build/admin` → `warmthly-admin` project → `admin.warmthly.org`

**Important:** Ensure Cloudflare Pages build settings are disabled for all projects:
- Go to each Cloudflare Pages project (warmthly, warmthly-mint, warmthly-post, warmthly-admin)
- Settings → Builds & deployments
- Set "Build command" to empty/blank
- Set "Build output directory" to `/` (root)
- This ensures Cloudflare only serves pre-built files, allowing unlimited deployments

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed deployment instructions.

### Environment Variables

**Required for deployment** (set in GitHub Secrets):
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID

**Optional for API** (set in Cloudflare Pages Environment Variables for each site):
- `LIBRETRANSLATE_URL` - Self-hosted LibreTranslate instance URL (e.g., `https://translate.yourdomain.com`)
- `LIBRETRANSLATE_API_KEY` - LibreTranslate API key (if required by your instance)
- `HUGGINGFACE_API_KEY` - Hugging Face API key for NLLB translations (free tier available)
- `TRANSLATION_CACHE` - Cloudflare KV namespace for translation caching (optional)
- `YOCO_SECRET_KEY` - Yoco payment secret key (for payment API endpoints)
- `YOCO_PUBLIC_KEY` - Yoco payment public key (for payment API endpoints)

**Note:** API functions are deployed with each site, so environment variables should be set in each Cloudflare Pages project (main, mint, post, admin).

## 🗺️ Path Aliases

All imports use universal path aliases that you can change in one place:

- `@components/*` → `./lego/components/*`
- `@utils/*` → `./lego/utils/*`
- `@config/*` → `./lego/config/*`
- `@styles/*` → `./lego/styles/*`
- `@apps/*` → `./apps/*`
- `@api/*` → `./api/*`
- `@assets/*` → `./assets/*`
- `@tests/*` → `./tests/*`

**To change paths:** Update `.config/tsconfig.json` and `.config/vite.config.ts`

## ♿ Accessibility

The project follows WCAG 2.1 AA standards. Accessibility is verified through:
- Automated testing with axe-core
- Manual testing guidelines
- Keyboard navigation support
- Screen reader compatibility

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Tests run automatically in GitHub Actions
4. Submit a pull request
