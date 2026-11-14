import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

// ✅ Fix #16 — HTTP security headers for all routes
const securityHeaders = [
  // Prevent clickjacking
  { key: 'X-Frame-Options', value: 'DENY' },
  // Stop MIME type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Limit referrer info to same origin
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disable browser features the app doesn't use
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(self)',
  },
  // Force HTTPS in production
  ...(isDev
    ? []
    : [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
      ]),
  // Content Security Policy
  // Tighten these directives as your CDN / analytics / font sources are confirmed
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js requires 'unsafe-inline' for styles in dev; use nonces in prod
      isDev
        ? "style-src 'self' 'unsafe-inline'"
        : "style-src 'self' 'unsafe-inline'",          // tighten with nonce when ready
      isDev
        ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"  // needed by Next.js HMR
        : "script-src 'self'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      `connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}`,
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      'upgrade-insecure-requests',
    ]
      .filter(Boolean)
      .join('; '),
  },
];

const nextConfig: NextConfig = {
  // Apply security headers to every route
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },

  // Explicit allowed image domains (replace with your CDN / S3 / Mux domains)
  images: {
    remotePatterns: [
      // Example — add your actual domains here
      // { protocol: 'https', hostname: 'cdn.tekrovia.com' },
    ],
  },

  // Enforce strict mode in React
  reactStrictMode: true,

  // Disable x-powered-by header leaking Next.js version
  poweredByHeader: false,
};

export default nextConfig;
