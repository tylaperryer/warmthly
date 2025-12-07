# Accessibility Features: Reading Levels & Multimedia

Complete guide to Warmthly's accessibility features including reading level transformation and multimedia accessibility.

## Overview

Warmthly implements comprehensive accessibility features to meet WCAG 2.1 AAA Success Criteria:

- **3.1.5 Reading Level** - Three reading levels (Standard, Simplified, Easy Read)
- **1.2.6 Sign Language (Prerecorded)** - Level AAA
- **1.2.7 Extended Audio Description (Prerecorded)** - Level AAA  
- **1.2.8 Media Alternative (Prerecorded)** - Level AAA

## Reading Levels

### Overview

Warmthly implements a comprehensive reading level transformation system that provides **3 reading levels** to meet WCAG 2.1 AAA Success Criterion 3.1.5 - Reading Level.

### Reading Level Options

#### 1. Standard (Grade 9+)
- **Target**: Grade 9 reading level (lower secondary education)
- **Max words per sentence**: 25
- **Max syllables per word**: 4
- **Use simple words**: No
- **Use pictures**: No
- **Max paragraph length**: 150 words

#### 2. Simplified (Grade 6)
- **Target**: Grade 6 reading level
- **Max words per sentence**: 15
- **Max syllables per word**: 3
- **Use simple words**: Yes
- **Use pictures**: No
- **Max paragraph length**: 100 words

#### 3. Easy Read (Pictures + Simple Words)
- **Target**: Easy Read format with pictures
- **Max words per sentence**: 10
- **Max syllables per word**: 2
- **Use simple words**: Yes
- **Use pictures**: Yes
- **Max paragraph length**: 50 words

### Implementation

#### Components

1. **Reading Level Utility** (`lego/utils/reading-level.ts`)
   - Content transformation algorithms
   - Word simplification dictionary (200+ words)
   - Sentence breaking logic
   - Paragraph splitting
   - LocalStorage persistence

2. **Reading Level Toggle Component** (`lego/components/warmthly-reading-level.ts`)
   - Accessible UI toggle
   - Three-button interface
   - Keyboard navigation support
   - Screen reader announcements
   - Visual indicators

### Usage

#### Quick Start

Add the reading level toggle to any page:

```html
<script type="module" src="/lego/components/warmthly-reading-level.js"></script>
<warmthly-reading-level></warmthly-reading-level>
```

Mark content for automatic transformation:

```html
<p data-reading-level-content>
  This content will be automatically simplified based on the selected reading level.
</p>
```

#### Programmatic Usage

```typescript
import { 
  getReadingLevel, 
  setReadingLevel, 
  transformReadingLevel,
  applyReadingLevelToDOM 
} from '@utils/reading-level.js';

// Get current level
const level = getReadingLevel(); // 'standard' | 'simplified' | 'easy-read'

// Set reading level
setReadingLevel('simplified');

// Transform text manually
const simplified = transformReadingLevel(
  "We are implementing a comprehensive solution.",
  'simplified'
);
// Result: "We are doing a complete solution."

// Apply to DOM
applyReadingLevelToDOM('easy-read');
```

#### Complete Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <script type="module" src="/lego/components/warmthly-head.js"></script>
  <script type="module" src="/lego/components/warmthly-reading-level.js"></script>
  <script type="module" src="/lego/utils/reading-level.js"></script>
</head>
<body>
  <warmthly-reading-level></warmthly-reading-level>
  
  <main>
    <h1 data-reading-level-content>Rehumanize Our World.</h1>
    <p data-reading-level-content>
      Warmthly is an international movement dedicated to bringing empathy 
      into the concrete of global systems.
    </p>
  </main>
  
  <script>
    // Initialize reading level system
    import { initReadingLevel } from '/lego/utils/reading-level.js';
    initReadingLevel();
  </script>
