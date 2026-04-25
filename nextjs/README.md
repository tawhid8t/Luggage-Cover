# Luggage Cover BD — Next.js 14 Frontend

Premium luggage cover e-commerce frontend built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand, and Recharts.

## Tech Stack

- **Framework**: Next.js 14 (App Router, ISR)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand (cart with localStorage persistence)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Backend**: Existing Express/MongoDB API (separate repo or `backend/`)

## Getting Started

### 1. Install dependencies

```bash
cd nextjs
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local with your values
```

### 3. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:5000/api` | Backend API base URL |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Site URL (for sitemap, OG tags) |
| `NEXT_PUBLIC_GA_ID` | `YOUR_GA_ID` | Google Analytics Measurement ID |

## Project Structure

```
nextjs/
├── app/                    # Next.js App Router pages
│   ├── (shop)/            # Shop & product pages
│   ├── admin/             # Admin panel
│   ├── cart/              # Cart page
│   ├── checkout/          # Checkout page
│   └── sitemap.ts         # Dynamic sitemap
├── components/            # React components
│   ├── layout/            # Navbar, Footer, PageHero
│   ├── product/           # Product gallery, size selector
│   ├── shop/              # Product card
│   └── ui/                # Button, Container, Skeleton, Toast
├── lib/                   # Utilities & API client
│   ├── api.ts             # TypeScript API client
│   ├── cart-store.ts      # Zustand cart store
│   └── utils.ts           # Helpers (cn, formatPrice, etc.)
├── types/                 # TypeScript interfaces
└── public/               # Static assets
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

Set environment variables in Vercel:
- `NEXT_PUBLIC_API_BASE_URL` → Your production API URL
- `NEXT_PUBLIC_SITE_URL` → `https://your-domain.com`
- `NEXT_PUBLIC_GA_ID` → Your GA Measurement ID

### Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### Self-hosted (Node.js)

```bash
npm run build
npm run start
```

## Architecture Notes

### Data Fetching
- Product listing: ISR with `revalidate = 3600` (1 hour)
- Product detail pages: SSG with `generateStaticParams`
- Cart & Checkout: Client-side only (no SSR)
- Admin: Client-side with session auth

### API Client
The API client (`lib/api.ts`) uses the existing Express/MongoDB backend's table-based REST pattern (`/api/{table}`). The backend should be running separately.

### Cart State
Cart persists in `localStorage` via Zustand middleware. No server-side cart storage.

### Admin Panel
- Protected by Next.js middleware + sessionStorage cookie
- Login credentials come from the `users` table in MongoDB
- See `/admin/login`
