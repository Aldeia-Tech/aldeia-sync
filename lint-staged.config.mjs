import path from 'path';

const config = {
  '*.{js,jsx,ts,tsx}': [
    (filenames) =>
      `eslint --fix ${filenames
        .map((f) => `"${path.relative(process.cwd(), f)}"`)
        .join(' ')}`,
    'prettier --write',
    'vitest related --run --passWithNoTests',
  ],

  '*.{md,json,css}': 'prettier --write',
};

export default config;