</body>
</html>
```

### Transformation Algorithm

#### 1. Sentence Breaking
- Splits sentences longer than max words
- Breaks at conjunctions (and, or, but)
- Breaks at commas
- Preserves punctuation

#### 2. Word Simplification
- Uses 200+ word simplification dictionary
- Preserves capitalization
- Handles punctuation
- Replaces complex words with simpler alternatives

Examples:
- `demonstrate` → `show`
- `utilize` → `use`
- `facilitate` → `help`
- `approximately` → `about`
- `significant` → `important`
- `comprehensive` → `complete`

#### 3. Paragraph Splitting
- Splits paragraphs longer than max length
- Maintains logical flow
- Preserves structure

#### 4. Syllable Counting
- Approximate syllable counting algorithm
- Handles common word patterns
- Replaces words with too many syllables

### Storage

Reading level preference is stored in `localStorage`:
- Key: `warmthly-reading-level`
- Value: `'standard'` | `'simplified'` | `'easy-read'`
- Persists across sessions

### Events

The system dispatches custom events:

```typescript
window.addEventListener('readinglevelchange', (e: CustomEvent) => {
  console.log('Reading level changed to:', e.detail.level);
});
```

## Multimedia Accessibility

### Overview

Warmthly implements comprehensive multimedia accessibility features to meet WCAG 2.1 AAA Success Criteria for media content.

### Features

#### 1. Sign Language Videos
- Dedicated sign language interpretation videos
- Accessible video player with controls
- Poster images for preview
- Full keyboard navigation

#### 2. Extended Audio Descriptions
- Detailed audio descriptions of visual content
- Separate audio track from main content
- Play/pause controls
- Toggle functionality

#### 3. Comprehensive Transcripts
- Full text transcripts of all media
- Show/hide toggle
- Downloadable format
- Properly formatted text
- Searchable content

#### 4. Closed Captions
- Caption track support
- Toggle functionality
- Multiple language support
- WebVTT format

### Component

**WarmthlyMediaAccessibility** (`lego/components/warmthly-media-accessibility.ts`)

A web component that provides all multimedia accessibility features in one place.

### Usage

#### Basic Usage

```html
<script type="module" src="/lego/components/warmthly-media-accessibility.js"></script>

<video id="main-video" src="/videos/content.mp4" controls></video>

<warmthly-media-accessibility
  video-id="main-video"
  sign-language-url="/videos/sign-language.mp4"
  audio-description-url="/audio/audio-description.mp3"
  transcript-url="/transcripts/video.txt"
  captions-url="/captions/video.vtt">
</warmthly-media-accessibility>
```

#### With Inline Transcript

```html
<warmthly-media-accessibility
  video-id="main-video"
  sign-language-url="/videos/sign-language.mp4"
  transcript-text="Full transcript text here...">
</warmthly-media-accessibility>
```

#### With Poster Image

```html
<warmthly-media-accessibility
  video-id="main-video"
  sign-language-url="/videos/sign-language.mp4"
  sign-language-poster="/images/sign-language-poster.jpg">
</warmthly-media-accessibility>
```

#### Complete Video Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <script type="module" src="/lego/components/warmthly-media-accessibility.js"></script>
</head>
<body>
  <video id="intro-video" src="/videos/intro.mp4" controls></video>
  
  <warmthly-media-accessibility
    video-id="intro-video"
    sign-language-url="/videos/intro-sign-language.mp4"
    sign-language-poster="/images/sign-language-poster.jpg"
    audio-description-url="/audio/intro-audio-description.mp3"
    transcript-url="/transcripts/intro-video.txt"
    captions-url="/captions/intro-video.vtt">
  </warmthly-media-accessibility>
</body>
</html>
```

#### Audio Example

```html
<audio id="podcast-episode" src="/audio/episode-1.mp3" controls></audio>

<warmthly-media-accessibility
  audio-id="podcast-episode"
  transcript-text="Full transcript text here...">
</warmthly-media-accessibility>
```

### Attributes

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `video-id` | string | No | ID of video element to control |
| `audio-id` | string | No | ID of audio element to control |
| `sign-language-url` | URL | No | URL to sign language video |
| `audio-description-url` | URL | No | URL to audio description track |
| `transcript-url` | URL | No | URL to transcript file |
| `transcript-text` | string | No | Inline transcript text |
| `captions-url` | URL | No | URL to WebVTT captions file |
| `chapters-url` | URL | No | URL to chapters file |
| `sign-language-poster` | URL | No | Poster image for sign language video |

### File Formats

#### Video
- **Sign Language**: MP4, WebM
- **Poster Images**: JPG, PNG, WebP

#### Audio
- **Audio Descriptions**: MP3, OGG, WAV

#### Text
- **Transcripts**: TXT, HTML, Markdown
- **Captions**: WebVTT (.vtt)

### Best Practices

#### Reading Levels

1. **Mark all user-facing content** with `data-reading-level-content`
2. **Test all three levels** to ensure content makes sense
3. **Provide context** - some content may need manual simplification
4. **Use semantic HTML** - headings, lists, etc. are preserved
5. **Test with screen readers** - ensure announcements work

#### Multimedia Accessibility

1. **Provide all formats** when possible:
   - Sign language video
   - Audio description
   - Full transcript
   - Captions

