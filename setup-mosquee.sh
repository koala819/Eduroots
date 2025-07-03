#!/bin/bash

# =============================================================================
# EDUROOTS - AUTOMATED SETUP SCRIPT
# =============================================================================
# This script helps you quickly configure your Eduroots instance
# Usage: ./setup-mosquee.sh

set -e  # Stop on error

echo "🕌 EDUROOTS - Automated Configuration"
echo "====================================="
echo ""

# =============================================================================
# PREREQUISITES CHECK
# =============================================================================
echo "🔍 Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check Docker Compose
if ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose is not installed."
    exit 1
fi

# Check OpenSSL for generating secrets
if ! command -v openssl &> /dev/null; then
    echo "❌ OpenSSL is not installed."
    exit 1
fi

echo "✅ All prerequisites are installed"
echo ""

# =============================================================================
# INFORMATION COLLECTION
# =============================================================================
echo "📝 Configuring your mosque"
echo "=========================="

# Mosque name
read -p "📍 Name of your mosque (e.g.: colomiers, paris-19): " MOSQUE_NAME
if [ -z "$MOSQUE_NAME" ]; then
    echo "❌ Mosque name is required"
    exit 1
fi

# Domain
read -p "🌐 Domain (leave empty for localhost): " DOMAIN
if [ -z "$DOMAIN" ]; then
    DOMAIN="localhost"
fi

# Admin email
read -p "📧 Administrator email: " ADMIN_EMAIL
if [ -z "$ADMIN_EMAIL" ]; then
    ADMIN_EMAIL="admin@$DOMAIN"
fi

echo ""
echo "🔐 Google OAuth Configuration"
echo "============================"
echo "ℹ️  Go to https://console.cloud.google.com/"
echo "ℹ️  Create an OAuth project and get your keys"
echo ""

read -p "🔑 Google Client ID: " GOOGLE_CLIENT_ID
read -p "🔐 Google Client Secret: " GOOGLE_CLIENT_SECRET

if [ -z "$GOOGLE_CLIENT_ID" ] || [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    echo "❌ Google OAuth keys are required"
    exit 1
fi

echo ""

# =============================================================================
# SECRETS GENERATION
# =============================================================================
echo "🔒 Generating secure secrets..."

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 48)
echo "✅ JWT Secret generated"

# Generate database password
DB_PASSWORD=$(openssl rand -base64 32)
echo "✅ Database password generated"

echo ""

# =============================================================================
# CREATING .ENV.LOCAL FILE
# =============================================================================
echo "📁 Creating configuration file..."

cat > .env.local << EOF
# =============================================================================
# EDUROOTS - AUTOMATED CONFIGURATION
# =============================================================================
# Generated automatically on $(date)
# Mosque: $MOSQUE_NAME

# Basic configuration
INSTANCE_NAME=eduroots-$MOSQUE_NAME
DOMAIN=$DOMAIN

# Database
POSTGRES_DB=eduroots_$(echo $MOSQUE_NAME | tr '-' '_')
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$DB_PASSWORD

# JWT Secret
JWT_SECRET=$JWT_SECRET

# URLs
SITE_URL=http://localhost:3000
API_EXTERNAL_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET

# Administration
ADMIN_EMAIL=$ADMIN_EMAIL
EOF

echo "✅ .env.local file created"
echo ""

# =============================================================================
# INSTALLATION
# =============================================================================
echo "🚀 Installing application..."

# Start services
echo "📦 Starting Docker services..."
docker compose up -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 15

# Check status
echo "🔍 Checking services..."
docker compose ps

echo ""

# =============================================================================
# SUMMARY AND INSTRUCTIONS
# =============================================================================
echo "🎉 INSTALLATION COMPLETED!"
echo "=========================="
echo ""
echo "📊 Your configuration summary:"
echo "  • Mosque: $MOSQUE_NAME"
echo "  • Domain: $DOMAIN"
echo "  • Database: eduroots_$(echo $MOSQUE_NAME | tr '-' '_')"
echo "  • Admin email: $ADMIN_EMAIL"
echo ""
echo "🌐 Application access:"
echo "  • Local: https://localhost/"
echo "  • Production: https://$DOMAIN/ (after DNS config)"
echo ""
echo "🔑 Important information:"
echo "  • JWT Secret: [AUTOMATICALLY GENERATED]"
echo "  • Database password: [AUTOMATICALLY GENERATED]"
echo "  • Configuration file: .env.local"
echo ""
echo "⚠️  IMPORTANT SECURITY:"
echo "  • Backup your .env.local file"
echo "  • NEVER share your secrets"
echo "  • Configure a domain for production"
echo ""
echo "📚 Next steps:"
echo "  1. Open https://localhost/ in your browser"
echo "  2. Test Google authentication"
echo "  3. Check README-DEPLOYMENT.md for production"
echo ""
echo "✅ Your Eduroots instance is ready!"
