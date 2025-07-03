# Template Repository Settings

## Description
🕌 **Eduroots Template** - Plateforme de gestion éducative pour mosquées

## Topics
- education
- mosque
- islamic-education
- nextjs
- docker
- template
- multi-tenant
- supabase

## Template Repository Configuration

### Repository Template
- ✅ Template repository enabled
- ✅ Include all branches: `main`, `docker`
- ✅ Include Git LFS: No

### Repository Settings
- **Visibility**: Public
- **Features**:
  - ✅ Issues
  - ✅ Wiki
  - ✅ Discussions
  - ❌ Projects (not needed for template)
  - ❌ Sponsorships

### Branch Protection
- **Default branch**: `docker`
- **Protection rules**:
  - Require PR reviews for main branch
  - Allow force pushes to feature branches

### Templates & Guidelines
- **Issue templates**: Use default GitHub templates
- **PR template**: Basic PR template for contributions
- **Code of conduct**: [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md)
- **Contributing**: [CONTRIBUTING.md](../CONTRIBUTING.md)

## Usage Instructions

When users click "Use this template":
1. They'll be prompted to name their repository
2. Recommended naming: `eduroots-mosquee-[nom]`
3. They should follow [TEMPLATE-SETUP.md](../TEMPLATE-SETUP.md)
4. Then use [README-DEPLOYMENT.md](../README-DEPLOYMENT.md) for deployment

## Repository Structure for Templates

```
eduroots-template/
├── README.md              # Template overview
├── TEMPLATE-SETUP.md      # Post-template setup guide
├── README-DEPLOYMENT.md   # Deployment guide
├── .env.example          # Environment variables template
├── setup-mosquee.sh      # Automated setup script
├── docker-compose.yml    # Docker services
├── dockerfile            # Next.js app container
└── .github/
    └── template-settings.md  # This file
```

## Support

Users of this template can:
- Open issues in their own repository
- Reference the original template for updates
- Contribute improvements back to the template