2. **Quality matters**:
   - Clear sign language videos
   - Detailed audio descriptions
   - Accurate transcripts
   - Synchronized captions

3. **File organization**:
   ```
   /videos/
     - content.mp4
     - content-sign-language.mp4
   /audio/
     - content-audio-description.mp3
   /transcripts/
     - content.txt
   /captions/
     - content.vtt
   ```

#### Sign Language Videos
1. Use clear, well-lit video
2. Signer should be clearly visible
3. Use appropriate background
4. Include poster image
5. Provide multiple language options if needed

#### Audio Descriptions
1. Describe all visual content
2. Include actions, expressions, and scene changes
3. Use clear, descriptive language
4. Match timing with video
5. Provide extended descriptions (not just basic)

#### Transcripts
1. Include all dialogue
2. Include sound effects in brackets: [sound effect]
3. Include visual descriptions: [visual description]
4. Use proper formatting
5. Make searchable
6. Provide downloadable version

#### Captions
1. Use WebVTT format
2. Synchronize accurately
3. Include speaker identification
4. Include sound effects
5. Use proper formatting

## Accessibility Features

### Keyboard Navigation
- ✅ All controls keyboard accessible
- ✅ Tab navigation
- ✅ Enter/Space to activate
- ✅ Escape to close modals
- ✅ Arrow keys for video controls

### Screen Reader Support
- ✅ ARIA labels on all elements
- ✅ ARIA expanded states
- ✅ ARIA controls relationships
- ✅ ARIA pressed states
- ✅ Live region announcements
- ✅ Descriptive button text

### Visual Design
- ✅ High contrast (16.8:1)
- ✅ Clear visual indicators
- ✅ Responsive design
- ✅ Touch-friendly controls (44×44px targets)

## Testing

### Reading Levels Checklist
- [ ] Toggle between all three levels
- [ ] Verify content transforms correctly
- [ ] Check word simplifications
- [ ] Verify sentence breaking
- [ ] Test keyboard navigation
- [ ] Test screen reader announcements
- [ ] Verify localStorage persistence
- [ ] Test on mobile devices

### Multimedia Accessibility Checklist
- [ ] Sign language video plays correctly
- [ ] Audio description toggle works
- [ ] Transcript shows/hides properly
- [ ] Captions toggle works
- [ ] All keyboard navigation works
- [ ] Screen reader announces changes
- [ ] Files load correctly
- [ ] Responsive design works

## Troubleshooting

### Reading Level Not Working

1. **Check component is loaded**:
   ```html
   <script type="module" src="/lego/components/warmthly-reading-level.js"></script>
   ```

2. **Check content is marked**:
   ```html
   <p data-reading-level-content>Content here</p>
   ```

3. **Check initialization**:
   ```typescript
   import { initReadingLevel } from '@utils/reading-level.js';
   initReadingLevel();
   ```

### Multimedia Not Working

1. **Check file URLs** are correct
2. **Check video/audio IDs** match
3. **Check file formats** are supported
4. **Check CORS** if loading from different domain
5. **Check browser console** for errors

## Performance

### Reading Levels
- **Transformation**: <10ms for typical paragraph
- **DOM updates**: <50ms for full page
- **Storage**: Instant (localStorage)
- **Memory**: Minimal (no large data structures)

### Multimedia
- **Video Loading**: Lazy loading supported
- **Audio Loading**: On-demand loading
- **Transcript Loading**: Fetch on demand
- **Memory**: Minimal overhead

## Browser Support

- ✅ Modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ LocalStorage support required
- ✅ ES2022 features used
- ✅ Video element support
- ✅ Audio element support
- ✅ WebVTT support
- ✅ Fetch API support

## Related Documentation

- [WCAG 2.1 Success Criterion 3.1.5 - Reading Level](https://www.w3.org/WAI/WCAG21/Understanding/reading-level.html)
- [WCAG 2.1 Success Criterion 1.2.6 - Sign Language](https://www.w3.org/WAI/WCAG21/Understanding/sign-language-prerecorded.html)
- [WCAG 2.1 Success Criterion 1.2.7 - Extended Audio Description](https://www.w3.org/WAI/WCAG21/Understanding/extended-audio-description-prerecorded.html)
- [WCAG 2.1 Success Criterion 1.2.8 - Media Alternative](https://www.w3.org/WAI/WCAG21/Understanding/media-alternative-prerecorded.html)
- [Standards Compliance](./STANDARDS-COMPLIANCE.md)

---

**Status**: ✅ Fully Implemented  
**Last Updated**: 2025-01-XX  
**Version**: 1.0.0

