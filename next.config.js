/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Add PDF.js worker configuration
    config.resolve.alias.pdfjs = `pdfjs-dist/legacy/build/pdf`;
    
    return config;
  },
  experimental: {
    appDir: true,
  }
}

export default nextConfig;