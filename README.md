# WhatGift 🎁
### Mobile-Friendly Family Wishlist & Secret Gift Coordination

WhatGift is a modern, responsive web application designed for families to share wishlists and coordinate holiday/birthday gifts in secret. Built following Apple Human Interface Guidelines (HIG) with vector Hugeicons, haptic feedback, and multi-theme customization.

---

## 🌟 Key Features

1. **Direct Invite Links with Auto-Launch**:
   - Share a direct invite link with family members: `http://<host>:5173/?family=MELBY-2026`
   - When opened, WhatGift **automatically launches directly into the family portal**.
   - No manual family code entry required!
2. **Simplified Login (No PIN Required)**:
   - Family members log in simply by typing their first name (e.g. "Sean", "Jia").
   - Quick-tap avatar chips allow instant 1-tap login on mobile devices.
3. **Surprise Protection & Anti-Spoiler Guard**:
   - **My Wishlist View**: When viewing their own list, the owner cannot see whether any item has been claimed or purchased. All claim data is stripped at the backend API boundary (`claim: null`).
   - **Family Circle View**: When viewing another family member's list, users can see if an item is available, claimed (Want to Buy), or purchased (Bought), including who marked it.
4. **Apple HIG Design & Hugeicons**:
   - iOS system grouped background (`#F2F2F7` light, `#000000` true OLED dark), borderless elevated cards, and authentic iOS segmented controls.
   - Vector Hugeicons throughout the app; emojis strictly reserved as user profile avatars.
5. **Themes & Haptics**:
   - Dynamic holiday themes (Classic Blue, Christmas Red & Green, Birthday Gold & Blue, Emerald, Purple).
   - Integrated Web Haptics for native mobile tactile response (toggleable in Settings).

---

## 🐧 Installation Guide for Ubuntu & Linux

This guide covers installing and running WhatGift on **Ubuntu** (20.04 LTS, 22.04 LTS, 24.04 LTS), **Debian**, and other Debian-based Linux distributions.

### 1. Install System Dependencies

Open a terminal and update your package lists, then install Python 3, `python3-venv`, `python3-pip`, `build-essential` (needed for compiling Python cryptographic dependencies), and `curl`:

```bash
sudo apt update
sudo apt install -y python3 python3-pip python3-venv python3-dev build-essential git curl sqlite3
```

> [!NOTE]
> On Debian and Ubuntu, the `python3-venv` package is separate from `python3`. It must be explicitly installed to create Python virtual environments without `ensurepip` errors.

---

### 2. Install Node.js (v18 or v20 LTS)

Ubuntu's default `apt` repository may contain an outdated version of Node.js. It is recommended to install Node.js LTS (v20.x) using the official NodeSource repository or NVM:

#### Option A: Via NodeSource (Recommended for servers/desktops)
```bash
# Add NodeSource repository for Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js and npm
sudo apt install -y nodejs

# Verify versions
node -v   # Should show v20.x.x
npm -v    # Should show v10.x.x
```

#### Option B: Via NVM (Node Version Manager)
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

---

### 3. Clone / Navigate to the Repository

```bash
cd /path/to/WhatGift
```

---

### 4. Setup the Python Backend

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python3 -m venv .venv
   ```

3. Activate the virtual environment:
   ```bash
   source .venv/bin/activate
   ```

4. Upgrade `pip` and install backend requirements:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

5. *(Optional)* Run tests to verify the backend setup:
   ```bash
   pytest tests
   ```
Or use this command if it is not in the usual directory (and running in the virtual environmentcd ../frontend):
   ```bash
   .venv/bin/python -m pytest tests
   ``` 

---

### 5. Setup the Frontend

1. In a new terminal tab (or navigate back to project root), enter the `frontend/` directory:
   ```bash
   cd ../frontend
   ```

2. Install npm dependencies:
   ```bash
   npm install
   ```

---

## 🚀 Running the Application (Development Mode)

### Step 1: Start the Backend (Port 8100)

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8100 --reload
```

