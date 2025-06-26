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
  devIndicators: {
    allowedDevOrigins: [
      'https://6000-firebase-studio-1749145066341.cluster-etsqrqvqyvd4erxx7qq32imrjk.cloudworkstations.dev',
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback, // Spread existing fallback if any
        tls: false,
        net: false,
        async_hooks: false,
      };
      // Mark Genkit modules as external for client-side build
      config.externals = [...(config.externals || []), '@genkit-ai/flow', '@genkit-ai/core'];
    }
    return config;
  },
};

export default nextConfig;
