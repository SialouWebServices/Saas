/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration pour les performances optimisées
  experimental: {
    // App Directory déjà activé
    // optimizeCss: true, // Optimisation CSS
    // optimizeServerReact: true, // Optimisation React côté serveur
  },

  // Compression et optimisations
  compress: true,
  poweredByHeader: false,
  
  // Configuration des images - sera surchargée plus bas pour GitHub Pages

  // Optimisations pour les connexions lentes (data mobile coûteux en CI)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Configuration PWA et Service Worker
  webpack: (config, { dev, isServer }) => {
    // Optimisations webpack pour le bundle
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            maxSize: 200000, // 200KB max par chunk pour les connexions lentes
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
            maxSize: 100000, // 100KB max
          },
        },
      }
    }
    
    return config
  },

  // Headers pour la performance et la sécurité
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Cache statique long terme
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          // Sécurité
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Performance hints
          {
            key: 'Link',
            value: '</fonts/inter.woff2>; rel=preload; as=font; type=font/woff2; crossorigin',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          // Headers API spécifiques
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000',
          },
        ],
      },
    ]
  },

  // Redirections pour l'onboarding
  async redirects() {
    return [
      {
        source: '/inscription',
        destination: '/onboarding',
        permanent: true,
      },
      {
        source: '/register',
        destination: '/onboarding',
        permanent: true,
      },
    ]
  },

  // Variables d'environnement publiques
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    APP_VERSION: process.env.npm_package_version || '1.0.0',
  },

  // Configuration pour GitHub Pages
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true, // Requis pour l'export statique
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 jours
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Base path pour GitHub Pages (sera le nom du repo)
  basePath: process.env.NODE_ENV === 'production' ? '/saas-rh-ci' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/saas-rh-ci' : '',
  
  // Optimisations spécifiques pour la Côte d'Ivoire
  async rewrites() {
    return [
      // Optimisation des routes API
      {
        source: '/api/v1/:path*',
        destination: '/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig