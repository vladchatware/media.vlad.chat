import { withWorkflow } from "workflow/next";
import type { NextConfig } from "next";

const BLOB_BASE = "https://7u68xtms1ss7pxli.public.blob.vercel-storage.com";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/public/:path*",
        destination: `${BLOB_BASE}/:path*`,
      },
    ];
  },
};

export default withWorkflow(nextConfig);