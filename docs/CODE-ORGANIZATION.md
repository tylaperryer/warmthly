# Code Organization Guide

Complete guide to understanding how the Warmthly codebase is organized and structured.

## 📁 Directory Structure Overview

```
warmthly/
├── .config/              # All build and tool configuration files
├── apps/                  # 4 separate websites (main, mint, post, admin)
├── lego/                  # Shared component library ("Lego blocks")
├── api/                   # Backend API endpoints
├── assets/                # Static assets (fonts, images)
├── tests/                 # Test files (unit, integration, e2e)
├── scripts/               # Build and utility scripts
├── docs/                  # Documentation
└── warmthly-api/          # Cloudflare Workers API functions
```

## 🎯 Core Philosophy: "Lego Architecture"

The codebase follows a **"Lego Architecture"** where:

- **Shared code** lives in `lego/` (like Lego blocks)
- **Apps** (`apps/`) use these blocks to build websites
- Each piece is **independent** and **reusable**
- Clear **module boundaries** prevent coupling

## 📂 Detailed Directory Breakdown

### `.config/` - Configuration Files

All configuration files are centralized in `.config/` for easy management:

#### `vite.config.ts`

**Purpose:** Build tool configuration for Vite
**What it does:**

- Defines entry points for all 4 apps (main, mint, post, admin)
- Configures code splitting (vendor, components, utils chunks)
- Sets up path aliases (`@components`, `@utils`, etc.)
- Configures CSS processing (PostCSS, minification)
- Optimizes production builds (tree shaking, minification, source maps)
- Sets performance budgets (warns if chunks exceed 1000KB)

**Key Features:**

- Automatic code splitting by type (vendor, components, utils)
- Path aliases for clean imports
- Production optimizations (terser, source maps)
- Bundle size analysis support

#### `tsconfig.json`

**Purpose:** TypeScript compiler configuration
**What it does:**

- Sets TypeScript strict mode (catches more errors)
- Configures path aliases matching Vite config
- Defines which files to include/exclude
- Sets compilation target (ES2022)
- Enables type checking features (no unused locals, no implicit returns)

**Key Features:**

- Strict type checking enabled
- Path aliases for imports (`@components/*`, `@utils/*`, etc.)
- Excludes test files from compilation
- Source maps for debugging

#### `vitest.config.ts`

**Purpose:** Unit test configuration
**What it does:**

- Configures Vitest test runner
- Sets up test environment (jsdom for DOM testing)
- Configures code coverage (99% threshold)
- Sets up path aliases for test imports
- Defines coverage exclusions

**Key Features:**

- 99% coverage requirement (lines, functions, branches, statements)
- jsdom environment for DOM testing
- Multiple coverage reporters (text, json, html, lcov)
- Path aliases matching main config

#### `playwright.config.ts`

**Purpose:** End-to-end (E2E) test configuration
**What it does:**

- Configures Playwright for browser testing
- Sets up multiple browser projects (Chrome, Firefox, Safari, Mobile)
- Configures test reporting (HTML, JSON, JUnit)
- Sets up test server (runs preview build)
- Configures retries and parallel execution

**Key Features:**

- Tests across 5 browser configurations
- Automatic test server startup
- Screenshots and videos on failure
- Trace on first retry for debugging

#### `postcss.config.js`

**Purpose:** CSS processing configuration
**What it does:**

- Adds modern CSS features with automatic fallbacks
- Enables CSS nesting (nested selectors)
- Enables container queries (responsive design)
- Adds vendor prefixes automatically (Autoprefixer)

**Key Features:**

- CSS Nesting support
- Container Queries support
- Automatic vendor prefixing
- Browser compatibility (last 2 versions, >0.5% usage)

#### `wrangler.toml`

**Purpose:** Cloudflare Workers/Pages deployment configuration
**What it does:**

- Configures deployment settings for each app
- Sets build output directories
- Defines environment-specific variables
- Configures project names for each environment

**Key Features:**

- Separate configs for main, mint, post, admin
- Environment-specific variables
- Build output directory configuration

### `apps/` - Application Websites

