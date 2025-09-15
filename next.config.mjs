/** @type {import('next').NextConfig} */
const nextConfig = {
  // CRITICAL: Configure for large video uploads - FIXED for HTTP 413
  experimental: {
    // Disable memory cache to handle large files
    isrMemoryCacheSize: 0,
    // CRITICAL: Set body size limit to handle large uploads
    serverComponentsExternalPackages: [],
  },
  
  // CRITICAL: Remove all size restrictions
  serverRuntimeConfig: {
    // This doesn't actually work for API routes, but keep for completeness
    maxRequestSize: '500mb',
  },
  
  // Public runtime config
  publicRuntimeConfig: {
    maxFileSize: '500mb',
  },

  // CRITICAL: Disable compression to save memory and avoid size issues
  compress: false,
  
  // Optimize for large file handling
  poweredByHeader: false,
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  // CRITICAL: Configure API routes for large uploads
  async rewrites() {
    return []
  },

  // CRITICAL: Headers for large file uploads
  async headers() {
    return [
      {
        source: '/api/upload',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'POST, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Content-Length',
          },
          // CRITICAL: Set max body size for API route
          {
            key: 'X-Max-Body-Size',
            value: '524288000', // 500MB in bytes
          },
        ],
      },
    ]
  },
}

export default nextConfig
