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
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withNextIntl(nextConfig);
