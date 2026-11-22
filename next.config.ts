import { withGluestackUI } from '@gluestack/ui-next-adapter';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // CLAUDE.md is the single source of agent instructions; stop `next dev`
  // from generating its own AGENTS.md when it detects an AI agent.
  agentRules: false,
  // `yarn test:e2e` runs its own server next to `yarn dev`, and Next.js locks
  // its build directory, so Playwright points this elsewhere.
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
};

// The adapter sets up react-native-web for both bundlers, but Next 16 builds
// with Turbopack and refuses to build when a `webpack` config is present, so
// only its Turbopack settings are kept.
const { webpack: _webpackConfig, ...gluestackConfig } =
  withGluestackUI(nextConfig);

export default gluestackConfig satisfies NextConfig;
