# Open Graph Images

This directory contains Open Graph (OG) images for social media sharing.

## Required Images

All images should be **1200×630px** (recommended by Facebook, Twitter, LinkedIn).

### Main Site (www.warmthly.org)
- `og-main.png` - Homepage
- `og-help.png` - Help/FAQ page
- `og-privacy.png` - Privacy Policy
- `og-easy-read.png` - Easy Read version
- `og-404.png` - 404 error page

### Mint Site (mint.warmthly.org)
- `og-mint.png` - Main mint page
- `og-mint-research.png` - Research page

### Post Site (post.warmthly.org)
- `og-post.png` - Main post page
- `og-post-report.png` - Report page
- `og-post-vote.png` - Vote/Dissolution page
- `og-post-your-data.png` - Your Data page

### Admin Site (admin.warmthly.org)
- `og-admin.png` - Admin dashboard
- `og-admin-emails.png` - Emails page

## Design Guidelines

1. **Size:** 1200×630px
2. **Format:** PNG (preferred) or JPG
3. **File size:** Under 300KB (optimize with TinyPNG or similar)
4. **Brand colors:**
   - Primary: #FF8C42 (Warmthly Orange)
   - Background: #FFF6F1 (Warm Cream)
   - Text: Dark gray/black for readability
5. **Typography:** Inter or Cormorant Garamond
6. **Content:** Page title (large, bold) + brief description + Warmthly logo

## Tools for Creation

- **Canva** (Free): https://www.canva.com - Search for "Facebook Post" template
- **Figma** (Free): https://www.figma.com - Create 1200×630px frame
- **Online generators:**
  - https://www.bannerbear.com
  - https://www.ogimage.dev

## Testing

After creating images, test them with:
- Facebook Debugger: https://developers.facebook.com/tools/debug/
- Twitter Card Validator: https://cards-dev.twitter.com/validator
- LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/

## Current Status

⚠️ **Action Required:** Create OG images for all pages listed above.

Once created, the `warmthly-head` component will automatically reference them based on the current page.

