/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  reactStrictMode: false,
  // better-sqlite3 (the SQLite checkpointer) is a native module; keep it external
  // so Next doesn't try to bundle it into the server build.
  serverExternalPackages: ["@langchain/langgraph-checkpoint-sqlite", "better-sqlite3"],
};

export default nextConfig;
