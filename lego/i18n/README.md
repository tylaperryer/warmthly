# Warmthly i18n - Real-time Online Translations

Fast, real-time translation system that fetches translations from an API, loads them in small packets, and caches for offline use.

## Features

- 🌐 **Real-time**: Fetches translations from API on demand
- 📦 **Small packets**: Loads translations in efficient chunks (50 keys per packet)
- 💾 **Offline support**: Caches translations in IndexedDB for offline use
- ⚡ **Fast**: Uses cached translations immediately, refreshes in background
- 🔄 **Auto-refresh**: Updates translations when coming back online

## API Endpoint

The i18n system expects an API at `/api/i18n` with the following endpoints:

### GET `/api/i18n/languages`

Returns list of available languages:

```json
{
  "languages": ["en", "es", "fr", "de", ...]
}
```

### GET `/api/i18n/:language`

Returns all translations for a language:

```json
{
  "translations": {
    "common": {
      "loading": "Loading...",
      "error": "Error"
    }
  },
  "version": "1.0.0"
}
```

**Query parameters:**

- `?keys=true` - Returns only the list of translation keys
- `?chunked=true` - Returns translations in chunks

### POST `/api/i18n/:language/chunk`

Fetches specific translation keys:

```json
// Request
{
  "keys": ["common.loading", "common.error"]
}

// Response
{
  "translations": {
    "common.loading": "Loading...",
    "common.error": "Error"
  },
  "keys": ["common.loading", "common.error"],
  "total": 150
}
```

## Usage

### 1. Add the i18n component to your HTML

```html
<script type="module" src="/lego/components/warmthly-i18n.js"></script>
<warmthly-i18n></warmthly-i18n>
```

### 2. Use translations in HTML

```html
<!-- Simple text translation -->
<h1 data-i18n="main.title">Rehumanize Our World.</h1>

<!-- With HTML content -->
<div data-i18n data-i18n-html="main.subtitle">Warmthly is a global movement...</div>

<!-- With parameters -->
<p data-i18n="common.welcome" data-i18n-param-name="John">Welcome, {{name}}!</p>

<!-- Input placeholders -->
<input data-i18n="common.search" placeholder="Search..." />

<!-- Title and aria-label -->
<button data-i18n-title="common.close" data-i18n-aria-label="common.close">Close</button>
```

### 3. Use translations in JavaScript/TypeScript

```typescript
import { t, setLanguage, getLanguage, initI18n } from '@utils/i18n.js';

// Initialize (call early in your app)
await initI18n({
  apiUrl: '/api/i18n', // Your API endpoint
  defaultLanguage: 'en',
  fallbackLanguage: 'en',
});

// Get translation
const text = t('main.title');

// With parameters
const welcome = t('common.welcome', { name: 'John' });

// Change language (force refresh from API)
await setLanguage('es', true);

// Get current language
const currentLang = getLanguage();
```

### 4. Add language switcher

```html
<select data-i18n-switcher>
  <option value="en">English</option>
  <option value="es">Español</option>
  <option value="fr">Français</option>
  <option value="de">Deutsch</option>
</select>
```

## How It Works

1. **Initial Load**:

   - Checks IndexedDB cache first
   - If cached, uses immediately (fast!)
   - If online, fetches fresh from API in background

2. **Online Fetching**:

   - Fetches translation keys list
   - Loads translations in small chunks (50 keys per packet)
   - Caches each chunk as it arrives
   - Updates page as chunks load

3. **Offline Mode**:

   - Uses cached translations from IndexedDB
   - Works completely offline after initial load
   - Auto-refreshes when connection restored

4. **Caching**:
   - Stores in IndexedDB (persistent, large capacity)
   - Cache persists across sessions
   - Versioned for cache invalidation

## Configuration

Set up your translation service:

### Option 1: Use Built-in API

The `/api/i18n.js` endpoint is included and works out of the box with fallback translations.

### Option 2: External Translation Service

Set environment variables:

```bash
TRANSLATION_SERVICE_URL=https://api.your-translation-service.com
TRANSLATION_SERVICE_API_KEY=your-api-key
```

The API will fetch from your service and cache responses.

### Option 3: Custom API

Implement the API endpoints above in your backend. The i18n system will work with any API that follows the same format.

## Performance

- **First load**: ~100-200ms (from cache if available)
- **Online refresh**: ~50-100ms per chunk (parallel loading)
- **Offline**: Instant (from IndexedDB)
- **Cache size**: Unlimited (IndexedDB handles large datasets)

## Translation Keys

Use dot notation for nested keys:

- `common.loading` → `{ "common": { "loading": "Loading..." } }`
- `main.title` → `{ "main": { "title": "..." } }`

## Parameters

Use `{{paramName}}` in translations and pass parameters:

```json
{
  "common": {
    "welcome": "Welcome, {{name}}!"
  }
}
```

```html
<p data-i18n="common.welcome" data-i18n-param-name="John"></p>
```

## Clearing Cache

```typescript
import { getI18n } from '@utils/i18n.js';

// Clear all cached translations
await getI18n().clearCache();
```

## Browser Support

- Modern browsers with IndexedDB support
- Falls back gracefully if IndexedDB unavailable
- Works with or without service workers
