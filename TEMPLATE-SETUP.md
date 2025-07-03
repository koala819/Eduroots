# 🎯 Setting up your Eduroots Instance

> Guide to customize your instance after using the template

## 🚀 Steps after "Use this template"

### 1. Rename your repository
- **Recommended format**: `eduroots-mosque-[name]`
- **Examples**:
  - `eduroots-mosque-colomiers`
  - `eduroots-mosque-paris-19`
  - `eduroots-institute-nour`

### 2. Clone your new repository
```bash
git clone https://github.com/your-org/eduroots-mosque-name.git
cd eduroots-mosque-name
```

### 3. Initial configuration

#### Copy the environment file
```bash
cp .env.example .env.local
```

#### Edit `.env.local` with your information
```bash
# Basic configuration
INSTANCE_NAME=mosque-name    # 👈 Customize with your name
DOMAIN=localhost             # 👈 Change to your domain in production

# Database (generate secure passwords)
POSTGRES_DB=eduroots_mosque_name  # 👈 Customize
POSTGRES_USER=postgres
POSTGRES_PASSWORD=CHANGE_ME_SECURE_PASSWORD  # 👈 Required!

# JWT Secret (generate a unique secret)
JWT_SECRET=GENERATE_A_UNIQUE_SECRET_32_CHARACTERS_MINIMUM  # 👈 Required!

# URLs (adapt according to your environment)
SITE_URL=https://your-mosque.com            # 👈 Your domain
API_EXTERNAL_URL=https://your-mosque.com    # 👈 Same domain

# Google OAuth (configure OAuth)
GOOGLE_CLIENT_ID=your_client_id              # 👈 Configure OAuth
GOOGLE_CLIENT_SECRET=your_client_secret      # 👈 Configure OAuth
```

### 4. Google OAuth Configuration

#### Create a Google Cloud project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project: `Eduroots-[Mosque-Name]`
3. Enable the Google+ API

#### Configure OAuth
1. **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
2. **Application type**: Web application
3. **Name**: `Eduroots [Mosque Name]`
4. **Authorized redirect URIs**:
   - `http://localhost:3000/auth/google-auth` (development)
   - `https://your-domain.com/auth/google-auth` (production)

#### Get the keys
- Copy `Client ID` → `GOOGLE_CLIENT_ID`
- Copy `Client Secret` → `GOOGLE_CLIENT_SECRET`

### 5. Customization

#### Mosque name in the application
Edit files to customize:

```bash
# Search and replace "Eduroots" with "Mosque [Name]"
find . -name "*.tsx" -o -name "*.ts" | xargs grep -l "Eduroots"

# Main files to modify:
# - app/layout.tsx (title)
# - components/ui/* (displayed names)
```

#### Logo and branding
```bash
# Replace logos in public/
public/
├── icon-192x192.png      # 👈 Your logo 192x192
├── icon-512x512.png      # 👈 Your logo 512x512
├── Logo-blanc.webp       # 👈 White logo
└── Logo.jpg              # 👈 Main logo
```

### 6. Generate secure secrets

#### JWT Secret
```bash
# Generate a secure JWT secret
openssl rand -base64 48
```

#### Database password
```bash
# Generate a secure password
openssl rand -base64 32
```

### 7. Installation test

#### Local development
```bash
# Start
docker compose up -d

# Check
docker compose ps

# Access
open https://localhost/
```

#### Verifications
- ✅ Application accessible
- ✅ Database created
- ✅ Google authentication works
- ✅ Automatic SSL/HTTPS

### 8. Production deployment

Follow the complete guide: [README-DEPLOYMENT.md](./README-DEPLOYMENT.md)

## 🔒 Important security

### ⚠️ MUST change:
- `POSTGRES_PASSWORD` - Unique password
- `JWT_SECRET` - Unique secret 32+ characters
- `GOOGLE_CLIENT_ID/SECRET` - Your own OAuth keys

### 🚫 Never commit:
- `.env.local` (already in .gitignore)
- Plain text passwords
- Private API keys

## 📞 Support

- **Issues**: [GitHub Issues](../../issues)
- **Documentation**: [README-DEPLOYMENT.md](./README-DEPLOYMENT.md)
- **Template source**: [eduroots-template](https://github.com/your-org/eduroots)

---

## ✅ Configuration checklist

- [ ] Repository cloned and renamed
- [ ] `.env.local` configured with your values
- [ ] Google OAuth configured
- [ ] Secrets generated (JWT_SECRET, passwords)
- [ ] Logos replaced
- [ ] Application tested locally
- [ ] Ready for deployment

🎉 **Your Eduroots instance is configured!**