- API Docs: `http://localhost:8100/docs`
- *Note:* `--host 0.0.0.0` allows connections from other devices on your local network (e.g. testing on mobile phones) or across WSL2/VM bridges.

### Step 2: Start the Frontend (Port 5173)

In a second terminal:

```bash
cd frontend
npm run dev -- --host
```

- Web App: `http://localhost:5173`
- *Note:* The Vite dev server will proxy all `/api` requests automatically to `http://127.0.0.1:8100`.
- The `--host` flag prints both your local URL (`http://localhost:5173`) and Network URL (`http://192.168.x.x:5173`) so you can access WhatGift directly from a mobile device connected to the same Wi-Fi network.

---

## 🌐 Production Deployment Guide (Ubuntu / Linux)

If deploying on an Ubuntu server (e.g. VPS, home server, Raspberry Pi):

### 1. Build the Frontend Static Assets
```bash
cd frontend
npm run build
```
This generates the optimized, production-ready static assets in `frontend/dist/`.

---

### 2. Configure Systemd Service for the Backend
Run the FastAPI backend as a persistent background daemon managed by `systemd`.

Create `/etc/systemd/system/whatgift.service`:
```ini
[Unit]
Description=WhatGift FastAPI Backend
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/WhatGift/backend
Environment="PATH=/var/www/WhatGift/backend/.venv/bin"
ExecStart=/var/www/WhatGift/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8100

# Auto-restart on failure
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Ensure the `www-data` user has read/write permissions to the database file:
```bash
sudo chown -R www-data:www-data /var/www/whatgift
```

Enable and start the backend service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now whatgift
sudo systemctl status whatgift
```

Verify the backend is running:
```bash
curl http://127.0.0.1:8100/api/health
# Returns: {"status":"ok","app":"WhatGift API"}
```

---

### 3. Web Server Configuration

Choose between **Apache** (for side-by-side subdomain hosting alongside an existing site) or **Nginx**.

---

#### 🟢 Option A: Apache Web Server (Side-by-Side at `whatgift.<root-domain.dev>`)

If you already have an Apache website serving your root domain (e.g. `yourdomain.dev`), you can run WhatGift alongside it as an independent **VirtualHost** on the subdomain `whatgift.yourdomain.dev`.

##### 1. DNS Setup
In your DNS provider (Cloudflare, Namecheap, Route 53, etc.), add a record for your subdomain:
- **Type**: `A` record (or `CNAME` pointing to `yourdomain.dev`)
- **Name**: `whatgift`
- **Value**: Your server's public IP address

##### 2. Enable Required Apache Modules
Ensure Apache's proxy, HTTP proxy, rewrite, headers, and SSL modules are active:
```bash
sudo a2enmod proxy proxy_http rewrite headers ssl
sudo systemctl restart apache2
```

##### 3. Create the WhatGift Apache VirtualHost
Create a new configuration file at `/etc/apache2/sites-available/whatgift.conf`:

```apache
<VirtualHost *:80>
    ServerName whatgift.yourdomain.dev
    ServerAdmin webmaster@yourdomain.dev

    # 1. Frontend Static Files (Built Vite App)
    DocumentRoot /var/www/WhatGift/frontend/dist

    <Directory /var/www/WhatGift/frontend/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # Single Page Application (SPA) routing:
        # Directs all non-file route requests to index.html
        FallbackResource /index.html
    </Directory>

    # 2. Reverse Proxy for Backend API (/api/*)
    ProxyPreserveHost On
    ProxyPass /api/ http://127.0.0.1:8100/api/
    ProxyPassReverse /api/ http://127.0.0.1:8100/api/

    # 3. Interactive API Documentation (Optional)
    ProxyPass /docs http://127.0.0.1:8100/docs
    ProxyPassReverse /docs http://127.0.0.1:8100/docs
    ProxyPass /openapi.json http://127.0.0.1:8100/openapi.json
    ProxyPassReverse /openapi.json http://127.0.0.1:8100/openapi.json

    # 4. Logs
    ErrorLog ${APACHE_LOG_DIR}/whatgift_error.log
    CustomLog ${APACHE_LOG_DIR}/whatgift_access.log combined
</VirtualHost>
```

