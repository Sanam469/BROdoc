/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return []
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Allow server components to call our local backend
  experimental: {},
}

export default nextConfig
