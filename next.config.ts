import { withWorkflow } from "workflow/next";
import type { NextConfig } from "next";
import { BLOB_BASE } from "./remotion/assets";

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