/**
 * Dev proxy rewrites to avoid CORS during frontend development.
 * Routes like `/patches` and `/api/*` will be proxied to the backend at localhost:3002.
 */
module.exports = {
  async rewrites() {
    return [
      { source: '/register', destination: 'http://localhost:3002/register' },
      { source: '/auth/:path*', destination: 'http://localhost:3002/auth/:path*' },
      { source: '/patches', destination: 'http://localhost:3002/patches' },
      { source: '/patches/:path*', destination: 'http://localhost:3002/patches/:path*' },
      { source: '/api/:path*', destination: 'http://localhost:3002/api/:path*' },
      { source: '/upload/:path*', destination: 'http://localhost:3002/upload/:path*' }
    ]
  }
}
