import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  env: {
    NEXT_APP_URL: process.env.NEXT_APP_URL || '',
    NEXT_APP_SUPABASE_ANON: process.env.NEXT_APP_SUPABASE_ANON || '',
  },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm"],
  },
});

export default withMDX(nextConfig);
