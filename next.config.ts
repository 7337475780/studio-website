import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com", // Unsplash sometimes uses this
      },
      {
        protocol: "https",
        hostname: "ik.imagekit.io", // ImageKit
      },
      {
        protocol: "https",
        hostname: "i.pinimg.com", // Pinterest
      },
      {
        protocol: "https",
        hostname: "burleighprint.com.au", // Product Photography site
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/dtsdku445/**", // your Cloudinary folder or path
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
