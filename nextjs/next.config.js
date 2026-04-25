/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.imgbb.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
      },
      {
        protocol: 'https',
        hostname: '**.postimages.org',
      },
      {
        protocol: 'https',
        hostname: '**.drive.google.com',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
