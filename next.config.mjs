/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  // Prisma's native query engine is loaded dynamically, so include the
  // generated client in every Vercel server-function bundle explicitly.
  outputFileTracingIncludes: {
    "/*": ["./app/generated/prisma/**/*"],
  },
};

export default nextConfig;
