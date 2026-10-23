module.exports = {
  poweredByHeader: false,
  // Native / WebAssembly database packages must stay outside the bundle.
  serverExternalPackages: ['@libsql/client', 'libsql'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'same-origin' },
        ],
      },
    ];
  },
};