Four separate websites that share the Lego component library:

#### `apps/main/`

- **Purpose:** Main landing page (www.warmthly.org)
- **Files:** `index.html`, `404.html`, `privacy.html`
- **Features:** Donation flow, video, mission statement

#### `apps/mint/`

- **Purpose:** Transaction minting interface (mint.warmthly.org)
- **Files:** `index.html`, `research/index.html`
- **Features:** Live donation tracking, Firebase integration, Matter.js physics

#### `apps/post/`

- **Purpose:** Posting and reporting interface (post.warmthly.org)
- **Files:** `index.html`, `report/index.html`, `vote/index.html`, `your-data/index.html`
- **Features:** Timeline, world map, dissolution voting, reporting

#### `apps/admin/`

- **Purpose:** Administrative dashboard (admin.warmthly.org)
- **Files:** `index.html`, `emails/index.html`
- **Features:** Admin login, email management

### `lego/` - Shared Component Library

The "Lego blocks" that all apps use:

#### `lego/components/`

**Web Components** - Reusable custom HTML elements:

- `warmthly-head.ts` - Dynamic head element (SEO, meta tags)
- `warmthly-header.ts` - Site header with navigation
- `warmthly-stoplight.ts` - Status indicator
- `warmthly-font-loader.ts` - Font loading utility
- `world-map-svg.ts` - World map visualization
- `forms/` - Form components (input, textarea, select, button, field-group, form)
- `loading/` - Loading components (skeleton, spinner, progress)
- `a11y/` - Accessibility components (modal, tooltip)

#### `lego/utils/`

**Utility Functions** - Helper functions used across apps:

- `init.ts` - Application initialization
- `error-handler.ts` - Global error handling
- `error-tracker.ts` - Error tracking
- `i18n.ts` - Internationalization utilities
- `prefetch.ts` - Link prefetching
- `scroll-lock.ts` - Body scroll locking
- `focus-trap.ts` - Focus management
- `aria-announcer.ts` - ARIA announcements
- `sanitize.ts` - HTML sanitization
- `service-worker.ts` - Service worker management
- `rum.ts` - Real User Monitoring (privacy-first)

#### `lego/config/`

**Configuration** - Centralized app configuration:

- `warmthly-config.ts` - Main config (URLs, paths, navigation, constants)

#### `lego/core/`

**Core Infrastructure** - Foundation for components:

- `base-component.ts` - Base class for all components
- `di-container.ts` - Dependency injection container
- `error-boundary.ts` - Error boundary system
- `services/` - Service layer (logger, validation)

#### `lego/styles/`

**CSS Files** - Shared stylesheets:

- `base.css` - Base styles
- `common.css` - Common styles
- `variables.css` - CSS variables (design tokens)
- `components.css` - Component styles
- `mint.css` - Mint app styles
- `post.css` - Post app styles
- `admin.css` - Admin app styles

#### `lego/i18n/`

**Internationalization** - Translation files:

- `en.json`, `af.json`, `de.json`, `es.json`, `fr.json` - Language files
- `schema.json` - Translation schema
- `types.ts` - TypeScript types

### `api/` - Backend API Endpoints

API handlers for backend functionality:

- `airtable.ts` - Airtable integration
- `convert-currency.ts` - Currency conversion
- `create-checkout.ts` - Payment checkout
- `get-emails.ts` - Email retrieval
- `get-yoco-public-key.ts` - Yoco payment key
- `i18n.ts` - Internationalization API (deprecated - use warmthly-api)
- `inbound-email.ts` - Email receiving
- `login.ts` - Admin authentication
- `reports.ts` - User report submissions
- `send-email.ts` - Email sending
- `rate-limit.ts` - Rate limiting middleware
- `redis-client.ts` - Redis caching
- `logger.ts` - Logging utility

### `assets/` - Static Assets

Static files served directly:

- `fonts/` - Font files (Inter, Cormorant Garamond)
- `images/` - Image files (signature.png, worlddots.svg)

### `tests/` - Test Files

Comprehensive test coverage:

