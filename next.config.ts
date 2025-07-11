
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
    // allowedDevOrigins is a top-level property.
  },
  allowedDevOrigins: [
    'https://6000-firebase-studio-1752242955078.cluster-duylic2g3fbzerqpzxxbw6helm.cloudworkstations.dev',
  ],
};

export default nextConfig;
