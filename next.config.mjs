/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow unsupported Next.js version for Cloudflare deployment
  experimental: {
    allowUnsupportedNextVersion: true,
  },
};

export default nextConfig;