- `unit/` - Unit tests (33 test files)
- `integration/` - Integration tests
- `e2e/` - End-to-end tests (Playwright)
- `performance/` - Performance tests
- `security/` - Security tests
- `setup.ts` - Test setup configuration

### `scripts/` - Build Scripts

Utility scripts for development:

- `check-bundle-size.js` - Analyze bundle sizes and check performance budgets
- `build.sh` - Build script
- `generate-sitemap.ts` - Generate sitemap
- `validate-i18n.ts` - Validate translation files

## 🔗 Path Aliases

All imports use path aliases defined in `.config/tsconfig.json` and `.config/vite.config.ts`:

| Alias           | Path                  | Purpose             |
| --------------- | --------------------- | ------------------- |
| `@components/*` | `./lego/components/*` | Web Components      |
| `@utils/*`      | `./lego/utils/*`      | Utility functions   |
| `@config/*`     | `./lego/config/*`     | Configuration       |
| `@styles/*`     | `./lego/styles/*`     | CSS files           |
| `@core/*`       | `./lego/core/*`       | Core infrastructure |
| `@apps/*`       | `./apps/*`            | Application files   |
| `@api/*`        | `./api/*`             | API endpoints       |
| `@assets/*`     | `./assets/*`          | Static assets       |
| `@tests/*`      | `./tests/*`           | Test files          |
| `@lego/*`       | `./lego/*`            | Everything in lego  |

**Example:**

```typescript
import { WARMTHLY_CONFIG } from '@config/warmthly-config.js';
import { initApp } from '@utils/init.js';
import { BaseComponent } from '@core/base-component.js';
```

## 🎨 Code Organization Principles

### 1. **Separation of Concerns**

- Apps are separate from shared code
- Components are separate from utilities
- Configuration is centralized
- Styles are organized by app

### 2. **Single Responsibility**

- Each file has one clear purpose
- Components do one thing well
- Utilities are focused and reusable

### 3. **DRY (Don't Repeat Yourself)**

- Shared code lives in `lego/`
- Common patterns are abstracted
- Configuration is centralized

### 4. **Type Safety**

- TypeScript strict mode enabled
- Path aliases are type-safe
- All imports are validated

### 5. **Testability**

- Tests mirror source structure
- Clear module boundaries
- Dependency injection for testing

## 📊 Code Quality Metrics

- **TypeScript:** Strict mode enabled
- **Test Coverage:** 99% threshold
- **Linting:** ESLint configured
- **Formatting:** Prettier configured
- **Performance:** Bundle size budgets enforced

## 🔍 Finding Code

### Where to find things:

- **Components:** `lego/components/`
- **Utilities:** `lego/utils/`
- **Configuration:** `lego/config/` or `.config/`
- **Styles:** `lego/styles/`
- **API endpoints:** `api/`
- **Tests:** `tests/`
- **Build config:** `.config/`

### Import patterns:

```typescript
// Components
import { WarmthlyHead } from '@components/warmthly-head.js';

// Utils
import { initApp } from '@utils/init.js';

// Config
import { WARMTHLY_CONFIG } from '@config/warmthly-config.js';

// Core
import { BaseComponent } from '@core/base-component.js';
```

## ✅ Code Organization Checklist

- ✅ All config files in `.config/`
- ✅ Shared code in `lego/`
- ✅ Apps separated in `apps/`
- ✅ Path aliases configured
- ✅ TypeScript strict mode
- ✅ Tests organized by type
- ✅ Clear module boundaries
- ✅ Consistent naming conventions

## 🚀 Best Practices

1. **Use path aliases** - Don't use relative paths (`../../`)
2. **Follow the structure** - Put code in the right place
3. **Keep it modular** - One file, one purpose
4. **Document changes** - Update docs when structure changes
5. **Test everything** - Maintain 99% coverage

## 📝 Summary

The Warmthly codebase is **well-organized** with:

- Clear separation between apps and shared code
- Centralized configuration
- Type-safe path aliases
- Comprehensive testing
- Modern build tooling

The "Lego Architecture" makes it easy to:

- Find code quickly
- Share code across apps
- Maintain consistency
- Scale the codebase
