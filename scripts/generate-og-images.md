# Open Graph Image Generation Guide

This guide explains how to create Open Graph (OG) images for all Warmthly pages.

## Requirements

- **Size:** 1200x630px (recommended by Facebook, Twitter, LinkedIn)
- **Format:** PNG or JPG
- **File size:** Under 300KB (for fast loading)

## Tools

You can use any of these tools:

1. **Canva** (Free) - https://www.canva.com
   - Search for "Facebook Post" template (1200x630px)
   - Customize with Warmthly branding

2. **Figma** (Free) - https://www.figma.com
   - Create 1200x630px frame
   - Design with your brand colors

3. **Photoshop/GIMP** - Professional tools

4. **Online generators:**
   - https://www.bannerbear.com
   - https://www.ogimage.dev

## Images Needed

Create OG images for:

### Main Site (www.warmthly.org)
- `/og-main.png` - Homepage
- `/og-404.png` - 404 page

### Mint Site (mint.warmthly.org)
- `/og-mint.png` - Main mint page
- `/og-mint-research.png` - Research page

### Post Site (post.warmthly.org)
- `/og-post.png` - Main post page
- `/og-post-report.png` - Report page
- `/og-post-vote.png` - Vote page
- `/og-post-your-data.png` - Your Data page

### Admin Site (admin.warmthly.org)
- `/og-admin.png` - Admin dashboard

### Shared
- `/og-privacy.png` - Privacy Policy

## Design Guidelines

1. **Brand Colors:**
   - Primary: #FF8C42 (Warmthly Orange)
   - Background: #FFF6F1 (Warm Cream)
   - Text: Dark gray/black for readability

2. **Typography:**
   - Use Inter or Cormorant Garamond fonts
   - Keep text large and readable
   - Maximum 2-3 lines of text

3. **Logo:**
   - Include Warmthly logo/wordmark
   - Position: Top-left or center

4. **Content:**
   - Page title (large, bold)
   - Brief description (optional)
   - Visual element (illustration, pattern, or photo)

## File Structure

Save images in:
```
warmthly/
├── apps/
│   ├── main/
│   │   ├── og-main.png
│   │   └── og-404.png
│   ├── mint/
│   │   ├── og-mint.png
│   │   └── og-mint-research.png
│   ├── post/
│   │   ├── og-post.png
│   │   ├── og-post-report.png
│   │   ├── og-post-vote.png
│   │   └── og-post-your-data.png
│   └── admin/
│       └── og-admin.png
```

## Quick Template (Canva)

1. Go to Canva.com
2. Create custom size: 1200x630px
3. Add background: #FFF6F1
4. Add text: Page title in #FF8C42
5. Add Warmthly logo
6. Export as PNG
7. Optimize with TinyPNG.com (reduce file size)

## Automated Generation (Optional)

For future automation, consider:
- Using a service like Bannerbear API
- Creating a script with Canvas API
- Using a design tool API

## Testing

After creating images, test them with:
- Facebook Debugger: https://developers.facebook.com/tools/debug/
- Twitter Card Validator: https://cards-dev.twitter.com/validator
- LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/

## Current Status

⚠️ **Action Required:** Create OG images for all pages listed above.

Once created, update the `warmthly-head` component to reference these images in the `image` attribute.

