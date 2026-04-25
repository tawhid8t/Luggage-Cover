# 🚀 Luggage Cover BD — Deployment Guide
## Hostinger (Custom Domain) + Free Alternatives

---

## 📋 Overview

This is a **static HTML/CSS/JS website** with a built-in database (Genspark Tables API).  
No Node.js, no server-side code, no build step required.  
You just upload the files and it works.

---

## ✅ OPTION 1 — Hostinger Shared Hosting (Recommended for Static Sites)

### Step 1 — Buy Hosting + Domain
1. Go to [hostinger.com](https://hostinger.com)
2. Purchase a **Shared Hosting** plan (Premium or Business)
3. During checkout, register your custom domain (e.g., `luggagecoverbd.com`)
4. Complete payment and wait for account activation email

### Step 2 — Access hPanel
1. Log into [hpanel.hostinger.com](https://hpanel.hostinger.com)
2. Click **Manage** next to your hosting plan

### Step 3 — Upload Your Files
**Method A — File Manager (easiest):**
1. In hPanel → click **File Manager**
2. Navigate to `public_html/` folder
3. Delete the default `index.html` that Hostinger places there
4. Click **Upload** and select ALL your project files:
   - `index.html`, `shop.html`, `product.html`, `cart.html`, `checkout.html`
   - `about.html`, `faq.html`, `contact.html`, `returns.html`, `shipping.html`
   - `admin-login.html`, `admin.html`
   - Folders: `css/`, `js/`
5. Wait for upload to complete

**Method B — FTP/SFTP (for large uploads):**
1. In hPanel → **FTP Accounts** → note your FTP credentials
2. Use [FileZilla](https://filezilla-project.org/) (free)
3. Connect with: Host = your domain, Username = FTP user, Password, Port = 21
4. Drag all project files to `/public_html/`

### Step 4 — Point Your Domain
If you registered your domain WITH Hostinger:
- It's already pointed automatically ✅

If you bought your domain elsewhere (GoDaddy, Namecheap, etc.):
1. In hPanel → **Domains** → click your domain → **DNS / Nameservers**
2. Copy Hostinger's nameservers (e.g., `ns1.dns-parking.com`, `ns2.dns-parking.com`)
3. Go to your domain registrar → update nameservers to Hostinger's
4. Wait 24–48 hours for DNS propagation

### Step 5 — Enable Free SSL (HTTPS)
1. In hPanel → **SSL** → click **Install** next to your domain
2. Wait 5–10 minutes
3. Test: `https://luggagecoverbd.com` should show a padlock 🔒

### Step 6 — Test Your Live Site
- Homepage: `https://luggagecoverbd.com`
- Shop: `https://luggagecoverbd.com/shop.html`
- Admin: `https://luggagecoverbd.com/admin-login.html`
- Admin credentials: `admin` / `lcbd@2024` (change after first login!)

---

## ✅ OPTION 2 — Vercel (Free, Instant, Best Performance)

**Why Vercel?** Free SSL, global CDN, instant deploys, custom domain support.

### Step 1 — Create Vercel Account
1. Go to [vercel.com](https://vercel.com) → **Sign Up** with GitHub/Google

### Step 2 — Deploy via Drag & Drop
1. Go to [vercel.com/new](https://vercel.com/new)
2. Drag your entire project folder onto the page
3. Click **Deploy** — done in ~30 seconds!

### Step 3 — Add Your Custom Domain
1. In Vercel dashboard → your project → **Settings** → **Domains**
2. Type your domain: `luggagecoverbd.com`
3. Vercel shows you DNS records to add

### Step 4 — Update DNS at Your Domain Registrar
Add these records at your domain registrar (GoDaddy/Namecheap/Hostinger):
```
Type: A       Name: @        Value: 76.76.21.21
Type: CNAME   Name: www      Value: cname.vercel-dns.com
```
4. Wait 10–60 minutes → your site is live at `https://luggagecoverbd.com` ✅

---

## ✅ OPTION 3 — Hostinger VPS (For Future Next.js Version)

> Use this ONLY if you later upgrade to the Next.js version of this project.

### Prerequisites
- Hostinger VPS plan (KVM 1 or higher)
- SSH access
- Ubuntu 22.04 OS

### Step 1 — SSH into Your VPS
```bash
ssh root@YOUR_VPS_IP
```

### Step 2 — Install Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Should show v20.x.x
```

### Step 3 — Install PM2 (Process Manager)
```bash
npm install -g pm2
```

### Step 4 — Install Nginx
```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 5 — Clone/Upload Your Project
```bash
cd /var/www
git clone https://github.com/YOUR_USERNAME/luggage-cover-bd.git
# OR use SCP to upload:
# scp -r ./nextjs-app root@YOUR_VPS_IP:/var/www/luggagecoverbd
cd /var/www/luggage-cover-bd/nextjs-app
```

### Step 6 — Set Up Environment Variables
```bash
cp .env.local.example .env.local
nano .env.local
```
Fill in:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/luggagecoverbd
NEXTAUTH_SECRET=your-random-secret-string-here
NEXTAUTH_URL=https://luggagecoverbd.com
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Step 7 — Build & Start the App
```bash
npm install
npm run build
pm2 start npm --name "luggagecoverbd" -- start
pm2 startup  # Follow the instructions shown
pm2 save
```

### Step 8 — Configure Nginx Reverse Proxy
```bash
sudo nano /etc/nginx/sites-available/luggagecoverbd
```
Paste this:
```nginx
server {
    listen 80;
    server_name luggagecoverbd.com www.luggagecoverbd.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/luggagecoverbd /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 9 — Install SSL Certificate (Free via Certbot)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d luggagecoverbd.com -d www.luggagecoverbd.com
# Follow the prompts (enter email, agree to terms)
# Certbot auto-renews every 90 days
```

### Step 10 — Update DNS to Point to VPS
At your domain registrar, set:
```
Type: A    Name: @    Value: YOUR_VPS_IP_ADDRESS
Type: A    Name: www  Value: YOUR_VPS_IP_ADDRESS
```

---

## 🔐 Post-Deployment Security Checklist

- [ ] Change admin password immediately after first login
- [ ] Add your real WhatsApp number (replace `8801XXXXXXXXX` in contact.html)
- [ ] Add your real Facebook page URL in footer social links
- [ ] Update phone numbers in footer (already has real numbers)
- [ ] Set up Google Analytics (add UA or GA4 tracking code)
- [ ] Test checkout flow end-to-end
- [ ] Test COD order placement
- [ ] Verify cart saves between sessions
- [ ] Test admin login → dashboard → orders → products

---

## 📱 Admin Panel URLs

| Page | URL |
|------|-----|
| Admin Login | `/admin-login.html` |
| Dashboard | `/admin.html#dashboard` |
| Orders | `/admin.html#orders` |
| Products & Gallery | `/admin.html#products` |
| Production Costs | `/admin.html#production` |
| Reviews | `/admin.html#reviews` |
| Settings | `/admin.html#settings` |

**Default Admin Credentials:**
- Username: `admin`
- Password: `lcbd@2024`
- ⚠️ Change immediately after first login!

---

## 🛠️ Troubleshooting

### Site not loading after upload
- Ensure `index.html` is in the root `public_html/` folder (not a subfolder)
- Clear browser cache (Ctrl+Shift+R)
- Check hPanel → File Manager that files are correct

### Images not showing
- Product images use URLs — make sure the image URLs are valid & accessible
- Test by pasting the URL directly in browser

### Cart not working
- The cart uses `localStorage` — works on all modern browsers
- Ensure JavaScript is enabled in browser
- Check browser console (F12) for any errors

### Admin login not working
- Default: admin / lcbd@2024
- Data is stored in browser's localStorage
- Try clearing site data if locked out: F12 → Application → Clear Storage

---

## 📊 Recommended Free Tools for Images

| Tool | URL | Best For |
|------|-----|----------|
| Imgbb | imgbb.com | Free image hosting, permanent URLs |
| Cloudinary | cloudinary.com | Professional image CDN (free tier) |
| Google Photos | photos.google.com | Share image URL |
| ImgUR | imgur.com | Quick image hosting |

**How to get image URL for products:**
1. Upload your product photo to Imgbb.com
2. Copy the "Direct link" URL
3. Paste in Admin → Products → Edit → Image URL fields

---

*Luggage Cover BD — Deployment Guide v2.0*  
*Last Updated: March 2025*
