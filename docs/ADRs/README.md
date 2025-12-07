# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) for the Warmthly project.

## What are ADRs?

ADRs document important architectural decisions, the context in which they were made, and the consequences. They help:
- Understand why decisions were made
- Avoid revisiting settled decisions
- Onboard new team members
- Maintain consistency

## ADR Format

Each ADR follows this structure:
- **Status**: Accepted, Proposed, Deprecated, Superseded
- **Context**: What situation led to this decision?
- **Decision**: What did we decide?
- **Rationale**: Why did we choose this?
- **Consequences**: What are the trade-offs?
- **Alternatives**: What else did we consider?

## Current ADRs

1. **[ADR-001: Lego Component Architecture](./001-lego-architecture.md)** - How we organize shared code
2. **[ADR-002: TypeScript Strict Mode](./002-typescript-strict-mode.md)** - Why we use strict TypeScript
3. **[ADR-003: Redis Caching](./003-redis-caching.md)** - Caching and rate limiting strategy
4. **[ADR-004: i18n Architecture](./004-i18n-architecture.md)** - Internationalization approach
5. **[ADR-005: Path Aliases](./005-path-aliases.md)** - Import path strategy
6. **[ADR-006: Web Components](./006-web-components.md)** - Why native Web Components

## Adding New ADRs

When making a significant architectural decision:

1. Create a new file: `docs/ADRs/XXX-title.md`
2. Use the template below
3. Update this README
4. Get team review
5. Mark as "Accepted" when approved

## Template

```markdown
# ADR-XXX: Title

## Status
Proposed

## Context
[Describe the situation]

## Decision
[What did we decide?]

## Rationale
[Why this choice?]

## Consequences
[Trade-offs and impacts]

## Alternatives Considered
[What else did we look at?]
```

