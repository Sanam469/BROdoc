/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return []
  },
  // Allow server components to call our local backend
  experimental: {},
}

export default nextConfig
