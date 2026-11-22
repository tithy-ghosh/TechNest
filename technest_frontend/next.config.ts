import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, '');

    if (!apiUrl) {
      throw new Error(
        'NEXT_PUBLIC_API_URL is required. Set it in .env.local, for example: NEXT_PUBLIC_API_URL=http://localhost:5000',
      );
    }

    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiUrl}/api/v1/:path*`,
      },
    ]
  },
};

export default nextConfig;
