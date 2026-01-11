/**
 * Next.js config for separate server setup.
 */
export default {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
      {
        source: '/auth/:path*',
        destination: 'http://localhost:3001/auth/:path*',
      },
      {
        source: '/upload',
        destination: 'http://localhost:3001/api/upload',
      },
      // Removed /patches/:path* rewrite to allow frontend pages to work
      {
        source: '/admin/:path*',
        destination: 'http://localhost:3001/admin/:path*',
      },
      {
        source: '/download/:path*',
        destination: 'http://localhost:3001/download/:path*',
      },
    ]
  },
}
