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

### Option 1: Local Development
```bash
git clone https://github.com/your-org/eduroots-mosque-name.git
cd eduroots-mosque-name
cp .env.example .env.local
# Edit .env.local with your values
docker compose up -d
```

### Option 2: Production VPS
Follow the complete guide: [README-DEPLOYMENT.md](./README-DEPLOYMENT.md)

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

## 📄 License

This project is licensed under [MIT](./LICENSE).

---

## 🏁 Quick Start

1. **Use this template** → Create your repository
2. **Clone** your repository
3. **Configure** `.env.local`
4. **Run** `docker compose up -d`
5. **Access** https://localhost/

🎉 **Your Eduroots instance is ready!**