> [!NOTE]
> - Your existing `<VirtualHost *:80>` and `<VirtualHost *:443>` blocks for `yourdomain.dev` remain completely untouched.
> - Apache inspects the `Host:` request header (`whatgift.yourdomain.dev` vs `yourdomain.dev`) to route traffic to the correct site.

##### 4. Enable the Site and Test Configuration
```bash
# Enable the WhatGift site
sudo a2ensite whatgift.conf

# Test Apache configuration syntax
sudo apache2ctl configtest
# Should output: Syntax OK

# Reload Apache
sudo systemctl reload apache2
```

##### 5. Secure with Free HTTPS (Let's Encrypt / Certbot)
Install Certbot with the Apache plugin to obtain and install a free SSL certificate:
```bash
sudo apt install -y certbot python3-certbot-apache
sudo certbot --apache -d whatgift.yourdomain.dev
```
- Certbot will automatically create the secure `<VirtualHost *:443>` block in `/etc/apache2/sites-available/whatgift-le-ssl.conf` and configure automatic HTTP &rarr; HTTPS redirection.
- Your existing root domain's SSL certificates remain separate and unaffected.

---

#### ⚪ Option B: Nginx Reverse Proxy

If using Nginx as your web server, create `/etc/nginx/sites-available/whatgift`:
```nginx
server {
    listen 80;
    server_name whatgift.yourdomain.dev;

    # Frontend static files
    root /var/www/WhatGift/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8100;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API documentation proxy
    location /docs {
        proxy_pass http://127.0.0.1:8100/docs;
    }

    location /openapi.json {
        proxy_pass http://127.0.0.1:8100/openapi.json;
    }
}
```

Enable the site and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/whatgift /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### 4. Firewall (UFW)
Ensure HTTP (80) and HTTPS (443) are allowed through the firewall:
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 🔄 Updating & Pulling New Changes on the Server

When you push code updates or bug fixes to GitHub and want to pull them onto your production server:

### 1. Pull Latest Commits
```bash
cd /var/www/WhatGift   # (or /var/www/whatgift)
git pull origin main
```

---

### 2. If Frontend Code Changed (UI, components, styles, or new npm packages)
Whenever you modify React files or frontend dependencies, you **must rebuild the production bundle** into `frontend/dist`:

```bash
cd frontend
npm install            # Only needed if package.json dependencies were added/updated
npm run build
```
> [!NOTE]
> Apache/Nginx immediately serves the updated files from `frontend/dist/`. You do **not** need to restart Apache unless you changed `.conf` VirtualHost settings.

---

### 3. If Backend Code Changed (Python endpoints, database models, or new pip packages)
Whenever you modify backend code, you **must restart the systemd service** so uvicorn loads the new Python code:

```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt   # Only needed if requirements.txt changed

# Restart the background backend service
sudo systemctl restart whatgift
```

Verify backend health:
```bash
sudo systemctl status whatgift
curl http://127.0.0.1:8100/api/health
```

---

### 🚀 All-in-One Quick Update Script
If you want to pull and apply all updates in one shot, run this single block from the repository root:

```bash
git pull origin main && \
(cd frontend && npm install && npm run build) && \
(cd backend && .venv/bin/pip install -r requirements.txt) && \
sudo systemctl restart whatgift
```

---

## 🔗 Direct Family Invite Links

Once deployed on your domain, invite links automatically adapt to your live URL:

- **Local Dev**: `http://localhost:5173/?family=MELBY-2026`
- **Production Subdomain**: `https://whatgift.yourdomain.dev/?family=MELBY-2026`

**Sharing Links**:
- Click **"Copy Invite Link"** in the top navigation bar to copy the direct URL.
- Family members who tap the link on mobile or desktop are immediately logged into the family view without needing to enter the family code.
