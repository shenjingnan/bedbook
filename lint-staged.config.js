/**
 * @type {import('lint-staged').Configuration}
 */
export default {
  '*.{ts,tsx,js,jsx,json}': ['biome check --write'],
};
