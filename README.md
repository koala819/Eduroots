<img src="./public/icon-512x512.png" alt="Logo Eduroots" width="100" align="left">

<br>

# 🕌 Eduroots - Template Repository

> **Template Repository** to easily create your own Eduroots instance for your mosque

## 🚀 Using the Template

### To create your Eduroots instance:

1. **Click "Use this template" at the top of this page**
2. **Name your repository**: `eduroots-mosque-[name]`
3. **Clone your new repository**
4. **Follow the deployment guide**: [README-DEPLOYMENT.md](./README-DEPLOYMENT.md)

## 📖 About Eduroots

Eduroots is an educational management platform designed specifically for mosques and Islamic educational institutions. It enables:

- **Student Management**: Registration, profiles, courses
- **Attendance Tracking**: Automated attendance system
- **Behavior Assessment**: Educational notes and comments
- **Grade Management**: Tests and report cards
- **Family Communication**: Parent/teacher interface
- **Dashboard**: Statistics and analytics

## 🛠 Architecture

- **Frontend**: Next.js 15 with TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + API)
- **Deployment**: Docker with Traefik (automatic SSL)
- **Authentication**: Google OAuth + internal system

## 🏗 Deployment

### Step 1: Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/eduroots-mosque-name.git
   cd eduroots-mosque-name
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env`** with your values:
   ```env
   # Database
   POSTGRES_DB=eduroots
   POSTGRES_PASSWORD=your_strong_password

   # Authentication
   JWT_SECRET=your_jwt_secret_key
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret

   # Instance
   INSTANCE_NAME=mosque-name
   DOMAIN=localhost  # or your domain in production
   ```

### Step 2: Docker Launch

```bash
# Build and launch all services
docker compose up -d

# Verify all services are ready
docker compose ps
```

### Step 3: Service Access

Once deployment is complete (2-3 minutes), you have access to:

| Service | URL | Description |
|---------|-----|-------------|
| **Application** | `https://localhost/` | Main Eduroots interface |
| **Supabase Studio** | `http://localhost:8080` | Database administration interface |
| **Auth API** | `https://localhost/auth/` | Authentication endpoints |
| **REST API** | `https://localhost/rest/v1/` | Data REST API |

### Step 4: First Access

1. **Access the application**: `https://localhost/`
2. **Sign in** with your configured Google account
3. **Access Studio**: `http://localhost:8080` to manage the database

## 🔧 Administration with Supabase Studio

**Supabase Studio** (`http://localhost:8080`) allows you to:
- 📊 View and modify your data
- 🔑 Manage authentication and users
- 📝 Write and execute SQL queries
- 🔧 Configure RLS (Row Level Security) policies
- 📈 View usage statistics

## 🐳 Useful Docker Commands

```bash
# View logs
docker compose logs -f

# Restart a service
docker compose restart [service-name]

# Stop all services
docker compose down

# Remove volumes (⚠️ deletes data)
docker compose down -v

# Update services
docker compose pull
docker compose up -d
```

## 🛡️ Production

For production deployment:

1. **Replace `DOMAIN=localhost`** with your domain
2. **Configure SSL certificates** (Traefik handles this automatically)
3. **Backup Docker volumes** regularly
4. **Monitor logs**: `docker compose logs -f`

## 📋 Prerequisites

- **Docker** and **Docker Compose**
- **Google OAuth** account for authentication
- **Domain** (for production)
- **VPS** or server (for production)

## 📞 Support

- **Documentation**: [README-DEPLOYMENT.md](./README-DEPLOYMENT.md)
- **Issues**: Use the Issues tab on GitHub
- **Email**: [your-email@domain.com]

## 🔒 Security

- Multi-factor authentication
- Data encryption
- RLS (Row Level Security) policies
- Automatic SSL/TLS

## 🌍 Multi-tenant

Each mosque has its own completely independent instance:
- Separate database
- Isolated authentication
- Private and secure data

## 🔧 Common Issues & Troubleshooting

### Services won't start

```bash
# Check service status
docker compose ps

# View logs in real-time
docker compose logs -f

# Restart all services
docker compose restart
```

### Missing environment variables

If you see warnings like `variable is not set`:
1. Check that `.env` exists
2. Verify all required variables are defined
3. Restart: `docker compose down && docker compose up -d`

### PostgreSQL connection errors

```bash
# Remove volumes and restart
docker compose down -v
docker compose up -d
```

### Port 8080 or 443 already in use

```bash
# Check which ports are in use
sudo netstat -tulpn | grep :8080
sudo netstat -tulpn | grep :443

# Stop services using these ports
sudo systemctl stop nginx  # example
```

### Studio (port 8080) not responding

```bash
# Check that Studio is running
docker compose logs studio

# Restart Studio
docker compose restart studio

# Wait 30 seconds then test
curl -I http://localhost:8080
```

### SSL certificate issues

In local development, accept self-signed certificates in your browser.

## 📄 License

This project is licensed under [AGPL](./LICENSE).

---

## 🏁 Quick Start

1. **Use this template** → Create your repository
2. **Clone** your repository: `git clone https://github.com/your-org/eduroots-mosque-name.git`
3. **Configure** `.env` with your values
4. **Run** `docker compose up -d`
5. **Wait 2-3 minutes** for all services to start

## 🌐 Access URLs

Once deployment is complete:

- **🏠 Main Application**: `http://localhost/`
- **🗄️ Database Admin**: `http://localhost:8080`
- **🔐 Auth API**: `https://localhost/auth/`
- **📊 REST API**: `https://localhost/rest/v1/`

🎉 **Your Eduroots instance is ready!**
