import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // CLAUDE.md is the single source of agent instructions; stop `next dev`
  // from generating its own AGENTS.md when it detects an AI agent.
  agentRules: false,
};

export default nextConfig;
