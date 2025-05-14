/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/v0/b/uncomic-8fd4b.appspot.com/o/**', // si el bucket es *.appspot.com
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/v0/b/uncomic-8fd4b.firebasestorage.app/o/**', // si ves URLs así en tu app
      },
    ],
  },
};

module.exports = nextConfig;
