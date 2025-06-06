// eslint-disable-next-line

module.exports = {
  plugins: [
    require('@tailwindcss/postcss')({
      config: './tailwind.config.js',
    }),
    require('autoprefixer'),
  ],
};
