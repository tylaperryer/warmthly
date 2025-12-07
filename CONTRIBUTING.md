# Contributing to Warmthly

Thank you for your interest in contributing to Warmthly! This guide will help you get started.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow privacy-first principles (no tracking/analytics)

## Development Setup

### Prerequisites

- Node.js 20 or higher
- npm or yarn
- Git

### Getting Started

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/warmthly.git
   cd warmthly
   ```

2. **Install dependencies**
   ```bash
   npm install
   npx playwright install --with-deps
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

## Code Style

### TypeScript

- Use TypeScript strict mode (already configured)
- Prefer explicit types over `any`
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### Code Formatting

- Use Prettier (configured via `.prettierrc`)
- Run `npm run format` before committing
- Follow existing code style in the project

### File Organization

- Components: `lego/components/`
- Utilities: `lego/utils/`
- Services: `lego/core/services/`
- API endpoints: `api/`
- Tests: `tests/`

## Testing

### Writing Tests

- Write tests for all new features
- Aim for 99% test coverage
- Test both success and error cases
- Use descriptive test names

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Check coverage
npm run test:coverage
```

### Test Structure

```typescript
describe('ComponentName', () => {
  it('should do something specific', () => {
    // Arrange
    // Act
    // Assert
  });
});
```

## Pull Request Process

### Before Submitting

1. **Update tests** - Ensure all tests pass
2. **Update documentation** - Update README/docs if needed
3. **Check linting** - Run `npm run lint`
4. **Format code** - Run `npm run format`

### PR Checklist

- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No console errors
- [ ] Accessibility checked
- [ ] Privacy-first (no tracking)

### PR Description

Include:
- What changes were made
- Why the changes were needed
- How to test the changes
- Screenshots (if UI changes)

## Commit Messages

Use clear, descriptive commit messages:

```
feat: Add new component for X
fix: Resolve issue with Y
docs: Update API documentation
test: Add tests for Z
refactor: Simplify component structure
```

## Architecture Guidelines

### Web Components

- Use native Web Components (no frameworks)
- Follow the Lego component architecture
- Use Shadow DOM when needed for style isolation
- Implement proper lifecycle hooks

### API Endpoints

- Use rate limiting
- Validate all inputs
- Handle errors gracefully
- Return consistent error format

### Privacy

- **No tracking or analytics**
- All metrics stored locally only
- No third-party trackers
- Privacy-first by default

## Getting Help

- Check existing documentation
- Review existing code for patterns
- Ask questions in issues or discussions
- Be patient and respectful

## Review Process

- All PRs require review
- Address feedback promptly
- Be open to suggestions
- Learn from code reviews

Thank you for contributing to Warmthly! 🎉

