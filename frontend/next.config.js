/**
 * Dev proxy rewrites to avoid CORS during frontend development.
 * Routes like `/patches` and `/api/*` will be proxied to the backend at localhost:3000.
 */
module.exports = {
  async rewrites() {
    return [
      { source: '/patches', destination: 'http://localhost:3000/patches' },
      { source: '/patches/:path*', destination: 'http://localhost:3000/patches/:path*' },
      { source: '/api/:path*', destination: 'http://localhost:3000/api/:path*' },
      { source: '/upload/:path*', destination: 'http://localhost:3000/upload/:path*' }
    ]
  }
}
