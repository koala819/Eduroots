<img src="./public/icon-512x512.png" alt="Logo Eduroots" width="100" align="left">

<br>

# Eduroots

Eduroots is an open-source educational platform designed to facilitate course management and communication between teachers and students, specifically adapted for mosques.

## Features

- Course and schedule management
- Attendance and behavior tracking
- Integrated messaging system
- Responsive interface (mobile and desktop)
- PWA (Progressive Web App) with Serwist
- Google OAuth authentication
- Dashboard with statistics
- Grade and evaluation management

## Technologies

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Static typing
- **Tailwind CSS 4** - Utility-first CSS framework (latest version)
- **Framer Motion** - Smooth animations

### Backend & Database
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **Supabase Auth** - Authentication with Google OAuth
- **PostgreSQL** - Relational database

### PWA & Performance
- **Serwist** - Service Worker for PWA
- **@serwist/next** - Next.js integration

### Development Tools
- **Vitest** - Testing framework
- **ESLint** - Code linting
- **Husky** - Git hooks
- **pnpm** - Package manager

### Others
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **Recharts** - Charts and visualizations
- **Cloudinary** - Image management

## Installation

1. Clone the repository:

```bash
git clone https://github.com/koala819/Eduroots.git
cd Eduroots
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

Required environment variables:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Others
NEXTAUTH_SECRET=your_nextauth_secret
NEXT_PUBLIC_CLIENT_URL=http://localhost:3000
```

4. Start the development server:

```bash
pnpm dev
```

## Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm test         # Run tests with Vitest
pnpm lint         # Check code with ESLint
pnpm lint:fix     # Auto-fix ESLint errors
```

## Architecture

### Database
- **Supabase PostgreSQL** with multiple schemas:
  - `education` - Main data
  - `logs` - Connection logs and audit

### Authentication
- **Supabase Auth** with Google OAuth
- Role management (admin, teacher, student, family)
- Route protection middleware

## Tests

The project uses Vitest for testing:

```bash
pnpm test                    # Run all tests
pnpm test --coverage        # Run tests with coverage
```

## PWA

The application is configured as PWA with:
- Service Worker via Serwist
- Manifest for installation
- Offline support
- Push notifications

## Contributing

Contributions are welcome! Please check our [contribution guidelines](CONTRIBUTING.md) for more information.

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE). This license ensures that any modified version of this software must also be distributed under the AGPL-3.0 license and that the source code must remain freely accessible.

## Contact

For any questions or suggestions, feel free to:

- Open an issue on GitHub
- Contact me on LinkedIn: [Your LinkedIn profile]
