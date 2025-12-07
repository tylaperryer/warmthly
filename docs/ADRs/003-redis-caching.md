# ADR-003: Redis-Based Caching and Rate Limiting

## Status
Accepted

## Context
We needed:
- Fast API responses (Airtable, i18n)
- Rate limiting to prevent abuse
- Distributed caching (multiple server instances)

## Decision
Use Redis for:
1. **API Response Caching**: 30-second TTL for Airtable data
2. **Rate Limiting**: Sliding window algorithm
3. **Email Storage**: Temporary storage for inbound emails

## Rationale
1. **Performance**: Redis is in-memory, extremely fast
2. **Distributed**: Works across multiple server instances
3. **TTL Support**: Automatic expiration
4. **Atomic Operations**: Safe for rate limiting
5. **Fail Open**: If Redis fails, requests still work (graceful degradation)

## Consequences
- ✅ Fast API responses (cached)
- ✅ Effective rate limiting
- ✅ Works across multiple instances
- ⚠️ Requires Redis infrastructure
- ⚠️ Cache invalidation complexity
- ⚠️ Additional dependency

## Implementation Details
- Cache keys: `{service}:{identifier}:{params}`
- TTL: 30 seconds (Airtable), configurable per endpoint
- Rate limit keys: `ratelimit:{ip}:{endpoint}`
- Fail open: Errors log but don't block requests

## Alternatives Considered
1. **In-memory cache**: Doesn't work across instances
2. **Database caching**: Too slow
3. **CDN caching**: Doesn't work for dynamic content
4. **No caching**: Too slow, expensive API calls

## References
- [Redis Documentation](https://redis.io/docs/)
- [Sliding Window Rate Limiting](https://redis.io/docs/manual/patterns/rate-limiting/)

