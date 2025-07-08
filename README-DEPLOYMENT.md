# Eduroots Deployment Guide

## Environment Configuration

### Required Environment Variables

Create a `.env.local` file at the project root:

```bash
# Basic configuration
INSTANCE_NAME=eduroots
DOMAIN=localhost

# Database
POSTGRES_DB=eduroots
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password

# JWT Secret (generate a secure secret)
JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters

# URLs (adapt according to environment)
SITE_URL=http://localhost:3000
API_EXTERNAL_URL=http://localhost:3000

# Google OAuth (same configuration for all mosques)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Supabase (for migration from existing)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_DB_URL=postgresql://postgres:password@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

### Deployment Environments

#### 1. Local Development
```bash
# Use .env.local with default values
docker compose up -d
```

#### 2. Production VPS
```bash
# Create .env.prod
SITE_URL=https://mosque-a.your-domain.com
API_EXTERNAL_URL=https://mosque-a.your-domain.com
DOMAIN=mosque-a.your-domain.com
JWT_SECRET=very-secure-secret-for-production

# Deploy
docker compose --env-file .env.prod up -d
```

#### 3. Multi-tenant (multiple mosques)
```bash
# Mosque A
mkdir mosque-a
cp .env.local mosque-a/.env
# Modify mosque-a/.env with correct URLs

# Mosque B
mkdir mosque-b
cp .env.local mosque-b/.env
# Modify mosque-b/.env with correct URLs
```

## Deployment

### 1. First Installation
```bash
# Clone the repository
git clone https://github.com/your-org/eduroots.git
cd eduroots

# Configure environment
cp .env.example .env.local
# Edit .env.local with your values

# Start
docker compose up -d

# Verify
docker compose ps
```

### 2. Update
```bash
# Stop
docker compose down

# Update code
git pull

# Rebuild and restart
docker compose up -d --build
```

### 3. Backup
```bash
# Backup database
docker compose exec postgres pg_dump -U postgres eduroots > backup_$(date +%Y%m%d).sql

# Restore
docker compose exec -T postgres psql -U postgres eduroots < backup_20250703.sql
```

## Troubleshooting

### Auth won't start
- Check `API_EXTERNAL_URL` in `.env.local`
- Check `JWT_SECRET` (minimum 32 characters)
- Use GoTrue v2.100.0 (stable) instead of newer versions
- Drop existing auth schema: `docker exec -i eduroots-postgres-1 psql -U postgres -d eduroots -c "DROP SCHEMA IF EXISTS auth CASCADE;"`

### Empty database
- Check that migration file is in `docker/supabase/migrations/`
- Restart PostgreSQL: `docker compose restart postgres`
- Ensure RLS policies don't block migrations

### Application inaccessible
- Check logs: `docker compose logs app`
- Check that port 3000 is accessible
- Test via HTTPS: `curl -k https://localhost/`

### Docker Services
```bash
# Check status of all services
docker compose ps

# Service-specific logs
docker compose logs postgres
docker compose logs auth
docker compose logs app
docker compose logs rest
docker compose logs traefik

# Restart specific service
docker compose restart auth
```

## ✅ Infrastructure Status

| Service | Status | Notes |
|---------|--------|-------|
| PostgreSQL | ✅ HEALTHY | Migrations applied |
| Next.js App | ✅ UP | Accessible via HTTPS |
| Supabase Auth | ✅ UP | GoTrue v2.100.0 stable |
| PostgREST | ✅ UP | REST API functional |
| Traefik | ✅ UP | Reverse proxy + SSL |

The Docker infrastructure is **100% functional** for development and testing.

## Architecture Overview

### Services
- **app**: Next.js application (port 3000)
- **postgres**: PostgreSQL 15 database with health checks
- **auth**: Supabase GoTrue authentication service
- **rest**: PostgREST API for database access
- **traefik**: Reverse proxy with automatic SSL

### Network
All services communicate through the `eduroots` Docker network with internal DNS resolution.

### Data Persistence
- `postgres_data`: Database data volume
- `traefik_certificates`: SSL certificates volume

### Security
- JWT-based authentication
- Row Level Security (RLS) policies
- HTTPS redirection via Traefik
- Isolated Docker network

## Production Considerations

### SSL Certificates
For production deployment, ensure your domain is publicly accessible for Let's Encrypt certificate generation.

### Database Security
- Use strong passwords for production
- Consider database connection pooling
- Implement regular backups

### Monitoring
Monitor service health using:
```bash
# Overall status
docker compose ps

# Resource usage
docker stats

# Service logs
docker compose logs -f [service_name]
```
