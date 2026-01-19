import withSerwistInit from '@serwist/next'
import process from 'process'


const withSerwist = withSerwistInit({
  // Note: This is only an example. If you use Pages Router,
  // use something else that works, such as "service-worker/index.ts".
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ['**/node_modules', '**/.git', '**/dist', '**/build', '**/.next', '**/coverage', '**/tmp', '**/temp']
      }
    }
    return config
  },
  env: {
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    ENCRYPTION_SALT: process.env.ENCRYPTION_SALT,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GMAIL_REFRESH_TOKEN: process.env.GMAIL_REFRESH_TOKEN,
    INVALID_EMAIL: process.env.INVALID_EMAIL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXT_PUBLIC_CLIENT_URL: process.env.NEXT_PUBLIC_CLIENT_URL,
    START_YEAR: process.env.START_YEAR,
    MIGRATION_SECRET: process.env.MIGRATION_SECRET,
    DEFAULT_SENDER: process.env.DEFAULT_SENDER,
    TECH_SUPPORT_EMAIL: process.env.TECH_SUPPORT_EMAIL,
    WEBSITE_URL: process.env.WEBSITE_URL,
    CONFIG_EMAIL_FIRSTNAME: process.env.CONFIG_EMAIL_FIRSTNAME,
    CONFIG_EMAIL_LASTNAME: process.env.CONFIG_EMAIL_LASTNAME,
    DEFAULT_NAME: process.env.DEFAULT_NAME,
    YOUTUBE_LINK: process.env.YOUTUBE_LINK,
    MY_CUSTOM_JWT_SECRET: process.env.MY_CUSTOM_JWT_SECRET,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    MONGODB_URI: process.env.MONGODB_URI,
    NEXT_PUBLIC_SUPABASE_URI: process.env.NEXT_PUBLIC_SUPABASE_URI,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    loader: 'default',
    path: '/_next/image',
    remotePatterns: [{ hostname: 'images.unsplash.com' }],
  },
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
}

export default withSerwist(nextConfig)
// export default nextConfig
