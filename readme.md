# Warmthly

**Rehumanize Our World** - Making empathy a measurable part of our systems.

Warmthly is an international movement dedicated to bringing empathy into the concrete of global systems. We rehumanize sectors, starting with mental health and education, to make sure that people are no longer treated like numbers. We aim to make empathy a measurable design principle.

## 🌐 Live Sites

- **Main Site**: [warmthly.org](https://www.warmthly.org)
- **Mint (Transparency)**: [mint.warmthly.org](https://mint.warmthly.org)
- **Post (Community)**: [post.warmthly.org](https://post.warmthly.org)
- **Admin**: [admin.warmthly.org](https://admin.warmthly.org)

## 📁 Project Structure

```
warmthly-main-OG/
├── apps/                    # Multi-site application structure
│   ├── main/               # Main homepage and donation platform
│   ├── mint/               # Transparency dashboard (live transaction tracking)
│   ├── post/               # Community features (voting, reporting)
│   └── admin/              # Administrative dashboard
├── api/                     # Cloudflare Workers API endpoints
│   ├── airtable.js         # Airtable data integration
│   ├── convert-currency.js # Currency conversion service
│   ├── create-checkout.js  # Payment processing (Yoco)
│   ├── get-yoco-public-key.js
│   ├── send-email.js       # Email sending (Resend)
│   ├── get-emails.js       # Email retrieval
│   ├── login.js            # Admin authentication
│   ├── rate-limit.js       # Rate limiting middleware
│   └── redis-client.js     # Redis caching
├── lego/                    # Reusable components and utilities
│   ├── web-components/     # Custom web components
│   ├── styles/             # Shared CSS styles
│   ├── config/             # Configuration files
│   └── utils/              # Utility functions
├── fonts/                   # Custom font files
├── global/                  # Global assets (images, etc.)
├── wrangler.toml           # Cloudflare Workers configuration
├── package.json            # Node.js dependencies
└── manifest.json           # PWA manifest
```

## ✨ Features

### Main Site (`apps/main/`)
- **Donation Platform**: Multi-currency donation system with Yoco payment integration
- **Mission Information**: Comprehensive information about Warmthly's mission and goals
- **Video Content**: Embedded educational videos
- **Transparency**: Public tracking of all donations and expenses

### Mint (`apps/mint/`)
- **Live Transaction Tracking**: Real-time visualization of all donations and expenses
- **Interactive Dashboard**: Searchable donation pool with visual representations
- **Statistics**: Total donations, amount raised, and donor count
- **Research Section**: Academic research and methodology documentation
- **Firebase Integration**: Real-time data synchronization

### Post (`apps/post/`)
- **Dissolution Vote**: Community-driven dissolution mechanism (100,000 votes threshold)
- **Parliamentary Visualization**: Interactive chamber showing vote distribution
- **Report System**: Community reporting functionality
- **Your Data**: User data management and privacy controls
- **Vote Cooldown**: 30-day cooldown between votes to prevent abuse

### Admin (`apps/admin/`)
- **Email Management**: View and manage inbound emails
- **Dashboard**: Administrative controls and monitoring

## 🛠️ Technology Stack

### Frontend
- **HTML5** with semantic markup
- **CSS3** with custom properties (CSS variables)
- **Vanilla JavaScript** (ES6+ modules)
- **Web Components** (Custom Elements API)
- **Progressive Web App** (PWA) support

### Backend/API
- **Cloudflare Workers** for serverless API endpoints
- **Cloudflare Pages** for static site hosting
- **Redis** for caching (via Cloudflare Workers)
- **Firebase Realtime Database** for live data synchronization

### Third-Party Services
- **Yoco** - Payment processing (South African payment gateway)
- **Airtable** - Database and data management
- **Resend** - Email sending service
- **Exchange Rate API** - Currency conversion

### Design System
- **Custom Fonts**: Inter (sans-serif) and Cormorant Garamond (serif)
- **Color Scheme**: Warm, empathetic palette with `#FF8C42` (Warmthly Orange) as primary
- **Design Tokens**: CSS custom properties for consistent spacing, typography, and colors
- **Accessibility**: WCAG AA compliant, ARIA labels, keyboard navigation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Cloudflare account with Workers and Pages enabled
- Firebase project (for Mint and Post apps)
- Airtable account (optional, for data management)
- Yoco account (for payment processing)
- Resend account (for email functionality)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/tylaperryer/warmthly.git
   cd warmthly
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.dev.vars` file (for local development) or set environment variables in Cloudflare Workers:
   ```env
   AIRTABLE_API_KEY=your_airtable_api_key
   YOCO_SECRET_KEY=your_yoco_secret_key
   YOCO_PUBLIC_KEY=your_yoco_public_key
   RESEND_API_KEY=your_resend_api_key
   EXCHANGE_RATE_API_KEY=your_exchange_rate_api_key (optional)
   ADMIN_PASSWORD_HASH=your_hashed_admin_password
   REDIS_URL=your_redis_url (optional, for caching)
   ```

4. **Configure Firebase**
   
   Update Firebase configuration in `apps/mint/index.html` and `apps/post/vote/index.html`:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

### Development

1. **Run Cloudflare Workers locally**
   ```bash
   npx wrangler dev
   ```

2. **Deploy to Cloudflare Pages**
   ```bash
   npx wrangler pages deploy apps/main --project-name=warmthly-main
   npx wrangler pages deploy apps/mint --project-name=warmthly-mint
   npx wrangler pages deploy apps/post --project-name=warmthly-post
   npx wrangler pages deploy apps/admin --project-name=warmthly-admin
   ```

### Deployment

The project uses **Cloudflare Pages** for hosting and **Cloudflare Workers** for API endpoints. Configuration is managed via `wrangler.toml`.

Each app is deployed as a separate Cloudflare Pages project:
- `warmthly-main` → `www.warmthly.org`
- `warmthly-mint` → `mint.warmthly.org`
- `warmthly-post` → `post.warmthly.org`
- `warmthly-admin` → `admin.warmthly.org`

## 📚 API Endpoints

All API endpoints are deployed as Cloudflare Workers:

- `GET /api/airtable` - Fetch data from Airtable (with caching)
- `GET /api/convert-currency` - Convert currencies to ZAR
- `POST /api/create-checkout` - Create Yoco payment checkout
- `GET /api/get-yoco-public-key` - Get Yoco public key for client-side
- `POST /api/send-email` - Send emails via Resend
- `GET /api/get-emails` - Retrieve emails (admin only)
- `POST /api/login` - Admin authentication
- `POST /api/inbound-email` - Handle inbound emails

All endpoints include:
- Rate limiting
- Request timeout handling
- Error logging
- CORS support

## 🎨 Design System

### Colors
- **Primary**: `#FF8C42` (Warmthly Orange)
- **Background**: `#fff6f1` (Warm Cream)
- **Text**: `#1a1a1a` (Near Black)
- **Text Light**: `rgba(26, 26, 26, 0.75)`

### Typography
- **Primary Font**: Inter (variable weight)
- **Display Font**: Cormorant Garamond (variable weight)
- **Font Loading**: Custom font loader with FOUC prevention

### Spacing
- 8pt grid system with golden ratio
- CSS custom properties for consistent spacing

## 🔒 Security & Privacy

- **No Tracking**: No analytics, cookies, or third-party tracking
- **Privacy-First**: Minimal data collection, local storage only for vote cooldowns
- **Rate Limiting**: API endpoints protected with rate limiting
- **Secure Payments**: PCI-compliant payment processing via Yoco
- **HTTPS Only**: All sites served over HTTPS

## 🤝 Contributing

Warmthly is committed to transparency. All code is open source and available for forking and improvement. We welcome contributions that align with our mission of making empathy measurable.

## 📄 License

This project is licensed under **CC BY-NC-SA** (Creative Commons Attribution-NonCommercial-ShareAlike).

> "Our work is not ours, it's yours."

## 🙏 Acknowledgments

- Built with empathy and transparency in mind
- Inspired by the need to rehumanize global systems
- Powered by open-source technologies

## 📞 Contact

- **Website**: [warmthly.org](https://www.warmthly.org)
- **Social Media**: [@bewarmthly](https://youtube.com/@bewarmthly) on YouTube
- **GitHub**: [github.com/tylaperryer/warmthly](https://github.com/tylaperryer/warmthly)

---

**Warmthly 2025** - Rehumanize Our World. ❤️

