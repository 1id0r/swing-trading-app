// next.config.ts
import type { NextConfig } from 'next'

// Load environment variables during build
const dotenv = require('dotenv')
const path = require('path')

// Load .env.local before anything else
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const nextConfig: NextConfig = {
  // Enable experimental features if needed
  experimental: {
    // serverComponentsExternalPackages: ['pg'],
  },
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ensure pg is not bundled on client side
      config.externals.push('pg')
    }
    return config
  },

  // Environment variables that should be available at build time
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
  },

  // Disable type checking during build if needed
  typescript: {
    // Set to true if you want to skip type checking during build
    ignoreBuildErrors: false,
  },

  // Disable ESLint during build if needed
  eslint: {
    // Set to true if you want to skip ESLint during build
    ignoreDuringBuilds: true,
  },
}

export default nextConfig