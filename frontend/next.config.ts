import type { NextConfig } from "next";

const getApiOrigin = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  try {
    return new URL(apiUrl).origin;
  } catch {
    return apiUrl;
  }
};

const nextConfig: NextConfig = {
  // ── Image Optimization ─────────────────────────────────────────────────────
  // Allow external image domains (Google avatars, BhartX CDN)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google profile pictures
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
    ],
  },

  // ── Security Headers ───────────────────────────────────────────────────────
  // Applied to every response from the Next.js server
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent MIME type sniffing attacks
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Prevent embedding in iframes (clickjacking protection)
          { key: "X-Frame-Options", value: "DENY" },
          // XSS filter (legacy browsers)
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // Control referrer information sent with requests
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Allow camera/mic for future video features, block most powerful APIs
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // Content Security Policy — allows YouTube embeds + Google APIs
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Scripts: self + Google Identity Services + YouTube player API
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://www.youtube.com https://s.ytimg.com",
              // Styles: self + inline styles (needed for CSS-in-JS)
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts
              "font-src 'self' https://fonts.gstatic.com",
              // Images: self + Google user content + YouTube thumbnails
              "img-src 'self' data: blob: https://*.googleusercontent.com https://i.ytimg.com https://img.youtube.com",
              // Iframes: YouTube no-cookie embeds
              "frame-src https://www.youtube-nocookie.com https://accounts.google.com",
              // API connections: self + backend Render URL + Google APIs
              `connect-src 'self' ${getApiOrigin()} https://accounts.google.com https://oauth2.googleapis.com`,
            ].join("; "),
          },
        ],
      },
    ];
  },

  // ── Compiler ────────────────────────────────────────────────────────────────
  // Remove console.log in production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;
