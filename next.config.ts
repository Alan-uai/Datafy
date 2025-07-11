import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    allowedDevOrigins: [
        "http://localhost:9002",
        "https://*.cluster-duylic2g3fbzerqpzxxbw6helm.cloudworkstations.dev"
    ]
  },
  favicon: false,
};

export default nextConfig;
