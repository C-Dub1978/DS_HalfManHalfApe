import type { StorybookConfig } from '@storybook/angular-vite';

// `npm run build:site` sets this for the static build published at
// https://cswilson.site/storybook/. Three addons only make sense against a
// running dev server and a local checkout — the onboarding tour, the Vitest
// test runner and Chromatic's visual tests — and show visitors panels that
// can't do anything, so the public build leaves them out. `npm run
// storybook` is unaffected: the dev server (and the Storybook MCP's
// `test-run`, which needs addon-vitest) still loads all of them.
const isPublicBuild = process.env['HMHA_PUBLIC_STORYBOOK'] === 'true';

const devOnlyAddons = [
  "@chromatic-com/storybook",
  "@storybook/addon-vitest",
  "@storybook/addon-onboarding",
];

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    ...(isPublicBuild ? [] : devOnlyAddons),
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-mcp"
  ],
  "framework": "@storybook/angular-vite"
};
export default config;
