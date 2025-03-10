/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  images: {
    domains: ['res.cloudinary.com', 'lh3.googleusercontent.com'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Ignore all node-specific modules on the client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        module: false,
        path: false,
        os: false,
        child_process: false
      };
    }
    
    // Move puppeteer to server-only
    if (isServer) {
      config.externals = [...config.externals, 'puppeteer'];
    }

    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;