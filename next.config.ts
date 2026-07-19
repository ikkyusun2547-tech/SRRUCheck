import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // scripts/render-pdf-worker.mjs is invoked via child_process.execFile
  // (see app/api/admin/reports/graduation/route.ts), not statically
  // imported — Next's serverless output tracer won't find it or the font
  // files it loads by path unless told explicitly, so it'd be missing from
  // a deployed build even though it works locally off the full repo.
  outputFileTracingIncludes: {
    "/api/admin/reports/graduation": [
      "./scripts/render-pdf-worker.mjs",
      "./node_modules/@fontsource/sarabun/files/sarabun-thai-400-normal.woff",
      "./node_modules/@fontsource/sarabun/files/sarabun-thai-700-normal.woff",
    ],
  },
  // The mobile client (and any other non-cookie, Bearer-token-authed
  // caller — e.g. the Expo web build) hits these routes cross-origin, so
  // they need CORS headers to be readable by browser fetch(). Safe to be
  // permissive with the origin here specifically because these endpoints
  // never rely on cookies for auth (see lib/auth/session.ts) — without
  // Access-Control-Allow-Credentials, a wildcard origin cannot be used to
  // read a cookie-authenticated response.
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PATCH, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withNextIntl(nextConfig);
