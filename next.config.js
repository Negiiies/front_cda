/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during builds for deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript checking during builds if needed
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig