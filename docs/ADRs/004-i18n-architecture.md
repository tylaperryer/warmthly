# ADR-004: Real-time i18n with IndexedDB Caching

## Status

Accepted

## Context

We needed internationalization that:

- Works offline
- Loads fast
- Supports many languages
- Updates automatically
- Privacy-first (no proprietary services)
- Open-source only

## Decision

Implement a hybrid i18n system:

1. **API-based**: Fetches translations from `/api/i18n`
2. **Chunked Loading**: 50 keys per packet
3. **IndexedDB Caching**: Offline support
4. **Open-Source Translation**: LibreTranslate (primary) + NLLB via Hugging Face (fallback)
5. **Background Refresh**: Updates cache when online

## Rationale

1. **Offline First**: IndexedDB works without network
2. **Fast Initial Load**: Uses cache immediately
3. **Efficient**: Only loads needed translations
4. **Scalable**: Supports unlimited languages
5. **User Experience**: No loading delays
6. **Privacy-First**: 100% open-source providers, self-hostable
7. **Cost-Effective**: Completely free (self-hosted or free tier)

## Consequences

- ✅ Works offline
- ✅ Fast initial load
- ✅ Supports 7,019 languages
- ✅ Automatic translation via open-source providers
- ✅ Privacy-first (no proprietary services)
- ✅ Completely free
- ⚠️ IndexedDB complexity
- ⚠️ Cache invalidation needed
- ⚠️ Requires API endpoint

## Implementation Details

- Cache structure: `{ language: string, translations: object, timestamp: number }`
- Chunk size: 50 keys per request
- Fallback chain: Manual → LibreTranslate → NLLB (Hugging Face) → English
- Auto-refresh: When coming back online

## Translation Providers

### Primary: LibreTranslate

- **Type**: Self-hosted, open-source
- **Languages**: 50+ languages
- **Privacy**: 100% private (runs on your infrastructure)
- **Cost**: Free (self-hosted)
- **Setup**: Docker deployment or use public instance

### Fallback: NLLB via Hugging Face

- **Type**: Open-source model (Meta's No Language Left Behind)
- **Languages**: 200+ languages
- **Privacy**: Open-source model, free tier available
- **Cost**: Free (generous free tier)
- **Setup**: Optional API key (works without it, but better with)

## Alternatives Considered

1. **Static JSON files**: Too large, no offline updates
2. **Server-side only**: No offline support
3. **Google Translate**: Proprietary, less privacy-respecting
4. **DeepL**: Proprietary, paid after free tier, data sent to third-party
5. **Full bundle**: Too large, slow initial load

## References

- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [LibreTranslate](https://github.com/LibreTranslate/LibreTranslate)
- [NLLB Model (Meta)](https://github.com/facebookresearch/fairseq/tree/nllb)
- [Hugging Face Inference API](https://huggingface.co/docs/api-inference/index)
