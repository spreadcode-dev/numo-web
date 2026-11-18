import { withGluestackUI } from '@gluestack/ui-next-adapter';
import type { NextConfig } from 'next';

const DEFAULT_NUMO_API_URL = 'http://localhost:3000';
const numoApiUrl = process.env.NUMO_API_URL ?? DEFAULT_NUMO_API_URL;

const nextConfig: NextConfig = {
  // CLAUDE.md is the single source of agent instructions; stop `next dev`
  // from generating its own AGENTS.md when it detects an AI agent.
  agentRules: false,
  // The browser only calls its own origin (/api/...), so there's no CORS and
  // numo-api's SameSite=Strict refresh cookie stays first-party.
  // `next build` bakes this in: rebuild after changing NUMO_API_URL.
  rewrites: () => [
    { source: '/api/:path*', destination: `${numoApiUrl}/:path*` },
  ],
};

// The adapter sets up react-native-web for both bundlers, but Next 16 builds
// with Turbopack and refuses to build when a `webpack` config is present, so
// only its Turbopack settings are kept.
const { webpack: _webpackConfig, ...gluestackConfig } =
  withGluestackUI(nextConfig);

export default gluestackConfig satisfies NextConfig;
