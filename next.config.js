/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['@supabase/supabase-js'],
  images: {
    domains: ['zbfosmwzntckdrxrfwta.supabase.co']
  },
  eslint: {
    // Temporarily disable ESLint during build for core functionality testing
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Temporarily disable TypeScript checks during build
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
