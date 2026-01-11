/**
 * Next.js config for integrated server.
 */
module.exports = {
  // No rewrites needed since backend and frontend are integrated in server-next.js
  experimental: {
    esmExternals: true
  }
}